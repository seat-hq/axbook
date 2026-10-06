---
title: Smart Contracts Overview
description: The contract inventory, deployment status, inheritance, and the access-control matrix.
order: 1
---

Axbook's contracts are Solidity `0.8.28`, built with Foundry (`via_ir`, optimizer at 200 runs, `cancun` EVM), using OpenZeppelin contracts. Source: `contracts/src/`.

## Inventory

| Contract | Responsibility | Status |
|---|---|---|
| `DeskVault` | Custody, book shares, NAV, fees, copies | 🟢 Deployed on 46630 |
| `DeskFactory` | One vault per leader; listing bonds | 🟢 Deployed on 46630 |
| `RiskModule` | Deterministic copy decisions | 🟢 Deployed on 46630 |
| `SwapAdapter` | Restricted swap surface | 🟢 Deployed on 46630 (router `0`) |
| `FeeModule` | Fee math and splits | 🟢 Deployed on 46630 |
| `NavLib` | Fixed-point NAV library | 🟢 (library; used by the vault) |
| `ChainlinkOracle` | Token → AggregatorV3 prices | 🟡 Tested; not deployed on 46630 |
| `ExactInputRouter02` | Uniswap SwapRouter02 wrapper | 🟡 Tested; deploys with guarded mainnet scripts |
| `SeatToken` | Fixed-supply $AXBOOK | 🟡 Tested; not deployed anywhere |
| `StakingPool` | Stake $AXBOOK, earn USDG fees | 🟡 Tested; not deployed |
| `LpLocker` | ≥365-day Uni v3 NFT lock | 🟡 Tested; not deployed |

Interfaces live in `contracts/src/interfaces/`: `IDeskVault`, `IRiskModule`, `ISwapAdapter`, `IExactInputRouter`, `ISwapRouter02`, `IPriceOracle` (in `NavLib`), `IScaledUIAmount`, `IStakingPool`, `AggregatorV3Interface`.

## Access-control matrix

| Function group | Who can call |
|---|---|
| `DeskVault.deposit / redeem / processWithdrawals` | Anyone (redeem: shareholders) |
| `DeskVault.executeCopy` | The desk's `keeper` only |
| `DeskVault.set*` / `pause / unpause` | Owner |
| `RiskModule.configureDesk / setTokenAllowed / setSessionRisk` | Owner |
| `SwapAdapter.setRouter / setAllowedToken` | Owner |
| `FeeModule.setParams` | Owner |
| `ChainlinkOracle.setFeed` | Owner |
| `DeskFactory.createDesk / setListingParams / returnBond` | Owner |
| `DeskFactory.listDesk` | Anyone with the `$AXBOOK` bond |
| `StakingPool.stake / unstake / claim` | Anyone (stakers) |
| `StakingPool.notifyReward` | Anyone — desks call it; it pulls USDG from the caller |
| `LpLocker.lock / withdraw` | Owner (withdraw only after unlock, to beneficiary) |

**There is no owner function that moves user funds out of a vault.** The owner's powers are configuration, pausing, and bond custody.

## Inheritance

- `DeskVault`: `Ownable`, `Pausable`, `ReentrancyGuard`, `IDeskVault`
- `RiskModule`, `SwapAdapter`, `FeeModule`, `ChainlinkOracle`, `DeskFactory`, `LpLocker`: `Ownable` (+ `IERC721Receiver` for the locker)
- `StakingPool`: `ReentrancyGuard`, `IStakingPool`
- `SeatToken`: OpenZeppelin `ERC20`

## Testing

90 Foundry tests across 13 suites pass (`forge test`), including invariant tests (`DeskInvariants.t.sol`: NAV equals cash in the cash-only phase, accounting cash equals the vault's USDG balance, no shares ⇒ zero NAV per share) and a live-wiring simulation (`DeskVaultLive.t.sol`). See [Development → Testing](/docs/development/testing).
