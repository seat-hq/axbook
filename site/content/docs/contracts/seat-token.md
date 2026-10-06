---
title: SeatToken
description: $AXBOOK — fixed 1B supply, 18 decimals, minted once at deploy, no mint after. Code shipped; not deployed.
order: 10
status: experimental
---

`contracts/src/SeatToken.sol` — extends OpenZeppelin `ERC20`.

:::callout{type="experimental" title="Not deployed"}
No `$AXBOOK` contract exists on any network. The token deploys only via `DeployPhase2`, which requires both `CONFIRM_MAINNET=I_UNDERSTAND` and `CONFIRM_SEAT_TGE=I_UNDERSTAND`. Anything presenting a `$AXBOOK` address today is not from this repository.
:::

> Fixed-supply $AXBOOK. 1,000,000,000 tokens, 18 decimals, no mint. Constructor mints the whole supply to `initialHolder`. Bucket splits (docs/phase-2.md) are owner transfers after TGE.

## Storage / constants

| Field | Value |
|---|---|
| `MAX_SUPPLY` | `1_000_000_000 ether` (1B, 18 decimals) |
| name / symbol | `Axbook` / `AXBOOK` |

## Behaviour

- The constructor mints `MAX_SUPPLY` to `initialHolder` (reverts on the zero address) — the deploy script uses `SEAT_HOLDER`, defaulting to `OWNER`.
- **There is no `mint` function and no owner.** After deployment the supply is fixed forever; the contract is a vanilla ERC-20.

## Allocation model

Bucket splits are *post-TGE transfers* from the holder, not constructor distributions: liquidity/market 40%, community/airdrop 20%, team 15%, treasury/protocol 12%, leader incentives 8%, staker bootstrap 5%. The deploy script intentionally does not invent team or airdrop addresses. Details: [Economics → $AXBOOK](/docs/economics/seat-token) and the [Phase 2 spec](/docs/runbooks/phase-2).

## Interactions

`DeskFactory.setListingParams(seat, bond)` makes it the listing-bond currency; `StakingPool` takes it as the staking asset.
