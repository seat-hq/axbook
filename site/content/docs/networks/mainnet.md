---
title: Mainnet (4663)
description: Robinhood Chain mainnet — verified token registry, Uniswap addresses, and Axbook deployment status.
order: 2
---

::status{value="planned"}

## Chain

| Field | Value |
|---|---|
| Chain ID | `4663` |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Gas | ETH |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (6 decimals) |

## Axbook deployment status

**Nothing is deployed.** `app/src/lib/addresses.ts` mainnet entries are all `null`. The deployment scripts (`DeployMainnet.s.sol`, `DeployPhase2.s.sol`) are written and tested but gated behind `CONFIRM_MAINNET=I_UNDERSTAND` and have never been broadcast.

## Verified Stock Tokens (chain-verified registry)

From `sdk/src/registry.ts` — all 18 decimals, issuer **Robinhood Assets (Jersey) Limited**, all with Chainlink feeds:

| Symbol | Token | Chainlink feed |
|---|---|---|
| NVDA | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` | `0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15` |
| AAPL | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` | `0x6B22A786bAa607d76728168703a39Ea9C99f2cD0` |
| SPY | `0x117cc2133c37B721F49dE2A7a74833232B3B4C0C` | `0x319724394D3A0e3669269846abE664Cd621f9f6A` |

Only these three are `eligible` for copy trading in the keeper's `isTradeEligible` — and only on chain `4663`.

## Uniswap v3 (cited addresses)

| Contract | Address |
|---|---|
| SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` |
| Factory | `0x1f7d7550B1b028f7571E69A784071F0205FD2EfA` |
| NonfungiblePositionManager | `0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3` |
| QuoterV2 | `0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7` (cited, unused) |
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` |

`ExactInputRouter02` wraps SwapRouter02 with an immutable `poolFee` of `3000` (0.3%). No Axbook router is deployed yet.

## Mainnet defaults (from `DeployMainnet.s.sol`)

| Parameter | Value |
|---|---|
| `maxFill` | 5,000 USDG |
| `maxPosition` | 20,000 USDG |
| `maxGross` | 50,000 USDG |
| `maxDrawdown` | 2,000 bps (20%) |
| `maxStaleness` | 120 s |
| Deposit cap | 50,000 USDG |
| Fee split | 70/20/10 leader/protocol/staker — but `stakerRecipient` unset ⇒ **staker slice accrues as a liability** (Phase 1 posture) |
