---
title: Why Axbook?
description: The problem with wallet copy-trading and the gap a pooled, risk-boxed copy desk fills on Robinhood Chain.
order: 2
---

## The problem

Copy-trading as practiced on-chain today is usually **wallet mirroring**: a bot watches a leader wallet and fires the same trade from your wallet, as fast as possible, at whatever size you configured. That model has structural problems:

- **No pooled accounting.** Every follower eats their own slippage, their own gas, their own partial fills. There is no NAV, no shares, no auditable track record — just a wallet history.
- **No risk box.** A mirroring bot will happily copy a leader into an illiquid launch, a spoofed token, or a 3 a.m. gap. Anything the leader's wallet touches gets copied.
- **Misaligned fees.** Terminal and sniper tools typically charge on volume. The tool gets paid whether or not you ever make money.
- **Custody confusion.** Some "copy" products ask for keys or deposits into opaque strategies. It is hard to answer the simplest question: *where is my money, and who can move it?*

## The Axbook answer

Axbook keeps the appealing part — following a trader you rate — and changes the ownership primitive:

| Wallet mirroring | Axbook copy desk |
|---|---|
| You copy a wallet address | You join a desk by depositing USDG |
| Your wallet trades | The desk vault trades |
| No accounting | Book shares + NAV per share |
| Copies anything the wallet touches | Only verified, enabled Stock Tokens from the official registry |
| No limits beyond your own config | On-chain caps per fill, per position, and gross exposure; session sizing; drawdown halt |
| Fee on volume | Fee on profit above the high-water mark; no volume fee |
| Leader is just an address you watch | Leader is opted-in and bound to the desk; earns 70% of performance fees |

Two properties fall out of this design and are worth stating plainly:

1. **Custody separation.** Depositor funds sit in the `DeskVault` contract. The leader cannot withdraw them. The keeper can only call one function (`executeCopy`) and only through the risk module and the restricted swap adapter. See [Trust architecture](/docs/security/security-model).
2. **Explainable decisions.** Every copy decision — accept, resize, skip, halt — is produced by deterministic rules with a human-readable reason, and recorded to a public fill tape. See the [Keeper](/docs/keeper/overview) section.

## Why Robinhood Chain

The protocol is built specifically around Robinhood Chain's **USDG** stablecoin and its official **Stock Token** markets, which expose an authoritative `balanceOfUI()` balance interface and Chainlink `AggregatorV3` price feeds. The v1 desk books are the official NVDA, AAPL and SPY Stock Tokens on mainnet `4663`. The chain-specific facts (addresses, feeds, router) are documented with citations in [Networks](/docs/networks/mainnet).

:::callout{type="note"}
Stock Tokens are not shares of stock. They are on-chain assets issued by a third party (Robinhood Assets (Jersey) Limited, per the official documentation) and may be subject to jurisdictional restrictions. See [USDG & Stock Tokens](/docs/concepts/usdg-and-stock-tokens).
:::
