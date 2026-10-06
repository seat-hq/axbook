---
title: StakingPool
description: Stake $AXBOOK, claim pro-rata USDG from desk fee harvests — accumulator accounting, no rebase.
order: 11
status: experimental
---

`contracts/src/StakingPool.sol` — implements `IStakingPool`, `ReentrancyGuard`. Phase 2: code shipped, not deployed.

> Stake $AXBOOK, earn pro-rata USDG from desk fee harvest. No rebase.

## Storage

| Field | Meaning |
|---|---|
| `seat`, `usdg` | Immutable staking and reward tokens |
| `totalStaked` | Total `$AXBOOK` staked |
| `accUsdgPerShare` | Cumulative USDG per staked token, scaled by `1e18` |
| `undistributedUsdg` | Rewards received while nobody was staked |
| `stakedOf` / `rewardDebt` / `claimedUsdg` | Per-user stake, reward checkpoint, lifetime claims |

## Interface

| Function | Behaviour |
|---|---|
| `stake(amount)` | Settles pending rewards first (folding undistributed rewards), then pulls `$AXBOOK`. The first staker after an idle period starts with `rewardDebt = 0` so they earn the folded accumulator; later stakers checkpoint at the current accumulator. |
| `unstake(amount)` | Settles rewards, then returns `$AXBOOK`. Reverts on 0 (`ZeroAmount`) or over-stake (`stake`). |
| `claim()` | Folds undistributed rewards and pays pending USDG. |
| `pendingUsdg(user) → uint256` | View: accrued-but-unclaimed USDG, including a virtual fold of `undistributedUsdg`. |
| `notifyReward(amountUsdg)` | Pulls USDG from the caller (a desk vault paying its staker share) and folds it into the accumulator; with zero stakers it parks in `undistributedUsdg`. Emits `RewardNotified`. |

## Events / errors

`Staked`, `Unstaked`, `Claimed`, `RewardNotified`; `ZeroAmount`.

## Security assumptions

- All externals are `nonReentrant`; rewards are settled before balance changes (checks-effects via the accumulator pattern).
- `notifyReward` is permissionless but self-funding: it pulls the tokens from the caller, so nobody can fabricate rewards.
- Rewards arriving with no stakers are preserved, not lost or redirected.

## Interactions

`DeskVault._tryPayFees` approves the pool for the staker slice and calls `notifyReward`. If a vault's `stakerRecipient` is unset, that slice simply never leaves the vault (it remains a liability) — the pool is an optional sink, not a required one.
