---
title: Project Status
description: Honest, component-by-component implementation status — what is shipped, what is experimental, what is only planned.
order: 6
---

Axbook documentation uses a four-state model. It appears on pages and in sidebars wherever a component could be mistaken for something more finished than it is.

| Badge | Meaning |
|---|---|
| 🟢 Implemented | Code exists, is tested, and is in use by the shipped system |
| 🟡 Experimental | Code exists and is tested, but is not deployed / not exercised with real value |
| 🔵 Planned | Designed and documented, but not deployed (deploy scripts exist and are guarded) |
| 🔴 Not implemented | Named as future work; no code exists |

## Phase status

From the litepaper and README, verified against the code:

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** — paper copy | Deterministic risk pipeline, paper executor, full test coverage | 🟢 Shipped |
| **Phase 1** — testnet desks | Factory + cash vault on `46630`, USDG deposit/redeem in the blotter, keeper bound to `vault.leader()` | 🟢 Shipped on Robinhood testnet |
| Capped mainnet desk | `$50k`-capped desk on `4663` with cited MAG7 tokens, feeds, SwapRouter02 | 🔵 Wired in code; broadcast guarded by `CONFIRM_MAINNET` |
| **Phase 2** — $AXBOOK + open desks | Fixed-supply token, 70/20/10 fees, stake-to-list, LP locker | 🟡 Code shipped and tested; TGE guarded by `CONFIRM_MAINNET` + `CONFIRM_SEAT_TGE` |
| Later | Buyback-and-burn, vesting, merkle airdrop, ungated AUM, Phase 3/4 tooling | 🔴 Not implemented (non-binding roadmap) |

## Component status

| Component | Status | Evidence |
|---|---|---|
| `DeskVault` (deposits, redeems, queue, copies, fees) | 🟢 | Deployed on `46630` (`0x8ff6…73ff`); 90 Foundry tests pass |
| `RiskModule` | 🟢 | Deployed on `46630`; deterministic `evaluate` with unit tests |
| `SwapAdapter` | 🟢 | Deployed with `router = 0` on `46630` — execution reverts by design |
| `DeskFactory` | 🟢 | Deployed on `46630`; one-vault-per-leader enforced |
| `FeeModule` | 🟢 | Deployed on `46630` with 80/20 split (staker share `0`) |
| `ChainlinkOracle` | 🟡 | Implemented and tested; not deployed on `46630` (no cited feeds) |
| `ExactInputRouter02` | 🟡 | Implemented and tested with a mock router; deploys only via guarded mainnet scripts |
| Live swap execution | 🔵 | Requires a configured router; `46630` has none cited, `4663` awaits a guarded broadcast |
| Keeper live fill indexing | 🟡 | `LiveFillSource` decodes direction only; notional/price are not attached yet, so live fills reject as `ZERO_NOTIONAL` |
| `SeatToken` ($AXBOOK) | 🟡 | Code shipped (1B fixed supply, no mint); **no contract deployed** |
| `StakingPool` | 🟡 | Code shipped and tested; not deployed |
| `LpLocker` | 🟡 | Code shipped and tested; not deployed |
| Stake-to-list (`listDesk` bond) | 🟡 | Implemented in `DeskFactory`; inert until `setListingParams` runs at Phase 2 TGE |
| Buyback-and-burn | 🔴 | Named in docs as later work; no code |
| Bond slashing | 🔴 | Explicitly deferred to Phase 3 (`returnBond` only) |

## Deployment status

| Network | What exists |
|---|---|
| Robinhood testnet `46630` | RiskModule, SwapAdapter (router `0`), FeeModule, DeskFactory, one DeskVault. Full table in [Networks → Testnet](/docs/networks/testnet). |
| Robinhood mainnet `4663` | **No Axbook contracts deployed.** Only the official USDG address is recorded. Deploys are guarded; see [Deployment](/docs/deployment/overview). |

:::callout{type="danger" title="Do not deposit on mainnet"}
Until a capped vault address is recorded from a real `DeployMainnet` or `DeployPhase2` broadcast, there is nothing to deposit into on `4663`. The app enforces this: writes are only enabled on chains with a wired vault address.
:::
