"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";
import { formatDeskUsd, formatHold, formatPct, windowLabel } from "@/lib/leader-activity";

const BOOK = listSymbols().filter((symbol) => isTradeEligible(symbol, CHAIN.MAINNET_ID));

interface DeckOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  notionalUsdg: string;
  price: string;
  atMs: number;
  realizedUsdg: string | null;
}

interface DeckTape {
  fromMs: number;
  toMs: number;
  trades: number;
  realizedUsdg: string;
  realizedPct: number | null;
  unrealizedUsdg: string;
  winRate: number | null;
  wins: number;
  closed: number;
  volumeUsdg: string;
  boughtUsdg: string;
  soldUsdg: string;
  avgHoldMs: number | null;
  gasEth: number;
  hours: { tMs: number; realizedUsdg: string }[];
  orders: DeckOrder[];
}

export function LiveDeck({
  tape,
  leader,
  error,
  loading,
  copiedCount,
}: {
  tape: DeckTape | null;
  leader: string | null;
  error: string | null;
  loading: boolean;
  copiedCount: number;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const realized = tape ? BigInt(tape.realizedUsdg) : 0n;
  const unrealized = tape ? BigInt(tape.unrealizedUsdg) : 0n;
  const marked = realized + unrealized;
  const span = tape ? windowLabel(tape.fromMs, tape.toMs) : "—";
  const buys = tape?.orders.filter((o) => o.side === "buy").length ?? 0;
  const sells = tape?.orders.filter((o) => o.side === "sell").length ?? 0;
  const tradeCount = tape?.trades ?? 0;

  const cumulative = useMemo(() => {
    let run = 0;
    return (tape?.hours ?? []).map((hour) => {
      run += Number(hour.realizedUsdg) / 1_000_000;
      return { t: hour.tMs, v: run };
    });
  }, [tape]);

  const flow = useMemo(() => linePath(cumulative.map((p) => p.v), 320, 120), [cumulative]);
  const volumeLine = useMemo(() => {
    const buckets = hourlyVolume(tape?.orders ?? [], tape?.fromMs ?? 0);
    let run = 0;
    const series = buckets.map((n) => {
      run += n;
      return run;
    });
    return linePath(series, 320, 92);
  }, [tape]);

  const meters = [
    { label: "Win rate", value: tape?.winRate ?? 0, text: tape?.winRate == null ? "—" : formatPct(tape.winRate * 100, 1).replace("+", "") },
    { label: "Buy share", value: tradeCount ? buys / Math.max(tape?.orders.length ?? 1, 1) : 0, text: tradeCount ? `${buys}` : "—" },
    { label: "Return", value: clamp((tape?.realizedPct ?? 0) / 5), text: tape?.realizedPct == null ? "—" : formatPct(tape.realizedPct) },
    { label: "Activity", value: clamp(tradeCount / 400), text: tradeCount ? String(tradeCount) : "—" },
    { label: "Hold", value: clamp((tape?.avgHoldMs ?? 0) / (6 * 3_600_000)), text: formatHold(tape?.avgHoldMs ?? null) },
    { label: "Copied", value: clamp(copiedCount / 12), text: String(copiedCount) },
  ];

  return (
    <div className="deck">
      <section className="deck-panel deck-pnl">
        <header className="deck-kicker">
          <span className="mono">{leader ? shortAddr(leader) : "Leader"}</span>
          <span className="live-pill">
            <span className="live-dot" />
            {loading ? "Sync" : "Live"}
          </span>
        </header>
        <div className="deck-label">Marked · {span}</div>
        <div className={`deck-hero ${tone(marked)}`}>{formatDeskUsd(marked, true)}</div>
        <dl className="deck-facts">
          <div>
            <dt>Realized</dt>
            <dd className={tone(realized)}>{formatDeskUsd(realized, true)}</dd>
          </div>
          <div>
            <dt>Unrealized</dt>
            <dd className={tone(unrealized)}>{formatDeskUsd(unrealized, true)}</dd>
          </div>
          <div>
            <dt>Fills</dt>
            <dd>{tradeCount || "—"}</dd>
          </div>
          <div>
            <dt>Win rate</dt>
            <dd>{tape?.closed ? `${tape.wins}/${tape.closed}` : "—"}</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>{tape ? formatDeskUsd(BigInt(tape.volumeUsdg)) : "—"}</dd>
          </div>
          <div>
            <dt>Gas</dt>
            <dd>{tape ? `${tape.gasEth.toFixed(3)} ETH` : "—"}</dd>
          </div>
        </dl>
        <svg className="deck-spark" viewBox="0 0 320 64" aria-hidden>
          <path className="flow-area" d={areaPath(cumulative.map((p) => p.v), 320, 64)} />
          <path className="flow-line" d={linePath(cumulative.map((p) => p.v), 320, 64)} pathLength={100} />
        </svg>
        <div className="deck-clock mono">{now === null ? "––:––:––" : clockLabel(now)}</div>
        {error && !tape ? <p className="hint">{error}</p> : null}
      </section>

      <section className="deck-panel deck-flow">
        <header className="deck-kicker">
          <span>Realized path</span>
          <span className="deck-label">{span}</span>
        </header>
        <div className="chart-frame">
          <svg className="deck-chart" viewBox="0 0 320 140" role="img" aria-label="Cumulative realized profit">
            <path className="flow-area" d={areaPath(cumulative.map((p) => p.v), 320, 140)} />
            <path className="flow-line" d={flow} pathLength={100} />
            <path className="flow-ghost" d={flow} pathLength={100} />
          </svg>
          <span className="playhead" />
        </div>
        <div className="deck-axis">
          {(tape?.hours ?? []).slice(0, 8).map((hour) => (
            <span key={hour.tMs}>{hourLabel(hour.tMs)}</span>
          ))}
        </div>
      </section>

      <section className="deck-panel deck-field">
        <header className="deck-kicker">
          <span>Fill field</span>
          <span className="deck-label">{tape?.orders.length ?? 0} shown</span>
        </header>
        <div className="field">
          {(tape?.orders ?? []).map((order, index) => (
            <span
              className={`field-dot ${order.side}`}
              key={order.id}
              style={dotStyle(order, tape, index)}
              title={`${order.symbol} ${order.side}`}
            />
          ))}
        </div>
        <div className="tile-grid">
          {(tape?.orders ?? []).slice(0, 18).map((order, index) => {
            const pnl = order.realizedUsdg === null ? null : BigInt(order.realizedUsdg);
            const cls = pnl === null ? order.side : pnl >= 0n ? "buy" : "sell";
            return (
              <span className={`tile ${cls}`} key={order.id} style={{ animationDelay: `${index * 40}ms` }}>
                <b>{order.symbol}</b>
                <em>{formatDeskUsd(BigInt(order.notionalUsdg))}</em>
              </span>
            );
          })}
        </div>
      </section>

      <section className="deck-panel deck-shell">
        <header className="deck-kicker">
          <span>Priced book</span>
          <span className="deck-label">{BOOK.length} feeds</span>
        </header>
        <div className="shell">
          <div className="meters">
            {meters.map((meter) => (
              <div className="meter" key={meter.label}>
                <span>{meter.label}</span>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${Math.round(meter.value * 100)}%` }} />
                </div>
                <em>{meter.text}</em>
              </div>
            ))}
          </div>
          <div className="shell-stage">
            <div className="shell-core" />
            <svg viewBox="0 0 100 100" aria-hidden>
              {BOOK.map((symbol, index) => {
                const node = nodeAt(index, BOOK.length);
                return (
                  <line
                    className="spoke"
                    key={symbol}
                    style={{ animationDelay: `${index * 70}ms` }}
                    x1="50"
                    x2={node.x}
                    y1="50"
                    y2={node.y}
                  />
                );
              })}
              {BOOK.map((symbol, index) => {
                const node = nodeAt(index, BOOK.length);
                return (
                  <g key={symbol}>
                    <circle className="node-dot" cx={node.x} cy={node.y} r="1.15" style={{ animationDelay: `${index * 90}ms` }} />
                    <text className="node-label" fontSize="2.15" x={node.x} y={node.y - 1.8} textAnchor="middle">
                      {symbol}
                    </text>
                  </g>
                );
              })}
              <circle className="node-core" cx="50" cy="50" r="2.2" />
            </svg>
          </div>
        </div>
      </section>

      <section className="deck-panel deck-spine">
        <header className="deck-kicker">
          <span>Execution spine</span>
          <span className="deck-label">{buys} buy · {sells} sell</span>
        </header>
        <ol className="spine">
          {(tape?.orders ?? []).slice(0, 11).map((order, index) => (
            <li key={order.id} style={{ animationDelay: `${index * 50}ms` }}>
              <span className={order.side === "buy" ? "side side-buy" : "side side-sell"}>{order.side}</span>
              <b>{order.symbol}</b>
              <em>{formatPx(order.price)}</em>
              <strong>{formatDeskUsd(BigInt(order.notionalUsdg))}</strong>
            </li>
          ))}
          {!tape || tape.orders.length === 0 ? <li className="spine-empty">{error ?? "Waiting for fills."}</li> : null}
        </ol>
        <div className="spine-bars" aria-hidden>
          {(tape?.hours ?? []).map((hour) => {
            const value = Number(hour.realizedUsdg);
            const max = Math.max(...(tape?.hours ?? []).map((h) => Math.abs(Number(h.realizedUsdg))), 1);
            return (
              <span
                className={value < 0 ? "down" : "up"}
                key={hour.tMs}
                style={{ height: `${Math.max(8, (Math.abs(value) / max) * 100)}%` }}
              />
            );
          })}
        </div>
      </section>

      <section className="deck-panel deck-law">
        <header className="deck-kicker">
          <span>Cumulative</span>
          <span className="deck-label">Realized and volume</span>
        </header>
        <svg className="deck-chart" viewBox="0 0 320 110" role="img" aria-label="Cumulative realized profit and volume">
          <path className="flow-line gold" d={volumeLine} pathLength={100} />
          <path className="flow-line" d={linePath(cumulative.map((p) => p.v), 320, 110)} pathLength={100} />
        </svg>
        <p className="caption">Green is cumulative realized. Gold is cumulative notional in the same hours.</p>
      </section>

      <section className="deck-panel deck-chain">
        <header className="deck-kicker">
          <span>Flow</span>
          <span className="deck-label">Buy · sell · copy</span>
        </header>
        <svg className="chain" viewBox="0 0 280 150" aria-hidden>
          <line className="spoke" x1="70" x2="140" y1="48" y2="78" />
          <line className="spoke" x1="210" x2="140" y1="48" y2="78" />
          <line className="spoke gold-stroke" x1="140" x2="140" y1="78" y2="122" />
          <g className="chain-node buy">
            <circle cx="70" cy="48" r="22" />
            <text fontSize="9" x="70" y="45" textAnchor="middle">Buy</text>
            <text fontSize="11" x="70" y="58" textAnchor="middle">{buys}</text>
          </g>
          <g className="chain-node sell">
            <circle cx="210" cy="48" r="22" />
            <text fontSize="9" x="210" y="45" textAnchor="middle">Sell</text>
            <text fontSize="11" x="210" y="58" textAnchor="middle">{sells}</text>
          </g>
          <g className="chain-node core">
            <circle cx="140" cy="78" r="16" />
            <text fontSize="8" x="140" y="82" textAnchor="middle">Book</text>
          </g>
          <g className="chain-node copy">
            <circle cx="140" cy="122" r="16" />
            <text fontSize="11" x="140" y="126" textAnchor="middle">{copiedCount}</text>
          </g>
        </svg>
        <div className="dist-bars">
          <span className="up" style={{ flex: Math.max(buys, 0.2) }} />
          <span className="down" style={{ flex: Math.max(sells, 0.2) }} />
          <span className="flat" style={{ flex: Math.max(copiedCount, 0.2) }} />
        </div>
      </section>
    </div>
  );
}

function shortAddr(addr: string): string {
  return addr.length < 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function tone(amount: bigint): string {
  if (amount > 0n) return "up";
  if (amount < 0n) return "down";
  return "flat";
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clockLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function hourLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: true,
  })
    .format(new Date(ms))
    .replace(" ", "")
    .toLowerCase();
}

function formatPx(price: string): string {
  const dollars = Number(BigInt(price)) / 1e8;
  if (!Number.isFinite(dollars) || dollars <= 0) return "—";
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function nodeAt(index: number, count: number): { x: number; y: number } {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  const ring = 30 + (index % 3) * 6;
  return {
    x: 50 + Math.cos(angle) * ring,
    y: 50 + Math.sin(angle) * ring,
  };
}

function linePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * (width - 8) + 4;
      const y = height - 8 - ((value - min) / span) * (height - 16);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function areaPath(values: number[], width: number, height: number): string {
  const line = linePath(values, width, height);
  if (!line) return "";
  return `${line} L${width - 4},${height - 4} L4,${height - 4} Z`;
}

function hourlyVolume(orders: DeckOrder[], fromMs: number): number[] {
  if (orders.length === 0) return [];
  const buckets = new Map<number, number>();
  for (const order of orders) {
    const key = Math.floor(order.atMs / 3_600_000) * 3_600_000;
    buckets.set(key, (buckets.get(key) ?? 0) + Number(order.notionalUsdg) / 1_000_000);
  }
  const start = Math.floor((fromMs || Math.min(...orders.map((order) => order.atMs))) / 3_600_000) * 3_600_000;
  const end = Math.max(...buckets.keys(), start);
  if (end - start > 48 * 3_600_000) return [...buckets.values()];
  const out: number[] = [];
  for (let t = start; t <= end; t += 3_600_000) out.push(buckets.get(t) ?? 0);
  return out;
}

function dotStyle(
  order: DeckOrder,
  tape: DeckTape | null,
  index: number,
): { left: string; top: string; animationDelay: string } {
  const span = Math.max((tape?.toMs ?? 0) - (tape?.fromMs ?? 0), 1);
  const x = ((order.atMs - (tape?.fromMs ?? order.atMs)) / span) * 88 + 4;
  const notionals = (tape?.orders ?? []).map((row) => Number(row.notionalUsdg));
  const max = Math.max(...notionals, 1);
  const y = 86 - (Math.log10(Number(order.notionalUsdg) + 1) / Math.log10(max + 1)) * 76;
  return {
    left: `${clamp(x / 100) * 100}%`,
    top: `${clamp(y / 100) * 100}%`,
    animationDelay: `${(index % 12) * 0.18}s`,
  };
}
