/**
 * Keeper NAV helpers — thin wrappers over the SDK's fixed-point NAV math so the
 * keeper and the on-chain accounting share one definition of NAV.
 */
import {
  calculateNav,
  navPerShare,
  type NavOptions,
  type NavResult,
  type Position,
} from "@seat/sdk";

export type { NavResult, Position } from "@seat/sdk";

/** Desk equity in USDG base units. */
export function deskEquity(
  cashUsdg: bigint,
  positions: readonly Position[],
  opts: NavOptions = {},
): NavResult {
  return calculateNav(cashUsdg, positions, opts);
}

/** NAV per book share (USDG base units per share). */
export function deskNavPerShare(
  equityUsdg: bigint,
  totalShares: bigint,
): bigint {
  return navPerShare(equityUsdg, totalShares);
}
