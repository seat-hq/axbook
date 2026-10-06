# Phase 2 — Open desks + `$AXBOOK`

**Status: code shipped.** Broadcast to Robinhood mainnet `4663` still
requires `CONFIRM_MAINNET=I_UNDERSTAND` **and** `CONFIRM_SEAT_TGE=I_UNDERSTAND`.
The 46630 cash vault (`0x8ff6…`) is unchanged (immutable, no router).

Phase 2 skips the 30-day live gate. It adds extra opted-in desks, a
fixed-supply `$AXBOOK` token, stake-to-list, and the Idea.md **70 / 20 / 10**
fee loop. Buyback-and-burn is **not** in this phase.

Ticker is **`$AXBOOK`** (not `$WAKE`). No mint after deploy. No volume fee.
Do not invent token / oracle / router / NPM addresses.

## Token

`SeatToken` is a fixed ERC-20:

| Field | Value |
|---|---|
| Name / symbol | `Axbook` / `Axbook` |
| Decimals | 18 |
| `totalSupply` | `1_000_000_000e18` |
| Mint | constructor only, to `SEAT_HOLDER` (default `OWNER`) |
| After deploy | **no `mint`** |

Bucket splits are **owner transfers after TGE**, not constructor
addresses:

| Bucket | Share | Notes |
|---|---|---|
| Liquidity / market | 40% | AXBOOK/USDG Uniswap v3; NFT locked 12 months |
| Community / airdrop | 20% | Later merkle; not deployed here |
| Team | 15% | Later vesting; not deployed here |
| Treasury / protocol | 12% | Ops + protocol 20% fee recipient |
| Leader incentives | 8% | Later |
| Staker bootstrap | 5% | Optional seed into `StakingPool` |

Do not invent team / airdrop wallets in the constructor.

## Fees — 70 / 20 / 10

`FeeModule` defaults on Phase 2 desks:

- Performance: `1000` bps (10% of profit above high-water)
- AUM: `200` bps per year
- Protocol share: `2000` bps of any fee → treasury address
- Staker share: `1000` bps of any fee → `StakingPool`
- Remainder `7000` bps → leader

`protocolShareBps + stakerShareBps <= 10000`. There is **no volume fee**.
Protocol 20% pays `PROTOCOL_FEE_RECIPIENT`. Buyback-and-burn is later.

If `stakerRecipient` is `address(0)`, the staker slice **stays in the
vault** as unpaid `feeLiabilitiesUsdg` (fail closed — not given to
protocol).

`StakingPool`: stake / unstake `$AXBOOK`, `notifyReward` USDG from vaults,
`claim` pro-rata. No rebase. No vote-to-print.

Phase 1 testnet / `DeployMainnet` keep `stakerShareBps: 0` (80/20) so
existing cash vaults do not change.

## Stake-to-list

`DeskFactory.createDesk` stays owner-only (bootstrap `LEADER_ADDRESS`,
`LEADER_2`, `LEADER_3` when set).

Anyone may `listDesk(leader)` after `setListingParams`:

- Pull `listingBondSeat` `$AXBOOK` from `msg.sender` (default `100_000e18`)
- Same one-vault-per-leader invariant
- Record `bondOf[vault]` / `bonderOf[vault]`
- Owner `returnBond` on sunset; **no auto-slash** (Phase 3)

Each new vault gets the same Phase 1 wiring: oracle, fee module, `$50k`
`depositCapUsdg`, MAG7 `setTokenAllowed` (NVDA / AAPL / SPY on 4663),
session bps (regular `10000` / pre+AH `3000` / closed `0`), optional
keeper.

`$50k` is still **per desk**. MAG7 only. No ungated AUM.

## App + keeper

Blotter reads `factory.deskCount` / `allDesks`. `?desk=` selects a vault
so deposits, NAV, and tape are per desk. Stake and list-desk forms appear
when `seatToken` is wired.

Keeper accepts `DESK_ADDRESSES` (comma list) or walks `DESK_FACTORY`
`allDesks`. One fill tape; each row already has `desk`.

## Locked LP

`LpLocker` holds a Uniswap v3 position NFT for **≥ 365 days**. Owner
withdraws to `beneficiary` only after unlock.

Cited NonfungiblePositionManager on 4663
([deployments/4663.md](https://github.com/Uniswap/contracts/blob/main/deployments/4663.md)):

`0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3`

Seeding AXBOOK/USDG liquidity is a **manual owner tx**. `DeployPhase2`
logs “seed+lock later” unless `SEAT_LP_USDG` is set; it does not invent
ticks or mint a position in the script.

## Guarded deploy

Step-by-step checklist: [`mainnet-day.md`](mainnet-day.md).

```bash
# requires both confirms in local .env — does not run otherwise
CONFIRM_MAINNET=I_UNDERSTAND CONFIRM_SEAT_TGE=I_UNDERSTAND make deploy-phase2
pnpm exec tsx scripts/write-addresses.ts
```

`DeployPhase2.s.sol` (separate from Phase 1 scripts):

- `chainid == 4663`
- Deploys `SeatToken`, `StakingPool`, `FeeModule` (70/20/10), `LpLocker`,
  factory with listing bond, then `createDesk` for each set leader
- Missing `LEADER_*` ⇒ that desk is skipped; `listDesk` covers later
  leaders
- Records `seatToken`, `stakingPool`, `lpLocker`, extra vaults via
  `write-addresses.ts`
- `canWriteOnChain` stays “Robinhood chain + vault set”

`.env` stays gitignored. Do not broadcast unless both CONFIRMs are set
on purpose.

## Out of scope

Buyback-and-burn keeper, vesting cliffs, merkle airdrop, UI boost, bond
slash, ungated AUM, Phase 3 (gap skip, agent seat, multi-leader
portfolio), Phase 4 (RFQ/Rialto, insurance, meme factory).
