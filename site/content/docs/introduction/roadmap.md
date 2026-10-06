---
title: Roadmap
description: The phase model — Phase 0 paper copy, Phase 1 testnet desks, Phase 2 open desks and $AXBOOK — and what is explicitly later.
order: 7
---

The roadmap below contains only phases that exist in the repository. It is non-binding by the project's own declaration, and each phase's status is verified against code, not aspirations.

## Phase 0 — Paper copy ::status{value="implemented"}

**Goal: prove the mechanism without real money.**

- The keeper observes hypothetical leader fills and produces copy signals.
- The risk module accepts, rejects, or sizes each signal deterministically.
- Execution is paper only — no router is configured and no funds move.
- Every decision is explainable: the tape records *why* a fill was copied, resized, or skipped.

Run it with `make paper`. Specification: [litepaper](/docs/runbooks/litepaper).

## Phase 1 — Testnet desks ::status{value="implemented"}

**Goal: wire the cash vault to Robinhood testnet `46630`.**

- `DeskFactory.createDesk(leader)` on `46630`.
- Depositors approve USDG and mint book shares; redeem is instant when cash is available, otherwise queued.
- The app reads NAV, shares, cash and leader from the vault; writes are enabled on `46630` (and `4663` once a capped vault exists).
- The keeper binds to `vault.leader()`; it does not choose a leader.
- Fill tape rows are labelled `source=fixture` or `source=chain`; fixtures are never labelled live.
- Live execution fails closed on `46630` (no cited router). On `4663` it requires `ExactInputRouter02` plus a trade-eligible symbol.

Runbook: [Phase 1](/docs/runbooks/phase-1). Cited mainnet facts: [Phase 1 live](/docs/runbooks/phase-1-live).

## Capped mainnet desk ::status{value="planned"}

Wired into `DeployMainnet.s.sol` but not broadcast:

- One desk on `4663` with a **$50,000 USDG deposit cap**.
- Cited NVDA / AAPL / SPY tokens, Chainlink feeds, and Uniswap SwapRouter02 (via `ExactInputRouter02`, pool fee 3000).
- Refuses to run unless `CONFIRM_MAINNET=I_UNDERSTAND` and the chain id is `4663`. Never deploys `SeatToken`.

See [Deployment → Mainnet](/docs/deployment/mainnet).

## Phase 2 — Open desks + $AXBOOK ::status{value="experimental"}

**Code shipped; TGE guarded.** Specification: [Phase 2](/docs/runbooks/phase-2).

- `SeatToken`: fixed 1,000,000,000 `$AXBOOK`, 18 decimals, minted once to the holder at deploy, **no mint after**.
- Fee split becomes **70% leader / 20% protocol / 10% stakers** on Phase 2 desks (Phase 1 vaults keep 80/20).
- `StakingPool`: stake `$AXBOOK`, claim pro-rata USDG from desk fee harvest.
- Stake-to-list: anyone can `listDesk(leader)` by posting a `$AXBOOK` bond (default 100,000 `$AXBOOK`); owner `createDesk` remains.
- `LpLocker`: locks a Uniswap v3 position NFT for ≥ 365 days.
- Up to three leader desks from `LEADER_ADDRESS` / `LEADER_2` / `LEADER_3`; later leaders via `listDesk`.

Broadcast requires both `CONFIRM_MAINNET=I_UNDERSTAND` and `CONFIRM_SEAT_TGE=I_UNDERSTAND`. Checklist: [mainnet-day](/docs/runbooks/mainnet-day).

## Later ::status{value="not-implemented"}

Named in the litepaper and Phase 2 doc as out of scope, with no code in the repository:

- Buyback-and-burn keeper
- Vesting cliffs and merkle airdrop
- Bond slashing (Phase 3)
- Ungated mainnet AUM
- Phase 3 tools (gap skip, agent seat, multi-leader portfolio) and Phase 4 (RFQ/Rialto, insurance)

:::callout{type="warning"}
Nothing on this page is a commitment. The litepaper labels the roadmap non-binding, and "Later" items have no implementation. Treat them as direction, not schedule.
:::
