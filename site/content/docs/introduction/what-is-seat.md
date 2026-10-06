---
title: What is Axbook?
description: Axbook is a copy-desk protocol on Robinhood Chain — USDG vaults that copy the Stock Token trades of an opted-in leader under deterministic on-chain risk rules.
order: 1
---

Axbook is a **copy-desk protocol** on [Robinhood Chain](/docs/networks/overview). It lets a pool of depositors collectively follow the trading activity of a specific, opted-in **leader** — without giving that leader, or anyone else, custody of their funds.

The litepaper defines it precisely:

> Axbook is a protocol for USDG-denominated **copy-trading desks** on Robinhood Chain. A desk mirrors the trades of an opted-in leader across a small set of authoritatively verified, official Stock Tokens (initially NVDA, AAPL, SPY). Depositors receive **book shares** representing a pro-rata claim on desk equity (NAV), computed from USDG cash plus the USDG value of held Stock Tokens.

## The one-paragraph version

You deposit **USDG** into a desk vault and receive **book shares**. The desk is bound to one leader — an address that has opted in. When the leader trades an eligible Stock Token, an off-chain **keeper** observes the fill, evaluates it against deterministic risk rules (session, caps, price freshness, drawdown), resizes or skips it, and — only if every check passes — executes a copy trade for the vault through a restricted swap adapter. The desk's **NAV** (net asset value) moves with the copied positions; your shares track your pro-rata slice of it. Fees are charged on profit above a **high-water mark**, not on volume.

## What Axbook is made of

Axbook is not a single contract or a bot. It is a system of four parts in one monorepo:

| Part | Path | Job |
|---|---|---|
| Smart contracts | `contracts/` | Desk factory, vault, risk module, swap adapter, fee module, oracle, $AXBOOK token suite |
| Keeper | `keeper/` | Watches leader fills, evaluates risk, submits vault copies |
| Application | `app/` | The desk blotter: deposit, redeem, seats, fill tape |
| SDK | `sdk/` | The official Stock Token registry and fixed-point NAV math |

## What Axbook is not

- **Not a generic trading bot or sniper.** There is no mempool racing, no meme-launch buying, no per-wallet "task". A desk can only ever hold assets that are verified and enabled in the [official registry](/docs/networks/token-registry).
- **Not a custodian for the leader.** The leader's wallet and the desk's vault are separate piles of money. The leader never receives a withdrawal key to the vault; they receive a share of performance fees.
- **Not affiliated with Robinhood.** Axbook is an independent, community project. See [Not affiliated](/docs/runbooks/not-affiliated).
- **Not finished.** The protocol is experimental and unaudited. See [Project status](/docs/introduction/project-status) for an honest component-by-component classification.

:::callout{type="warning" title="Read before depositing"}
Axbook is experimental software. The contracts are unaudited, the keeper is a single off-chain operator, and Stock Tokens carry issuer and jurisdictional risk. You can lose money. See the [Security](/docs/security/security-model) section and the repo's [risk disclosure](/docs/runbooks/risk).
:::
