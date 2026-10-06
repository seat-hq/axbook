# Phase 1 live copies — facts (46630 + 4663)

Do **not** invent token, oracle, or router addresses. Every row below is
cited. Missing facts stay closed. Do not paste 4663 addresses onto 46630.

Public litepaper remains **Later** until a real copy exists. This file is
the Gate 0 record for leftover Phase 1.

## Sources

| Fact | Source |
|---|---|
| Chain ids 4663 / 46630, RPC | [Connecting](https://docs.robinhood.com/chain/connecting/) |
| USDG, WETH, Stock Tokens | [Token contracts](https://docs.robinhood.com/chain/contracts/) |
| Stock Token model, `balanceOfUI`, Chainlink `AggregatorV3` | [Building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens/) |
| Feed interface; feed **addresses** live on Chainlink’s directory | [Oracles & price feeds](https://docs.robinhood.com/chain/oracles-and-price-feeds/) |
| Issuer (product-level) | [Stock Tokens](https://docs.robinhood.com/chain/stock-tokens/) — Robinhood Assets (Jersey) Limited |
| Uniswap 4663 SwapRouter02 | [Uniswap deployments/4663.md](https://github.com/Uniswap/contracts/blob/main/deployments/4663.md) |
| Uniswap: **no** 46630 deployment | Uniswap docs / community registries list **4663 only** |
| Mainnet desk cap $50k | [`Idea.md`](Idea.md) Phase 1 |

On-chain checks used `https://rpc.mainnet.chain.robinhood.com` and
`https://rpc.testnet.chain.robinhood.com` (`cast call`).

---

## Mainnet 4663 (capped live desk)

### USDG / WETH

| Field | Value |
|---|---|
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| USDG decimals | 6 (`symbol()` = `USDG`) |
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` |
| Source | Official contracts page, mainnet column + on-chain |

### Official MAG7 Stock Tokens

`symbol()`, `decimals()` = 18, `balanceOfUI(address)` present, shared
bytecode hash. Issuer (product-level): Robinhood Assets (Jersey) Limited.

| Symbol | Address | Feed (AggregatorV3) | Feed `description()` | Feed decimals |
|---|---|---|---|---|
| NVDA | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` | `0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15` | `RHNVDA / USD` | 8 |
| AAPL | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` | `0x6B22A786bAa607d76728168703a39Ea9C99f2cD0` | `Robinhood AAPL / USD` | 8 |
| SPY | `0x117cc2133c37B721F49dE2A7a74833232B3B4C0C` | `0x319724394D3A0e3669269846abE664Cd621f9f6A` | `RHSPY / USD` | 8 |

Bytecode hash (all three):
`0x6c1fdd40002dcb440c7fff6a84171404d279ccb057803b65826f7546acd65630`

Registry: `verified` + `enabled` on **4663 only**. `isTradeEligible(symbol, 4663)`
is true for NVDA / AAPL / SPY.

### Uniswap SwapRouter02

| Field | Value |
|---|---|
| SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` |
| Factory | `0x1f7d7550B1b028f7571E69A784071F0205FD2EfA` |
| On-chain | `WETH9()` = official WETH; `factory()` = row above |
| QuoterV2 (not used by the vault) | `0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7` |

`SwapAdapter` never calls SwapRouter02 directly. `ExactInputRouter02` wraps
`exactInputSingle` at fee **3000**. USDG/NVDA, USDG/AAPL, and USDG/SPY pools
exist at that fee (factory `getPool`).

### Deposit cap

`DeskVault.depositCapUsdg = 50_000e6` ($50,000 USDG). `0` = unlimited
(testnet). `DeployMainnet` sets the cap after `createDesk`.

`make deploy-mainnet` **refuses** unless `CONFIRM_MAINNET=I_UNDERSTAND`.
It never deploys `SeatToken` / `$AXBOOK`. Phase 2 TGE is a separate
`make deploy-phase2` with dual confirm — see [`phase-2.md`](phase-2.md).

---

## Testnet 46630 (cash vault; copies still closed)

### USDG (testnet)

| Field | Value |
|---|---|
| Address | `0x7E955252E15c84f5768B83c41a71F9eba181802F` |
| Decimals | 6 (on-chain) |
| Source | Official contracts page, testnet column |

Mainnet USDG `0x5fc5…b168` is **not** used on 46630.

### Official testnet Stock Tokens

NVDA, AAPL, and SPY are **not** on the official testnet contracts table.
They stay `placeholder` in the SDK **for chain 46630**. Do not copy mainnet
4663 addresses.

These **are** listed on the official testnet contracts page. Decimals and
`symbol()` confirmed on-chain. `balanceOfUI(address)` succeeded on TSLA
(ERC-8056 present). All five share the same deployed bytecode hash.

| Symbol | Address | Decimals | Bytecode hash | Feed | Registry |
|---|---|---|---|---|---|
| TSLA | `0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E` | 18 | `0x2f367e6a678e7b30ab613d5963e541e6f4d3ca586de76e2f441fbfeb1a27c440` | **not cited** | `unverified`, `enabled=false` |
| AMZN | `0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02` | 18 | same | **not cited** | `unverified`, `enabled=false` |
| PLTR | `0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0` | 18 | same | **not cited** | `unverified`, `enabled=false` |
| NFLX | `0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93` | 18 | same | **not cited** | `unverified`, `enabled=false` |
| AMD | `0x71178BAc73cBeb415514eB542a8995b82669778d` | 18 | same | **not cited** | `unverified`, `enabled=false` |

**Not `verified` / not `enabled` on 46630:** official Chainlink **feed
proxies for 46630** are not published. `isTradeEligible(symbol, 46630)`
stays false.

### Router (46630 blocker)

| Field | Value |
|---|---|
| Official 46630 SwapRouter / Universal Router | **none cited** |
| Action | `SwapAdapter.router` stays `address(0)` on 46630. Never paste a 4663 Uniswap address onto testnet. Never deploy a fake DEX as “the” router. |

`SwapAdapter.execute` calls a fixed `IExactInputRouter.swapExactIn` **only**
when `router != 0` (Foundry `MockRouter` in tests; `ExactInputRouter02` on
4663). On 46630, `setRouter` is not invoked.

---

## What this ships vs what stays closed

| Shipped | Closed |
|---|---|
| Cited 4663 NVDA/AAPL/SPY + feeds + SwapRouter02 | 46630 live swap (`router = 0`) |
| `ExactInputRouter02` + `$50k` `depositCapUsdg` | Ungated AUM |
| Vault equity = cash + `balanceOfUI` × oracle − fees | Broadcast to 4663 without `CONFIRM_MAINNET=I_UNDERSTAND` |
| Fee harvest (10% HW / 2% AUM; Phase 2 adds 10% stakers) | Buyback-and-burn (later) |
| `LiveExecutor` on 4663 or 46630 when router is set | Invented 46630 feeds/router |

## Exit

- Tests + paper engine prove the wiring.
- A real 46630 blotter copy still waits on a cited testnet router **and** feed.
- A real 4663 copy waits on `make deploy-mainnet` (guarded) + USDG in the
  capped vault + keeper `SEAT_SUBMIT_TX=1`.
