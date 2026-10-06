---
title: NAV & Accounting
description: How Axbook values a desk — USDG base units, balanceOfUI, oracle prices, and the exact NAV formulas.
order: 1
---

This page is the authoritative description of desk accounting. The rules here are enforced by `NavLib` on-chain and mirrored by `@seat/sdk` off-chain.

## Units and decimals

| Quantity | Decimals | Notes |
|---|---|---|
| USDG amounts | 6 | All vault accounting is in USDG base units |
| Stock Token balances | 18 | Via `balanceOfUI()`, never raw `balanceOf` for equity |
| Oracle prices | 8 | On the cited 4663 Chainlink feeds |
| Book shares | 6 | `SHARE_PRECISION = 6` |

**Raw vs UI balances.** Stock Tokens expose `balanceOfUI(address)` (ERC-8056), the authoritative supported-balance interface. The vault's valuation path is: try `balanceOfUI` → fall back to `balanceOf` → fall back to `0` (only if both calls fail). The SDK's `Position.uiBalance` is the same quantity. Display formatting (`formatUsdg`) happens only at the edges; internally everything is integer base units.

## The formulas

```
positionValue = uiBalance × price × 10^6 / (10^tokenDecimals × 10^priceDecimals)
grossEquity   = cashUsdg + Σ positionValue
equity        = grossEquity − feeLiabilitiesUsdg          (floored at 0)
navPerShare   = equity × 10^6 / totalShares               (0 when no shares)
```

`DeskVault.totalAssetsUsdg()` goes one step further and subtracts **pending** (not yet booked) fees — an estimate of the AUM accrual since `lastFeeTs` plus any performance fee that would charge at the current NAV — so external reads are never ahead of liabilities.

## When valuation runs (and reverts)

Position values are needed by `deposit`, `redeem`, `executeCopy`, and the `totalAssetsUsdg`/`navPerShare` views. Any of these reverts when:

- the desk holds a position but has no oracle set (`MissingOracle`),
- the oracle returns a zero price (`NavLib.ZeroPrice`),
- the price timestamp is in the future or older than `maxStalenessSec` (default 120 s) (`StalePrice`).

A cash-only desk (the current testnet state) never touches the oracle: with no held tokens, NAV is exactly `cashUsdg − liabilities`.

## Fee liabilities

`feeLiabilitiesUsdg` accumulates two charges at every state transition (see [Fees](/docs/accounting/fees)):

- **AUM:** `equity × 200 bps × elapsed / (10_000 × 365 days)`
- **Performance:** 10% of `(navPerShare − highWaterNavPerShare) × totalShares / 10^6` when NAV/share exceeds the high-water mark

Liabilities are paid out of cash when possible; until paid they reduce equity.

## Reading NAV off-chain

```ts
import { calculateNav, navPerShare, formatUsdg } from "@seat/sdk";

const nav = calculateNav(cashUsdg, positions, {
  now: Math.floor(Date.now() / 1000),
  maxStalenessSec: 120,
  liabilities: feeLiabilitiesUsdg,
});
console.log(formatUsdg(nav.equity), formatUsdg(navPerShare(nav.equity, totalShares)));
```

The keeper uses the same functions for paper accounting, so the tape's NAV figures match the vault's definition exactly.
