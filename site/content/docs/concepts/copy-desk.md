---
title: Copy Desk
description: The core Axbook primitive — one leader, one vault, one risk configuration.
order: 2
---

## Plain English

A **copy desk** is a pool of money that follows one trader. You put USDG in; the desk copies that trader's Stock Token trades under a strict set of risk rules; you hold shares of the pool and can leave by redeeming them. It is closer to a small, transparent, rules-bound fund than to a trading bot.

The name is deliberate: a *desk* (as in a trading desk) is capital plus a mandate plus limits. The leader supplies the trading judgment; the desk supplies the capital, the limits, and the accounting.

## Technically

A desk is the composition of:

| Piece | Contract / component | Fixed or configurable |
|---|---|---|
| Leader binding | `DeskVault.leader` (immutable) | Fixed at deployment |
| Vault | `DeskVault` | Holds USDG + allowlisted Stock Tokens; issues book shares |
| Risk configuration | `RiskModule.deskConfig[desk]` + token allowlist + session multipliers | Owner-configured |
| Swap path | `SwapAdapter` router + token allowlist | Owner-configured; `router = 0` means no execution |
| Fee parameters | `FeeModule.params` | Owner-configured |
| Keeper binding | `DeskVault.keeper` | Owner-set; the only caller of `executeCopy` |

Desks are created by the **DeskFactory**, which enforces **one vault per leader**:

- `createDesk(leader)` — owner only, no bond. Used for bootstrap leaders.
- `listDesk(leader)` — anyone, by posting the `$AXBOOK` listing bond (Phase 2; inert until `setListingParams` is called at TGE).

Each deployed vault is a full `DeskVault` with the factory's shared `riskModule` and `swapAdapter`, and the factory records `deskOf[leader]`, `allDesks[]`, and (for listed desks) the bond.

## What a desk can and cannot do

**Can:** hold USDG and allowlisted Stock Tokens; mint/burn book shares; execute keeper-submitted copies that pass risk; accrue and pay fees; queue withdrawals when cash is deployed.

**Cannot:** trade assets outside the allowlist; trade when the session is closed; exceed its caps; be traded by anyone other than its keeper; be upgraded (there is no proxy or admin upgrade path); mint `$AXBOOK`.

## The two piles

The essential safety property is that **the leader's money and the desk's money are separate piles**:

- The leader trades their own wallet. Their balance is untouched by the desk.
- Depositor funds sit in the vault. The leader has no withdrawal path to them; their economic exposure is the 70% share of performance fees.
- The desk can still lose money on copies — separation is about **custody**, not about the leader being right.

See [Security → Security model](/docs/security/security-model) for the full trust matrix.
