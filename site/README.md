# Axbook marketing site

Next.js app on port **3100** (`pnpm dev` from repo root: `make site-dev`).

## Environment

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SEAT_TOKEN_ADDRESS` | No | Mainnet `$AXBOOK` ERC-20 address (`0x` + 40 hex). When unset or invalid, the hero **Token** row is hidden. Set after Phase 2 TGE broadcast. |

Example (local):

```bash
NEXT_PUBLIC_SEAT_TOKEN_ADDRESS=0x… pnpm --filter @seat/site dev
```

The token bar links to [pons launchpad](https://www.ponsfamily.com/launchpad) (`/launchpad/<address>`) and [Robinhood Chain Blockscout](https://robinhoodchain.blockscout.com) (`/token/<address>`).
