"use client";

import { useEffect, useState } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";
import { parseUsdgField, type RecordedFill } from "@/lib/fills";
import {
  formatDeskUsd,
  formatHold,
  formatPct,
  windowLabel,
} from "@/lib/leader-activity";

const BOOK = listSymbols().filter((symbol) =>
  isTradeEligible(symbol, CHAIN.MAINNET_ID),
);

interface DistBand {
  label: string;
  count: number;
  pct: number;
}

interface LeaderOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  notionalUsdg: string;
  price: string;
  atMs: number;
  realizedUsdg: string | null;
  keeper: {
    action: "accept" | "resize" | "skip";
    reason: string;
    session: string;
    copyUsdg: string;
    openSessionUsdg: string;
  };
}

interface LeaderTape {
  tracked: number;
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
  avgRealizedUsdg: string;
  avgHoldMs: number | null;
  gasEth: number;
  distribution: DistBand[];
  hours: { tMs: number; realizedUsdg: string }[];
  orders: LeaderOrder[];
}

const DIST_CLASS = ["d-hot", "d-up", "d-flat", "d-down"];

export function LeaderBoard({
  leader,
  deskChain,
  view,
}: {
  leader: `0x${string}` | null;
  deskChain: number;
  view: "leader" | "orders";
}) {
  const [tape, setTape] = useState<LeaderTape | null>(null);
  const [copies, setCopies] = useState<RecordedFill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leader) return;
    let stop = false;
    setLoading(true);
    const load = async () => {
      try {
        const [leaderRes, fillRes] = await Promise.all([
          fetch(`/api/leader?leader=${leader}&deskChain=${deskChain}`, {
            cache: "no-store",
          }),
          fetch("/api/fills", { cache: "no-store" }),
        ]);
        const leaderJson = (await leaderRes.json()) as LeaderTape & { error?: string };
        if (!leaderRes.ok) throw new Error(leaderJson.error ?? "Leader tape unavailable");
        const fillJson = (await fillRes.json()) as { fills?: RecordedFill[] };
        if (stop) return;
        setTape(leaderJson);
        setCopies(Array.isArray(fillJson.fills) ? fillJson.fills : []);
        setError(null);
      } catch (err) {
        if (stop) return;
        setError(err instanceof Error ? err.message : "Leader tape unavailable");
      } finally {
        if (!stop) setLoading(false);
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [leader, deskChain]);

  const copiedOrders = (tape?.orders ?? []).flatMap((order) => {
    const copied = matchCopy(order, copies);
    return copied === null ? [] : [{ order, copied }];
  });
  const span = tape ? windowLabel(tape.fromMs, tape.toMs) : "8h";
  const realized = tape ? BigInt(tape.realizedUsdg) : 0n;
  const unrealized = tape ? BigInt(tape.unrealizedUsdg) : 0n;
  const maxHour = tape
    ? tape.hours.reduce((m, h) => {
        const v = abs(BigInt(h.realizedUsdg));
        return v > m ? v : m;
      }, 0n)
    : 0n;

  return (
    <div className="tab-body">
      {view === "leader" ? (
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Leader tape</h2>
          <span className="section-note">
            {tape ? `${tape.trades} stock-token fills · ${span}` : "Priced book"}
          </span>
        </div>
        {error && !tape ? (
          <p className="hint">{error}</p>
        ) : !tape ? (
          <div className="leader-grid" aria-hidden>
            <div className="skel" />
            <div className="skel" />
            <div className="skel" />
            <div className="skel" />
          </div>
        ) : (
          <div className="leader-grid">
            <article className="stat-panel">
              <div className="label">Realized · {span}</div>
              <div className={`pnl-figure ${tone(realized)}`}>
                {formatDeskUsd(realized, true)}
              </div>
              <div className={`pnl-sub ${tone(realized)}`}>
                {tape.realizedPct === null ? "—" : formatPct(tape.realizedPct)}
              </div>
              <dl className="pnl-meta">
                <div>
                  <dt>Unrealized</dt>
                  <dd className={tone(unrealized)}>{formatDeskUsd(unrealized, true)}</dd>
                </div>
                <div>
                  <dt>Bought</dt>
                  <dd>{formatDeskUsd(BigInt(tape.boughtUsdg))}</dd>
                </div>
              </dl>
            </article>

            <article className="stat-panel">
              <div className="label">Win rate</div>
              <div className="pnl-figure">
                {tape.winRate === null ? "—" : formatPct(tape.winRate * 100, 1).replace("+", "")}
              </div>
              <p className="pnl-sub flat">
                {tape.closed === 0
                  ? "No closed sell in this window"
                  : `${tape.wins} of ${tape.closed} closed`}
              </p>
              <div className="hour-strip" aria-label="Realized by hour">
                {tape.hours.map((hour) => {
                  const value = BigInt(hour.realizedUsdg);
                  const pct =
                    maxHour === 0n ? 8 : Math.max(8, Number((abs(value) * 100n) / maxHour));
                  return (
                    <div className="hour" key={hour.tMs}>
                      <div
                        className={`hour-bar ${value < 0n ? "down" : "up"}`}
                        style={{ height: `${pct}%` }}
                      />
                      <span>{hourLabel(hour.tMs)}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="stat-panel">
              <div className="label">Analysis</div>
              <dl className="analysis">
                <div>
                  <dt>Volume</dt>
                  <dd>{formatDeskUsd(BigInt(tape.volumeUsdg))}</dd>
                </div>
                <div>
                  <dt>Sold</dt>
                  <dd>{formatDeskUsd(BigInt(tape.soldUsdg))}</dd>
                </div>
                <div>
                  <dt>Avg realized</dt>
                  <dd className={tone(BigInt(tape.avgRealizedUsdg))}>
                    {formatDeskUsd(BigInt(tape.avgRealizedUsdg), true)}
                  </dd>
                </div>
                <div>
                  <dt>Avg hold</dt>
                  <dd>{formatHold(tape.avgHoldMs)}</dd>
                </div>
                <div>
                  <dt>Gas</dt>
                  <dd>{tape.gasEth.toFixed(4)} ETH</dd>
                </div>
                <div>
                  <dt>Tracked</dt>
                  <dd>{tape.tracked}</dd>
                </div>
              </dl>
            </article>

            <article className="stat-panel">
              <div className="label">Distribution</div>
              <div className="dist-bar" aria-hidden>
                {tape.distribution.map((band, i) => (
                  <span
                    className={DIST_CLASS[i] ?? "d-flat"}
                    key={band.label}
                    style={{ width: `${band.pct}%` }}
                  />
                ))}
              </div>
              <ul className="dist-legend">
                {tape.distribution.map((band, i) => (
                  <li key={band.label}>
                    <span className={`swatch ${DIST_CLASS[i] ?? "d-flat"}`} />
                    <span>{band.label}</span>
                    <strong>
                      {band.count}
                      <em>{band.pct.toFixed(0)}%</em>
                    </strong>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        )}
        <p className="caption">
          Notional is the USDG that moved in the same transaction. Open positions
          are marked with Chainlink. Realized profit matches a sell to buys in
          this window. The keeper copies 5% in the cash session, 30% of that
          after hours, and nothing while the session is closed.
          {loading && tape ? " Refreshing." : ""}
        </p>
      </section>
      ) : null}

      {view === "orders" ? (
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Orders</h2>
          <span className="section-note">
            {tape ? `${copiedOrders.length} copied` : "Copied fills"}
          </span>
        </div>
        <div className="table-wrap table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Leader</th>
                <th>Result</th>
                <th>Keeper</th>
                <th>Copied</th>
              </tr>
            </thead>
            <tbody>
              {!tape ? (
                <tr>
                  <td className="empty" colSpan={7}>
                    {error ?? "Reading copies."}
                  </td>
                </tr>
              ) : copiedOrders.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={7}>
                    No copies yet.
                  </td>
                </tr>
              ) : (
                copiedOrders.map(({ order, copied }) => {
                  const realized =
                    order.realizedUsdg === null ? null : BigInt(order.realizedUsdg);
                  return (
                    <tr key={order.id}>
                      <td className="mono">
                        {formatWhen(order.atMs)}
                        <span className="order-px"> ET</span>
                      </td>
                      <td>
                        <div className="order-sym">{order.symbol}</div>
                        <div className="order-px">{formatPx(order.price)}</div>
                      </td>
                      <td className={order.side === "buy" ? "side side-buy" : "side side-sell"}>
                        {order.side}
                      </td>
                      <td className="mono">{formatDeskUsd(BigInt(order.notionalUsdg))}</td>
                      <td className={`mono ${realized === null ? "" : tone(realized)}`}>
                        {realized === null ? "—" : formatDeskUsd(realized, true)}
                      </td>
                      <td className="think">
                        <div className={`think-action think-${order.keeper.action}`}>
                          {actionLabel(order.keeper.action)}
                        </div>
                        <div className="think-reason">{order.keeper.reason}</div>
                      </td>
                      <td className="mono">{formatDeskUsd(copied)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {view === "leader" ? (
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Priced book</h2>
          <span className="section-note">{BOOK.length} with a feed</span>
        </div>
        <div className="symbols">
          {BOOK.map((symbol) => (
            <span className="symbol" key={symbol}>
              {symbol}
            </span>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}

function matchCopy(order: LeaderOrder, fills: readonly RecordedFill[]): bigint | null {
  let best: { at: number; amount: bigint } | null = null;
  for (const fill of fills) {
    if (fill.source === "fixture") continue;
    if (fill.symbol.toUpperCase() !== order.symbol.toUpperCase()) continue;
    if (fill.side.toLowerCase() !== order.side) continue;
    const at = Date.parse(fill.timestamp);
    if (!Number.isFinite(at) || Math.abs(at - order.atMs) > 180_000) continue;
    const amount = parseUsdgField(fill.executedUsdg);
    if (!best || Math.abs(at - order.atMs) < Math.abs(best.at - order.atMs)) {
      best = { at, amount };
    }
  }
  return best && best.amount > 0n ? best.amount : null;
}

function tone(amount: bigint): string {
  if (amount > 0n) return "up";
  if (amount < 0n) return "down";
  return "flat";
}

function abs(amount: bigint): bigint {
  return amount < 0n ? -amount : amount;
}

function actionLabel(action: LeaderOrder["keeper"]["action"]): string {
  if (action === "accept") return "Accept";
  if (action === "resize") return "Resize";
  return "Skip";
}

function formatPx(price: string): string {
  try {
    const dollars = Number(BigInt(price)) / 1e8;
    if (!Number.isFinite(dollars) || dollars <= 0) return "—";
    return `$${dollars.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    return "—";
  }
}

function formatWhen(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
