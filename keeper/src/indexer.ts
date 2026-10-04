/**
 * Indexer: sources leader fills for the signaler.
 *
 * StaticFillSource is deterministic paper/fixture.
 * LiveFillSource reads ERC-20 Transfer logs for registry addresses only.
 * It never invents fills: empty tape if RPC/logs cannot be decoded.
 */
import {
  CHAIN,
  getOfficialStockToken,
  getOfficialStockTokenByAddress,
  listedTokenAddresses,
} from "@seat/sdk";
import type { LeaderFill } from "./signaler.js";

export interface FillSource {
  fetchFills(): Promise<readonly LeaderFill[]> | readonly LeaderFill[];
}

export class StaticFillSource implements FillSource {
  private readonly fills: readonly LeaderFill[];

  constructor(fills: readonly LeaderFill[]) {
    this.fills = [...fills].sort((a, b) => a.timestampMs - b.timestampMs);
  }

  fetchFills(): readonly LeaderFill[] {
    return this.fills;
  }
}

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function topicAddr(topic: string): string {
  return `0x${topic.slice(-40).toLowerCase()}`;
}

function hexToBigInt(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

export interface LiveFillSourceOpts {
  readonly rpcUrl: string;
  readonly leader: string;
  readonly chainId?: number;
  readonly fromBlock?: bigint;
  readonly toBlock?: bigint | "latest";
}

interface RpcLog {
  readonly address?: string;
  readonly topics?: string[];
  readonly data?: string;
  readonly transactionHash?: string;
  readonly logIndex?: string;
  readonly blockNumber?: string;
}

/**
 * On-chain tape. Labels must be `source=chain` at the recorder.
 * Returns [] if RPC fails or logs cannot be decoded — does not invent history.
 */
export class LiveFillSource implements FillSource {
  constructor(private readonly opts: LiveFillSourceOpts) {}

  async fetchFills(): Promise<readonly LeaderFill[]> {
    const rpc = this.opts.rpcUrl.trim();
    const leader = this.opts.leader.trim().toLowerCase();
    if (!rpc || !/^0x[0-9a-f]{40}$/.test(leader)) {
      // eslint-disable-next-line no-console
      console.warn("[indexer] LiveFillSource: missing rpc/leader; empty tape");
      return [];
    }
    const chainId = this.opts.chainId ?? CHAIN.TESTNET_ID;
    const tokens = listedTokenAddresses(chainId);
    if (tokens.length === 0) {
      // eslint-disable-next-line no-console
      console.warn("[indexer] LiveFillSource: no cited token addresses; empty tape");
      return [];
    }

    let toBlock = this.opts.toBlock ?? "latest";
    let fromBlock = this.opts.fromBlock;
    try {
      if (fromBlock === undefined) {
        const head = await this.rpc<string>("eth_blockNumber", []);
        const n = BigInt(head);
        const lookback = 2_000n;
        fromBlock = n > lookback ? n - lookback : 0n;
      }
      const toHex = toBlock === "latest" ? "latest" : `0x${toBlock.toString(16)}`;
      const fromHex = `0x${fromBlock.toString(16)}`;
      const logs: RpcLog[] = [];
      for (let i = 0; i < tokens.length; i += 15) {
        const batch = await this.rpc<RpcLog[]>("eth_getLogs", [
          {
            fromBlock: fromHex,
            toBlock: toHex,
            address: tokens.slice(i, i + 15),
            topics: [TRANSFER_TOPIC],
          },
        ]);
        logs.push(...batch);
      }
      const prices = await this.pricesFor(logs, chainId);
      const times = await this.blockTimes(logs);
      return this.decode(logs, leader, prices, times);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[indexer] LiveFillSource: decode/rpc failed; empty tape:",
        err instanceof Error ? err.message : err,
      );
      return [];
    }
  }

  decode(
    logs: readonly RpcLog[],
    leader: string,
    prices: ReadonlyMap<string, bigint> = new Map(),
    times: ReadonlyMap<string, number> = new Map(),
  ): LeaderFill[] {
    const want = leader.toLowerCase();
    const out: LeaderFill[] = [];
    for (const log of logs) {
      const tokenAddr = (log.address ?? "").toLowerCase();
      const entry = getOfficialStockTokenByAddress(tokenAddr);
      if (!entry || !entry.address) continue;
      const topics = log.topics ?? [];
      if (topics[0]?.toLowerCase() !== TRANSFER_TOPIC) continue;
      if (topics.length < 3) continue;
      const from = topicAddr(topics[1] ?? "0x");
      const to = topicAddr(topics[2] ?? "0x");
      let side: "buy" | "sell";
      if (to === want && from !== want) side = "buy";
      else if (from === want && to !== want) side = "sell";
      else continue;
      const raw = hexToBigInt(log.data ?? "0x");
      const price = prices.get(tokenAddr) ?? 0n;
      const dec = BigInt(entry.decimals ?? 18);
      // USDG has 6 decimals. Feed prices are 8 decimals per whole token.
      const notionalUsdg =
        price > 0n ? (raw * price) / 10n ** (dec + 8n - 6n) : 0n;
      const block = (log.blockNumber ?? "").toLowerCase();
      const id = `${log.transactionHash ?? "0x"}-${log.logIndex ?? "0"}`;
      out.push({
        id,
        leader: want,
        symbol: entry.symbol,
        side,
        notionalUsdg,
        price,
        priceDecimals: 8,
        timestampMs: times.get(block) ?? 0,
      });
    }
    return out;
  }

  private async pricesFor(
    logs: readonly RpcLog[],
    chainId: number,
  ): Promise<Map<string, bigint>> {
    const out = new Map<string, bigint>();
    const seen = new Set<string>();
    for (const log of logs) {
      const tokenAddr = (log.address ?? "").toLowerCase();
      if (!tokenAddr || seen.has(tokenAddr)) continue;
      seen.add(tokenAddr);
      const entry = getOfficialStockTokenByAddress(tokenAddr);
      if (!entry?.feed || entry.chainId !== chainId) continue;
      const priced = getOfficialStockToken(entry.symbol, chainId);
      if (!priced?.feed) continue;
      try {
        const data = await this.rpc<string>("eth_call", [
          { to: priced.feed, data: "0xfeaf968c" },
          "latest",
        ]);
        const body = data.startsWith("0x") ? data.slice(2) : data;
        if (body.length < 256) continue;
        let answer = BigInt(`0x${body.slice(64, 128)}`);
        if (answer >= 1n << 255n) answer -= 1n << 256n;
        const updatedAt = BigInt(`0x${body.slice(192, 256)}`);
        const age = BigInt(Math.floor(Date.now() / 1000)) - updatedAt;
        // Equity feeds heartbeat once a day and only move during the session.
        if (answer <= 0n || updatedAt <= 0n || age > 86_400n) continue;
        out.set(tokenAddr, answer);
      } catch {
        // No cited price for this log. The fill stays zero-notional.
      }
    }
    return out;
  }

  private async blockTimes(logs: readonly RpcLog[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    for (const log of logs) {
      const block = (log.blockNumber ?? "").toLowerCase();
      if (!block || out.has(block)) continue;
      try {
        const header = await this.rpc<{ timestamp?: string }>("eth_getBlockByNumber", [
          block,
          false,
        ]);
        const ts = hexToBigInt(header.timestamp ?? "0x");
        if (ts > 0n) out.set(block, Number(ts) * 1000);
      } catch {
        out.set(block, 0);
      }
    }
    return out;
  }

  private async rpc<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetch(this.opts.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`rpc HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { message?: string } };
    if (json.error?.message) throw new Error(json.error.message);
    if (json.result === undefined) throw new Error("rpc empty result");
    return json.result;
  }
}
