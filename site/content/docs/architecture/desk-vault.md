---
title: DeskVault (Architecture)
description: The heart of the protocol — custody, share accounting, fee liabilities, the withdrawal queue, and the single copy entry point.
order: 3
---

**Responsibility.** Custody depositor funds, account for ownership in book shares, value positions for NAV, accrue and pay fees, and execute keeper-submitted copies that pass risk.

**Contract:** `contracts/src/DeskVault.sol` — full reference: [DeskVault](/docs/contracts/desk-vault).

## Inputs / outputs

| Caller | Function | Effect |
|---|---|---|
| Anyone | `deposit(assetsUsdg)` | Mints book shares; takes USDG |
| Shareholder | `redeem(shares)` | Burns shares; pays USDG or queues |
| Anyone | `processWithdrawals(maxCount)` | Pays queued withdrawals FIFO while cash covers |
| Keeper only | `executeCopy(...)` | Risk-checked swap through the adapter |
| Owner | `setKeeper / setOracle / setFeeModule / setFeeRecipients / setDepositCap / setMaxStalenessSec / pause / unpause` | Configuration |

## Dependencies

- Immutable: `usdg`, `riskModule`, `swapAdapter`, `leader`.
- Owner-set: `oracle` (NAV pricing), `feeModule` (fee math), fee recipients, `keeper`.
- OpenZeppelin: `Ownable`, `Pausable`, `ReentrancyGuard`, `SafeERC20`.

## Important state

`totalShares`, `sharesOf`, `cashUsdg`, `feeLiabilitiesUsdg`, `highWaterNavPerShare`, `lastFeeTs`, `heldTokens[]` / `isHeld`, `withdrawQueue[]` / `queueHead`, `depositCapUsdg`, `maxStalenessSec`.

## Security considerations

- **Single copy entry point.** Only `keeper` can call `executeCopy`; the call re-runs `RiskModule.evaluate` and reverts on anything but `Accept`.
- **Reentrancy:** all state-changing externals are `nonReentrant`; approvals to the adapter use `forceApprove` and are reset to zero after each swap.
- **Pause semantics:** `pause()` blocks deposits, copies and withdrawal *processing* — but `redeem` still works while paused, landing in the queue. This is deliberate: pausing never traps shares, it defers cash.
- **No upgrade path.** A mis-deployed vault is abandoned, not patched; see [Operations → Emergency](/docs/operations/emergency).
- **Valuation fails closed:** missing oracle, zero price, or stale price reverts any call that needs a position value.

## Failure modes

| Case | Behaviour |
|---|---|
| Deposit over cap | `DepositCap` |
| Redeem more shares than held | `InsufficientShares` |
| Copy not from keeper | `NotKeeper` |
| Copy with `minAmountOut = 0` | `ZeroMinOut` (keeper must always supply slippage protection) |
| Risk decision ≠ Accept | `risk rejected` |
| Buy without cash | `cash` revert |
| Oracle price stale / in future | `StalePrice` |

## Interactions

Created by `DeskFactory`; configured by the owner; driven by the keeper; read by the app through the ABIs in `app/src/abis`; valued by `NavLib`; fees computed by `FeeModule` and (Phase 2) pushed to `StakingPool`.
