---
title: Testnet (46630)
description: Robinhood Chain testnet — the deployed Phase 1 contract set and its live addresses.
order: 3
---

::status{value="implemented"}

## Chain

| Field | Value |
|---|---|
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Gas | ETH |
| USDG | `0x7E955252E15c84f5768B83c41a71F9eba181802F` (6 decimals) |

## Deployed Axbook contracts

From `app/src/lib/addresses.ts` (generated from the broadcast log; see `docs/phase-1-live.md` for the deploy runbook):

| Contract | Address |
|---|---|
| DeskFactory | `0x4c58691ad3395d9a9fa078b2d86a1c5d90a73e10` |
| DeskVault (bootstrap desk) | `0x8ff6ef04312679a0112b5229c6911cbc026e73ff` |
| RiskModule | `0x48a0733a5b7b7ae1c98d29712cc639f33bcb2147` |
| SwapAdapter | `0xff8851ea3699781c6c331ee9530d7831cc465f02` |
| FeeModule | `0x475d9d5a7d1b839845ee1073c5a0c51320064408` |
| ChainlinkOracle | **not deployed** (`null`) |

:::callout{type="info" title="Cash-only by design"}
The testnet deploy has **no router configured** (`SwapAdapter.router == address(0)`), so `executeCopy` always reverts and the vault holds cash only. This is the deliberate Phase 1 posture: deposits, shares, fees, and the withdrawal queue are live; execution is not. See [Phase 1 runbook](/docs/runbooks/phase-1-live).
:::

## Unverified Stock Tokens (registry, not chain-verified)

These testnet token addresses are recorded in the SDK registry but are **not** eligible for copy trading anywhere:

| Symbol | Address |
|---|---|
| TSLA | `0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E` |
| AMZN | `0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02` |
| PLTR | `0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0` |
| NFLX | `0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93` |
| AMD | `0x71178BAc73cBeb415514eB542A8995b82669778d` |

## Getting testnet funds

The repository does not document a faucet. You need testnet ETH for gas and testnet USDG for deposits; obtain them through Robinhood Chain testnet channels. Do not bridge or send mainnet assets.
