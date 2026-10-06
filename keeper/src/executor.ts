/**
 * Executor: risk evaluation + PAPER execution.
 *
 * Phase 0 is paper-only. {@link PaperExecutor} simulates fills against a
 * {@link MarketModel} and mutates an in-memory {@link RiskState}. There is no
 * router, no signer, and no on-chain effect. Every decision is explainable.
 *
 * Pipeline (per fill): normalize -> evaluate risk -> (accept|resize|skip) ->
 * paper-execute -> recompute NAV -> update high-water / drawdown halt.
 */
import {
  CHAIN,
  calculateNav,
  isTradeEligible,
  navPerShare,
  type NavOptions,
  type Position,
  type PriceData,
} from "@seat/sdk";
import { normalizeFill, type CopySignal, type LeaderFill } from "./signaler.js";
import { getSessionState, type SessionState } from "./session.js";
import { submitExecuteCopy } from "./submit.js";

/** PAPER is the Phase 1 default. LIVE always fails closed (no router). */
export type ExecutionMode = "PAPER" | "LIVE";

export interface CopyConfig {
  /** Fraction of the leader's notional to copy, in bps (e.g. 500 = 5%). */
  readonly baseCopyBps: number;
  /** Max notional for a single copy, in USDG base units. */
  readonly maxFillUsdg: bigint;
  /** Max value of any one position, in USDG base units. */
  readonly maxPositionUsdg: bigint;
}

export interface RiskConfig {
  /** Max gross exposure (sum of position values), in USDG base units. */
  readonly maxGrossExposureUsdg: bigint;
  /** Drawdown from high-water NAV/share that halts new copies, in bps. */
  readonly maxDrawdownBps: number;
  /** Max oracle price age, in seconds. Older => fail closed. */
  readonly maxStalenessSec: number;
}

/** Supplies prices and slippage for paper simulation. */
export interface MarketModel {
  /** Price of one whole token in USDG, or undefined if unknown (fail closed). */
  priceOf(symbol: string, atMs: number): PriceData | undefined;
  /** Token decimals for a symbol, or undefined if unknown. */
  decimalsOf(symbol: string): number | undefined;
  /** Slippage applied to paper fills, in bps (worse price for the desk). */
  readonly slippageBps: number;
}

/** Mutable desk state for paper simulation. */
export interface RiskState {
  cashUsdg: bigint;
  /** symbol -> UI balance in token base units. */
  positionsUi: Record<string, bigint>;
  shares: bigint;
  /** Highest NAV/share observed so far (for drawdown). */
  highWaterNavPerShare: bigint;
  halted: boolean;
}

export type DecisionAction = "accept" | "resize" | "skip";

export interface Decision {
  readonly action: DecisionAction;
  /** Copy notional to execute after sizing/caps, in USDG base units. */
  readonly sizeUsdg: bigint;
  /** Intended notional before caps (base × session), in USDG base units. */
  readonly intendedUsdg: bigint;
  readonly reason: string;
}

export interface FillOutcome {
  readonly fillId: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly action: DecisionAction | "reject";
  readonly reason: string;
  readonly session: SessionState["session"];
  readonly intendedUsdg: bigint;
  readonly executedUsdg: bigint;
  readonly navAfterUsdg: bigint;
  readonly navPerShareAfter: bigint;
  readonly halted: boolean;
}

const BPS = 10_000n;

function mulDiv(x: bigint, num: bigint, den: bigint): bigint {
  return (x * num) / den;
}

/** Create a fresh desk state seeded with USDG cash and book shares. */
export function createRiskState(
  cashUsdg: bigint,
  shares: bigint,
  navPerShareSeed = 0n,
): RiskState {
  return {
    cashUsdg,
    positionsUi: {},
    shares,
    highWaterNavPerShare: navPerShareSeed,
    halted: false,
  };
}

function positionsToNavInputs(
  state: RiskState,
  market: MarketModel,
  atMs: number,
): { positions: Position[]; opts: NavOptions } {
  const positions: Position[] = [];
  for (const [symbol, uiBalance] of Object.entries(state.positionsUi)) {
    if (uiBalance <= 0n) continue;
    const price = market.priceOf(symbol, atMs);
    const decimals = market.decimalsOf(symbol);
    if (price === undefined || decimals === undefined) {
      // Fail closed: a held position with no price cannot be valued.
      throw new Error(`no price/decimals for held position ${symbol}`);
    }
    positions.push({ symbol, uiBalance, decimals, price });
  }
  return { positions, opts: { now: Math.floor(atMs / 1000) } };
}

/** Equity (USDG base units) of the desk given current state and prices. */
export function computeEquity(
  state: RiskState,
  market: MarketModel,
  atMs: number,
): bigint {
  const { positions, opts } = positionsToNavInputs(state, market, atMs);
  return calculateNav(state.cashUsdg, positions, opts).equity;
}

/** Sum of position values (gross exposure), in USDG base units. */
function grossExposure(
  state: RiskState,
  market: MarketModel,
  atMs: number,
): bigint {
  const { positions, opts } = positionsToNavInputs(state, market, atMs);
  return calculateNav(0n, positions, opts).positionsValue;
}

/** Value one symbol's current position in USDG base units. */
function positionValue(
  symbol: string,
  state: RiskState,
  market: MarketModel,
  atMs: number,
): bigint {
  const uiBalance = state.positionsUi[symbol] ?? 0n;
  if (uiBalance <= 0n) return 0n;
  const price = market.priceOf(symbol, atMs);
  const decimals = market.decimalsOf(symbol);
  if (price === undefined || decimals === undefined) return 0n;
  return calculateNav(0n, [{ symbol, uiBalance, decimals, price }], {
    now: Math.floor(atMs / 1000),
  }).positionsValue;
}

/**
 * Deterministic risk decision for a normalized signal. Returns the copy size
 * (possibly reduced) with an explanation, or a skip with a reason.
 */
export function evaluateRisk(
  signal: CopySignal,
  session: SessionState,
  state: RiskState,
  copy: CopyConfig,
  risk: RiskConfig,
  market: MarketModel,
): Decision {
  if (state.halted) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: 0n, reason: "desk halted by drawdown protection" };
  }
  if (!session.tradable) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: 0n, reason: `session ${session.session} not tradable` };
  }

  const price = market.priceOf(signal.symbol, signal.timestampMs);
  const decimals = market.decimalsOf(signal.symbol);
  if (price === undefined || decimals === undefined) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: 0n, reason: "no price for symbol (fail closed)" };
  }
  const age = Math.floor(signal.timestampMs / 1000) - price.updatedAt;
  if (age < 0 || age > risk.maxStalenessSec) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: 0n, reason: `price stale (${age}s > ${risk.maxStalenessSec}s)` };
  }

  // Base sizing: leader notional × copy fraction × session multiplier.
  const base = mulDiv(signal.leaderNotionalUsdg, BigInt(copy.baseCopyBps), BPS);
  const intended = mulDiv(base, BigInt(session.sizeMultiplierBps), BPS);
  if (intended <= 0n) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: "intended size rounds to zero" };
  }

  let size = intended;
  let capped = false;

  // Per-fill cap.
  if (size > copy.maxFillUsdg) {
    size = copy.maxFillUsdg;
    capped = true;
  }

  if (signal.side === "buy") {
    // Per-position cap (headroom by value).
    const posVal = positionValue(signal.symbol, state, market, signal.timestampMs);
    const posHeadroom = copy.maxPositionUsdg - posVal;
    if (posHeadroom <= 0n) {
      return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: `position cap reached for ${signal.symbol}` };
    }
    if (size > posHeadroom) {
      size = posHeadroom;
      capped = true;
    }

    // Gross exposure cap.
    const gross = grossExposure(state, market, signal.timestampMs);
    const grossHeadroom = risk.maxGrossExposureUsdg - gross;
    if (grossHeadroom <= 0n) {
      return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: "gross exposure cap reached" };
    }
    if (size > grossHeadroom) {
      size = grossHeadroom;
      capped = true;
    }

    // Cash availability.
    if (state.cashUsdg <= 0n) {
      return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: "no USDG cash available" };
    }
    if (size > state.cashUsdg) {
      size = state.cashUsdg;
      capped = true;
    }
  } else {
    // Sell: cannot sell more than the current position value.
    const posVal = positionValue(signal.symbol, state, market, signal.timestampMs);
    if (posVal <= 0n) {
      return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: `no ${signal.symbol} position to sell` };
    }
    if (size > posVal) {
      size = posVal;
      capped = true;
    }
  }

  if (size <= 0n) {
    return { action: "skip", sizeUsdg: 0n, intendedUsdg: intended, reason: "size reduced to zero by caps" };
  }
  return {
    action: capped ? "resize" : "accept",
    sizeUsdg: size,
    intendedUsdg: intended,
    reason: capped ? "accepted with size reduced by caps" : "accepted at full size",
  };
}

/**
 * PAPER executor. Simulates a copy against the market model, applying slippage,
 * and mutates desk state. Hard-guards against any non-paper mode.
 */
export class PaperExecutor {
  readonly mode: ExecutionMode = "PAPER";

  constructor(
    private readonly market: MarketModel,
    env: Record<string, string | undefined> = process.env,
  ) {
    const requested = (env.EXECUTION_MODE ?? "PAPER").toUpperCase();
    if (requested !== "PAPER") {
      throw new Error(
        `PaperExecutor refuses to run in mode ${requested}: use LiveExecutor for LIVE`,
      );
    }
  }

  /** Convert a USDG notional into token UI units at a slippage-adjusted price. */
  private tokensForNotional(
    symbol: string,
    notionalUsdg: bigint,
    atMs: number,
    side: "buy" | "sell",
  ): { tokens: bigint; price: PriceData; decimals: number } | null {
    const price = this.market.priceOf(symbol, atMs);
    const decimals = this.market.decimalsOf(symbol);
    if (price === undefined || decimals === undefined) return null;
    // Buys pay a worse (higher) price; sells receive a worse (lower) price.
    const slip = BigInt(this.market.slippageBps);
    const effValue =
      side === "buy"
        ? mulDiv(price.value, BPS + slip, BPS)
        : mulDiv(price.value, BPS - slip, BPS);
    // tokens = notional * 10^tokenDec * 10^priceDec / (effPrice * 10^usdgDec)
    const usdgScale = 10n ** 6n;
    const tokenScale = 10n ** BigInt(decimals);
    const priceScale = 10n ** BigInt(price.decimals);
    if (effValue <= 0n) return null;
    const tokens = (notionalUsdg * tokenScale * priceScale) / (effValue * usdgScale);
    return { tokens, price, decimals };
  }

  /** Apply an accepted/resized decision to state (paper fill). */
  execute(signal: CopySignal, decision: Decision, state: RiskState): bigint {
    if (decision.action === "skip" || decision.sizeUsdg <= 0n) return 0n;
    const res = this.tokensForNotional(
      signal.symbol,
      decision.sizeUsdg,
      signal.timestampMs,
      signal.side,
    );
    if (res === null) return 0n;
    const current = state.positionsUi[signal.symbol] ?? 0n;
    if (signal.side === "buy") {
      state.cashUsdg -= decision.sizeUsdg;
      state.positionsUi[signal.symbol] = current + res.tokens;
    } else {
      const sold = res.tokens > current ? current : res.tokens;
      state.positionsUi[signal.symbol] = current - sold;
      state.cashUsdg += decision.sizeUsdg;
    }
    return decision.sizeUsdg;
  }
}

/**
 * Live path. Throws unless CHAIN_ID is 4663 or 46630 AND a router is
 * configured AND the symbol is trade-eligible on that chain.
 * 46630 has no cited router. 4663 uses ExactInputRouter02 around SwapRouter02.
 */
export class LiveExecutor {
  readonly mode: ExecutionMode = "LIVE";
  private readonly env: Record<string, string | undefined>;
  private readonly chainId: number;

  constructor(
    opts: { chainId: number; routerConfigured: boolean },
    env: Record<string, string | undefined> = process.env,
  ) {
    this.env = env;
    const chainId = Number(env.CHAIN_ID ?? opts.chainId);
    this.chainId = chainId;
    if (chainId !== CHAIN.MAINNET_ID && chainId !== CHAIN.TESTNET_ID) {
      throw new Error(
        `LiveExecutor refuses chain ${chainId}; only Robinhood 4663 or 46630`,
      );
    }
    if (!opts.routerConfigured) {
      throw new Error(
        "LiveExecutor refuses: SwapAdapter router is not configured",
      );
    }
  }

  execute(signal: CopySignal, _decision: Decision, _state: RiskState): bigint {
    if (!isTradeEligible(signal.symbol, this.chainId)) {
      throw new Error(
        `LiveExecutor refuses unverified registry symbol ${signal.symbol}`,
      );
    }
    throw new Error(
      "LiveExecutor.execute is paper-sync; call submitCopy after a cited router",
    );
  }

  async submitCopy(
    signal: CopySignal,
    decision: Decision,
    session: string,
  ): Promise<`0x${string}`> {
    return submitExecuteCopy(signal, decision, session, this.env);
  }
}

export interface CopyExecutor {
  execute(signal: CopySignal, decision: Decision, state: RiskState): bigint;
}

/** PAPER unless EXECUTION_MODE=LIVE *and* live guards pass. */
export function createExecutor(
  market: MarketModel,
  env: Record<string, string | undefined> = process.env,
): CopyExecutor {
  const mode = (env.EXECUTION_MODE ?? "PAPER").toUpperCase();
  const chainId = Number(env.CHAIN_ID ?? CHAIN.TESTNET_ID);
  const routerConfigured = env.SWAP_ROUTER_CONFIGURED === "1";
  if (mode === "LIVE") {
    return new LiveExecutor({ chainId, routerConfigured }, env);
  }
  return new PaperExecutor(market, env);
}

/** Update high-water NAV/share and set the halt flag if drawdown is breached. */
function updateDrawdown(
  state: RiskState,
  navPerShareNow: bigint,
  risk: RiskConfig,
): void {
  if (navPerShareNow > state.highWaterNavPerShare) {
    state.highWaterNavPerShare = navPerShareNow;
  }
  const hw = state.highWaterNavPerShare;
  if (hw > 0n) {
    const drawdownBps = mulDiv(hw - navPerShareNow, BPS, hw);
    if (drawdownBps >= BigInt(risk.maxDrawdownBps)) {
      state.halted = true;
    }
  }
}

export interface ProcessDeps {
  readonly copy: CopyConfig;
  readonly risk: RiskConfig;
  readonly market: MarketModel;
  readonly executor: CopyExecutor;
  /** Optional override for "now"; defaults to the fill timestamp. */
  readonly now?: Date;
}

/**
 * Process a single leader fill end-to-end against desk state, returning an
 * explainable outcome. Shared by the keeper entrypoint and the paper script.
 */
export function processFill(
  fill: LeaderFill,
  state: RiskState,
  deps: ProcessDeps,
): FillOutcome {
  const now = deps.now ?? new Date(fill.timestampMs);
  const session = getSessionState(now);

  const norm = normalizeFill(fill);
  if (!norm.ok) {
    const equity = safeEquity(state, deps.market, fill.timestampMs);
    return {
      fillId: fill.id,
      symbol: fill.symbol,
      side: fill.side,
      action: "reject",
      reason: `${norm.reason}: ${norm.detail}`,
      session: session.session,
      intendedUsdg: 0n,
      executedUsdg: 0n,
      navAfterUsdg: equity,
      navPerShareAfter: navPerShare(equity, state.shares),
      halted: state.halted,
    };
  }

  const decision = evaluateRisk(
    norm.signal,
    session,
    state,
    deps.copy,
    deps.risk,
    deps.market,
  );
  const executed = deps.executor.execute(norm.signal, decision, state);

  const equity = safeEquity(state, deps.market, fill.timestampMs);
  const nps = navPerShare(equity, state.shares);
  updateDrawdown(state, nps, deps.risk);

  return {
    fillId: fill.id,
    symbol: norm.signal.symbol,
    side: norm.signal.side,
    action: decision.action,
    reason: decision.reason,
    session: session.session,
    intendedUsdg: decision.intendedUsdg,
    executedUsdg: executed,
    navAfterUsdg: equity,
    navPerShareAfter: nps,
    halted: state.halted,
  };
}

/** Equity computation that never throws (returns cash-only on price gaps). */
function safeEquity(
  state: RiskState,
  market: MarketModel,
  atMs: number,
): bigint {
  try {
    return computeEquity(state, market, atMs);
  } catch {
    return state.cashUsdg;
  }
}
