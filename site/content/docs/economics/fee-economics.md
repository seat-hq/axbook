---
title: Fee Economics
description: The two fees, the high-water mark, and where every bip goes — Phase 1 vs Phase 2.
order: 1
---

Axbook has exactly two fees. There is **no volume fee, no deposit fee, no withdrawal fee**.

| Fee | Rate | Trigger |
|---|---|---|
| Performance | **10%** (1,000 bps) of profits | Charged only on NAV/share above the **high-water mark** |
| AUM | **2% per year** (200 bps) | Accrues continuously on assets under management |

Both are computed by the pure `FeeModule` and accrued lazily by the vault (`_accrueFees` on state changes, `_tryPayFees` when recipients are set). The math is specified in [Fees](/docs/accounting/fees).

## Where the fees go

| Recipient | Phase 1 (live posture) | Phase 2 (code shipped, not deployed) |
|---|---|---|
| Leader | 70% | 70% |
| Protocol treasury (`PROTOCOL_FEE_RECIPIENT`) | 20% | 20% |
| Stakers | 10% — **accrues as a vault liability** while `stakerRecipient` is unset | 10% → `StakingPool` |

Phase 1 scripts keep `stakerShareBps: 0` (an 80/20 effective split) precisely so no fee is promised to a staking contract that does not exist yet. The Phase 2 deployment wires `stakerRecipient` and activates the full 70/20/10.

## High-water mark

The performance fee can only be charged on **new** profits: the vault records the highest NAV/share ever seen and fees only the excess above it. Losses must be fully recovered before performance fees resume. This is implemented in the vault's accrual path and tested in `DeskVault.t.sol`.

## Worked example

*Example numbers — not a live desk or forecast.*

- NAV/share rises from 1.00 to 1.10 on 100,000 USDG AUM ⇒ profit above HWM = 10,000 USDG ⇒ performance fee = 1,000 USDG ⇒ leader 700 / protocol 200 / staker-slice 100 (liability in Phase 1).
- AUM fee on 100,000 USDG for 30 days ≈ `100,000 × 2% × 30/365` ≈ 164.4 USDG, split the same way.

## What fees deliberately do not do

- No fee on deposits or withdrawals — entering and exiting is free (gas aside).
- No fee on volume — churn is not monetized.
- "Buyback-and-burn" is explicitly listed as **later** in the Phase 2 doc — it is not implemented.
