---
title: Known Limitations
description: The honest list — what the system does not do, cannot do yet, or deliberately refuses to do.
order: 2
---

## Execution

- **No router deployed anywhere.** `SwapAdapter.router` is `address(0)` on the live testnet deployment; every `executeCopy` reverts. Phase 1 is a cash vault.
- **Live fill indexer is direction-only.** `LiveFillSource` decodes buy/sell but reports `notionalUsdg = 0` / `price = 0`, so live fills reject as `ZERO_NOTIONAL` until a cited price source is attached. Paper/fixture fills carry real numbers.
- **`SwapAdapter.quote` always reverts.** No on-chain quoting exists.

## Market coverage

- Only **NVDA, AAPL, SPY on 4663** are trade-eligible. Everything on 46630 is unverified/placeholder and disabled.
- The session clock is a fixed ET schedule (04:00–09:30–16:00–20:00) with **no holiday calendar**; it fails closed when uncertain.

## Operations

- **No multi-RPC failover**, no metrics/alerting stack, no backfill of missed fills.
- **No upgrade path** — contracts are immutable.
- **No local-chain dev harness** — development targets testnet or the paper engine.

## Token / economics

- `$AXBOOK`, staking, LP locking, and the listing bond are **Phase 2 code, never deployed**. No token exists on any chain. See [Economics](/docs/economics/seat-token).
- The Phase 1 fee split leaves the staker slice as a vault liability until Phase 2 wires `stakerRecipient`.

## Assurance

- **No audit.** The test suite (90 Foundry tests, keeper guard tests, site number tests) expresses intent; it is not a security review.
- **Nothing on mainnet.** All mainnet addresses are `null`; deploy scripts are unbroadcast.

## Documentation boundaries

- No faucet is documented for testnet funds.
- No security policy file exists in the repo — see [Reporting](/docs/security/reporting).
