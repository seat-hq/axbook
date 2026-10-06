# Axbook — Litepaper

Axbook is a protocol for USDG-denominated **copy-trading desks** on Robinhood
Chain. A desk mirrors the trades of an opted-in leader across a small set of
authoritatively verified, official Stock Tokens (initially NVDA, AAPL, SPY).
Depositors receive **book shares** representing a pro-rata claim on desk equity
(NAV), computed from USDG cash plus the USDG value of held Stock Tokens.

This document describes the concept. It makes **no guarantees** of returns and
is **not investment advice**. See [`risk.md`](risk.md) and
[`not-affiliated.md`](not-affiliated.md).

## Status

**Phase 0 is shipped** (paper copy, deterministic risk, no funds move).

**Phase 1 is shipped on Robinhood testnet `46630`**: factory + cash vault
deploy, USDG deposit/redeem in the blotter, keeper bound to `vault.leader()`,
honest fill tape (`source=fixture|chain`). A **$50k-capped** mainnet desk
is wired in code (cited MAG7 + SwapRouter02); it is **not** broadcast
unless `CONFIRM_MAINNET=I_UNDERSTAND`.

**Phase 2 code is shipped**: 1B `$AXBOOK` (no mint), 70/20/10 fees,
stake-to-list, extra desks, 12-month LP locker. TGE on 4663 still needs
`CONFIRM_MAINNET` **and** `CONFIRM_SEAT_TGE`. See
[`phase-2.md`](phase-2.md). Axbook is **not affiliated** with Robinhood
Markets.

Do not deposit on mainnet (`4663`) until a capped vault address is recorded
from a real `DeployMainnet` or `DeployPhase2` broadcast.

## Phase 0 — Paper Copy

Phase 0 exists to prove the mechanism **without real money**:

- The keeper observes hypothetical leader fills and produces copy signals.
- The risk module accepts/rejects/sizes each signal deterministically.
- Execution is **paper only** — no router is configured and no funds move.
- Every decision is explainable (why a fill was copied, resized, or skipped).

## Phase 1 — Testnet desks

Phase 1 wires the cash vault to testnet:

- `DeskFactory.createDesk(leader)` on `46630` (optional in the deploy script).
- Depositors approve USDG and mint book shares; redeem is instant when cash
  is available, otherwise queued.
- The app reads NAV, shares, cash, and leader from the vault. Deposit/redeem
  are enabled when connected on `46630` or `4663` with a real vault address
  (4663 also enforces the $50k deposit cap).
- The keeper does **not** pick a leader. It reads `vault.leader()` (or an
  explicit `LEADER_ADDRESS` fallback).
- Fill tape rows are labeled `source=fixture` or `source=chain`. Fixtures are
  never labeled live.
- Live execution fails closed on 46630 (no router). On 4663 it requires
  `ExactInputRouter02` + `isTradeEligible(symbol, 4663)`.

## Accounting

- Accounting asset: **USDG** (6 decimals).
- Gas asset: **ETH**.
- NAV = USDG cash + Σ(token UI balance × oracle price) − liabilities.
- Seat NAV = desk equity ÷ outstanding book shares.
- Token balances use the authoritative `balanceOfUI()` supported-balance
  interface, never raw ERC-20 `balanceOf()`.
- Phase 1 vaults are cash-only, so NAV equals USDG cash.

## Sessions

Copy sizing depends on the market session. After-hours size is strictly smaller
than cash-session size. When the session or price is uncertain, the system fails
closed (does not trade).

## Components

| Component | Role |
|---|---|
| `DeskFactory` | One `DeskVault` per leader |
| `DeskVault` | Holds USDG + Stock Tokens, issues book shares |
| `RiskModule` | Caps, session clock, drawdown halt, skip rules |
| `SwapAdapter` | Restricted swap surface (no arbitrary calldata) |
| `FeeModule` | High-water performance fee + AUM accrual; 70/20/10 split on Phase 2 |
| `SeatToken` | Fixed 1B `$AXBOOK`, no mint — TGE via guarded `DeployPhase2` |
| `StakingPool` | Stake `$AXBOOK`, claim USDG from desk fees |
| `LpLocker` | 12-month lock of a Uniswap v3 position NFT |

## Roadmap (non-binding)

1. **Phase 0** — paper copy, deterministic risk, full test coverage. **Shipped.**
2. **Phase 1** — testnet deposits/redeems, blotter on real 46630 data. **Shipped.**
   Capped mainnet desk ($50k MAG7) is wired; broadcast is guarded.
3. **Phase 2** — extra desks + `$AXBOOK` (1B, no mint), 70/20/10, stake-to-list,
   12-month LP lock. **Code shipped;** TGE needs dual CONFIRM. See
   [`phase-2.md`](phase-2.md).
4. **Later** — buyback-and-burn, vesting, merkle airdrop, ungated AUM,
   Phase 3 tools.
