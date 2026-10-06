/**
 * Axbook NAV math.
 *
 * All arithmetic is integer / fixed-point using bigint. There is no floating
 * point in the accounting path, mirroring the on-chain NavLib. Values are kept
 * in base units (smallest integer units) and only formatted for display at the
 * edges.
 *
 * NAV concept (desk equity):
 *
 *   USDG cash
 *   + Σ(token UI balance × oracle price)
 *   - applicable liabilities / fees
 *   = desk equity
 *
 * Seat NAV = desk equity / outstanding book shares.
 *
 * Token balances use the authoritative supported balance interface
 * (`balanceOfUI()`), not raw ERC-20 `balanceOf()`. The exact interface must be
 * verified against Robinhood Chain documentation before mainnet use.
 */

/** USDG accounting decimals on Robinhood Chain. */
export const USDG_DECIMALS = 6;

export type NavErrorCode =
  | "INVALID_DECIMALS"
  | "NEGATIVE_VALUE"
  | "ZERO_PRICE"
  | "STALE_PRICE"
  | "DIVIDE_BY_ZERO";

/** Structured error for all NAV validation failures (fail closed). */
export class NavError extends Error {
  readonly code: NavErrorCode;
  constructor(code: NavErrorCode, message: string) {
    super(message);
    this.name = "NavError";
    this.code = code;
  }
}

/** Oracle price of one whole token, expressed in USDG. */
export interface PriceData {
  /** Price value in `decimals` fixed-point units. Must be > 0. */
  readonly value: bigint;
  /** Number of decimals in `value` (e.g. 8 for a Chainlink-style feed). */
  readonly decimals: number;
  /** Unix seconds when the price was last updated. Used for staleness checks. */
  readonly updatedAt: number;
}

/** A desk position in an allowlisted token, valued via `balanceOfUI()`. */
export interface Position {
  readonly symbol: string;
  /** UI balance in the token's base units, from `balanceOfUI()`. */
  readonly uiBalance: bigint;
  /** Token decimals. */
  readonly decimals: number;
  /** Price of one whole token in USDG. */
  readonly price: PriceData;
}

/** Options controlling NAV evaluation. */
export interface NavOptions {
  /** Current unix seconds; required when `maxStalenessSec` is set. */
  readonly now?: number;
  /** Max allowed price age in seconds. Older prices throw `STALE_PRICE`. */
  readonly maxStalenessSec?: number;
  /** Liabilities / accrued fees to subtract, in USDG base units. */
  readonly liabilities?: bigint;
  /** Output USDG decimals. Defaults to `USDG_DECIMALS` (6). */
  readonly usdgDecimals?: number;
}

/** Result of a NAV evaluation. All amounts are in USDG base units. */
export interface NavResult {
  /** USDG cash component. */
  readonly cash: bigint;
  /** Sum of position values. */
  readonly positionsValue: bigint;
  /** Liabilities subtracted. */
  readonly liabilities: bigint;
  /** Desk equity = cash + positionsValue - liabilities. */
  readonly equity: bigint;
}

const MAX_DECIMALS = 36;

function assertDecimals(decimals: number, label: string): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new NavError(
      "INVALID_DECIMALS",
      `${label} decimals out of range [0, ${MAX_DECIMALS}]: ${decimals}`,
    );
  }
}

function pow10(n: number): bigint {
  return 10n ** BigInt(n);
}

/**
 * Rescale an integer amount from `fromDecimals` to `toDecimals` fixed-point.
 * Scaling down truncates toward zero (floor for non-negative values).
 */
export function normalizeBalance(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number,
): bigint {
  assertDecimals(fromDecimals, "from");
  assertDecimals(toDecimals, "to");
  if (amount < 0n) {
    throw new NavError("NEGATIVE_VALUE", `balance must be >= 0: ${amount}`);
  }
  if (toDecimals >= fromDecimals) {
    return amount * pow10(toDecimals - fromDecimals);
  }
  return amount / pow10(fromDecimals - toDecimals);
}

/**
 * Rescale a price from `fromDecimals` to `toDecimals` fixed-point. Rejects
 * non-positive prices (fail closed on zero / negative oracle data).
 */
export function normalizePrice(
  value: bigint,
  fromDecimals: number,
  toDecimals: number,
): bigint {
  assertDecimals(fromDecimals, "price from");
  assertDecimals(toDecimals, "price to");
  if (value <= 0n) {
    throw new NavError("ZERO_PRICE", `price must be > 0: ${value}`);
  }
  if (toDecimals >= fromDecimals) {
    return value * pow10(toDecimals - fromDecimals);
  }
  return value / pow10(fromDecimals - toDecimals);
}

function validatePrice(price: PriceData, opts: NavOptions): void {
  assertDecimals(price.decimals, "price");
  if (price.value <= 0n) {
    throw new NavError("ZERO_PRICE", `price must be > 0: ${price.value}`);
  }
  if (opts.maxStalenessSec !== undefined) {
    if (opts.now === undefined) {
      throw new NavError(
        "STALE_PRICE",
        "now must be provided when maxStalenessSec is set",
      );
    }
    const age = opts.now - price.updatedAt;
    if (age < 0 || age > opts.maxStalenessSec) {
      throw new NavError(
        "STALE_PRICE",
        `price age ${age}s exceeds max ${opts.maxStalenessSec}s`,
      );
    }
  }
}

/**
 * Value a single position in USDG base units:
 *
 *   value = uiBalance × price × 10^usdgDecimals
 *           / (10^tokenDecimals × 10^priceDecimals)
 *
 * Multiplication is done before division to preserve precision. Truncates
 * toward zero.
 */
export function valuePosition(position: Position, opts: NavOptions = {}): bigint {
  const usdgDecimals = opts.usdgDecimals ?? USDG_DECIMALS;
  assertDecimals(usdgDecimals, "usdg");
  assertDecimals(position.decimals, "token");
  if (position.uiBalance < 0n) {
    throw new NavError(
      "NEGATIVE_VALUE",
      `uiBalance must be >= 0: ${position.uiBalance}`,
    );
  }
  validatePrice(position.price, opts);
  const numerator =
    position.uiBalance * position.price.value * pow10(usdgDecimals);
  const denominator = pow10(position.decimals) * pow10(position.price.decimals);
  return numerator / denominator;
}

/**
 * Compute desk equity (NAV) in USDG base units:
 *   equity = cash + Σ position values - liabilities.
 * Throws (fails closed) on invalid decimals, zero/negative prices, stale prices,
 * or negative inputs.
 */
export function calculateNav(
  cashUsdg: bigint,
  positions: readonly Position[],
  opts: NavOptions = {},
): NavResult {
  if (cashUsdg < 0n) {
    throw new NavError("NEGATIVE_VALUE", `cash must be >= 0: ${cashUsdg}`);
  }
  const liabilities = opts.liabilities ?? 0n;
  if (liabilities < 0n) {
    throw new NavError(
      "NEGATIVE_VALUE",
      `liabilities must be >= 0: ${liabilities}`,
    );
  }
  let positionsValue = 0n;
  for (const position of positions) {
    positionsValue += valuePosition(position, opts);
  }
  const equity = cashUsdg + positionsValue - liabilities;
  return { cash: cashUsdg, positionsValue, liabilities, equity };
}

/**
 * NAV per book share, scaled to `sharePrecision` decimals of USDG per share.
 * Returns 0 when there are no shares (a fresh desk has no per-share value).
 */
export function navPerShare(
  equityUsdg: bigint,
  totalShares: bigint,
  sharePrecision: number = USDG_DECIMALS,
): bigint {
  assertDecimals(sharePrecision, "share");
  if (totalShares < 0n) {
    throw new NavError(
      "NEGATIVE_VALUE",
      `totalShares must be >= 0: ${totalShares}`,
    );
  }
  if (totalShares === 0n) {
    return 0n;
  }
  return (equityUsdg * pow10(sharePrecision)) / totalShares;
}

/** Format a USDG base-unit amount as a decimal string (display only). */
export function formatUsdg(
  amount: bigint,
  usdgDecimals: number = USDG_DECIMALS,
): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const scale = pow10(usdgDecimals);
  const whole = abs / scale;
  const frac = abs % scale;
  const fracStr = frac.toString().padStart(usdgDecimals, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fracStr}`;
}
