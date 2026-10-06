# Mainnet day — Phase 2 TGE + desks (4663)

One-page checklist for when you are ready to broadcast. **Do not run this
until you mean it.** `.env` stays gitignored.

46630 testnet vault `0x8ff6…` is **unchanged** (no router, no `$AXBOOK`).

Full Phase 2 spec: [`phase-2.md`](phase-2.md). Cited 4663 facts:
[`phase-1-live.md`](phase-1-live.md).

---

## 0. Pre-flight

- [ ] `phase-2` merged (or you are on the branch that has `DeployPhase2.s.sol`)
- [ ] `forge test`, `pnpm typecheck`, `make paper`, `pnpm --filter keeper test` green
- [ ] Deploy wallet (`OWNER` = broadcaster) funded with ETH on **4663**
- [ ] Leader wallet(s) opted in and ready (you choose addresses; script never invents them)
- [ ] `KEEPER_ADDRESS` hot wallet funded (optional but needed for live copies)
- [ ] `PROTOCOL_FEE_RECIPIENT` treasury address decided
- [ ] `SEAT_HOLDER` decided (default `OWNER`; receives full 1B mint)

**Choose one path:**

| Path | When |
|---|---|
| **`make deploy-phase2`** | Full stack: `$AXBOOK`, staking, factory, up to 3 desks (recommended if nothing live on 4663 yet) |
| **`make deploy-mainnet`** | Phase 1 only: one capped desk, **no** `$AXBOOK` — skip if you want Phase 2 in one shot |

This runbook assumes **`deploy-phase2`**.

---

## 1. `.env` (local only)

Copy from `.env.example`. Minimum for broadcast:

```bash
# RPC
RH_RPC_URL=https://rpc.mainnet.chain.robinhood.com
NEXT_PUBLIC_RH_RPC_URL=https://rpc.mainnet.chain.robinhood.com
CHAIN_ID=4663
NEXT_PUBLIC_CHAIN_ID=4663

# Signer (must match OWNER)
PRIVATE_KEY=...
OWNER=0x...                    # same as broadcaster

# Dual confirm — both required
CONFIRM_MAINNET=I_UNDERSTAND
CONFIRM_SEAT_TGE=I_UNDERSTAND

# Official USDG (script rejects anything else)
USDG_ADDRESS=0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168

# Leaders — unset = skipped; listDesk covers later
LEADER_ADDRESS=0x...
# LEADER_2=0x...
# LEADER_3=0x...

# Ops
KEEPER_ADDRESS=0x...
PROTOCOL_FEE_RECIPIENT=0x...
SEAT_HOLDER=0x...              # optional; defaults to OWNER
LISTING_BOND_SEAT=100000000000000000000000   # 100_000e18 default

# Live keeper (after deploy)
SWAP_ROUTER_CONFIGURED=1
EXECUTION_MODE=LIVE
SEAT_SUBMIT_TX=0               # set 1 only when ready to submit copy txs
DESK_FACTORY=0x...             # from deploy logs; or DESK_ADDRESSES=0x...,0x...
```

Optional risk caps (defaults in script): `MAX_FILL_USDG`, `MAX_POSITION_USDG`,
`MAX_GROSS_USDG`, `MAX_DRAWDOWN_BPS`, `MAX_STALENESS_SEC`.

---

## 2. Dry run (no broadcast)

```bash
cd seat
export PATH="$HOME/.foundry/bin:$PATH"
set -a && . ./.env && set +a
forge script contracts/script/DeployPhase2.s.sol --rpc-url robinhood
```

Expect `OWNER must be the broadcaster` if `OWNER` ≠ signer. Fix before
broadcasting.

---

## 3. Broadcast

```bash
make deploy-phase2
```

Script deploys (single tx batch):

1. `SeatToken` → `SEAT_HOLDER` (1B mint)
2. `StakingPool`, `LpLocker`
3. `RiskModule`, `SwapAdapter`, `ExactInputRouter02`, `FeeModule` (70/20/10)
4. `ChainlinkOracle` + NVDA/AAPL/SPY feeds
5. `DeskFactory` + `setListingParams($AXBOOK, bond)`
6. `createDesk` for each set `LEADER_*` (oracle, fees, $50k cap, MAG7, session bps, keeper)

**Save console output** — addresses for step 4.

LP: script logs “seed+lock later” unless `SEAT_LP_USDG` is set. Minting the
Uni v3 position is **not** automated.

---

## 4. Wire the app

```bash
pnpm exec tsx scripts/write-addresses.ts
```

Verify `app/src/lib/addresses.ts` on **4663** has non-null:

- `seatToken`, `stakingPool`, `lpLocker`, `deskFactory`, `deskVault`, …

Restart app with `NEXT_PUBLIC_CHAIN_ID=4663`:

```bash
make app-dev
```

Blotter should show **Phase 2 · $AXBOOK**, desk picker when `deskCount > 1`,
stake + list-desk forms.

---

## 5. Post-deploy owner txs (manual)

Order is flexible; typical sequence:

### 5a. `$AXBOOK` bucket transfers

From `SEAT_HOLDER`, transfer per [`phase-2.md`](phase-2.md) buckets (40/20/15/12/8/5).
Do **not** invent team/airdrop addresses in the constructor — allocate now.

### 5b. AXBOOK/USDG liquidity + lock

Cited NPM (4663):
`0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3`

1. Create / use Axbook–USDG pool on Uni v3 (fee 3000) if needed
2. Mint position via NPM
3. `LpLocker.lock(npm, tokenId, 365 days, beneficiary)` from owner
4. Confirm `unlockTime` ≥ 365 days; no early withdraw

### 5c. Optional staker bootstrap

Transfer `$AXBOOK` to stakers or seed messaging; optional USDG is **not** required
for the pool to work (rewards come from desk fees via `notifyReward`).

### 5d. Extra desks

- Owner: `factory.createDesk(leader)` (no bond)
- Anyone: approve bond → `factory.listDesk(leader)` via blotter or wallet

---

## 6. Keeper

```bash
# .env: CHAIN_ID=4663, DESK_FACTORY=<from logs>, SWAP_ROUTER_CONFIGURED=1
make keeper-mainnet
```

Keeper walks `factory.allDesks` when `DESK_FACTORY` is set (or use
`DESK_ADDRESSES`). Fill tape rows include `desk`.

Start with `SEAT_SUBMIT_TX=0` (dry-run copies). Set `SEAT_SUBMIT_TX=1` only
after vault has USDG and you accept live swap risk.

---

## 7. Smoke test checklist

- [ ] Blotter on 4663: NAV / cash / leader read from vault
- [ ] Deposit ≤ $50k USDG on desk 1; redeem instant when cash available
- [ ] Stake `$AXBOOK` → after fee accrual, claim USDG from pool
- [ ] `listDesk` posts bond; new vault appears in picker (`?desk=`)
- [ ] Keeper writes tape with correct `desk` field
- [ ] 46630 vault still works unchanged (optional regression)

---

## 8. Rollback / mistakes

- There is **no** admin upgrade path on deployed vaults.
- Wrong deploy: do **not** reuse addresses in git; deploy fresh only with
  new CONFIRM intent and update `write-addresses.ts` from new broadcast.
- Never commit `.env`, `PRIVATE_KEY`, or broadcast logs with secrets.

---

## Quick reference

| Item | Value |
|---|---|
| Chain | Robinhood mainnet **4663** |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` |
| NPM | `0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3` |
| Deposit cap | $50k USDG **per desk** |
| Fee split | 70% leader / 20% protocol / 10% stakers |
| Listing bond default | 100_000 `$AXBOOK` |
