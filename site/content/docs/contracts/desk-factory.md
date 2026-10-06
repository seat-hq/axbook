---
title: DeskFactory
description: Deploys and registers one DeskVault per leader; custodies $AXBOOK listing bonds for permissionless listings.
order: 3
status: implemented
---

`contracts/src/DeskFactory.sol` — inherits `Ownable`.

> One DeskVault per leader. Owner may `createDesk` with no bond. Anyone may `listDesk` by posting a $AXBOOK listing bond.

## Storage

| Field | Meaning |
|---|---|
| `usdg`, `riskModule`, `swapAdapter` | Immutable wiring shared by every vault it deploys |
| `seatToken`, `listingBondSeat` | Listing parameters (owner-set; unset by default) |
| `deskOf[leader] → vault` | The one-vault-per-leader registry |
| `allDesks[]` | Every deployed vault, in creation order |
| `bondOf[vault]`, `bonderOf[vault]` | Listing-bond custody |

## Interface

| Function | Access | Behaviour |
|---|---|---|
| `createDesk(leader) → vault` | owner | Deploys a `DeskVault` (owner = factory owner), registers it, emits `DeskCreated` |
| `listDesk(leader) → vault` | anyone | Pulls `listingBondSeat` `$AXBOOK` from the caller, deploys + registers, records the bond, emits `BondPosted` |
| `setListingParams(seat, bond)` | owner | Enables the bonded path; emits `ListingParamsSet` |
| `returnBond(vault)` | owner | Returns the bond to the original bonder; emits `BondReturned` |
| `deskCount() → uint256` | view | `allDesks.length` |

## Errors

`DeskExists(leader)`, `ListingNotConfigured`, `NoBond`. Constructor reverts on `usdg = 0`; `_deployDesk` reverts on `leader = 0`.

## Invariants

- **One vault per leader** — `deskOf[leader] != 0` reverts.
- Every vault shares the factory's risk module and swap adapter.
- Bonds are only returnable to their bonder; there is no slash path.

## Interactions

The deploy scripts call `createDesk` and then wire each vault (oracle, fee module, recipients, deposit cap, keeper, risk configuration). The app enumerates desks with `deskCount`/`allDesks`; the keeper can walk the same functions when `DESK_FACTORY` is set.
