---
title: Deploy Phase 2 (TGE)
description: SeatToken, StakingPool, LpLocker, multi-desk wiring — the token-generation deployment and its double confirmation.
order: 4
---

::status{value="planned"}

`DeployPhase2.s.sol` implements the Phase 2 token generation event. Code shipped, **never deployed**. The full design is in the repo's [Phase 2 doc](/docs/runbooks/phase-2).

## Guards

- `CONFIRM_MAINNET=I_UNDERSTAND`
- `CONFIRM_SEAT_TGE=I_UNDERSTAND`
- Chain `4663`, official USDG, `OWNER` == broadcaster.

## What it deploys / does

1. **`SeatToken`** — 1,000,000,000 `$AXBOOK` (18 decimals) minted **once** to `SEAT_HOLDER` (defaults to `OWNER`). No mint function exists after construction.
2. **`StakingPool`** — `$AXBOOK` staking with an `accUsdgPerShare` reward accumulator.
3. **`LpLocker`** — locks a Uniswap v3 position NFT for **≥ 365 days**.
4. **Extra desks** — `LEADER_2` and `LEADER_3` each get a desk if set; unset leaders are skipped.
5. **Fee wiring** — sets each vault's `stakerRecipient` to the staking pool, activating the 70/20/10 leader/protocol/staker split.
6. **Listing bond** — factory `listingBond` set to `LISTING_BOND_SEAT` (default `100_000e18`).

## What it deliberately does not do

- **No LP mint.** If `SEAT_LP_USDG` is set, the script *logs* the intent to seed a `$AXBOOK`/USDG pool at the cited NPM (`0x7399…E0D3`) — the actual position mint stays a manual operator step, then the NFT is locked via `LpLocker`.
- No router changes. Execution posture is unchanged by the TGE.

## Configuration

```env
# everything from the mainnet deploy, plus:
CONFIRM_SEAT_TGE=I_UNDERSTAND
SEAT_HOLDER=<token-recipient>
LISTING_BOND_SEAT=100000000000000000000000   # 100k * 1e18
LEADER_2=<second-leader>                      # optional
LEADER_3=<third-leader>                       # optional
SEAT_LP_USDG=<intended-lp-usdg-amount>        # optional, log-only
```

```bash
make deploy-phase2
```

## Post-TGE checklist

1. `make write-addresses`, commit.
2. Distribute `$AXBOOK` per the [allocation](/docs/economics/seat-token) — the buckets are post-TGE transfers from `SEAT_HOLDER`, not mints.
3. Mint the LP position manually, then lock the NFT in `LpLocker` for ≥ 365 days.
4. Verify `stakerRecipient` on every vault and a nonzero `listingBond` on the factory.
