---
title: Seat Shares & NAV
description: How desk ownership is measured — book shares, NAV, and NAV per share.
order: 5
---

## Plain English

When you deposit USDG into a desk you receive **book shares** — the unit that measures your slice of the desk. The desk's total value is its **NAV** (net asset value): the USDG it holds as cash, plus the current USDG value of every Stock Token position, minus fees owed. **NAV per share** is NAV divided by all outstanding shares; it is the single number that tells you what one share is worth, and it is what deposits, redemptions, fees and the drawdown halt all key off.

If the desk trades well, NAV per share rises above 1.00 (the bootstrap value); if it trades poorly, it falls below. Your shares never change number — their USDG value moves.

## Technically

Book shares are **not** an ERC-20. They are internal vault accounting: `totalShares` and `sharesOf[account]` in `DeskVault`, with `SHARE_PRECISION = 6` decimals (matching USDG).

### NAV

```
equity      = cashUsdg + Σ positionValues − feeLiabilitiesUsdg
positionVal = balanceOfUI(vault) × oraclePrice, normalized to USDG base units
navPerShare = equity × 10^6 / totalShares        (0 when no shares exist)
```

- `DeskVault.totalAssetsUsdg()` returns equity **including** an estimate of fees accrued but not yet booked (`_pendingFeeDelta`), so reads reflect fees in real time.
- All math is fixed-point integer arithmetic in `NavLib` (mirrored by the SDK's `nav.ts`); multiplication precedes division, and division truncates toward zero.
- A position with a missing oracle, a zero price, or a price older than `maxStalenessSec` (default 120s) **reverts** the whole valuation — the vault fails closed rather than guess a NAV.

### Shares in and out

| Action | Formula | Notes |
|---|---|---|
| Deposit | `shares = assets × totalShares / equity` | Bootstrap: empty desk mints 1:1 |
| Redeem | `assets = shares × equity / totalShares` | Paid instantly from cash, or queued |

Both directions accrue fees *before* computing, so no one enters or exits ahead of the fee liability.

### Worked example

Example numbers — not a live desk or forecast:

1. Two depositors each deposit 10,000 USDG into an empty desk → 10,000 shares each; NAV/share = 1.00.
2. The desk copies a leader into NVDA, spending 12,000 USDG over several capped fills (the per-fill cap is 5,000). Cash: 8,000; position: 12,000.
3. NVDA rises; the position is now worth 14,000. NAV = 22,000 → NAV/share = **1.10** before fees.
4. Profit above the high-water mark is 2,000; the 10% performance fee books a 200 USDG liability. NAV/share after fees ≈ **1.09**.
5. A depositor redeems 5,000 shares at ~1.09 → ~5,450 USDG, paid instantly if the vault has the cash, otherwise queued.

The full fee math (including the 70/20/10 split of that 200) is on [Fees & High-Water Mark](/docs/concepts/fees-and-high-water-mark); the exact accounting rules are in [NAV & Accounting](/docs/accounting/nav-and-accounting).
