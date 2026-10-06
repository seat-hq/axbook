---
title: FAQ
description: Direct answers to the questions everyone asks first — all verified against the repository.
order: 1
---

## What is Axbook?

A copy-desk protocol on Robinhood Chain: opted-in **leader** trading activity is observed by a **keeper**, risk-checked on-chain, resized, and executed for capital deposited in that leader's **desk vault**. It is a system of contracts + keeper + app + SDK — not a trading bot. See [What is Axbook?](/docs/introduction/what-is-seat).

## What is a copy desk?

A smart-contract vault bound to one leader address. Depositors hold **book shares**; the desk replicates the leader's eligible trades within on-chain risk limits. See [Copy desk](/docs/concepts/copy-desk).

## What is a leader?

An address whose trading activity a desk follows. Leaders are opted-in; a desk exists only for a registered leader. Leaders earn 70% of the desk's fees. See [Leaders & followers](/docs/concepts/leaders-and-followers).

## What is USDG?

The USD-denominated settlement asset on Robinhood Chain, **6 decimals**. All deposits, NAV, and fees are USDG-denominated. Mainnet: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`; testnet: `0x7E955252E15c84f5768B83c41a71F9eba181802F`.

## What assets are supported?

Only **NVDA, AAPL, and SPY Stock Tokens on mainnet 4663** are trade-eligible (verified + enabled in the [registry](/docs/networks/token-registry)). Testnet tokens are unverified and disabled. Nothing else can be held by a desk.

## How does copying work?

Leader fills → keeper observes → session check → `RiskModule.evaluate` → resize or skip → `executeCopy` → vault accounting updates. Full pipeline: [Keeper](/docs/keeper/overview) and [How it works](/docs/introduction/how-it-works).

## Who controls the funds?

The **vault contract** holds funds. The owner can pause and configure but **cannot withdraw user funds** — no admin sweep exists. The keeper can only call `executeCopy`, bounded by on-chain risk checks. See [Security model](/docs/security/security-model).

## What happens when a leader trades?

If the asset is eligible, the session is open, and risk checks pass, the desk executes a resized copy. If anything fails, the fill is skipped with an explicit reason — the system fails closed.

## What happens when the keeper stops?

Copies stop; nothing else changes. Deposits and withdrawals keep working (queue processing is permissionless), and on-chain halts still protect the vault. Missed fills are not backfilled.

## What happens during a drawdown?

When NAV/share falls 20% (default) below the high-water mark, the **drawdown halt** rejects all new copies until NAV recovers. It is automatic and on-chain. See [Risk engine](/docs/risk/overview).

## What networks are supported?

Robinhood Chain **testnet 46630** (Phase 1 contracts live, cash-only) and **mainnet 4663** (nothing deployed). No other chain is supported; the keeper refuses other chain IDs. See [Networks](/docs/networks/overview).

## Is Axbook affiliated with Robinhood?

**No.** The repository states this explicitly — see the [not-affiliated notice](/docs/runbooks/not-affiliated). Axbook builds on Robinhood Chain infrastructure and instruments; it is an independent project.

## Is the protocol production-ready?

**No.** Unaudited, nothing on mainnet, no live execution anywhere, and a known live-indexer limitation. See [Project status](/docs/introduction/project-status) and [Known limitations](/docs/security/limitations).

## Does Axbook have a token?

Not deployed. `$AXBOOK` is Phase 2 code (fixed 1B supply) that has never been broadcast. See [The Axbook token](/docs/economics/seat-token).

## Where should developers start?

[Quickstart](/docs/introduction/quickstart) → [Development setup](/docs/development/setup) → [Contracts](/docs/contracts/overview) → [SDK](/docs/sdk/installation).
