import { story, usd } from "../../lib/story";

export type CenterKind =
  | "wall"
  | "deposit-you"
  | "deposit-sam"
  | "tape"
  | "size"
  | "clock"
  | "price-up"
  | "fee"
  | "price-down"
  | "redeem-pay"
  | "redeem-queue"
  | "finale";

export interface VaultState {
  readonly cash: number;
  readonly nvda: number;
  readonly shares: number;
  readonly you: number;
  readonly sam: number;
  readonly tone: "flat" | "up" | "down";
  readonly note?: string;
  readonly alternate?: boolean;
}

export interface AlexState {
  readonly status: string;
  readonly tone: "idle" | "trade" | "fee" | "loss" | "unchanged";
}

export interface Beat {
  readonly id: string;
  readonly stage: number;
  readonly title: string;
  readonly body: readonly string[];
  readonly alex: AlexState;
  readonly vault: VaultState;
  readonly center: CenterKind;
}

export const STAGES = [
  "Two pools",
  "Deposits",
  "What gets copied",
  "The clock",
  "Price, then fee",
  "Leaving",
] as const;

const d = story.deposits;
const u = story.up;
const dn = story.down;
const r = story.redeem;

const empty: VaultState = { cash: 0, nvda: 0, shares: 0, you: 0, sam: 0, tone: "flat" };
const funded: VaultState = { cash: d.cash, nvda: 0, shares: d.totalShares, you: d.youShares, sam: d.samShares, tone: "flat" };
const copied: VaultState = { ...funded, cash: story.copy.cashAfter, nvda: story.copy.spend, note: "NVDA at cost" };
const up: VaultState = { ...copied, nvda: u.nvda, tone: "up", note: "before performance fee" };
const fee: VaultState = { ...up, cash: u.cashAfterFee, note: "after performance fee" };
const down: VaultState = { ...copied, nvda: dn.nvda, tone: "down", note: "market moved against the desk" };
const redeemed: VaultState = {
  cash: r.after.cash,
  nvda: r.after.nvda,
  shares: r.after.shares,
  you: r.after.youShares,
  sam: r.after.samShares,
  tone: "up",
  note: "after your redemption",
};

export const beats: readonly Beat[] = [
  {
    id: "pools",
    stage: 0,
    title: "Two piles. Never one.",
    body: [
      "Alex trades NVDA, AAPL and SPY from his own wallet. His private key stays with Alex.",
      "The desk vault is a separate contract. It starts empty. You never receive Alex's key, and Alex can't withdraw from the vault.",
    ],
    alex: { status: "Trading his own money", tone: "idle" },
    vault: empty,
    center: "wall",
  },
  {
    id: "deposit-you",
    stage: 1,
    title: `You deposit ${usd(d.you)} USDG.`,
    body: [
      `The vault mints ${usd(d.youShares)} book shares to you at 1.00 USDG per share.`,
      "Your USDG now sits in the desk — not in Alex's wallet.",
    ],
    alex: { status: "Not involved", tone: "idle" },
    vault: { ...empty, cash: d.you, shares: d.youShares, you: d.youShares },
    center: "deposit-you",
  },
  {
    id: "deposit-sam",
    stage: 1,
    title: `Sam deposits ${usd(d.sam)} USDG.`,
    body: [
      `Sam receives ${usd(d.samShares)} shares at the same 1.00 NAV/share.`,
      `${usd(d.cash)} USDG cash. ${usd(d.totalShares)} shares. Each of you owns ${d.youPct}%.`,
    ],
    alex: { status: "Not involved", tone: "idle" },
    vault: funded,
    center: "deposit-sam",
  },
  {
    id: "tape",
    stage: 2,
    title: "Alex trades. The desk decides.",
    body: [
      "The keeper watches Alex's fills. Each one is a signal — information, not money.",
      "Rules decide what reaches the vault. Two of these three signals stop at a gate.",
    ],
    alex: { status: "3 trades on his tape", tone: "trade" },
    vault: funded,
    center: "tape",
  },
  {
    id: "size",
    stage: 2,
    title: "The copy is smaller by design.",
    body: [
      "Alex's NVDA buy is large. The desk copies a fraction of it, capped per fill and per position.",
      `The vault spends ${usd(story.copy.spend)} of its own USDG over several capped fills. ${usd(story.copy.cashAfter)} stays in cash.`,
      "Buying NVDA doesn't change NAV — it changes what NAV is made of.",
    ],
    alex: { status: "BUY NVDA · large", tone: "trade" },
    vault: copied,
    center: "size",
  },
  {
    id: "clock",
    stage: 3,
    title: "Same signal. Different hour. Different size.",
    body: [
      "Copy size depends on the US market session. After-hours size is always smaller than cash-session size.",
      "When the session or the price can't be determined, the desk doesn't trade.",
    ],
    alex: { status: "Trades whenever he likes", tone: "idle" },
    vault: copied,
    center: "clock",
  },
  {
    id: "price-up",
    stage: 4,
    title: "NVDA rises. NAV follows.",
    body: [
      `The vault spent ${usd(story.copy.spend)} USDG. The copied NVDA position later rose to ${usd(u.nvda)} USDG.`,
      `${usd(u.cash)} cash + ${usd(u.nvda)} NVDA = ${usd(u.nav)} NAV. Over ${usd(d.totalShares)} shares: 1.10 NAV/share — before the performance fee.`,
      "The gain came from the asset appreciating. The copy mechanism didn't create it.",
    ],
    alex: { status: "His own position, his own result", tone: "idle" },
    vault: up,
    center: "price-up",
  },
  {
    id: "fee",
    stage: 4,
    title: "The fee comes from the profit.",
    body: [
      `The desk is ${usd(u.gain)} USDG above its high-water mark. The performance fee is 10% of that: ${usd(u.perfFee)} USDG.`,
      `70% to Alex (${usd(u.split.alex)}), 20% to the protocol (${usd(u.split.protocol)}), 10% to stakers (${usd(u.split.stakers)}). A small annual AUM fee also accrues — left out here to keep the math readable.`,
      `After the fee: ${usd(u.navAfterFee)} NAV, ${u.navPerShareAfterFee.toFixed(2)} NAV/share. The rise is real. The fee comes from the profit.`,
    ],
    alex: { status: `Receives ${usd(u.split.alex)} USDG fee — from profit only`, tone: "fee" },
    vault: fee,
    center: "fee",
  },
  {
    id: "price-down",
    stage: 4,
    title: "Or NVDA falls.",
    body: [
      `Same copy, other direction: the ${usd(story.copy.spend)} USDG position is now worth ${usd(dn.nvda)}.`,
      `${usd(dn.cash)} cash + ${usd(dn.nvda)} NVDA = ${usd(dn.nav)} NAV. NAV/share falls from 1.00 to ${dn.navPerShare.toFixed(2)}. No performance fee — the desk is below its high-water mark.`,
      "Separation is about custody, not protection from losses.",
    ],
    alex: { status: "His own trade lost too — in his wallet", tone: "loss" },
    vault: down,
    center: "price-down",
  },
  {
    id: "redeem-pay",
    stage: 5,
    title: `You redeem ${usd(r.shares)} shares.`,
    body: [
      `At 1.10 NAV/share (before fee), ${usd(r.shares)} shares claim ${usd(r.claimPreFee)} USDG. After the example fee, at 1.09, the claim is ${usd(r.claimAfterFee)} USDG.`,
      `The desk holds ${usd(r.cashAvailable)} USDG in cash, so the redemption is paid now.`,
      "Alex's wallet doesn't move. Your exit is settled by the vault, from the vault.",
    ],
    alex: { status: "UNCHANGED", tone: "unchanged" },
    vault: redeemed,
    center: "redeem-pay",
  },
  {
    id: "redeem-queue",
    stage: 5,
    title: "If the cash is deployed, you queue.",
    body: [
      `Suppose more of the desk were in tokens and only ${usd(r.queueScenarioCash)} USDG sat in cash.`,
      `Your ${usd(r.claimAfterFee)} USDG claim is fixed at redemption and enters the withdrawal queue. It's paid in order as cash becomes available.`,
      "Liquidity is not guaranteed. The queue is how the desk is honest about it.",
    ],
    alex: { status: "UNCHANGED", tone: "unchanged" },
    vault: { ...fee, cash: r.queueScenarioCash, alternate: true, note: "alternate moment · cash mostly deployed" },
    center: "redeem-queue",
  },
  {
    id: "finale",
    stage: 5,
    title: "Notice what never moved.",
    body: [
      "Deposits, copies, gains, losses, fees, redemptions — all of it happened inside the desk.",
      "Alex's wallet was an input. Never a destination.",
    ],
    alex: { status: "UNCHANGED", tone: "unchanged" },
    vault: redeemed,
    center: "finale",
  },
];

export const navOf = (v: VaultState): number => v.cash + v.nvda;
export const npsOf = (v: VaultState): number => (v.shares === 0 ? 0 : navOf(v) / v.shares);
