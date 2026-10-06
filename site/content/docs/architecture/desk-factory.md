---
title: DeskFactory (Architecture)
description: How desks are created — the owner path, the bonded listing path, and the one-vault-per-leader invariant.
order: 2
---

**Responsibility.** Deploy and register exactly one `DeskVault` per leader, and (Phase 2) custody the `$AXBOOK` listing bonds of permissionlessly listed desks.

**Contract:** `contracts/src/DeskFactory.sol` — reference: [DeskFactory](/docs/contracts/desk-factory).

## Inputs / outputs

| Input | Output |
|---|---|
| `createDesk(leader)` (owner) | New `DeskVault` address |
| `listDesk(leader)` + bond approval (anyone) | New `DeskVault` address; bond recorded |
| `returnBond(vault)` (owner) | Bond back to the bonder |
| Reads: `deskOf(leader)`, `allDesks(i)`, `deskCount()` | Desk discovery for app and keeper |

## Dependencies

- Immutable constructor wiring: `usdg`, `riskModule`, `swapAdapter` — every vault it deploys shares these.
- `seatToken` + `listingBondSeat`, set post-deploy by the owner (`setListingParams`). Until set, `listDesk` reverts `ListingNotConfigured` — the permissionless path is inert by default.

## Important state

- `deskOf[leader] → vault` and `allDesks[]` — the registry the app and keeper walk.
- `bondOf[vault]` / `bonderOf[vault]` — listing-bond custody.

## Invariants and security considerations

- **One vault per leader**, enforced by `DeskExists`.
- Every vault is constructed with the factory's shared risk module and swap adapter — a listed desk cannot bring its own.
- The bond is only ever returnable to its original bonder, by explicit owner action. There is no slashing path in the code.
- The factory's owner is the vaults' owner: `new DeskVault(owner(), …)` — so vault admin (pause, keeper, oracle) concentrates in the same operator address that controls the factory.

## Failure modes

| Case | Behaviour |
|---|---|
| `listDesk` before `setListingParams` | Reverts `ListingNotConfigured` |
| Duplicate leader | Reverts `DeskExists` |
| `returnBond` with no bond | Reverts `NoBond` |
| `leader = 0` | Reverts (`leader=0`) |

## Interactions

The app lists desks via `deskCount`/`allDesks`; the keeper resolves desks from `DESK_ADDRESSES`, `DESK_ADDRESS`, or by walking `allDesks` when `DESK_FACTORY` is set. Deploy scripts call `createDesk` and then wire each vault (oracle, fees, caps, keeper).
