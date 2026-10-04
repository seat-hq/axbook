/**
 * Fail-closed guards for LiveExecutor / PaperExecutor mode split.
 */
import assert from "node:assert/strict";
import { isTradeEligible } from "@seat/sdk";
import { LiveExecutor, PaperExecutor } from "./executor.js";
import { LiveFillSource } from "./indexer.js";
import { buildStaticMarket } from "./market.js";
import { parseDeskList } from "./vault.js";

const market = buildStaticMarket({}, 25);

assert.equal(false, isTradeEligible("NVDA", 46630));
assert.equal(true, isTradeEligible("NVDA", 4663));
assert.equal(true, isTradeEligible("AAPL", 4663));
assert.equal(true, isTradeEligible("SPY", 4663));
assert.equal(true, isTradeEligible("TSLA", 4663));
assert.equal(false, isTradeEligible("TSLA", 46630));

assert.doesNotThrow(
  () =>
    new LiveExecutor(
      { chainId: 4663, routerConfigured: true },
      { CHAIN_ID: "4663" },
    ),
);

assert.throws(
  () =>
    new LiveExecutor(
      { chainId: 46630, routerConfigured: false },
      { CHAIN_ID: "46630" },
    ),
  /router/,
);

assert.throws(
  () =>
    new LiveExecutor(
      { chainId: 1, routerConfigured: true },
      { CHAIN_ID: "1" },
    ),
  /4663|46630|Robinhood/,
);

assert.throws(
  () => new PaperExecutor(market, { EXECUTION_MODE: "LIVE" }),
  /LiveExecutor/,
);

const liveTestnet = new LiveExecutor(
  { chainId: 46630, routerConfigured: true },
  { CHAIN_ID: "46630" },
);
assert.throws(
  () =>
    liveTestnet.execute(
      {
        fillId: "x",
        leader: "0x1",
        symbol: "NVDA",
        side: "buy",
        leaderNotionalUsdg: 1n,
        price: 1n,
        priceDecimals: 8,
        timestampMs: 0,
      },
      { action: "accept", sizeUsdg: 1n, intendedUsdg: 1n, reason: "ok" },
      {
        cashUsdg: 1n,
        positionsUi: {},
        shares: 1n,
        highWaterNavPerShare: 0n,
        halted: false,
      },
    ),
  /unverified registry/,
);

const liveMainnet = new LiveExecutor(
  { chainId: 4663, routerConfigured: true },
  { CHAIN_ID: "4663" },
);
assert.throws(
  () =>
    liveMainnet.execute(
      {
        fillId: "x",
        leader: "0x1",
        symbol: "NVDA",
        side: "buy",
        leaderNotionalUsdg: 1n,
        price: 1n,
        priceDecimals: 8,
        timestampMs: 0,
      },
      { action: "accept", sizeUsdg: 1n, intendedUsdg: 1n, reason: "ok" },
      {
        cashUsdg: 1n,
        positionsUi: {},
        shares: 1n,
        highWaterNavPerShare: 0n,
        halted: false,
      },
    ),
  /submitCopy/,
);

const src = new LiveFillSource({ rpcUrl: "", leader: "0x" });
const leader = "0x5b78b7f961af6825f70d33f4142102bbf4adc704";
const tsla = "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E";
const decoded = src.decode(
  [
    {
      address: tsla,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        `0x000000000000000000000000${"11".repeat(20)}`,
        `0x000000000000000000000000${leader.slice(2)}`,
      ],
      data: `0x${(10n ** 18n).toString(16).padStart(64, "0")}`,
      transactionHash: "0xabc",
      logIndex: "0x1",
    },
  ],
  leader,
);
assert.equal(decoded.length, 1);
assert.equal(decoded[0]?.symbol, "TSLA");
assert.equal(decoded[0]?.side, "buy");
assert.equal(decoded[0]?.notionalUsdg, 0n);

const mainnetTsla = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const priced = src.decode(
  [
    {
      address: mainnetTsla,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        `0x000000000000000000000000${"11".repeat(20)}`,
        `0x000000000000000000000000${leader.slice(2)}`,
      ],
      data: `0x${(10n ** 18n).toString(16).padStart(64, "0")}`,
      transactionHash: "0xdef",
      logIndex: "0x2",
      blockNumber: "0x10",
    },
  ],
  leader,
  new Map([[mainnetTsla.toLowerCase(), 100_00000000n]]),
  new Map([["0x10", 1_700_000_000_000]]),
);
assert.equal(priced[0]?.symbol, "TSLA");
assert.equal(priced[0]?.notionalUsdg, 100_000000n);
assert.equal(priced[0]?.timestampMs, 1_700_000_000_000);

assert.deepEqual(parseDeskList({ DESK_ADDRESS: "0x8ff6ef04312679a0112b5229c6911cbc026e73ff" }), [
  "0x8ff6ef04312679a0112b5229c6911cbc026e73ff",
]);
assert.deepEqual(
  parseDeskList({
    DESK_ADDRESSES:
      "0x1111111111111111111111111111111111111111, 0x2222222222222222222222222222222222222222",
  }),
  [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
  ],
);
assert.deepEqual(parseDeskList({}), []);

console.log("live-guards ok");
