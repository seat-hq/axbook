"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";

const BOOK = listSymbols().filter((symbol) => isTradeEligible(symbol, CHAIN.MAINNET_ID));
const NAMES = BOOK.length > 0 ? BOOK : ["NVDA", "AAPL", "SPY", "MSTR", "PLTR", "TSLA"];

interface Bar {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface Print {
  id: string;
  atMs: number;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  notional: number;
  copied: boolean;
  copyUsd: number;
  reason: string;
}

interface LogLine {
  id: string;
  atMs: number;
  tag: "COPY" | "SKIP";
  symbol: string;
  side: "buy" | "sell";
  price: number;
  detail: string;
}

interface Toast {
  id: string;
  title: string;
  body: string;
  side: "buy" | "sell";
  holdMs: number;
}

interface DeskSim {
  prints: Print[];
  logs: LogLine[];
  candles: Bar[];
  path: number[];
  prices: Record<string, number>;
  focus: string;
  realized: number;
  unrealized: number;
  volume: number;
  bought: number;
  sold: number;
  wins: number;
  closed: number;
  gasEth: number;
  trades: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedPrice(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i += 1) h = Math.imul(h ^ symbol.charCodeAt(i), 16777619);
  const unit = (h >>> 0) % 1000;
  return Math.round((18 + unit * 0.86) * 100) / 100;
}

function gap(rand: () => number, min: number, max: number): number {
  return Math.floor(min + rand() * rand() * (max - min));
}

function money(value: number, digits = 2): string {
  const abs = Math.abs(value);
  const body =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(2)}M`
      : abs >= 10_000
        ? `$${(abs / 1_000).toFixed(1)}K`
        : `$${abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  return value < 0 ? `-${body}` : body;
}

function signed(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
}

function clock(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).format(new Date(ms));
}

function buildSim(now: number): DeskSim {
  const rand = mulberry32(0x5ea7);
  const prices: Record<string, number> = {};
  for (const symbol of NAMES) prices[symbol] = seedPrice(symbol);
  const focus = NAMES.includes("MSTR") ? "MSTR" : NAMES[0] ?? "SPY";
  let px = prices[focus] ?? 100;
  const candles: Bar[] = [];
  for (let i = 0; i < 42; i += 1) {
    const o = px;
    const c = Math.max(1, o * (1 + (rand() - 0.48) * 0.012));
    const h = Math.max(o, c) * (1 + rand() * 0.004);
    const l = Math.min(o, c) * (1 - rand() * 0.004);
    candles.push({ o, h, l, c });
    px = c;
  }
  prices[focus] = px;
  const prints: Print[] = [];
  const logs: LogLine[] = [];
  let realized = 1840;
  let volume = 0;
  let bought = 0;
  let sold = 0;
  let wins = 11;
  let closed = 17;
  for (let i = 18; i >= 1; i -= 1) {
    const row = nextPrint(rand, prices, now - i * 1400, realized);
    prints.push(row.print);
    logs.push(row.log);
    realized = row.realized;
    volume += row.print.notional;
    if (row.print.side === "buy") bought += row.print.notional;
    else sold += row.print.notional;
    if (row.closed) {
      closed += 1;
      if (row.win) wins += 1;
    }
  }
  const path: number[] = [];
  let acc = realized - 900;
  for (let i = 0; i < 32; i += 1) {
    acc += (rand() - 0.42) * 80;
    path.push(acc);
  }
  path[path.length - 1] = realized;
  return {
    prints,
    logs,
    candles,
    path,
    prices,
    focus,
    realized,
    unrealized: -240 + rand() * 80,
    volume,
    bought,
    sold,
    wins,
    closed,
    gasEth: 0.0412,
    trades: 360 + prints.length,
  };
}

function nextPrint(rand: () => number, prices: Record<string, number>, atMs: number, realized: number) {
  const symbol = NAMES[Math.floor(rand() * NAMES.length)] ?? "SPY";
  const side: "buy" | "sell" = rand() > 0.46 ? "buy" : "sell";
  const prev = prices[symbol] ?? seedPrice(symbol);
  const price = Math.max(1, Math.round(prev * (1 + (rand() - 0.5) * 0.006) * 100) / 100);
  prices[symbol] = price;
  const notional = Math.round((120 + rand() * 4800) * 100) / 100;
  const copied = rand() > 0.55;
  const copyUsd = copied ? Math.round(notional * (rand() > 0.8 ? 0.05 : 0.03) * 100) / 100 : 0;
  const reason = copied ? (copyUsd < notional * 0.04 ? "resized to cap" : "5% copy") : "session closed";
  const edge = side === "sell" ? (rand() - 0.38) * notional * 0.004 : 0;
  const id = `${atMs}-${symbol}-${side}`;
  const print: Print = { id, atMs, symbol, side, price, notional, copied, copyUsd, reason };
  const log: LogLine = {
    id,
    atMs,
    tag: copied ? "COPY" : "SKIP",
    symbol,
    side,
    price,
    detail: copied ? `${money(notional)} → ${money(copyUsd)}  ${reason}` : `${money(notional)}  ${reason}`,
  };
  return {
    print,
    log,
    realized: realized + edge,
    closed: side === "sell",
    win: edge > 0,
  };
}

export function SeatTerminal({
  title,
  vault,
  wallet,
  nav,
  cash,
  seats,
  forms,
  note,
}: {
  leader: `0x${string}` | null;
  deskChain: number;
  title: string;
  vault: string;
  wallet: ReactNode;
  nav: string;
  cash: string;
  seats: string;
  forms: ReactNode;
  note: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [sim, setSim] = useState<DeskSim | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const simRef = useRef<DeskSim | null>(null);
  const randRef = useRef<(() => number) | null>(null);

  useEffect(() => {
    setNow(new Date());
    const clockId = window.setInterval(() => setNow(new Date()), 1000);
    const initial = buildSim(Date.now());
    simRef.current = initial;
    randRef.current = mulberry32(0x51ed);
    setSim(initial);
    let stop = false;
    const timers: number[] = [];
    const arm = (min: number, max: number, first: number, job: (rand: () => number, current: DeskSim) => DeskSim | null) => {
      const schedule = (delay: number) => {
        const id = window.setTimeout(() => {
          if (stop) return;
          const rand = randRef.current;
          const current = simRef.current;
          if (rand && current) {
            const next = job(rand, current);
            if (next) {
              simRef.current = next;
              setSim(next);
            }
          }
          const live = randRef.current;
          schedule(live ? gap(live, min, max) : min);
        }, delay);
        timers.push(id);
      };
      schedule(first);
    };
    arm(280, 4600, 350, (rand, current) => {
      const step = nextPrint(rand, current.prices, Date.now(), current.realized);
      if (rand() < 0.22) {
        const extra = window.setTimeout(() => {
          if (stop) return;
          const again = randRef.current;
          const nowSim = simRef.current;
          if (!again || !nowSim) return;
          const burst = nextPrint(again, nowSim.prices, Date.now(), nowSim.realized);
          const merged: DeskSim = {
            ...nowSim,
            prints: [burst.print, ...nowSim.prints].slice(0, 24),
            volume: nowSim.volume + burst.print.notional,
            bought: nowSim.bought + (burst.print.side === "buy" ? burst.print.notional : 0),
            sold: nowSim.sold + (burst.print.side === "sell" ? burst.print.notional : 0),
            trades: nowSim.trades + 1,
          };
          simRef.current = merged;
          setSim(merged);
        }, 90 + Math.floor(rand() * 280));
        timers.push(extra);
      }
      return {
        ...current,
        prints: [step.print, ...current.prints].slice(0, 24),
        volume: current.volume + step.print.notional,
        bought: current.bought + (step.print.side === "buy" ? step.print.notional : 0),
        sold: current.sold + (step.print.side === "sell" ? step.print.notional : 0),
        wins: current.wins + (step.win ? 1 : 0),
        closed: current.closed + (step.closed ? 1 : 0),
        trades: current.trades + 1,
      };
    });
    arm(700, 7400, 1100, (rand, current) => {
      const step = nextPrint(rand, current.prices, Date.now(), current.realized);
      return { ...current, logs: [step.log, ...current.logs].slice(0, 18) };
    });
    arm(160, 2100, 520, (rand, current) => {
      const prev = current.prices[current.focus] ?? 100;
      const px = Math.max(1, Math.round(prev * (1 + (rand() - 0.5) * 0.007) * 100) / 100);
      current.prices[current.focus] = px;
      const candles = current.candles.map((bar) => ({ ...bar }));
      const last = candles[candles.length - 1];
      if (last && rand() > 0.18) {
        last.c = px;
        last.h = Math.max(last.h, px);
        last.l = Math.min(last.l, px);
      } else {
        candles.push({ o: last?.c ?? px, h: px, l: px, c: px });
        if (candles.length > 48) candles.shift();
      }
      return { ...current, candles };
    });
    arm(500, 5600, 1800, (rand, current) => {
      const realized = current.realized + (rand() - 0.46) * (40 + rand() * 90);
      const path = current.path.slice(-31);
      path.push(realized);
      return {
        ...current,
        realized,
        unrealized: current.unrealized + (rand() - 0.5) * 18,
        gasEth: current.gasEth + rand() * 0.00008,
        path,
      };
    });
    arm(140, 680, 180, (rand, current) => {
      const step = nextPrint(rand, { ...current.prices }, Date.now(), current.realized);
      const toast: Toast = {
        id: `toast-${step.print.id}`,
        side: step.print.side,
        title: `${step.log.tag}  ${step.print.symbol} ${step.print.side.toUpperCase()}`,
        body: step.log.detail,
        holdMs: 900 + Math.floor(rand() * 700),
      };
      setToasts((rows) => [toast, ...rows].slice(0, 4));
      return null;
    });
    return () => {
      stop = true;
      window.clearInterval(clockId);
      for (const id of timers) window.clearTimeout(id);
    };
  }, []);

  const latest = sim?.prints[0];
  const winRate = sim && sim.closed > 0 ? (sim.wins / sim.closed) * 100 : null;
  const feed = sim?.prints.slice(0, 16) ?? [];
  const loop = feed.length > 0 ? [...feed, ...feed] : [];

  return (
    <div className="fx">
      <header className="fx-top">
        <div className="fx-brand">AXBOOK</div>
        <span className="fx-live">
          <i />
          LIVE
        </span>
        <span className="fx-brand-sub">COPY DESK</span>
        <span className="fx-chip">SIM TAPE</span>
        <span className="fx-chip">
          {sim?.focus ?? "TAPE"} <b>{latest && latest.symbol === sim?.focus ? `$${latest.price.toFixed(2)}` : "—"}</b>
        </span>
        <span className="fx-chip">
          WIN <b>{winRate == null ? "—" : `${winRate.toFixed(1)}%`}</b>
        </span>
        <span className="fx-chip">{sim ? `${sim.trades} PRINTS` : "…"}</span>
        <span className="fx-clock">
          {title} · {vault} ·{" "}
          {now ? now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" }) : "--:--:--"} UTC
        </span>
        {wallet}
      </header>

      <div className="fx-feed" data-guide="feed">
        <span className="fx-live">FEED</span>
        <div className="fx-ticker">
          <div className="fx-ticker-track">
            {loop.map((row, index) => (
              <span key={`${row.id}-${index}`}>
                <b>{row.symbol}</b>{" "}
                <span className={row.side === "buy" ? "fx-up" : "fx-dn"}>{row.side.toUpperCase()}</span>{" "}
                {money(row.notional)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="fx-metrics" data-guide="metrics">
        <Metric label="REALIZED" value={sim ? signed(sim.realized) : "—"} delta={sim ? signed(sim.realized * 0.01) : ""} up={(sim?.realized ?? 0) >= 0} series={sim?.path ?? []} />
        <Metric label="UNREALIZED" value={sim ? signed(sim.unrealized) : "—"} delta="open" up={(sim?.unrealized ?? 0) >= 0} series={sim?.path.map((n) => -n * 0.15) ?? []} />
        <Metric label="WIN RATE" value={winRate == null ? "—" : `${winRate.toFixed(1)}%`} delta={sim ? `${sim.wins}/${sim.closed}` : ""} up series={sim ? sim.prints.map((_, i) => i).reverse() : []} />
        <Metric label="VOLUME" value={sim ? money(sim.volume) : "—"} delta={sim ? money(sim.bought) + " buy" : ""} up series={sim?.prints.map((row) => row.notional).reverse() ?? []} />
        <Metric label="SOLD" value={sim ? money(sim.sold) : "—"} delta={sim ? `${sim.trades} prints` : ""} up={false} series={sim?.prints.filter((row) => row.side === "sell").map((row) => row.notional) ?? []} />
        <Metric label="GAS" value={sim ? `${sim.gasEth.toFixed(4)} ETH` : "—"} delta="desk" up series={sim ? [sim.gasEth, sim.gasEth] : []} />
      </section>

      <section className="fx-mid">
        <article className="fx-panel fx-rails" data-guide="rails">
          <Rail label="REALIZED" value={sim ? signed(sim.realized) : "—"} values={sim?.path ?? []} color="#3dff7a" />
          <Rail label="VOLUME" value={sim ? money(sim.volume) : "—"} values={sim?.prints.map((row) => row.notional).reverse() ?? []} color="#5ec8ff" />
          <Rail label="WIN" value={winRate == null ? "—" : `${winRate.toFixed(0)}%`} values={sim?.prints.map((_, index) => index + 1) ?? []} color="#f0c14a" />
          <Rail label="HOLD" value={sim ? `${sim.gasEth.toFixed(3)}` : "—"} values={sim?.path.map((value) => -value) ?? []} color="#ff5a6a" />
          <Rail label="SOLD" value={sim ? money(sim.sold) : "—"} values={sim?.prints.filter((row) => row.side === "sell").map((row) => row.notional) ?? []} color="#d5e4ee" />
          <Rail label="BOOK" value={String(NAMES.length)} values={sim?.prints.map((row) => (row.side === "sell" ? -1 : 1)) ?? []} color="#3dff7a" />
        </article>
          <article className="fx-panel fx-shell" data-guide="shell">
          <div className="fx-h">
            <span>Neural shell</span>
            <span>{sim?.focus ?? "Priced names"}</span>
          </div>
          <NeuralShell pulse={sim?.trades ?? 0} />
        </article>
        <article className="fx-panel fx-fills" data-guide="fills">
          <div className="fx-h">
            <span>Late fills</span>
            <span>{sim?.prints.length ?? 0}</span>
          </div>
          <div className="fx-scroll">
            {(sim?.prints.slice(0, 12) ?? []).map((row, index) => (
              <div className={`fx-fill ${row.side}`} key={row.id} style={{ animationDelay: `${index * 40}ms` }}>
                <strong>{row.symbol}</strong>
                <span>{row.side.toUpperCase()}</span>
                <b>{money(row.notional)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="fx-lower">
        <article className="fx-panel" data-guide="tape">
          <div className="fx-h">
            <span>Copy tape</span>
            <span>{sim?.logs.length ?? 0}</span>
          </div>
          <div className="fx-log">
            {(sim?.logs ?? []).map((line, index) => (
              <div className={`fx-log-line ${index === 0 ? "new" : ""}`} key={line.id}>
                <span>{clock(line.atMs)}</span>
                <b className={line.tag === "COPY" ? "fx-up" : "fx-am"}>{line.tag}</b>
                <b>{line.symbol}</b>
                <span className={line.side === "buy" ? "fx-up" : "fx-dn"}>{line.side.toUpperCase()}</span>
                <span>
                  ${line.price.toFixed(2)} · {line.detail}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="fx-panel" data-guide="prints">
          <div className="fx-h">
            <span>Prints</span>
            <span>{sim?.prints.length ?? 0}</span>
          </div>
          <div className="fx-scroll">
            <table className="fx-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Last</th>
                  <th>Notional</th>
                </tr>
              </thead>
              <tbody>
                {(sim?.prints ?? []).map((row, index) => (
                  <tr key={row.id} className={index === 0 ? "new" : undefined}>
                    <td>{clock(row.atMs)}</td>
                    <td>{row.symbol}</td>
                    <td className={row.side === "buy" ? "fx-up" : "fx-dn"}>{row.side.toUpperCase()}</td>
                    <td>${row.price.toFixed(2)}</td>
                    <td>{money(row.notional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="fx-panel fx-desk" data-guide="desk">
          <div className="fx-h">
            <span>Desk</span>
            <span>
              {nav} · {cash} · {seats}
            </span>
          </div>
          {forms}
          {note ? <p className="note">{note}</p> : null}
        </article>
      </section>

      <footer className="fx-foot" data-guide="foot">
        <span key={latest ? `${latest.id}` : "last"}>
          LAST <b>{latest ? `${latest.symbol} ${latest.side.toUpperCase()}` : "—"}</b>
        </span>
        <span key={sim ? sim.realized.toFixed(2) : "realized"}>
          REALIZED <b>{sim ? signed(sim.realized) : "—"}</b>
        </span>
        <span key={winRate == null ? "win" : winRate.toFixed(1)}>
          WIN <b>{winRate == null ? "—" : `${winRate.toFixed(1)}%`}</b>
        </span>
        <span>
          NAV <b>{nav}</b>
        </span>
        <span>
          CASH <b>{cash}</b>
        </span>
        <span>
          SHARES <b>{seats}</b>
        </span>
        <span key={sim?.logs.filter((line) => line.tag === "COPY").length ?? 0}>
          COPIES <b>{sim?.logs.filter((line) => line.tag === "COPY").length ?? 0}</b>
        </span>
      </footer>

      <Guide />
      <div className="fx-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`fx-toast ${toast.side}`} key={toast.id} style={{ animationDuration: `${toast.holdMs}ms` }}>
            <b className={toast.side === "buy" ? "fx-up" : "fx-dn"}>{toast.title}</b>
            <span>{toast.body}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const GUIDE: readonly {
  id: string;
  title: string;
  body: string;
  place: "below" | "above" | "right" | "inset";
}[] = [
  {
    id: "feed",
    title: "Feed",
    body: "The latest simulated prints scroll across the top. This tape is marked SIM, so it is not the leader’s live book.",
    place: "below",
  },
  {
    id: "metrics",
    title: "Session figures",
    body: "Realized and open P&L, win rate, volume, sold, and gas for the sim tape.",
    place: "below",
  },
  {
    id: "rails",
    title: "Shell rails",
    body: "Six live readings from the sim tape. The strands run from here into the ring.",
    place: "right",
  },
  {
    id: "shell",
    title: "Neural shell",
    body: "The book drawn as a ring. Packets travel in from the rails and out toward the late fills.",
    place: "inset",
  },
  {
    id: "fills",
    title: "Late fills",
    body: "The newest simulated prints, stacked as they land, with side and notional.",
    place: "inset",
  },
  {
    id: "tape",
    title: "Copy tape",
    body: "Each line is a copy or a skip: symbol, side, price, and why the size changed.",
    place: "inset",
  },
  {
    id: "prints",
    title: "Prints",
    body: "The print log: time, symbol, side, last price, and notional.",
    place: "inset",
  },
  {
    id: "desk",
    title: "Desk",
    body: "Deposit USDG to buy book shares, or redeem shares to leave. This form writes to the desk vault.",
    place: "above",
  },
  {
    id: "foot",
    title: "Status",
    body: "Last print, realized P&L, and win rate are from the sim tape. NAV, cash, and shares are the desk.",
    place: "above",
  },
];

function placeGuide(rect: DOMRect, place: (typeof GUIDE)[number]["place"]): { top: number; left: number } {
  const width = 268;
  const height = 108;
  const margin = 8;
  let top = rect.top + 28;
  let left = rect.left + 10;
  if (place === "below") {
    top = rect.bottom + margin;
    left = rect.left;
  } else if (place === "above") {
    top = rect.top - height - margin;
    left = rect.right - width;
  } else if (place === "right") {
    top = rect.top + 8;
    left = rect.right + margin;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
  return { top, left };
}

function Guide() {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  const current = GUIDE[step];

  useEffect(() => {
    if (!current) return;
    const target = document.querySelector<HTMLElement>(`[data-guide="${current.id}"]`);
    if (!target) {
      setStep((value) => value + 1);
      return;
    }
    target.classList.add("fx-guide-on");
    const measure = (): void => setBox(placeGuide(target.getBoundingClientRect(), current.place));
    measure();
    const timer = window.setTimeout(() => setStep((value) => value + 1), 10_000);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      target.classList.remove("fx-guide-on");
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current]);

  if (!current || !box) return null;
  return (
    <div className="fx-guide" style={{ top: box.top, left: box.left }} role="dialog" aria-label={current.title}>
      <button type="button" aria-label="Close" onClick={() => setStep((value) => value + 1)}>
        ×
      </button>
      <b>
        {current.title}
        <span>
          {step + 1}/{GUIDE.length}
        </span>
      </b>
      <p>{current.body}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  up,
  series,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  series: number[];
}) {
  return (
    <article className="fx-metric">
      <span>{label}</span>
      <strong className={up ? "fx-up" : "fx-dn"}>{value}</strong>
      <em className={up ? "fx-up" : "fx-dn"}>{delta}</em>
      <Spark values={series} color={up ? "#3dff7a" : "#ff5a6a"} />
    </article>
  );
}

function Rail({
  label,
  value,
  values,
  color,
}: {
  label: string;
  value: string;
  values: number[];
  color: string;
}) {
  return (
    <div className="fx-rail">
      <span>{label}</span>
      <Spark values={values} color={color} />
      <b style={{ color }}>{value}</b>
    </div>
  );
}

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <svg viewBox="0 0 120 22" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 120;
      const y = 20 - ((value - min) / span) * 16;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 120 22" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

function CandlePlot({ bars }: { bars: Bar[] }) {
  if (bars.length < 2) return <svg className="fx-svg" viewBox="0 0 640 240" />;
  const low = Math.min(...bars.map((bar) => bar.l));
  const high = Math.max(...bars.map((bar) => bar.h));
  const span = high - low || 1;
  const y = (value: number) => 16 + (1 - (value - low) / span) * 190;
  const slot = 560 / bars.length;
  const last = bars[bars.length - 1];
  return (
    <svg className="fx-svg" viewBox="0 0 640 240" role="img" aria-label="Price">
      {[0, 1, 2, 3].map((row) => {
        const value = low + ((3 - row) / 3) * span;
        const py = y(value);
        return (
          <g key={row}>
            <line stroke="rgba(94,168,220,0.16)" x1="8" x2="572" y1={py} y2={py} />
            <text fill="#7f96a8" fontSize="10" x="578" y={py + 3}>
              {value.toFixed(2)}
            </text>
          </g>
        );
      })}
      {bars.map((bar, index) => {
        const x = 16 + index * slot + slot / 2;
        const up = bar.c >= bar.o;
        const top = y(Math.max(bar.o, bar.c));
        const bot = y(Math.min(bar.o, bar.c));
        const body = Math.max(3, Math.min(10, slot * 0.62));
        return (
          <g key={index}>
            <line stroke={up ? "#3dff7a" : "#ff5a6a"} x1={x} x2={x} y1={y(bar.h)} y2={y(bar.l)} />
            <rect fill={up ? "#3dff7a" : "#ff5a6a"} height={Math.max(1.5, bot - top)} width={body} x={x - body / 2} y={top} />
          </g>
        );
      })}
      {last ? (
        <line stroke="#f0c14a" strokeDasharray="3 3" x1="8" x2="572" y1={y(last.c)} y2={y(last.c)} />
      ) : null}
    </svg>
  );
}

function AreaPlot({ series }: { series: number[] }) {
  if (series.length < 2) return <svg className="fx-svg" viewBox="0 0 480 240" />;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const x = (index: number) => 12 + (index / (series.length - 1)) * 400;
  const y = (value: number) => 16 + (1 - (value - min) / span) * 188;
  const line = series.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)} 210 L12 210 Z`;
  const last = series[series.length - 1] ?? 0;
  return (
    <svg className="fx-svg" viewBox="0 0 480 240" role="img" aria-label="Realized">
      {[0, 1, 2, 3].map((row) => {
        const value = min + ((3 - row) / 3) * span;
        const py = y(value);
        return (
          <g key={row}>
            <line stroke="rgba(94,168,220,0.16)" x1="8" x2="416" y1={py} y2={py} />
            <text fill="#7f96a8" fontSize="10" x="420" y={py + 3}>
              {Math.round(value)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="rgba(61,255,122,0.14)" />
      <path d={line} fill="none" stroke="#3dff7a" strokeWidth="1.6" />
      <circle cx={x(series.length - 1)} cy={y(last)} fill="#3dff7a" r="3" />
    </svg>
  );
}

function cubic(pts: readonly { x: number; y: number }[], t: number): { x: number; y: number } {
  const u = 1 - t;
  const p0 = pts[0];
  const p1 = pts[1];
  const p2 = pts[2];
  const p3 = pts[3];
  if (!p0 || !p1 || !p2 || !p3) return { x: 0, y: 0 };
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function NeuralShell({ pulse }: { pulse: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef(pulse);
  pulseRef.current = pulse;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const points = Array.from({ length: 1280 }, (_, index) => ({
      u: (index / 1280) * Math.PI * 2,
      v: (((index * 47) % 1280) / 1280) * Math.PI * 2,
      spike: index % 11 === 0,
      tone: index % 29 === 0 ? "sell" : index % 17 === 0 ? "buy" : "gold",
    }));
    let raf = 0;
    const draw = (time: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 2 || h < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const rot = time * 0.00022;
      const tilt = 0.72;
      const major = Math.min(w, h) * 0.34;
      const minor = major * 0.3;
      const cx = w * 0.52;
      const cy = h * 0.52;
      const halo = ctx.createRadialGradient(cx, cy, 8, cx, cy, major * 1.5);
      halo.addColorStop(0, "rgba(40,120,220,0.18)");
      halo.addColorStop(1, "rgba(40,120,220,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      const projected = points
        .map((point, index) => {
          const cu = Math.cos(point.u + rot);
          const su = Math.sin(point.u + rot);
          const cv = Math.cos(point.v);
          const sv = Math.sin(point.v);
          const x = (major + minor * cv) * cu;
          const y = minor * sv;
          const z = (major + minor * cv) * su;
          const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
          const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
          return { x: cx + x, y: cy + y2, z: z2, spike: point.spike, tone: point.tone, i: index };
        })
        .sort((a, b) => a.z - b.z);
      const colors = ["#3dff7a", "#5ec8ff", "#f0c14a", "#ff5a6a", "#d5e4ee", "#7aa2ff"];
      const strands = [0.12, 0.26, 0.4, 0.54, 0.68, 0.84].map((at, index) => {
        const y0 = h * at;
        const endY = cy + (index - 2.5) * minor * 0.55;
        const endX = cx - major * 0.55;
        return {
          color: colors[index] ?? "#5ec8ff",
          seed: index * 0.17,
          pts: [
            { x: 0, y: y0 },
            { x: w * 0.12, y: y0 },
            { x: endX - 40, y: endY },
            { x: endX, y: endY },
          ],
        };
      });
      const outbound = [0.18, 0.38, 0.58, 0.78].map((at, index) => {
        const startY = cy + (index - 1.5) * minor * 0.42;
        const startX = cx + major * 0.52;
        const y1 = h * at;
        return {
          color: colors[(index + 2) % colors.length] ?? "#f0c14a",
          seed: 0.31 + index * 0.19,
          pts: [
            { x: startX, y: startY },
            { x: startX + 36, y: startY },
            { x: w * 0.78, y: y1 },
            { x: w, y: y1 },
          ],
        };
      });
      const strandsAll = [...strands, ...outbound];
      for (const strand of strandsAll) {
        const [p0, p1, p2, p3] = strand.pts;
        if (!p0 || !p1 || !p2 || !p3) continue;
        ctx.strokeStyle = strand.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const rays: { x: number; y: number; dx: number; dy: number; reach: number; color: string; i: number }[] = [];
      for (const point of projected) {
        const depth = (point.z + major + minor) / (2 * (major + minor));
        const twinkle = 0.4 + 0.6 * Math.sin(time * 0.008 + point.i * 0.7);
        ctx.beginPath();
        const radial = Math.hypot(point.x - cx, point.y - cy);
        const outer = radial > major * 0.82;
        const color = point.spike && outer
          ? point.tone === "sell"
            ? `rgba(255,90,106,${0.55 + depth * 0.45})`
            : point.tone === "buy"
              ? `rgba(61,255,122,${0.5 + depth * 0.5})`
              : `rgba(240,193,74,${0.6 + depth * 0.4})`
          : `rgba(94,200,255,${0.25 + depth * 0.7 * twinkle})`;
        ctx.fillStyle = color;
        ctx.arc(point.x, point.y, point.spike && outer ? 1.6 + depth : 0.55 + depth * 1.15, 0, Math.PI * 2);
        ctx.fill();
        if (point.spike && outer && depth > 0.35) {
          const dx = point.x - cx;
          const dy = point.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const reach = (10 + depth * 28) * (0.55 + 0.45 * Math.sin(time * 0.004 + point.i));
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.x + (dx / len) * reach, point.y + (dy / len) * reach);
          ctx.stroke();
          rays.push({ x: point.x, y: point.y, dx: dx / len, dy: dy / len, reach, color, i: point.i });
        }
      }
      const boost = 1 + (pulseRef.current % 7) * 0.02;
      for (const strand of strandsAll) {
        for (let k = 0; k < 4; k += 1) {
          const t = (time * 0.00055 + strand.seed + k * 0.25) % 1;
          const head = cubic(strand.pts, t);
          const tail = cubic(strand.pts, Math.max(0, t - 0.06));
          ctx.globalAlpha = 0.7;
          ctx.strokeStyle = strand.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(head.x, head.y);
          ctx.stroke();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = strand.color;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 6 * boost, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const ray of rays) {
        const t = (time * 0.00085 + ray.i * 0.02) % 1;
        ctx.globalAlpha = 1 - t * 0.45;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ray.x + ray.dx * ray.reach * t, ray.y + ray.dy * ray.reach * t, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas className="shell-canvas" ref={ref} />;
}
