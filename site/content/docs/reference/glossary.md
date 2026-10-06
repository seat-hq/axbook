---
title: Glossary
description: Protocol terminology — short, precise definitions.
order: 2
---

| Term | Meaning |
|---|---|
| **Desk** | A copy-trading vault bound to one leader; the unit of participation |
| **Copy desk** | Same as desk — emphasizes that it replicates leader activity |
| **Leader** | An opted-in address whose trades a desk follows |
| **Follower / Depositor** | A user who deposits USDG into a desk |
| **DeskVault** | The contract holding funds, shares, positions, and the withdrawal queue |
| **DeskFactory** | The contract that creates desks (owner-curated or bonded listing) |
| **USDG** | Robinhood Chain's USD settlement asset; 6 decimals; all accounting unit |
| **Stock Token** | Issuer-backed tokenized equity/ETF on Robinhood Chain; 18 decimals |
| **Book share** | A depositor's proportional claim on a desk's NAV; internal accounting, 6-decimal precision |
| **NAV** | Net asset value: cash plus oracle-priced positions, minus liabilities |
| **NAV/share** | NAV divided by outstanding shares; the price of one book share |
| **High-water mark** | Highest NAV/share ever recorded; performance fees apply only above it |
| **Keeper** | Off-chain service that observes leader fills and submits `executeCopy` |
| **RiskModule** | Pure on-chain evaluator: `evaluate(input) → (decision, size, reason)` |
| **SwapAdapter** | Execution bridge from vault to a swap router; no arbitrary calldata |
| **ExactInputRouter02** | Immutable-fee wrapper over Uniswap SwapRouter02 `exactInputSingle` |
| **FeeModule** | Pure math for performance + AUM fees and their split |
| **NavLib** | Pure fixed-point NAV/share math; mirrored by the SDK |
| **ChainlinkOracle** | Feed registry (`feedOf`) with bad-price rejection |
| **Drawdown halt** | Automatic stop: copies rejected when NAV/share is ≥ threshold below HWM (default 20%) |
| **Position limit** | Max USDG value per single position (`maxPosition`) |
| **Fill limit** | Max USDG per single copy (`maxFill`) |
| **Gross limit** | Max total exposure across positions (`maxGross`) |
| **Session sizing** | Copy-size multiplier by market session: regular 100%, pre/after-hours 30%, closed 0% |
| **Staleness** | Max age of a fill/price before rejection (default 120 s) |
| **AUM** | Assets under management; basis for the 2%/yr fee |
| **Performance fee** | 10% of profits above the high-water mark |
| **Withdrawal queue** | FIFO queue for redemptions that exceed available cash; permissionless processing |
| **Fill tape** | The keeper's record of processed fills (`keeper/data/fills.json`) |
| **Paper mode** | Keeper mode that evaluates and records without any broadcast |
| **Dry-run** | Live mode without `SEAT_SUBMIT_TX=1`: full evaluation, calldata logged, no broadcast |
| **Listing bond** | `$AXBOOK` posted to list a desk permissionlessly (default 100,000); refundable |
| **StakingPool** | Phase 2 contract distributing the staker fee slice to `$AXBOOK` stakers |
| **LpLocker** | Phase 2 contract locking the AXBOOK/USDG LP NFT for ≥ 365 days |
| **Phase 0 / 1 / 2** | Paper engine shipped / testnet cash vault live / TGE + staking code shipped, undeployed |
| **4663 / 46630** | Robinhood Chain mainnet / testnet chain IDs |
