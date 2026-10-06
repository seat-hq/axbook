---
title: Environment Variables
description: Every environment variable in the repository — what it does, who reads it, and safe defaults.
order: 2
---

All variables are documented in `.env.example`. Copy it to a **gitignored** `.env` (`cp .env.example .env`) and fill in only what you need. Never commit `.env`; never put real secrets in examples or docs.

## Network / RPC

| Variable | Used by | Purpose |
|---|---|---|
| `RH_TESTNET_RPC_URL` | keeper, deploy scripts (`robinhood_testnet` endpoint) | Testnet `46630` RPC |
| `NEXT_PUBLIC_RH_TESTNET_RPC_URL` | app | Testnet RPC in the browser |
| `RH_RPC_URL` | keeper, deploy scripts (`robinhood` endpoint) | Mainnet `4663` RPC |
| `NEXT_PUBLIC_RH_RPC_URL` | app | Mainnet RPC in the browser |
| `RH_WS_URL` | keeper | Optional WebSocket endpoint |
| `CHAIN_ID` | keeper, scripts | `46630` (default) or `4663` |
| `NEXT_PUBLIC_CHAIN_ID` | app | Chain the app targets |

## Keys and ownership

| Variable | Used by | Purpose |
|---|---|---|
| `PRIVATE_KEY` | deploy scripts, keeper | Broadcaster / signer. **Keep empty in `.env.example`; real key only in local `.env`.** |
| `OWNER` | deploy scripts | Contract owner; must equal the broadcaster for mainnet scripts |
| `KEEPER_ADDRESS` | deploy scripts, keeper | The vault's keeper address; also the `from` for live submits |

## Desk / deploy wiring

| Variable | Used by | Purpose |
|---|---|---|
| `USDG_ADDRESS` | deploy scripts | Official USDG for the target chain; mainnet scripts **reject** anything but `0x5fc5…b168` |
| `LEADER_ADDRESS` | deploy scripts, keeper | Bootstrap leader (also keeper fallback) |
| `LEADER_2`, `LEADER_3` | `DeployPhase2` | Additional leaders; unset ⇒ that desk is skipped |
| `DESK_ADDRESS` | keeper | Single-desk binding |
| `DESK_ADDRESSES` | keeper | Comma-separated multi-desk list |
| `DESK_FACTORY` / `FACTORY_ADDRESS` | keeper | Walk `factory.allDesks` when no desk list is set |
| `PROTOCOL_FEE_RECIPIENT` | deploy scripts | Treasury for the protocol fee share (defaults to `OWNER`) |

## Phase 2 / TGE

| Variable | Used by | Purpose |
|---|---|---|
| `SEAT_HOLDER` | `DeployPhase2` | Receives the 1B `$AXBOOK` mint (defaults to `OWNER`) |
| `LISTING_BOND_SEAT` | `DeployPhase2` | Listing bond (default `100_000e18`) |
| `POSITION_MANAGER_ADDRESS` | operator | Cited Uniswap v3 NPM on 4663 (`0x7399…E0D3`); LP mint stays manual |
| `SEAT_LP_USDG` | `DeployPhase2` | If set, logs LP seeding intent; the script never mints the position |
| `CONFIRM_MAINNET` | `DeployMainnet`, `DeployPhase2` | Must be `I_UNDERSTAND` to broadcast on 4663 |
| `CONFIRM_SEAT_TGE` | `DeployPhase2` | Second confirm required for the TGE |

## Risk / fee tuning (optional)

| Variable | Default in scripts |
|---|---|
| `MAX_FILL_USDG` | testnet: unset (skips `configureDesk`); mainnet: 5,000 USDG |
| `MAX_POSITION_USDG` | testnet 5,000 / mainnet 20,000 USDG |
| `MAX_GROSS_USDG` | testnet 10,000 / mainnet 50,000 USDG |
| `MAX_DRAWDOWN_BPS` | 2,000 (20%) |
| `MAX_STALENESS_SEC` | 120 |
| `DEPOSIT_CAP_USDG` | 50,000 USDG (mainnet) |
| `SWAP_POOL_FEE` | 3000 |

## Execution guards

| Variable | Purpose |
|---|---|
| `EXECUTION_MODE` | `PAPER` (default) or `LIVE` |
| `SWAP_ROUTER_ADDRESS` | Testnet-only hook for `SwapAdapter.setRouter`; **leave empty on 46630 — none is cited** |
| `SWAP_ROUTER_CONFIGURED` | `1` only after a 4663 `ExactInputRouter02` is live |
| `SEAT_SUBMIT_TX` | `1` to actually broadcast keeper copies; `0` = dry-run with encoded calldata |

## Site (this documentation)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SEAT_PRODUCT_URL` | "Product" link target (defaults to `https://app.axbook.xyz`) |
| `NEXT_PUBLIC_SEAT_X_URL` | X/Twitter link (defaults to `https://x.com/xxniiinxx`) |
| `NEXT_PUBLIC_SEAT_SITE_URL` | Canonical site URL for metadata/sitemap |

## Safe example

```env
# .env — gitignored. Testnet development, paper keeper.
RH_TESTNET_RPC_URL=<your-testnet-rpc-url>
NEXT_PUBLIC_RH_TESTNET_RPC_URL=<your-testnet-rpc-url>
CHAIN_ID=46630
NEXT_PUBLIC_CHAIN_ID=46630
PRIVATE_KEY=<your-private-key>
USDG_ADDRESS=0x7E955252E15c84f5768B83c41a71F9eba181802F
OWNER=<your-deployer-address>
LEADER_ADDRESS=<opted-in-leader-address>
EXECUTION_MODE=PAPER
```
