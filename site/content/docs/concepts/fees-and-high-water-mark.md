---
title: Fees & High-Water Mark
description: Performance fee above the high-water mark, the time-based AUM fee, and the 70/20/10 split. No volume fee, by design.
order: 6
---

## Plain English

Axbook charges for **results and time**, never for activity:

- **Performance fee — 10%.** When a desk's NAV per share rises above the highest level it has ever reached (the **high-water mark**), 10% of that new profit becomes a fee liability. If the desk loses money, the fee stops until NAV per share fully recovers past its previous peak.
- **AUM fee — 2% per year.** A small fee accrues continuously on desk equity, prorated by the second.
- **No volume fee.** Copying ten trades or zero trades costs depositors nothing by itself. This is an explicit design rule of the protocol.

Fees are shared: **70% to the leader**, **20% to the protocol**, **10% to $AXBOOK stakers** (Phase 2 configuration; Phase 1 vaults run 80/20 with no staker share).

## Technically

All fee math lives in `FeeModule` (pure functions + owner-set params); liabilities and payouts live in `DeskVault`.

### Parameters (deploy defaults)

| Parameter | Value | Source |
|---|---|---|
| `performanceFeeBps` | `1_000` (10%) | Deploy scripts |
| `aumFeeBpsPerYear` | `200` (2%/yr) | Deploy scripts |
| `protocolShareBps` | `2_000` (20%) | Deploy scripts |
| `stakerShareBps` | `1_000` (10%) on Phase 2 desks; `0` on Phase 1 vaults | `DeployPhase2.s.sol` / `DeployTestnet.s.sol` |

`performanceFeeBps ≤ 10000` and `protocolShareBps + stakerShareBps ≤ 10000` are enforced in `setParams`.

### Accrual

`_accrueFees()` runs at the top of every state-changing vault call (deposit, redeem, executeCopy):

1. **AUM:** `aumFee = equity × 200bps × elapsed / (10_000 × 365 days)` is added to `feeLiabilitiesUsdg`.
2. **Performance:** if `navPerShare > highWaterNavPerShare`, the profit `(nav − hwm) × totalShares / 10^6` is charged at 10%, and the high-water mark is raised to the post-fee NAV per share.
3. `totalAssetsUsdg()` always reports equity net of *pending* (not yet booked) fees, so reads are never ahead of liabilities.

### Payout

`_tryPayFees()` runs after deposits, redeems and copies:

- The fee split is computed by `FeeModule.splitFee`: protocol `20%`, staker `10%`, leader the remainder (`70%`).
- Payout happens only when the vault holds enough **cash**; otherwise liabilities wait.
- The staker slice is pushed to the `StakingPool` via `notifyReward`. **Fail closed:** if `stakerRecipient` is unset, the staker slice is *not* redirected to anyone — it stays in the vault as an unpaid liability.

### Worked example

Example numbers — not a live desk or forecast. Desk NAV/share rises from a 1.00 high-water mark to 1.10 on 20,000 shares:

- Profit above HWM: `0.10 × 20,000 = 2,000 USDG`
- Performance fee: `10% × 2,000 = 200 USDG`
- Split: **140** leader, **40** protocol, **20** stakers
- NAV/share after the fee: ≈ 1.09

The AUM fee is deliberately left out of this example; it accrues separately by time.

:::callout{type="note" title="Why a high-water mark"}
Without it, a desk that loses 50% then gains 50% would charge a performance fee on the recovery — on money that merely got depositors back to even. The high-water mark makes the performance fee apply only to *new* profit.
:::
