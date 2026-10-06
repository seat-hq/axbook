---
title: Concepts Overview
description: The Axbook vocabulary at a glance — every term, plain English first, with links to the deep pages.
order: 1
---

Axbook has a small, precise vocabulary. Each term below is defined in one sentence here and gets a full explanation on its own page.

## The actors

| Term | Plain meaning |
|---|---|
| **Leader** | An opted-in trader whose Stock Token fills a desk copies. One per desk, fixed at deployment. |
| **Follower / Depositor** | A user who deposits USDG into a desk and receives book shares. |
| **Keeper** | The off-chain process that watches the leader, applies risk rules, and triggers vault copies. |
| **Owner** | The contract administrator (governance/operator) that configures risk, oracles, fees and keepers. |

## The structures

| Term | Plain meaning |
|---|---|
| **Copy desk** | The whole arrangement: one leader + one vault + one risk configuration. |
| **DeskVault** | The contract that holds USDG and Stock Tokens and issues book shares. |
| **Book shares** | The vault's internal unit of account for a depositor's pro-rata claim. Not a transferable token. |
| **NAV** | Net asset value: desk equity in USDG — cash plus position values minus fee liabilities. |
| **High-water mark** | The highest NAV-per-share a desk has reached; performance fees only apply above it. |

## The assets

| Term | Plain meaning |
|---|---|
| **USDG** | The accounting asset — a dollar stablecoin on Robinhood Chain, 6 decimals. |
| **Stock Token** | An official on-chain token tracking an equity (e.g. NVDA), issued on Robinhood Chain. Not a share of stock. |
| **$AXBOOK** | The protocol's fixed-supply token (Phase 2 — code shipped, not deployed). |

## The machinery

| Term | Plain meaning |
|---|---|
| **RiskModule** | The on-chain contract that decides accept / resize / skip / halt for every copy. |
| **SwapAdapter** | The restricted contract through which all vault swaps execute. |
| **FeeModule** | The contract that computes performance and AUM fees and their 70/20/10 split. |
| **AUM** | Assets under management — desk equity. A small annualized fee accrues on it. |
| **Performance fee** | A percentage of profit above the high-water mark. |
| **Drawdown halt** | An automatic stop: if NAV per share falls too far from its high-water mark, new copies halt. |
| **Session** | The US equities market phase (pre-market, regular, after-hours, closed) that scales copy size. |
| **Fill tape** | The keeper's public record of every observed fill and what the desk did about it. |

## Reading order

If you are new: [Copy Desk](/docs/concepts/copy-desk) → [Leaders & Followers](/docs/concepts/leaders-and-followers) → [USDG & Stock Tokens](/docs/concepts/usdg-and-stock-tokens) → [Seat Shares & NAV](/docs/concepts/seat-shares-and-nav) → [Fees & High-Water Mark](/docs/concepts/fees-and-high-water-mark). Then the machinery: [Keeper](/docs/concepts/keeper), [Risk Engine](/docs/concepts/risk-engine), [Market Sessions](/docs/concepts/market-sessions).
