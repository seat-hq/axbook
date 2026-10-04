import assert from "node:assert/strict";
import {
  accountFills,
  distribution,
  readKeeper,
  sessionAt,
  type PricedFill,
} from "./leader-activity";

const token = 10n ** 18n;
const px = (dollars: number) => BigInt(Math.round(dollars * 1e8));
const usd = (dollars: number) => BigInt(Math.round(dollars * 1e6));

function fill(
  seq: number,
  side: "buy" | "sell",
  dollars: number,
  atMs: number,
): PricedFill {
  return {
    id: `f${seq}`,
    seq,
    symbol: "NVDA",
    side,
    raw: token,
    notionalUsdg: usd(dollars),
    price: px(dollars),
    atMs,
  };
}

const saturday = Date.parse("2026-10-03T20:00:00Z");
const monday = Date.parse("2026-10-05T14:30:00Z");
assert.equal(sessionAt(saturday).session, "closed");
assert.equal(sessionAt(monday).session, "regular");

const closed = readKeeper(usd(10_000), saturday, 46630);
assert.equal(closed.action, "skip");
assert.equal(closed.reason, "Cash session is closed");
assert.equal(closed.openSessionUsdg, usd(500));

const watched = readKeeper(usd(10_000), monday, 46630);
assert.equal(watched.action, "skip");
assert.equal(watched.reason, "Desk cannot settle this token");

const live = readKeeper(usd(10_000), monday, 4663);
assert.equal(live.action, "accept");
assert.equal(live.copyUsdg, usd(500));

const capped = readKeeper(usd(80_000), monday, 4663);
assert.equal(capped.action, "resize");
assert.equal(capped.copyUsdg, usd(2_000));

const book = accountFills(
  [fill(0, "buy", 100, 1_000), fill(1, "sell", 110, 61_000)],
  new Map([["NVDA", px(110)]]),
);
assert.equal(book.realizedUsdg, usd(10));
assert.equal(book.wins, 1);
assert.equal(book.closed, 1);
assert.equal(book.unrealizedUsdg, 0n);
assert.equal(book.orders[1]?.realizedUsdg, usd(10));

const open = accountFills([fill(0, "buy", 100, 1_000)], new Map([["NVDA", px(90)]]));
assert.equal(open.unrealizedUsdg, usd(-10));
assert.equal(open.closed, 0);

const unpriced = accountFills(
  [
    {
      id: "z",
      seq: 0,
      symbol: "NVDA",
      side: "buy",
      raw: token,
      notionalUsdg: 0n,
      price: 0n,
      atMs: 1_000,
    },
  ],
  new Map([["NVDA", px(200)]]),
);
assert.equal(unpriced.unrealizedUsdg, 0n);
assert.equal(unpriced.boughtUsdg, 0n);

const unmatched = accountFills(
  [fill(0, "sell", 50, 1_000)],
  new Map([["NVDA", px(50)]]),
);
assert.equal(unmatched.realizedUsdg, 0n);
assert.equal(unmatched.closed, 0);
assert.equal(unmatched.orders[0]?.realizedUsdg, null);

const bands = distribution([
  { symbol: "NVDA", costUsdg: usd(100), pnlUsdg: usd(8) },
  { symbol: "AAPL", costUsdg: usd(100), pnlUsdg: usd(-2) },
]);
assert.equal(bands[0]?.count, 1);
assert.equal(bands[2]?.count, 1);

console.log("leader-activity ok");
