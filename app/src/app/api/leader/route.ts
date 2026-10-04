import { CHAIN, OFFICIAL_STOCK_TOKENS } from "@seat/sdk";
import { NextResponse } from "next/server";
import { getAddresses } from "@/lib/addresses";
import {
  accountFills,
  distribution,
  readKeeper,
  type PricedFill,
  type Side,
} from "@/lib/leader-activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RPC =
  process.env.NEXT_PUBLIC_RH_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ROUND = "0xfeaf968c";
const SPAN = 100_000n;
const WINDOWS = 3n;
const ADDRESS_BATCH = 12;
const USDG = getAddresses(CHAIN.MAINNET_ID).usdg;

interface BookToken {
  readonly symbol: string;
  readonly address: string;
  readonly feed: string;
  readonly decimals: number;
}

interface RpcLog {
  address?: string;
  topics?: string[];
  data?: string;
  blockNumber?: string;
  transactionHash?: string;
  logIndex?: string;
}

const BOOK: BookToken[] = OFFICIAL_STOCK_TOKENS.filter(
  (t) =>
    t.chainId === CHAIN.MAINNET_ID &&
    t.verification === "verified" &&
    t.enabled &&
    t.address !== null &&
    t.feed !== null &&
    t.decimals !== null,
).map((t) => ({
  symbol: t.symbol,
  address: (t.address as string).toLowerCase(),
  feed: t.feed as string,
  decimals: t.decimals as number,
}));

const BY_ADDRESS = new Map(BOOK.map((t) => [t.address, t]));

interface CacheEntry {
  at: number;
  body: unknown;
}
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const CACHE_MS = 45_000;

function padTopic(address: string): string {
  return `0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

function hexToBig(hex: string | undefined): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

function topicAddress(topic: string | undefined): string {
  if (!topic) return "";
  return `0x${topic.slice(-40).toLowerCase()}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcCall(body: unknown, attempt = 0): Promise<unknown> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "seat-blotter",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 3) {
    await sleep(350 * (attempt + 1));
    return rpcCall(body, attempt + 1);
  }
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  return res.json();
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const json = (await rpcCall({ jsonrpc: "2.0", id: 1, method, params })) as {
    result?: T;
    error?: { message?: string };
  };
  if (json.error) throw new Error(json.error.message ?? "rpc error");
  return json.result as T;
}

function decodeRound(data: string): bigint | null {
  const body = data.startsWith("0x") ? data.slice(2) : data;
  if (body.length < 128) return null;
  let answer = BigInt(`0x${body.slice(64, 128)}`);
  if (answer >= 1n << 255n) answer -= 1n << 256n;
  return answer > 0n ? answer : null;
}

async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      const item = items[idx];
      if (item === undefined) return;
      out[idx] = await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const leader = (url.searchParams.get("leader") ?? "").toLowerCase();
  const deskChain = Number(url.searchParams.get("deskChain") ?? CHAIN.TESTNET_ID);
  if (!/^0x[0-9a-f]{40}$/.test(leader)) {
    return NextResponse.json({ error: "leader address required" }, { status: 400 });
  }
  if (deskChain !== CHAIN.MAINNET_ID && deskChain !== CHAIN.TESTNET_ID) {
    return NextResponse.json({ error: "unknown desk chain" }, { status: 400 });
  }

  const cacheKey = `${leader}:${deskChain}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json(hit.body);
  }

  let pending = inflight.get(cacheKey);
  if (!pending) {
    pending = build(leader, deskChain)
      .then((body) => {
        cache.set(cacheKey, { at: Date.now(), body });
        return body;
      })
      .finally(() => {
        inflight.delete(cacheKey);
      });
    inflight.set(cacheKey, pending);
  }

  try {
    return NextResponse.json(await pending);
  } catch (err) {
    if (hit) return NextResponse.json(hit.body);
    const message = err instanceof Error ? err.message : "leader tape failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function build(leader: string, deskChainId: number) {
  const headHex = await rpc<string>("eth_blockNumber", []);
  const head = hexToBig(headHex);
  const [headBlock, oldBlock, balanceHex] = await Promise.all([
    rpc<{ timestamp?: string }>("eth_getBlockByNumber", [hex(head), false]),
    rpc<{ timestamp?: string }>("eth_getBlockByNumber", [hex(head - 10_000n), false]),
    rpc<string>("eth_getBalance", [leader, "latest"]),
  ]);
  const headTs = Number(hexToBig(headBlock.timestamp));
  const oldTs = Number(hexToBig(oldBlock.timestamp));
  const secPerBlock = head > 10_000n ? (headTs - oldTs) / 10_000 : 0.1;
  const leaderTopic = padTopic(leader);

  const jobs: { from: bigint; to: bigint; side: Side; addresses: string[] }[] = [];
  for (let i = 0n; i < WINDOWS; i++) {
    const to = head - i * SPAN;
    const from = to - SPAN + 1n;
    for (let a = 0; a < BOOK.length; a += ADDRESS_BATCH) {
      const addresses = BOOK.slice(a, a + ADDRESS_BATCH).map((t) => t.address);
      jobs.push({ from, to, side: "buy", addresses });
      jobs.push({ from, to, side: "sell", addresses });
    }
  }

  const batches = await mapPool(jobs, 2, async (job) => {
    const topics =
      job.side === "sell"
        ? [TRANSFER, leaderTopic]
        : [TRANSFER, null, leaderTopic];
    const logs = await rpc<RpcLog[]>("eth_getLogs", [
      {
        fromBlock: hex(job.from),
        toBlock: hex(job.to),
        address: job.addresses,
        topics,
      },
    ]);
    return logs.map((log) => ({ log, side: job.side }));
  });

  const seen = new Set<string>();
  const rawFills: {
    id: string;
    tx: string;
    block: bigint;
    symbol: string;
    side: Side;
    raw: bigint;
    token: BookToken;
  }[] = [];
  for (const batch of batches) {
    for (const row of batch) {
      const log = row.log;
      const token = BY_ADDRESS.get((log.address ?? "").toLowerCase());
      if (!token) continue;
      const topics = log.topics ?? [];
      if ((topics[0] ?? "").toLowerCase() !== TRANSFER) continue;
      const from = topicAddress(topics[1]);
      const to = topicAddress(topics[2]);
      if (from === leader && to === leader) continue;
      if (row.side === "buy" && to !== leader) continue;
      if (row.side === "sell" && from !== leader) continue;
      const tx = (log.transactionHash ?? "0x").toLowerCase();
      const id = `${tx}-${log.logIndex ?? "0"}`;
      if (seen.has(id)) continue;
      seen.add(id);
      rawFills.push({
        id,
        tx,
        block: hexToBig(log.blockNumber),
        symbol: token.symbol,
        side: row.side,
        raw: hexToBig(log.data),
        token,
      });
    }
  }
  rawFills.sort((a, b) => (a.block < b.block ? -1 : a.block > b.block ? 1 : a.id < b.id ? -1 : 1));

  const cash = new Map<string, { out: bigint; inn: bigint }>();
  if (USDG) {
    const cashJobs: { from: bigint; to: bigint; side: Side }[] = [];
    for (let i = 0n; i < WINDOWS; i++) {
      const to = head - i * SPAN;
      const from = to - SPAN + 1n;
      cashJobs.push({ from, to, side: "buy" }, { from, to, side: "sell" });
    }
    const cashLogs = await mapPool(cashJobs, 2, async (job) => {
      const topics =
        job.side === "sell" ? [TRANSFER, leaderTopic] : [TRANSFER, null, leaderTopic];
      return rpc<RpcLog[]>("eth_getLogs", [
        {
          fromBlock: hex(job.from),
          toBlock: hex(job.to),
          address: USDG,
          topics,
        },
      ]);
    });
    for (const logs of cashLogs) {
      for (const log of logs) {
        const tx = (log.transactionHash ?? "").toLowerCase();
        if (!tx) continue;
        const from = topicAddress(log.topics?.[1]);
        const to = topicAddress(log.topics?.[2]);
        const amt = hexToBig(log.data);
        const row = cash.get(tx) ?? { out: 0n, inn: 0n };
        if (from === leader) row.out += amt;
        if (to === leader) row.inn += amt;
        cash.set(tx, row);
      }
    }
  }

  const traded = BOOK.filter((token) => rawFills.some((fill) => fill.symbol === token.symbol));
  const markPayload = await rpcCall(
    traded.map((token, i) => ({
      jsonrpc: "2.0",
      id: i,
      method: "eth_call",
      params: [{ to: token.feed, data: ROUND }, "latest"],
    })),
  );
  const markRows = (Array.isArray(markPayload) ? markPayload : []) as {
    id: number;
    result?: string;
  }[];
  const marks = new Map<string, bigint>();
  for (const row of markRows) {
    const token = traded[row.id];
    const price = decodeRound(row.result ?? "0x");
    if (token && price) marks.set(token.symbol, price);
  }

  const byTx = new Map<string, number[]>();
  rawFills.forEach((fill, index) => {
    const list = byTx.get(fill.tx) ?? [];
    list.push(index);
    byTx.set(fill.tx, list);
  });
  const notionals = new Array<bigint>(rawFills.length).fill(0n);
  for (const [tx, indexes] of byTx) {
    const pot = cash.get(tx) ?? { out: 0n, inn: 0n };
    assignCash(indexes, "buy", pot.out);
    assignCash(indexes, "sell", pot.inn);
  }

  function weightOf(index: number): bigint {
    const fill = rawFills[index];
    if (!fill || fill.raw <= 0n) return 0n;
    const price = marks.get(fill.symbol) ?? 0n;
    if (price <= 0n) return 0n;
    const scale = 10n ** (BigInt(fill.token.decimals) + 8n - 6n);
    return (fill.raw * price) / scale;
  }

  function assignCash(indexes: number[], side: Side, pot: bigint): void {
    const legs = indexes.filter((index) => rawFills[index]?.side === side);
    if (legs.length === 0 || pot <= 0n) return;
    const weights = legs.map((index) => weightOf(index));
    const sum = weights.reduce((total, weight) => total + weight, 0n);
    legs.forEach((index, i) => {
      const weight = weights[i] ?? 0n;
      notionals[index] =
        sum > 0n ? (pot * weight) / sum : legs.length === 1 ? pot : 0n;
    });
  }

  const priced: PricedFill[] = rawFills.map((fill, seq) => {
    const notionalUsdg = notionals[seq] ?? 0n;
    const price =
      fill.raw > 0n && notionalUsdg > 0n ? (notionalUsdg * 10n ** 20n) / fill.raw : 0n;
    const atMs = Math.round((headTs - Number(head - fill.block) * secPerBlock) * 1000);
    return {
      id: fill.id,
      seq,
      symbol: fill.symbol,
      side: fill.side,
      raw: fill.raw,
      notionalUsdg,
      price,
      atMs,
    };
  });

  const account = accountFills(priced, marks);
  const fromMs = priced[0]?.atMs ?? headTs * 1000;
  const toMs = priced[priced.length - 1]?.atMs ?? headTs * 1000;
  const hourStart = Math.floor(fromMs / 3_600_000) * 3_600_000;
  const hours: { tMs: number; realizedUsdg: string }[] = [];
  for (let t = hourStart; t <= toMs; t += 3_600_000) {
    let sum = 0n;
    for (const order of account.orders) {
      if (order.realizedUsdg === null) continue;
      if (Math.floor(order.atMs / 3_600_000) * 3_600_000 === t) sum += order.realizedUsdg;
    }
    hours.push({ tMs: t, realizedUsdg: sum.toString() });
  }

  const newest = [...account.orders].reverse().slice(0, 40);
  const gasWei = hexToBig(balanceHex);
  const bought = account.boughtUsdg;
  const realizedPct =
    bought > 0n ? (Number(account.realizedUsdg) / Number(bought)) * 100 : null;

  return {
    leader,
    tracked: BOOK.length,
    fromMs,
    toMs,
    trades: priced.length,
    realizedUsdg: account.realizedUsdg.toString(),
    realizedPct,
    unrealizedUsdg: account.unrealizedUsdg.toString(),
    winRate: account.closed > 0 ? account.wins / account.closed : null,
    wins: account.wins,
    closed: account.closed,
    volumeUsdg: (account.boughtUsdg + account.soldUsdg).toString(),
    boughtUsdg: account.boughtUsdg.toString(),
    soldUsdg: account.soldUsdg.toString(),
    avgRealizedUsdg:
      account.closed > 0
        ? (account.realizedUsdg / BigInt(account.closed)).toString()
        : "0",
    avgHoldMs: account.avgHoldMs,
    gasEth: Number(gasWei) / 1e18,
    distribution: distribution(account.symbols),
    hours,
    orders: newest.map((order) => {
      const keeper = readKeeper(order.notionalUsdg, order.atMs, deskChainId);
      return {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        notionalUsdg: order.notionalUsdg.toString(),
        price: order.price.toString(),
        atMs: order.atMs,
        realizedUsdg: order.realizedUsdg === null ? null : order.realizedUsdg.toString(),
        keeper: {
          action: keeper.action,
          reason: keeper.reason,
          session: keeper.session,
          copyUsdg: keeper.copyUsdg.toString(),
          openSessionUsdg: keeper.openSessionUsdg.toString(),
        },
      };
    }),
  };
}

function hex(n: bigint): string {
  return `0x${n.toString(16)}`;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
