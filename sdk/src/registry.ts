/**
 * Axbook official Stock Token registry.
 *
 * The registry is the single source of truth for which assets a desk may hold.
 * Assets are NOT identified by symbol, name, or metadata alone. Every entry
 * declares a verification state, and only `verified` + `enabled` entries may be
 * traded by a desk — on the chain the entry is cited for.
 *
 * IMPORTANT: No token addresses are invented in this repository. See
 * docs/allowlist.md and docs/phase-1-live.md. Do not copy 4663 addresses
 * onto 46630.
 */
import { LEADER_EQUITIES } from "./leader-equities.js";

/** Verification state of a registry entry. See docs/allowlist.md. */
export type VerificationState = "verified" | "unverified" | "placeholder";

/** A `0x`-prefixed 20-byte hex address. */
export type Address = `0x${string}`;

/** Registry entry for a candidate/official Stock Token. */
export interface OfficialStockToken {
  /** Ticker symbol, e.g. "NVDA". Never used alone to identify an asset. */
  readonly symbol: string;
  /** Human-readable name. Informational only; never used to identify an asset. */
  readonly name: string;
  /** Robinhood Chain id this row applies to (4663 or 46630). */
  readonly chainId: number;
  /**
   * On-chain contract address. `null` when not yet authoritatively verified.
   * Never fabricate this value.
   */
  readonly address: Address | null;
  /** Cited AggregatorV3 proxy, or `null` if not published for this chain. */
  readonly feed: Address | null;
  /** Verified issuer identity, or `null` if not yet verified. */
  readonly issuer: string | null;
  /** Token decimals. `null` until verified on-chain. */
  readonly decimals: number | null;
  /**
   * Optional deployed-bytecode hash used for identity verification where
   * applicable. `null` when not applicable or not yet recorded.
   */
  readonly bytecodeHash: `0x${string}` | null;
  /** Verification state. Only `verified` entries are trade-eligible. */
  readonly verification: VerificationState;
  /** Whether the operator/governance process has enabled trading this asset. */
  readonly enabled: boolean;
  /** Free-form note explaining verification status or required follow-up. */
  readonly note: string;
}

const TESTNET_BYTECODE =
  "0x2f367e6a678e7b30ab613d5963e541e6f4d3ca586de76e2f441fbfeb1a27c440" as const;

const MAINNET_BYTECODE =
  "0x6c1fdd40002dcb440c7fff6a84171404d279ccb057803b65826f7546acd65630" as const;

const TESTNET_NOTE =
  "Official 46630 contracts page + on-chain decimals/symbol/bytecode. " +
  "Not verified: no cited 46630 Chainlink feed. enabled=false. " +
  "See docs/phase-1-live.md.";

const TESTNET_PLACEHOLDER_NOTE =
  "Not on official 46630 contracts table. Do not copy mainnet 4663. See docs/phase-1-live.md.";

const MAINNET_NOTE =
  "Official 4663 contracts page + on-chain symbol/decimals/balanceOfUI/" +
  "bytecode. Chainlink AggregatorV3 description() + 8 decimals. enabled. " +
  "See docs/phase-1-live.md.";

/**
 * Allowlist. Rows are chain-specific. NVDA/AAPL/SPY are verified on 4663
 * only. Official 46630 names stay unverified until a feed is published.
 */
export const OFFICIAL_STOCK_TOKENS: readonly OfficialStockToken[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA (Stock Token)",
    chainId: 46630,
    address: null,
    feed: null,
    issuer: null,
    decimals: null,
    bytecodeHash: null,
    verification: "placeholder",
    enabled: false,
    note: TESTNET_PLACEHOLDER_NOTE,
  },
  {
    symbol: "AAPL",
    name: "Apple (Stock Token)",
    chainId: 46630,
    address: null,
    feed: null,
    issuer: null,
    decimals: null,
    bytecodeHash: null,
    verification: "placeholder",
    enabled: false,
    note: TESTNET_PLACEHOLDER_NOTE,
  },
  {
    symbol: "SPY",
    name: "S&P 500 ETF (Stock Token)",
    chainId: 46630,
    address: null,
    feed: null,
    issuer: null,
    decimals: null,
    bytecodeHash: null,
    verification: "placeholder",
    enabled: false,
    note: TESTNET_PLACEHOLDER_NOTE,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA (Stock Token)",
    chainId: 4663,
    address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
    feed: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: MAINNET_BYTECODE,
    verification: "verified",
    enabled: true,
    note: MAINNET_NOTE,
  },
  {
    symbol: "AAPL",
    name: "Apple (Stock Token)",
    chainId: 4663,
    address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    feed: "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: MAINNET_BYTECODE,
    verification: "verified",
    enabled: true,
    note: MAINNET_NOTE,
  },
  {
    symbol: "SPY",
    name: "S&P 500 ETF (Stock Token)",
    chainId: 4663,
    address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C",
    feed: "0x319724394D3A0e3669269846abE664Cd621f9f6A",
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: MAINNET_BYTECODE,
    verification: "verified",
    enabled: true,
    note: MAINNET_NOTE,
  },
  {
    symbol: "TSLA",
    name: "Tesla (Stock Token)",
    chainId: 46630,
    address: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E",
    feed: null,
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: TESTNET_BYTECODE,
    verification: "unverified",
    enabled: false,
    note: TESTNET_NOTE,
  },
  {
    symbol: "AMZN",
    name: "Amazon (Stock Token)",
    chainId: 46630,
    address: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02",
    feed: null,
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: TESTNET_BYTECODE,
    verification: "unverified",
    enabled: false,
    note: TESTNET_NOTE,
  },
  {
    symbol: "PLTR",
    name: "Palantir (Stock Token)",
    chainId: 46630,
    address: "0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0",
    feed: null,
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: TESTNET_BYTECODE,
    verification: "unverified",
    enabled: false,
    note: TESTNET_NOTE,
  },
  {
    symbol: "NFLX",
    name: "Netflix (Stock Token)",
    chainId: 46630,
    address: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93",
    feed: null,
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: TESTNET_BYTECODE,
    verification: "unverified",
    enabled: false,
    note: TESTNET_NOTE,
  },
  {
    symbol: "AMD",
    name: "AMD (Stock Token)",
    chainId: 46630,
    address: "0x71178BAc73cBeb415514eB542a8995b82669778d",
    feed: null,
    issuer: "Robinhood Assets (Jersey) Limited",
    decimals: 18,
    bytecodeHash: TESTNET_BYTECODE,
    verification: "unverified",
    enabled: false,
    note: TESTNET_NOTE,
  },
  ...LEADER_EQUITIES,
];

/** Case-insensitive lookup by symbol, optionally scoped to a chain. */
export function getOfficialStockToken(
  symbol: string,
  chainId?: number,
): OfficialStockToken | undefined {
  const target = symbol.trim().toUpperCase();
  const matches = OFFICIAL_STOCK_TOKENS.filter(
    (t) => t.symbol.toUpperCase() === target,
  );
  if (chainId !== undefined) {
    return matches.find((t) => t.chainId === chainId);
  }
  return matches[0];
}

/** Lookup by contract address (case-insensitive). */
export function getOfficialStockTokenByAddress(
  address: string,
): OfficialStockToken | undefined {
  const target = address.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(target)) return undefined;
  return OFFICIAL_STOCK_TOKENS.find(
    (t) => t.address !== null && t.address.toLowerCase() === target,
  );
}

/**
 * Whether an asset is trade-eligible on `chainId`: present, `verified`,
 * `enabled`, with a concrete address, decimals, and cited feed.
 */
export function isTradeEligible(symbol: string, chainId: number): boolean {
  const token = getOfficialStockToken(symbol, chainId);
  return Boolean(
    token &&
      token.chainId === chainId &&
      token.verification === "verified" &&
      token.enabled &&
      token.address !== null &&
      token.decimals !== null &&
      token.feed !== null,
  );
}

/** Unique symbols currently in the registry (regardless of verification). */
export function listSymbols(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of OFFICIAL_STOCK_TOKENS) {
    if (!seen.has(t.symbol)) {
      seen.add(t.symbol);
      out.push(t.symbol);
    }
  }
  return out;
}

/** Addresses that may appear in a live fill tape on `chainId`. */
export function listedTokenAddresses(chainId: number): Address[] {
  return OFFICIAL_STOCK_TOKENS.filter(
    (t) => t.chainId === chainId && t.address !== null,
  ).map((t) => t.address as Address);
}
