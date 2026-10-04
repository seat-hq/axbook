/**
 * Leader stock-token accounting and the keeper's read on each fill.
 * Prices and transfers are supplied by the caller. This module does not
 * invent a mark, a feed, or a trade.
 */

export type Side = "buy" | "sell";
export type SessionName = "closed" | "pre_market" | "regular" | "after_hours";
export type KeeperAction = "accept" | "resize" | "skip";

export interface PricedFill {
  readonly id: string;
  readonly seq: number;
  readonly symbol: string;
  readonly side: Side;
  readonly raw: bigint;
  readonly notionalUsdg: bigint;
  readonly price: bigint;
  readonly atMs: number;
}

export interface AccountedOrder {
  readonly id: string;
  readonly symbol: string;
  readonly side: Side;
  readonly notionalUsdg: bigint;
  readonly price: bigint;
  readonly atMs: number;
  /** Set on a sell that matched in-window inventory. */
  readonly realizedUsdg: bigint | null;
}

export interface SymbolScore {
  readonly symbol: string;
  readonly costUsdg: bigint;
  readonly pnlUsdg: bigint;
}

export interface AccountResult {
  readonly orders: AccountedOrder[];
  readonly realizedUsdg: bigint;
  readonly unrealizedUsdg: bigint;
  readonly boughtUsdg: bigint;
  readonly soldUsdg: bigint;
  readonly wins: number;
  readonly closed: number;
  readonly avgHoldMs: number | null;
  readonly symbols: SymbolScore[];
}

interface Lot {
  raw: bigint;
  cost: bigint;
  atMs: number;
}

const COPY_BPS = 500n;
const BPS = 10_000n;
const MAX_FILL_USDG = 2_000_000_000n;

/** US equities session, matching the keeper clock. Weekends are closed. */
export function sessionAt(atMs: number): {
  session: SessionName;
  tradable: boolean;
  sizeMultiplierBps: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(atMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekday[get("weekday")];
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  const minute = Number(get("minute"));
  if (day === undefined || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return { session: "closed", tradable: false, sizeMultiplierBps: 0 };
  }
  if (day === 0 || day === 6) {
    return { session: "closed", tradable: false, sizeMultiplierBps: 0 };
  }
  const mins = hour * 60 + minute;
  let session: SessionName = "closed";
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) session = "regular";
  else if (mins >= 4 * 60 && mins < 9 * 60 + 30) session = "pre_market";
  else if (mins >= 16 * 60 && mins < 20 * 60) session = "after_hours";
  const sizeMultiplierBps =
    session === "regular" ? 10_000 : session === "closed" ? 0 : 3_000;
  return {
    session,
    tradable: session !== "closed",
    sizeMultiplierBps,
  };
}

/** 5% of the leader, then the session multiplier, then the 2,000 USDG cap. */
export function sizedCopyUsdg(
  notionalUsdg: bigint,
  multiplierBps: number,
): { size: bigint; capped: boolean } {
  if (notionalUsdg <= 0n || multiplierBps <= 0) return { size: 0n, capped: false };
  const base = (notionalUsdg * COPY_BPS) / BPS;
  const raw = (base * BigInt(multiplierBps)) / BPS;
  if (raw > MAX_FILL_USDG) return { size: MAX_FILL_USDG, capped: true };
  return { size: raw, capped: false };
}

export interface KeeperRead {
  readonly action: KeeperAction;
  readonly reason: string;
  readonly session: SessionName;
  readonly copyUsdg: bigint;
  /** 5% capped at 2,000 USDG, as if the cash session were open. */
  readonly openSessionUsdg: bigint;
}

/**
 * The same gates the keeper applies, in the same order: session, then whether
 * this desk chain can settle a 4663 stock token.
 */
export function readKeeper(
  notionalUsdg: bigint,
  atMs: number,
  deskChainId: number,
): KeeperRead {
  const clock = sessionAt(atMs);
  const open = sizedCopyUsdg(notionalUsdg, 10_000);
  if (notionalUsdg <= 0n) {
    return {
      action: "skip",
      reason: "No cited price",
      session: clock.session,
      copyUsdg: 0n,
      openSessionUsdg: 0n,
    };
  }
  if (!clock.tradable) {
    return {
      action: "skip",
      reason: "Cash session is closed",
      session: clock.session,
      copyUsdg: 0n,
      openSessionUsdg: open.size,
    };
  }
  const sized = sizedCopyUsdg(notionalUsdg, clock.sizeMultiplierBps);
  if (deskChainId !== 4663) {
    return {
      action: "skip",
      reason: "Desk cannot settle this token",
      session: clock.session,
      copyUsdg: 0n,
      openSessionUsdg: open.size,
    };
  }
  if (clock.session !== "regular") {
    return {
      action: sized.capped ? "resize" : "accept",
      reason: sized.capped
        ? "Capped at 2,000 USDG"
        : "After-hours copy is 30% of the regular size",
      session: clock.session,
      copyUsdg: sized.size,
      openSessionUsdg: open.size,
    };
  }
  return {
    action: sized.capped ? "resize" : "accept",
    reason: sized.capped ? "Capped at 2,000 USDG" : "Copy 5% of the leader",
    session: clock.session,
    copyUsdg: sized.size,
    openSessionUsdg: open.size,
  };
}

function markValue(raw: bigint, price: bigint): bigint {
  if (raw <= 0n || price <= 0n) return 0n;
  return (raw * price) / 10n ** 20n;
}

/**
 * FIFO match inside the supplied window. Sells with no in-window buy are
 * left unmarked so earlier inventory is not treated as free profit.
 */
export function accountFills(
  fills: readonly PricedFill[],
  marks: ReadonlyMap<string, bigint>,
): AccountResult {
  const ordered = [...fills].sort((a, b) => a.seq - b.seq);
  const lots = new Map<string, Lot[]>();
  const orders: AccountedOrder[] = [];
  let realizedUsdg = 0n;
  let boughtUsdg = 0n;
  let soldUsdg = 0n;
  let wins = 0;
  let closed = 0;
  let holdWeighted = 0;
  let holdWeight = 0n;
  const costBySymbol = new Map<string, bigint>();
  const pnlBySymbol = new Map<string, bigint>();

  for (const fill of ordered) {
    if (fill.notionalUsdg <= 0n || fill.raw <= 0n) {
      orders.push({
        id: fill.id,
        symbol: fill.symbol,
        side: fill.side,
        notionalUsdg: fill.notionalUsdg,
        price: fill.price,
        atMs: fill.atMs,
        realizedUsdg: null,
      });
      continue;
    }
    if (fill.side === "buy") {
      boughtUsdg += fill.notionalUsdg;
      const book = lots.get(fill.symbol) ?? [];
      book.push({ raw: fill.raw, cost: fill.notionalUsdg, atMs: fill.atMs });
      lots.set(fill.symbol, book);
      costBySymbol.set(fill.symbol, (costBySymbol.get(fill.symbol) ?? 0n) + fill.notionalUsdg);
      orders.push({
        id: fill.id,
        symbol: fill.symbol,
        side: fill.side,
        notionalUsdg: fill.notionalUsdg,
        price: fill.price,
        atMs: fill.atMs,
        realizedUsdg: null,
      });
      continue;
    }

    soldUsdg += fill.notionalUsdg;
    const book = lots.get(fill.symbol) ?? [];
    let left = fill.raw;
    let matchedCost = 0n;
    let matchedRaw = 0n;
    while (left > 0n && book.length > 0) {
      const lot = book[0];
      if (!lot || lot.raw <= 0n) {
        book.shift();
        continue;
      }
      const take = left < lot.raw ? left : lot.raw;
      const cost = lot.raw === 0n ? 0n : (lot.cost * take) / lot.raw;
      matchedCost += cost;
      matchedRaw += take;
      const hold = Math.max(0, fill.atMs - lot.atMs);
      const weight = cost / 1_000_000n > 0n ? cost / 1_000_000n : 1n;
      holdWeighted += hold * Number(weight);
      holdWeight += weight;
      lot.raw -= take;
      lot.cost -= cost;
      left -= take;
      if (lot.raw <= 0n) book.shift();
    }
    lots.set(fill.symbol, book);
    let realized: bigint | null = null;
    if (matchedRaw > 0n && fill.raw > 0n) {
      const proceeds = (fill.notionalUsdg * matchedRaw) / fill.raw;
      realized = proceeds - matchedCost;
      realizedUsdg += realized;
      pnlBySymbol.set(fill.symbol, (pnlBySymbol.get(fill.symbol) ?? 0n) + realized);
      closed += 1;
      if (realized > 0n) wins += 1;
    }
    orders.push({
      id: fill.id,
      symbol: fill.symbol,
      side: fill.side,
      notionalUsdg: fill.notionalUsdg,
      price: fill.price,
      atMs: fill.atMs,
      realizedUsdg: realized,
    });
  }

  let unrealizedUsdg = 0n;
  for (const [symbol, book] of lots) {
    const price = marks.get(symbol) ?? 0n;
    for (const lot of book) {
      if (lot.raw <= 0n) continue;
      const marked = markValue(lot.raw, price);
      const delta = marked - lot.cost;
      unrealizedUsdg += delta;
      pnlBySymbol.set(symbol, (pnlBySymbol.get(symbol) ?? 0n) + delta);
    }
  }

  const symbols: SymbolScore[] = [];
  for (const [symbol, costUsdg] of costBySymbol) {
    if (costUsdg <= 0n) continue;
    symbols.push({
      symbol,
      costUsdg,
      pnlUsdg: pnlBySymbol.get(symbol) ?? 0n,
    });
  }

  const avgHoldMs =
    holdWeight > 0n ? Math.round(holdWeighted / Number(holdWeight)) : null;

  return {
    orders,
    realizedUsdg,
    unrealizedUsdg,
    boughtUsdg,
    soldUsdg,
    wins,
    closed,
    avgHoldMs,
    symbols,
  };
}

export interface DistBand {
  readonly label: string;
  readonly count: number;
  readonly pct: number;
}

export function distribution(symbols: readonly SymbolScore[]): DistBand[] {
  const bands = [
    { label: "> 5%", test: (n: number) => n > 5 },
    { label: "0% – 5%", test: (n: number) => n >= 0 && n <= 5 },
    { label: "−5% – 0%", test: (n: number) => n < 0 && n >= -5 },
    { label: "< −5%", test: (n: number) => n < -5 },
  ];
  const counts = bands.map(() => 0);
  let total = 0;
  for (const row of symbols) {
    if (row.costUsdg <= 0n) continue;
    const pct = (Number(row.pnlUsdg) / Number(row.costUsdg)) * 100;
    const idx = bands.findIndex((b) => b.test(pct));
    if (idx >= 0) {
      counts[idx] = (counts[idx] ?? 0) + 1;
      total += 1;
    }
  }
  return bands.map((b, i) => {
    const count = counts[i] ?? 0;
    return {
      label: b.label,
      count,
      pct: total === 0 ? 0 : (count / total) * 100,
    };
  });
}

export function formatDeskUsd(amount: bigint, signed = false): string {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const dollars = Number(abs) / 1_000_000;
  const body =
    dollars >= 1_000_000
      ? `$${(dollars / 1_000_000).toFixed(2)}M`
      : dollars >= 10_000
        ? `$${(dollars / 1_000).toFixed(1)}K`
        : dollars >= 1_000
          ? `$${Math.round(dollars).toLocaleString("en-US")}`
          : `$${dollars.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
  if (!signed) return neg ? `−${body}` : body;
  if (neg) return `−${body}`;
  if (amount > 0n) return `+${body}`;
  return body;
}

export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function formatHold(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  const mins = Math.round(ms / 60_000);
  if (mins < 90) return `${mins}m`;
  const hours = mins / 60;
  if (hours < 36) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function windowLabel(fromMs: number, toMs: number): string {
  const hours = (toMs - fromMs) / 3_600_000;
  if (!Number.isFinite(hours) || hours <= 0) return "window";
  if (hours < 1.5) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 36) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
