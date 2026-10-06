---
title: The Axbook Token
description: $AXBOOK — fixed supply, allocation buckets, and the critical fact that it is not deployed.
order: 2
---

::status{value="planned"}

:::callout{type="warning" title="No token exists"}
`SeatToken` is **code, never deployed** — on any chain. There is no `$AXBOOK` contract address, no market, no airdrop, no claim. Anything trading under an Axbook ticker is not this project. The Phase 2 deploy is gated behind `CONFIRM_MAINNET` + `CONFIRM_SEAT_TGE` and has never been broadcast.
:::

## Specification (as implemented)

| Property | Value |
|---|---|
| Standard | ERC-20 |
| Decimals | 18 |
| `totalSupply` | `1_000_000_000e18` (1 billion, fixed) |
| Minting | **Once**, in the constructor, to `SEAT_HOLDER` |
| Post-deploy mint | **None exists** |

## Allocation

The bucket splits are **owner transfers after TGE, not constructor mints** — the full supply mints to one holder, who then distributes:

| Bucket | Share | Notes |
|---|---|---|
| Liquidity / market | 40% | AXBOOK/USDG Uniswap v3; NFT locked 12 months |
| Community / airdrop | 20% | Later merkle distribution; **not deployed** |
| Team | 15% | Later vesting; **not deployed** |
| Treasury / protocol | 12% | Ops + the protocol's 20% fee recipient |
| Leader incentives | 8% | Later |
| Staker bootstrap | 5% | Optional seed into `StakingPool` |

## What the token is for (in the code)

1. **Listing bond** — `DeskFactory.listDesk` pulls a `$AXBOOK` bond (default `100_000e18`) from anyone listing a desk without owner approval; `returnBond` gives it back.
2. **Staking** — `StakingPool` accepts `$AXBOOK` and distributes the 10% staker fee slice via an accumulator.
3. **LP locking** — `LpLocker` holds the AXBOOK/USDG liquidity NFT for ≥ 365 days.

## What the token is not

- Not a claim on vault assets. Desk shares and `$AXBOOK` are entirely separate instruments.
- Not a governance token — no governance code exists.
- Not live, not transferable, not valuable — there is no deployed contract.
