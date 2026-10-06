# Risk

Axbook is experimental software. You can lose money. There are **no guarantees**
of profit, capital preservation, availability, or correctness. This is not
investment advice.

## Fail-closed principle

The core operating rule is: **uncertain = do not trade**. Any of the following
causes a signal to be skipped rather than executed:

- Asset not authoritatively verified and enabled in the registry.
- Oracle price missing, zero, negative, or stale beyond the max age.
- Session cannot be determined, or is closed.
- Position/notional caps would be exceeded.
- The desk is halted by drawdown protection.

## Market & asset risk

- **Stock Tokens are not shares.** They may carry issuer, custody, settlement,
  and jurisdictional risk, and may be restricted in some jurisdictions.
- Prices can gap, especially across session boundaries and after hours.
- Liquidity may be thin; realized slippage can exceed simulated slippage.

## Copy-trading risk

- A leader's past behavior does not predict future results.
- Copies are delayed relative to the leader and may fill at worse prices.
- Sizing is scaled and capped, so a desk will not match leader performance.

## Smart-contract risk

- Contracts are unaudited in Phase 0.
- The swap adapter is intentionally restricted and reverts when no verified
  router is configured; there is no live trading path in Phase 0.
- Reentrancy protection, pausing, and safe ERC-20 handling are used, but do not
  eliminate risk.

## Operational risk

- The keeper is a single off-chain actor in Phase 0 and can fail or lag.
- Private keys, RPC endpoints, and infrastructure are trust assumptions.

## Drawdown halt

Each desk has a max drawdown from its high-water NAV. Breaching it halts new
copies until governance/operator review. This limits, but does not prevent,
losses.
