---
title: Market Sessions
description: The US equities session clock that scales copy size — and why after-hours copies are deliberately smaller.
order: 9
---

## Plain English

Stock Tokens track US equities, and US equities have market hours. Liquidity and price quality are very different at 11 a.m. on a Tuesday than at 7 p.m. or on a Saturday. Axbook encodes that reality directly: **the session scales the copy size**.

- **Regular hours:** copies at full size.
- **Pre-market and after-hours:** copies at 30% size.
- **Market closed (nights, weekends):** no copies at all.
- **Session unknown** (the clock cannot be determined): treated as closed — fail closed.

## Technically

The session clock lives in the keeper (`keeper/src/session.ts`) and the multipliers are enforced on-chain per desk (`RiskModule.sessionBps`).

### Boundaries (America/New_York)

| Session | Wall clock (ET) | Default multiplier |
|---|---|---|
| Pre-market | 04:00 – 09:30 | `3_000` bps (30%) |
| Regular | 09:30 – 16:00 | `10_000` bps (100%) |
| After-hours | 16:00 – 20:00 | `3_000` bps (30%) |
| Closed | 20:00 – 04:00, weekends | `0` — not tradable |

- Weekends are always closed. **Holidays are not modelled** — the session module is explicit that this is a Phase 0/1 approximation that must be validated against authoritative Robinhood Chain trading hours before live use.
- The clock is derived with `Intl.DateTimeFormat` in `America/New_York`. If the wall clock cannot be determined, `getSessionState` returns closed/not-tradable.
- On-chain, the keeper passes the session as an enum (`Closed=0, PreMarket=1, Regular=2, AfterHours=3`) into `executeCopy`; `RiskModule.evaluate` rejects `Closed` outright and rejects any session whose multiplier is unset (`session not tradable`).

### Where the sizing is applied

```
intendedSize = leaderNotional × baseCopyBps × sessionBps / (10_000 × 10_000)
```

`baseCopyBps` is the desk's copy fraction (the shipped keeper config uses `500` = 5% of the leader's notional). The session multiplier then scales it, and only afterwards do the hard caps apply. A leader's 20,000 USDG buy therefore intends 1,000 USDG in regular hours and 300 USDG after hours, before caps.

### Why this exists

Prices can gap across session boundaries and after-hours liquidity is thinner; realized slippage can exceed simulated slippage. The protocol's rule — from the README — is simply: *after-hours size is smaller than cash-session size*. The 30% figure is the shipped default (`DEFAULT_SESSION_POLICY`), configurable per desk by the owner via `RiskModule.setSessionRisk`.
