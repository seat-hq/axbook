---
title: USDG & Stock Tokens
description: The two asset types a desk touches — the USDG accounting asset and the official Stock Tokens it may hold.
order: 4
---

## USDG — the accounting asset

**Plain English.** USDG is the dollar stablecoin everything is measured in. Deposits go in as USDG, positions are valued in USDG, fees are paid in USDG, and redemptions pay out USDG.

**Technically.**

- USDG has **6 decimals**. All vault accounting (`cashUsdg`, `feeLiabilitiesUsdg`, caps, NAV) is in USDG base units.
- Official addresses (cited from the official contracts page; see [Networks](/docs/networks/overview)):

| Network | Address |
|---|---|
| Mainnet `4663` | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| Testnet `46630` | `0x7E955252E15c84f5768B83c41a71F9eba181802F` |

- Gas on both networks is ETH. USDG is accounting only.

## Stock Tokens — what desks hold

**Plain English.** Stock Tokens are official on-chain tokens on Robinhood Chain that track equities and ETFs (NVDA, AAPL, SPY, …). They are issued by a third party and are **not shares of stock**; they may carry issuer, custody, settlement and jurisdictional risk, and may be restricted in some jurisdictions.

**Technically.**

- Stock Tokens are ERC-20s with **18 decimals** that additionally expose `balanceOfUI(address)` — the ERC-8056 "supported balance" interface. Axbook's NAV uses `balanceOfUI()`, never raw `balanceOf()`. (The vault falls back to `balanceOf` only if the UI call is unavailable, and treats a total failure as a zero value.)
- Prices come from Chainlink `AggregatorV3` feeds (8 decimals on the cited 4663 feeds) through the vault's `ChainlinkOracle`.
- A desk may only hold tokens that are `verified` **and** `enabled` in the [official registry](/docs/networks/token-registry) for that chain, and allowlisted in both `RiskModule` and `SwapAdapter`.

### Registry snapshot (verified against `sdk/src/registry.ts`)

| Symbol | Chain | State | Trade-eligible |
|---|---|---|---|
| NVDA, AAPL, SPY | `4663` | `verified`, `enabled` | ✅ `isTradeEligible(symbol, 4663)` |
| NVDA, AAPL, SPY | `46630` | `placeholder` (not on the official testnet contracts table) | ❌ |
| TSLA, AMZN, PLTR, NFLX, AMD | `46630` | `unverified` (no cited 46630 Chainlink feed) | ❌ |

:::callout{type="warning" title="Not shares"}
"Stock Tokens" are on-chain assets that may be issued by third parties. They are not shares of stock and may differ materially from directly owning the underlying security. See [Not affiliated](/docs/runbooks/not-affiliated) and the [risk disclosure](/docs/runbooks/risk).
:::
