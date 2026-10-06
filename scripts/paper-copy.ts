/**
 * Phase 0 paper-copy engine.
 *
 * Runs a batch of hypothetical leader fills through the shared keeper pipeline
 * (normalize -> risk -> PAPER execute -> NAV) and prints an explainable report
 * for each fill plus a summary. No network, no signer, no on-chain effect.
 *
 * Run from the keeper workspace so `@seat/sdk` resolves:
 *   pnpm --filter keeper exec tsx ../scripts/paper-copy.ts
 */
import { formatUsdg } from "@seat/sdk";
import {
  PaperExecutor,
  createRiskState,
  processFill,
  type CopyConfig,
  type FillOutcome,
  type RiskConfig,
} from "../keeper/src/executor.js";
import { recordOutcome, writeFillTape } from "../keeper/src/fills.js";
import { buildStaticMarket, type StaticQuote } from "../keeper/src/market.js";
import type { LeaderFill } from "../keeper/src/signaler.js";

function usdg(n: number): bigint {
  return BigInt(Math.round(n * 1_000_000));
}

// Fixed reference moments (UTC) chosen to exercise session logic in ET.
const REGULAR = Date.parse("2026-01-07T15:00:00Z"); // Wed 10:00 ET
const AFTER_HOURS = Date.parse("2026-01-07T22:00:00Z"); // Wed 17:00 ET
const CLOSED = Date.parse("2026-01-10T15:00:00Z"); // Sat (weekend)

const QUOTES: Record<string, StaticQuote> = {
  NVDA: { value: 120_00000000n, decimals: 8, tokenDecimals: 18 },
  AAPL: { value: 190_00000000n, decimals: 8, tokenDecimals: 18 },
  SPY: { value: 480_00000000n, decimals: 8, tokenDecimals: 18 },
};

const FILLS: LeaderFill[] = [
  {
    id: "f1",
    leader: "0xleader",
    symbol: "NVDA",
    side: "buy",
    notionalUsdg: usdg(20_000),
    price: QUOTES.NVDA!.value,
    priceDecimals: 8,
    timestampMs: REGULAR,
  },
  {
    id: "f2",
    leader: "0xleader",
    symbol: "NVDA",
    side: "buy",
    notionalUsdg: usdg(60_000), // 5% = 3000 -> capped by maxFillUsdg (2000)
    price: QUOTES.NVDA!.value,
    priceDecimals: 8,
    timestampMs: REGULAR,
  },
  {
    id: "f3",
    leader: "0xleader",
    symbol: "AAPL",
    side: "buy",
    notionalUsdg: usdg(20_000), // after-hours: 5% * 30% = 300
    price: QUOTES.AAPL!.value,
    priceDecimals: 8,
    timestampMs: AFTER_HOURS,
  },
  {
    id: "f4",
    leader: "0xleader",
    symbol: "SPY",
    side: "buy",
    notionalUsdg: usdg(10_000), // weekend -> skipped (session closed)
    price: QUOTES.SPY!.value,
    priceDecimals: 8,
    timestampMs: CLOSED,
  },
  {
    id: "f5",
    leader: "0xleader",
    symbol: "TSLA", // not in the official registry -> rejected
    side: "buy",
    notionalUsdg: usdg(5_000),
    price: 250_00000000n,
    priceDecimals: 8,
    timestampMs: REGULAR,
  },
  {
    id: "f6",
    leader: "0xleader",
    symbol: "NVDA",
    side: "sell",
    notionalUsdg: usdg(10_000), // 5% = 500 sell of NVDA
    price: QUOTES.NVDA!.value,
    priceDecimals: 8,
    timestampMs: REGULAR,
  },
];

const COPY: CopyConfig = {
  baseCopyBps: 500, // copy 5% of leader notional
  maxFillUsdg: usdg(2_000),
  maxPositionUsdg: usdg(5_000),
};
const RISK: RiskConfig = {
  maxGrossExposureUsdg: usdg(10_000),
  maxDrawdownBps: 2_000, // 20%
  maxStalenessSec: 120,
};

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function main(): void {
  const market = buildStaticMarket(QUOTES, 25); // 0.25% slippage
  const executor = new PaperExecutor(market);
  const state = createRiskState(usdg(10_000), usdg(10_000));

  console.log("Axbook paper-copy engine — Phase 0 (PAPER, no funds move)\n");
  console.log(
    `Seed: cash=${formatUsdg(state.cashUsdg)} USDG, shares=${formatUsdg(
      state.shares,
    )}\n`,
  );
  console.log(
    pad("fill", 5) +
      pad("sym", 6) +
      pad("side", 6) +
      pad("session", 12) +
      pad("action", 9) +
      pad("intended", 14) +
      pad("executed", 14) +
      "reason",
  );

  const outcomes: FillOutcome[] = [];
  for (const fill of FILLS) {
    const o = processFill(fill, state, {
      copy: COPY,
      risk: RISK,
      market,
      executor,
      now: new Date(fill.timestampMs),
    });
    outcomes.push(o);
    console.log(
      pad(o.fillId, 5) +
        pad(o.symbol, 6) +
        pad(o.side, 6) +
        pad(o.session, 12) +
        pad(o.action, 9) +
        pad(formatUsdg(o.intendedUsdg), 14) +
        pad(formatUsdg(o.executedUsdg), 14) +
        o.reason,
    );
  }

  writeFillTape(
    outcomes.map((o, i) =>
      recordOutcome(o, {
        desk: null,
        leader: FILLS[i]?.leader ?? "0xleader",
        slippageBps: market.slippageBps,
        source: "fixture",
        timestamp: new Date(FILLS[i]?.timestampMs ?? 0).toISOString(),
      }),
    ),
  );

  const executedCount = outcomes.filter((o) => o.executedUsdg > 0n).length;
  const totalExecuted = outcomes.reduce((a, o) => a + o.executedUsdg, 0n);
  const last = outcomes[outcomes.length - 1];

  console.log("\nSummary");
  console.log(`  fills processed : ${outcomes.length}`);
  console.log(`  copies executed : ${executedCount}`);
  console.log(`  total executed  : ${formatUsdg(totalExecuted)} USDG`);
  console.log(`  final cash      : ${formatUsdg(state.cashUsdg)} USDG`);
  if (last) {
    console.log(`  final NAV       : ${formatUsdg(last.navAfterUsdg)} USDG`);
    console.log(
      `  final NAV/share : ${formatUsdg(last.navPerShareAfter)} USDG/share`,
    );
  }
  console.log(`  halted          : ${state.halted}`);
}

main();
