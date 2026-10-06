---
title: Security Model
description: Trust assumptions, privilege boundaries, and dependency risks — the actual model, not a marketing one.
order: 1
---

:::callout{type="danger" title="Unaudited, experimental software"}
Axbook has **no security audit**, no bug bounty, and no production deployment. Nothing in this section is a guarantee. It is a description of the intended privilege boundaries as implemented in the code.
:::

## Trust matrix

| Actor | Powers | Cannot |
|---|---|---|
| **Owner** | Pause/unpause; set risk parameters (bounded); set keeper; set fee recipients; configure desk | Withdraw user funds — no admin sweep exists |
| **Keeper** | Call `executeCopy` only | Touch deposits, redemptions, configuration; every copy is re-checked by `RiskModule` on-chain |
| **Factory owner** | `createDesk` permissioning | Access existing vaults' funds |
| **Anyone** | List a desk by posting the `$AXBOOK` bond (Phase 2); call `processWithdrawals` | — |
| **Depositor** | Deposit; queue a redemption at any time (even paused) | — |

## Key-management requirements

- `PRIVATE_KEY` (broadcaster/keeper) and the owner key are the crown jewels. Keep them out of `.env` on shared machines; never commit them; prefer hardware/KMS custody for the owner.
- A compromised **keeper** key can only submit risk-bounded copies — bad but bounded. A compromised **owner** key can pause and reconfigure every vault — the worst case. Rotate both immediately on suspicion.

## Dependency risks

| Dependency | Risk | Mitigation in code |
|---|---|---|
| Chainlink feeds | Stale/bad price | `ChainlinkOracle` rejects non-positive prices; staleness check (default 120 s) fails closed |
| RPC | Keeper blindness | None built in — single endpoint; operational failover is manual |
| Uniswap router | Execution venue | `ExactInputRouter02` wraps only SwapRouter02 `exactInputSingle`; no arbitrary calldata path in `SwapAdapter` |
| Stock Token issuer | Asset integrity | Registry verification states; only `verified`+`enabled` rows are eligible |
| Leader | Trading behavior | Risk caps, session sizing, drawdown halt — but leader losses are real depositor losses |

## Contract properties worth knowing

- **Immutable:** no proxy/upgrade pattern anywhere. Bugs are permanent; migration is the only fix.
- **Pause never traps shares** (redeems queue while paused).
- **Withdrawal queue is FIFO** and processing is permissionless.
- **Fee accrual is lazy** (`_accrueFees` on state changes) — reads between accruals can be slightly stale by design.
- **`SwapAdapter.quote` always reverts** — quoting is intentionally not on-chain.
- **Staker fee slice** accrues as a vault liability when `stakerRecipient` is unset (Phase 1 posture) — it is not lost and not skimmable by anyone else.

## Economic and market risks

- Copy trading **amplifies leader risk** across all follower capital. Caps bound size, not direction of P&L.
- Stock Tokens trade in market sessions; the session clock (ET, no holiday calendar) can misjudge holidays — it fails closed (size 0) when unsure.
- USDG and Stock Tokens are issuer-backed instruments; their own risks are out of Axbook's control. Axbook is [not affiliated with Robinhood](/docs/runbooks/not-affiliated).
