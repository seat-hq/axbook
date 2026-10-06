# Axbook

Follow the book. Hold the shares.

Monorepo for **Axbook**: USDG copy desks for official Stock Tokens on Robinhood Chain. You deposit USDG into a separate vault and receive **book shares** — a claim on desk NAV. A keeper may copy a leader’s fills, smaller, filtered, and capped.

![cover](docs/cover.png)

| | |
|---|---|
| Site | https://axbook.xyz |
| App | https://app.axbook.xyz |
| Docs | https://axbook.xyz/docs |
| X | https://x.com/xxniiinxx |
| Testnet | Robinhood `46630` — Phase 1 vault shipped |
| Mainnet | Robinhood `4663` — **no Axbook vault yet** |
| Token | `$AXBOOK` code exists. **Nothing is deployed.** Ignore any ticker using this name today. |

Independent of Robinhood Markets. Stock Tokens are not equity. Not investment advice. [MIT](LICENSE).

Git package names in this repo are still `seat`. The public product is Axbook.

## What to check

A desk is not a wallet-copy bot. The leader trades from their own wallet. You deposit **USDG** into a **separate vault** and receive **book shares**. NAV is cash plus the positions the desk actually holds. Copies are delayed, scaled, and capped. Uncertain means skip. The desk can lose money.

**Before you send USDG:**

1. You are on **https://app.axbook.xyz** (or this repo's `make app-dev`), not a lookalike.
2. The wallet network is **Robinhood Chain**. Gas is **ETH**. Accounting is **USDG** (6 decimals).
3. **Mainnet `4663`:** this repo's Axbook vault, factory, and `$AXBOOK` addresses are `null`. Official USDG on 4663 is `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`. Do not deposit expecting an Axbook desk there until a `CONFIRM_MAINNET` deploy is recorded here.
4. **Testnet `46630`:** the app talks to the vault below. Confirm the same addresses in [`app/src/lib/addresses.ts`](app/src/lib/addresses.ts).
5. Anything branded `$AXBOOK` on a DEX today is **not** this repository.
6. Read [`docs/risk.md`](docs/risk.md) and [`docs/not-affiliated.md`](docs/not-affiliated.md).

## Using the desk

Local: `make app-dev` → http://localhost:3000/ (dashboard + deposit/redeem). The older terminal shell is at `/desk`.

| Action | What happens |
|---|---|
| Connect wallet | Must be on 46630 (testnet) or 4663 once a vault exists. |
| Deposit USDG | Approve the vault, then mint book shares. |
| Redeem book shares | Pays USDG if the vault has cash; otherwise the claim queues. |
| NAV / cash / shares | Read from the vault. NAV uses `balanceOfUI()`, not raw balances. |
| Fill tape | Rows are `source=fixture` or `source=chain`. Fixtures are never labeled live. |

Phase 1 testnet desks are **cash vaults** (NAV ≈ USDG cash). Live copies on 46630 fail closed — there is no cited Uniswap router on testnet.

When a capped mainnet desk exists, deposits stop at **50,000 USDG**.

## Contracts (testnet 46630)

From Foundry broadcast, written by `make write-addresses`. Verify on-chain before using.

| | Address |
|---|---|
| Desk vault | `0x74DAc7f731E9fc18F3fb90F63F08aeF1Ba560C50` |
| Desk factory | `0xDD8d02C3D56b2f2923b2E6C75B1AfdBe57F71F4B` |
| Risk module | `0x48a0733a5b7b7ae1c98d29712cc639f33bcb2147` |
| Swap adapter | `0xff8851ea3699781c6c331ee9530d7831cc465f02` |
| Fee module | `0x475d9d5a7d1b839845ee1073c5a0c51320064408` |
| USDG (testnet) | `0x7e955252e15c84f5768b83c41a71f9eba181802f` |
| `$AXBOOK` / staking / LP locker | not deployed |

Mainnet 4663 USDG (cited, not an Axbook deploy): `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`.

Books: only registry rows that are `verified` **and** `enabled` on **that chain**. On 4663 that is official Stock Tokens (NVDA, AAPL, SPY, …). Testnet placeholders are **not** trade-eligible. See [`sdk/src/registry.ts`](sdk/src/registry.ts) and [`docs/allowlist.md`](docs/allowlist.md).

## Fees (when a live desk exists)

- No fee on volume.
- Performance fee on profit above the previous peak NAV per share.
- Small AUM fee.
- Phase 2 split: 70% leader / 20% protocol / 10% stakers.
- The leader can receive the fee share. The leader **cannot** withdraw the vault.

## Layout

```text
contracts/   Foundry. Factory, vault, risk, swap, fees, $AXBOOK (SeatToken.sol).
keeper/      Indexer + signaler. Paper executor unless live guards pass.
app/         Next.js desk. Deposit / redeem USDG. Defaults to 46630.
site/        Next.js marketing + /docs.
sdk/         Token registry, eligibility, NAV helpers.
docs/        Litepaper, runbooks, cited 4663/46630 facts.
scripts/     paper-copy, write-addresses.
```

Cited chain facts (USDG, MAG7, SwapRouter02, oracles): [`docs/phase-1-live.md`](docs/phase-1-live.md). Do not invent addresses.

## Commands

```bash
make install          # forge-std, OZ, pnpm
make test             # forge test -vvv
make paper            # paper copy, no key
make app-dev          # app, default 46630
make site-dev         # site, :3100
make keeper-testnet   # PAPER on 46630 unless you override
make write-addresses  # contracts → app/site address files
```

Broadcasts stay closed without env confirms:

```bash
CONFIRM_MAINNET=I_UNDERSTAND make deploy-mainnet          # no $AXBOOK
CONFIRM_MAINNET=I_UNDERSTAND CONFIRM_SEAT_TGE=I_UNDERSTAND make deploy-phase2
CONFIRM_BURN=I_UNDERSTAND LAUNCH_TOKEN=0x… make burn-launch
```

Copy [`.env.example`](.env.example) to `.env`. Leave keys out of git.

## Rules this repo enforces

- NAV from `balanceOfUI()`, never raw `balanceOf()`.
- No fee on volume. Performance is high-water on NAV/share; AUM is separate.
- `$AXBOOK` has no mint after the constructor. 1B, once. (`SeatToken.sol`)
- After-hours copy size < cash-session size.
- Uncertain session/price/asset/size → skip.
- Mainnet deposits are capped at 50,000 USDG.
- Keeper is bound to `vault.leader()`. It does not choose the leader.

## Risk (read this)

- You can lose the USDG you deposit. There is no guarantee of NAV, fills, or uptime.
- Copies lag the leader and will not match them trade-for-trade.
- Stock Tokens carry issuer, custody, and session/gap risk. They are not shares.
- Contracts are experimental. Phase 0 was unaudited; treat all phases as such until an audit is published in this repo.
- The keeper is an off-chain actor and can lag or stop.
- Uncertain = skip. That protects the desk; it does not protect your NAV from markets.

Full list: [`docs/risk.md`](docs/risk.md).

## Docs

| File | |
|---|---|
| [`docs/litepaper.md`](docs/litepaper.md) | Mechanism |
| [`docs/phase-1.md`](docs/phase-1.md) | Testnet desk |
| [`docs/phase-1-live.md`](docs/phase-1-live.md) | Cited mainnet/testnet facts |
| [`docs/phase-2.md`](docs/phase-2.md) | `$AXBOOK`, staking, LP lock |
| [`docs/mainnet-day.md`](docs/mainnet-day.md) | Guarded 4663 day |
| [`docs/allowlist.md`](docs/allowlist.md) | How a name becomes trade-eligible |
| [`docs/risk.md`](docs/risk.md) | What can go wrong |
| [`docs/not-affiliated.md`](docs/not-affiliated.md) | Robinhood / Stock Tokens |
