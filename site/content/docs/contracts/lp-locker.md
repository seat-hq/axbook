---
title: LpLocker
description: A timelock for a Uniswap v3 position NFT — minimum 365 days, withdraw only to the beneficiary.
order: 12
status: experimental
---

`contracts/src/LpLocker.sol` — inherits `Ownable`, `IERC721Receiver`. Phase 2: code shipped, not deployed.

> Holds a Uniswap v3 position NFT for at least 365 days. Owner withdraws to `beneficiary` only after unlock.

## Storage

| Field | Meaning |
|---|---|
| `MIN_LOCK` | `365 days` (constant) |
| `nft`, `tokenId` | The locked position |
| `unlockTime` | `lock timestamp + duration` |
| `beneficiary` | The only address `withdraw` can send to |
| `locked` | Whether a position is currently locked |

## Interface

| Function | Access | Behaviour |
|---|---|---|
| `lock(nft, tokenId, duration, beneficiary)` | owner | `duration ≥ MIN_LOCK` (`TooShort`), not already locked (`AlreadyLocked`), non-zero addresses; pulls the NFT and emits `Locked` |
| `withdraw()` | owner | Only after `unlockTime` (`StillLocked`), only when locked (`NotLocked`); sends the NFT to `beneficiary` |
| `onERC721Received` | — | Standard receiver |

## Purpose and status

The locker exists so the Phase 2 AXBOOK/USDG liquidity position can be provably locked for 12 months. The cited NonfungiblePositionManager on 4663 is `0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3`. **Seeding the pool is a manual owner transaction** — `DeployPhase2` does not mint a position; it logs "seed+lock later" unless `SEAT_LP_USDG` is set. The lock therefore does not exist until an operator performs those steps after TGE; see [Deployment → Phase 2](/docs/deployment/phase-2).
