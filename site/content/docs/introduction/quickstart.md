---
title: Quickstart
description: Clone, install, test, and run the paper-copy engine — the fastest path to seeing Axbook work.
order: 5
---

This gets you from zero to a running paper-copy engine and a local blotter. No private key is required for anything on this page.

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | `>= 18` | Enforced by the root `package.json` engines field |
| pnpm | `9.0.0` | Pinned via `packageManager` in the root manifest |
| Foundry | latest | `forge`, `cast` — installed to `~/.foundry/bin` by `foundryup` |

## Install and test

```bash
git clone git@github.com:seat-hq/seat.git
cd seat
make install   # forge-std + OpenZeppelin submodules, then pnpm install
make test      # forge test -vvv (90 tests across 13 suites)
```

## Run the paper-copy engine

Phase 0 is a deterministic simulation: five hypothetical leader fills go through the real keeper pipeline (normalize → session → risk → paper execute → NAV) and print an explainable report. No network, no key, no funds.

```bash
make paper
```

You will see each fill's session, action (`accept` / `resize` / `skip`), intended vs executed size, and a plain-language reason — for example, an oversized fill capped by `maxFillUsdg`, or a weekend fill skipped because the session is closed. The run also writes the fill tape to `keeper/data/fills.json` (gitignored) with `source=fixture`.

## Run the app

```bash
make app-dev
```

The blotter defaults to testnet `46630`. With no wallet connected it renders the paper desk (clearly labelled test data). Connect a wallet on `46630` — where a real cash vault is deployed — and deposit/redeem become live writes. See [Application](/docs/application/overview).

## Run the keeper against testnet config

```bash
make keeper-testnet
```

This runs the keeper entrypoint with `EXECUTION_MODE=PAPER` (default) on chain `46630`: it resolves the desk binding, processes the fixture tape, and appends outcomes to `keeper/data/fills.json`. Live execution stays fail-closed on testnet because no SwapAdapter router is configured there.

## Where to go next

- [Concepts](/docs/concepts/overview) — the protocol vocabulary
- [Environment variables](/docs/development/environment-variables) — every variable, documented
- [Deployment](/docs/deployment/overview) — guarded testnet/mainnet deploys
- [Keeper](/docs/keeper/overview) — how the off-chain side works

:::callout{type="tip"}
`make test` runs the Foundry suite. The TypeScript side has its own checks: `pnpm --filter keeper test` (live-guard tests), `pnpm --filter @seat/site test` (story-number tests), and `pnpm typecheck` across the workspace.
:::
