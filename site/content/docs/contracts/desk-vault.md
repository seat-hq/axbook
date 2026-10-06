---
title: DeskVault
description: The desk itself — USDG custody, seat-share accounting, oracle NAV, fee liabilities, withdrawal queue, and the keeper-only copy entry point.
order: 2
status: implemented
---

`contracts/src/DeskVault.sol` — one deployment per leader, created by `DeskFactory`.

> USDG desk: book shares, oracle NAV, fee liabilities, keeper copies. Live swaps require a configured SwapAdapter router (none on 46630). Mainnet uses `depositCapUsdg = 50_000e6` (0 = unlimited, testnet).

Inherits `Ownable`, `Pausable`, `ReentrancyGuard`, `IDeskVault`.

## Storage

### Immutable

| Field | Meaning |
|---|---|
| `usdg` | The USDG accounting token (6 decimals) |
| `riskModule` | The desk's decision contract |
| `swapAdapter` | The only swap path |
| `leader` | The bound leader address |

### Mutable configuration (owner-set)

| Field | Default | Setter |
|---|---|---|
| `oracle` | unset | `setOracle` |
| `feeModule` | unset | `setFeeModule` |
| `protocolRecipient` / `leaderFeeRecipient` / `stakerRecipient` | leader payee defaults to `leader` | `setFeeRecipients` |
| `keeper` | unset | `setKeeper` |
| `maxStalenessSec` | `120` (`DEFAULT_STALENESS`) | `setMaxStalenessSec` (0 resets to default) |
| `depositCapUsdg` | `0` = unlimited | `setDepositCap` |

### Accounting state

| Field | Meaning |
|---|---|
| `totalShares` / `sharesOf[a]` | Seat-share ledger (`SHARE_PRECISION = 6`) |
| `cashUsdg` | Free USDG held by the vault |
| `feeLiabilitiesUsdg` | Accrued, unpaid fees |
| `highWaterNavPerShare` | High-water mark for the performance fee and drawdown halt |
| `lastFeeTs` | Last AUM-fee accrual timestamp |
| `heldTokens[]` / `isHeld` | Tokens the desk has bought |
| `withdrawQueue[]` / `queueHead` | FIFO pending redemptions |

## User functions

### `deposit(uint256 assetsUsdg) → uint256 shares`

`nonReentrant whenNotPaused`. Reverts `ZeroAmount` on 0. Accrues fees, enforces the deposit cap (`DepositCap`), computes shares via `NavLib.sharesForDeposit` (1:1 bootstrap when empty), pulls USDG, updates cash/shares, touches the high-water mark, tries fee payout. Emits `Deposit`.

### `redeem(uint256 shares) → uint256 assetsUsdg`

`nonReentrant` — **not** gated by pause. Reverts `ZeroAmount` / `InsufficientShares`. Accrues fees, computes assets via `NavLib.assetsForRedeem`, burns shares, then:

- unpaused **and** `cashUsdg ≥ assets` → transfers USDG immediately (`Redeem`);
- otherwise → pushes a `WithdrawRequest` and emits `Redeem` + `WithdrawQueued`.

### `processWithdrawals(uint256 maxCount)`

`nonReentrant whenNotPaused`, callable by anyone. Walks the queue from `queueHead`, paying unfulfilled requests in order while cash covers them (`WithdrawFulfilled`); stops at the first request the cash cannot cover.

## Keeper function

### `executeCopy(address token, bool isBuy, uint256 sizeUsdg, IRiskModule.Session session, uint256 priceUpdatedAt, uint256 minAmountOut)`

`nonReentrant whenNotPaused`, `msg.sender` must be `keeper` (`NotKeeper`). Reverts `ZeroMinOut` / `ZeroAmount`. Then:

1. Accrue fees; snapshot position value, gross exposure and NAV per share.
2. Build `IRiskModule.CheckInput` and call `riskModule.evaluate` — revert `"risk rejected"` unless `Accept`.
3. Buys: `amountIn = allowedSize` USDG, requiring `cashUsdg ≥ amountIn`. Sells: convert the allowed USDG size to a token amount at the oracle price (`_usdgToTokenAmount`).
4. `forceApprove` the adapter, `swapAdapter.execute(params)` with the keeper's `minAmountOut`, reset the approval to 0.
5. Update `cashUsdg`; on buys mark the token held.
6. Accrue fees again, touch the high-water mark, try fee payout. Emit `CopyExecuted(token, isBuy, amountIn, amountOut)`.

## Views

`asset()`, `heldTokenCount()`, `totalAssetsUsdg()` (equity **including pending fee estimate**), `navPerShare()`, `withdrawQueueLength()`, plus public getters for all state fields.

## Events

`Deposit`, `Redeem`, `WithdrawQueued`, `WithdrawFulfilled` (from `IDeskVault`); `KeeperSet`, `OracleSet`, `FeeModuleSet`, `FeeRecipientsSet`, `FeesAccrued(aum, perf, liabilities)`, `FeesPaid(protocol, leader, staker)`, `CopyExecuted`, `DepositCapSet`.

## Errors

`NotKeeper`, `ZeroAmount`, `InsufficientShares`, `ZeroMinOut`, `MissingOracle`, `StalePrice`, `DepositCap`, plus `NavLib.ZeroPrice`.

## Invariants

From `DeskInvariants.t.sol` (cash-only phase): `totalAssetsUsdg() == cashUsdg()`; vault USDG balance == `cashUsdg`; `totalShares == 0 ⇒ navPerShare() == 0`. The equity floor: `_equity()` never returns below zero (`liabilities ≥ gross ⇒ 0`).

## Security assumptions

- The keeper can only *propose* copies; the risk module re-verifies in the same transaction.
- The owner cannot withdraw user funds; the most powerful owner action is `pause()`.
- Valuation depends on the oracle and on `balanceOfUI()` correctness — see [Security](/docs/security/security-model).
- Approvals to the adapter are scoped per-call and zeroed after (`forceApprove` … `forceApprove(0)`).
