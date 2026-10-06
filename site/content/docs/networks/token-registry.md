---
title: Token Registry
description: The SDK's chain-scoped token registry — eligibility, decimals, feeds, and how to query it.
order: 4
---

The registry lives in `sdk/src/registry.ts` and is the keeper's and app's shared answer to "what is this token, and may a desk hold it?"

## Entry shape

Each `OfficialStockToken` entry records: `symbol`, `name`, `chainId`, `address` (`null` until verified — never fabricated), Chainlink `feed`, `issuer`, `decimals`, optional `bytecodeHash`, a `verification` state (`verified` / `unverified` / `placeholder`), an `enabled` flag, and a `note` explaining the status.

An asset is trade-eligible only when it is `verified` **and** `enabled` **and** has a concrete address, decimals, and a cited feed — on that specific chain.

## Registry rows (verbatim from `sdk/src/registry.ts`)

| Symbol | Chain | Verification | Enabled | Address |
|---|---|---|---|---|
| NVDA | 4663 | verified | ✅ | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` |
| AAPL | 4663 | verified | ✅ | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` |
| SPY | 4663 | verified | ✅ | `0x117cc2133c37B721F49dE2A7a74833232B3B4C0C` |
| NVDA | 46630 | placeholder | ❌ | `null` |
| AAPL | 46630 | placeholder | ❌ | `null` |
| SPY | 46630 | placeholder | ❌ | `null` |
| TSLA | 46630 | unverified | ❌ | `0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E` |
| AMZN | 46630 | unverified | ❌ | `0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02` |
| PLTR | 46630 | unverified | ❌ | `0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0` |
| NFLX | 46630 | unverified | ❌ | `0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93` |
| AMD | 46630 | unverified | ❌ | `0x71178BAc73cBeb415514eB542A8995b82669778d` |

The 46630 "unverified" rows have real contract addresses (confirmed against the official contracts page, symbol/decimals/bytecode) but **no cited Chainlink feed**, so they stay disabled. The 46630 "placeholder" rows exist to stop anyone copying 4663 addresses onto testnet.

Eligibility is enforced twice: the keeper's `isTradeEligible` (chain + symbol) and on-chain via `RiskModule`/`SwapAdapter` token allowlists.

## Decimals discipline

| Token | Decimals |
|---|---|
| USDG | **6** |
| Stock Tokens | **18** |
| `$AXBOOK` | 18 |

Every accounting path normalizes through these decimals — see [NAV & Accounting](/docs/accounting/nav-and-accounting). UI code must never mix raw and UI units; the SDK's `nav.ts` helpers exist for exactly that reason.

## Querying the registry

```ts
import {
  getOfficialStockToken,
  getOfficialStockTokenByAddress,
  isTradeEligible,
  listSymbols,
  listedTokenAddresses,
} from "@seat/sdk";

getOfficialStockToken("NVDA", 4663);      // verified entry
getOfficialStockToken("NVDA", 46630);     // placeholder entry (address: null)
isTradeEligible("NVDA", 4663);            // true
isTradeEligible("TSLA", 46630);           // false
listSymbols();                            // ["NVDA", "AAPL", "SPY", "TSLA", ...]
listedTokenAddresses(46630);              // concrete 46630 token addresses
```

See [SDK: Registry](/docs/sdk/registry) for the full surface.
