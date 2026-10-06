"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";

const BOOK = listSymbols().filter((symbol) => isTradeEligible(symbol, CHAIN.MAINNET_ID));
const NAMES = BOOK.length > 0 ? BOOK : ["NVDA", "AAPL", "SPY", "MSTR", "PLTR", "TSLA"];
const GATES = ["SIGNAL", "SESSION", "SIZE", "CAP", "DELAY", "COPY"] as const;
const NODES = [
  { label: "LEAD", color: "#5ec8ff" },
  { label: "KEEP", color: "#7aa2ff" },
  { label: "DESK", color: "#39ff7a" },
  { label: "BOOK", color: "#f0c14a" },
  { label: "NAV", color: "#c084fc" },
] as const;

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

      <section className="ws-top">
        <article className={`fx-panel fx-hero ${(sim?.realized ?? 0) >= 0 ? "up" : "down"}`} data-guide="metrics">
          <div className="fx-h">
            <span>Copy desk · {NAMES.length} names</span>
            <span className="fx-live">
              <i /> live
            </span>
          </div>
          <strong>{sim ? signed(sim.realized) : "—"}</strong>
          <p>Realized on the sim tape. Open {sim ? signed(sim.unrealized) : "—"}.</p>
          <dl>
            <div>
              <dt>Prints</dt>
              <dd>{sim?.trades ?? "—"}</dd>
            </div>
            <div>
              <dt>Win</dt>
              <dd>{winRate == null ? "—" : `${winRate.toFixed(1)}%`}</dd>
            </div>
            <div>
              <dt>Copied</dt>
              <dd>{sim ? `${Math.round((sim.logs.filter((line) => line.tag === "COPY").length / Math.max(1, sim.logs.length)) * 1000) / 10}%` : "—"}</dd>
            </div>
          </dl>
          <Spark values={sim?.path ?? []} color={(sim?.realized ?? 0) >= 0 ? "#39ff7a" : "#ff4d6a"} />
        </article>

        <article className="fx-panel ws-log" data-guide="tape">
          <div className="fx-h">
            <span>Copy tape</span>
            <span>{sim?.logs.length ?? 0}</span>
          </div>
          <div className="fx-log">
            {(sim?.logs ?? []).slice(0, 8).map((line, index) => (
              <div className={`ws-code ${index === 0 ? "new" : ""}`} key={line.id}>
                <span>{clock(line.atMs)}</span>
                <b className={line.tag === "COPY" ? "fx-up" : "fx-dn"}>{line.tag}</b>
                <b>{line.symbol}</b>
                <span className={line.side === "buy" ? "fx-up" : "fx-dn"}>{line.side.toUpperCase()}</span>
                <span>{line.detail}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="ws-stack">
          <article className="fx-panel ws-forge" data-guide="fills">
            <div className="fx-h">
              <span>Gates · every print</span>
              <span className="fx-am">{latest ? latest.symbol : "—"}</span>
            </div>
            <ol className="ws-steps">
              {GATES.map((gate, index) => (
                <li key={gate} data-on={sim ? index <= sim.trades % GATES.length : index === 0}>
                  {index + 1}
                  <small>{gate}</small>
                </li>
              ))}
            </ol>
            <div className="ws-run">
              <span />
              <b>{latest?.copied ? "COPY" : "SKIP"}</b>
            </div>
          </article>
          <article className="fx-panel ws-sched">
            <div className="fx-h">
              <span>Session · the day is a loop</span>
              <span>ET</span>
            </div>
            <div className="ws-lanes" aria-hidden="true">
              <i data-tone="pre" />
              <i data-tone="reg" />
              <i data-tone="post" />
              <i data-tone="halt" />
              <b />
            </div>
          </article>
        </div>
      </section>

      <section className="fx-panel ws-work" data-guide="shell">
        <div className="fx-h">
          <span>Workspace · leader, keeper, desk, book, nav</span>
          <span>centre {NODES[sim ? sim.trades % NODES.length : 0]?.label}</span>
        </div>
        <Workspace pulse={sim?.trades ?? 0} prints={sim?.prints.slice(0, 4) ?? []} />
      </section>

      <section className="ws-bottom">
        <article className="fx-panel" data-guide="rails">
          <div className="fx-h">
            <span>Five readings · one tape</span>
          </div>
          <div className="ws-desks">
            <DeskCard label="LEAD" tone="#5ec8ff" value={sim?.focus ?? "—"} series={sim?.path ?? []} />
            <DeskCard label="KEEP" tone="#7aa2ff" value={sim ? String(sim.logs.filter((line) => line.tag === "COPY").length) : "—"} series={sim?.prints.map((_, index) => index) ?? []} />
            <DeskCard label="DESK" tone="#39ff7a" value={sim ? signed(sim.realized) : "—"} series={sim?.path ?? []} />
            <DeskCard label="BOOK" tone="#f0c14a" value={String(NAMES.length)} series={sim?.prints.map((row) => (row.side === "sell" ? -1 : 1)) ?? []} />
            <DeskCard label="NAV" tone="#c084fc" value={nav} series={sim?.path.map((value) => -value) ?? []} />
          </div>
        </article>
        <article className="fx-panel" data-guide="prints">
          <div className="fx-h">
            <span>Eight gates · every fill goes through</span>
            <span>gate {(sim?.trades ?? 0) % 8}</span>
          </div>
          <GateField active={(sim?.trades ?? 0) % 8} />
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
    body: "Five readings from the sim tape: leader, copies kept, desk P&L, book size, and NAV.",
    place: "right",
  },
  {
    id: "shell",
    title: "Workspace",
    body: "Leader, keeper, desk, book, and NAV sit on the ring. The live node grows, and the latest prints stay tethered to it.",
    place: "inset",
  },
  {
    id: "fills",
    title: "Gates",
    body: "Every print walks signal, session, size, cap, delay, and copy. Lit steps are the ones this print has passed.",
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
    title: "Eight gates",
    body: "The same gates as a field. The gold column is the gate this print is on.",
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
      <Spark values={series} color={up ? "#3ecf8e" : "#ff5d6c"} />
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
            <line stroke="rgba(197,212,238,0.12)" x1="8" x2="572" y1={py} y2={py} />
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
            <line stroke={up ? "#39ff7a" : "#ff4d6a"} x1={x} x2={x} y1={y(bar.h)} y2={y(bar.l)} />
            <rect fill={up ? "#39ff7a" : "#ff4d6a"} height={Math.max(1.5, bot - top)} width={body} x={x - body / 2} y={top} className={index === bars.length - 1 ? "fx-candle-live" : undefined} />
          </g>
        );
      })}
      {last ? (
        <line stroke="#8b97ab" strokeDasharray="3 3" x1="8" x2="572" y1={y(last.c)} y2={y(last.c)} />
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
            <line stroke="rgba(197,212,238,0.12)" x1="8" x2="416" y1={py} y2={py} />
            <text fill="#7f96a8" fontSize="10" x="420" y={py + 3}>
              {Math.round(value)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="rgba(62,207,142,0.12)" />
      <path d={line} fill="none" stroke="#3ecf8e" strokeWidth="1.6" />
      <circle cx={x(series.length - 1)} cy={y(last)} fill="#3ecf8e" r="3" />
    </svg>
  );
}

function DeskCard({ label, tone, value, series }: { label: string; tone: string; value: string; series: number[] }) {
  return (
    <div className="ws-desk" style={{ "--tone": tone } as React.CSSProperties}>
      <b>{label}</b>
      <strong>{value}</strong>
      <Spark values={series} color={tone} />
    </div>
  );
}

function GateField({ active }: { active: number }) {
  const dots = Array.from({ length: 210 }, (_, index) => {
    const gate = index % 8;
    const row = Math.floor(index / 8);
    const y = 10 + ((row * 17 + gate * 9) % 100);
    const x = 18 + gate * 38 + ((index * 11) % 24);
    return { x, y, hot: gate === active };
  });
  return (
    <svg className="ws-gates" viewBox="0 0 340 120" role="img" aria-label="Eight gates">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((gate) => (
        <line
          key={gate}
          x1={30 + gate * 38}
          x2={30 + gate * 38}
          y1="4"
          y2="116"
          stroke={gate === active ? "#f0c14a" : "rgba(94,200,255,0.28)"}
          strokeWidth={gate === active ? 3 : 1}
        />
      ))}
      <path d="M12 86 C 60 78, 110 28, 160 42 S 250 96, 328 24" fill="none" stroke="#39ff7a" strokeWidth="1.6" />
      <path d="M12 48 C 80 60, 140 90, 200 70 S 280 30, 328 58" fill="none" stroke="rgba(94,200,255,0.45)" strokeWidth="1" />
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.hot ? 2.6 : 1.6} fill={dot.hot ? "#f0c14a" : "#39ff7a"} opacity={dot.hot ? 1 : 0.8} />
      ))}
    </svg>
  );
}

function Workspace({ prints }: { pulse: number; prints: Print[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
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
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w * 0.3, h * 0.34);
      const active = Math.floor(time / 2800) % NODES.length;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(94,200,255,0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      const spots = NODES.map((node, index) => {
        const angle = -Math.PI / 2 + (index / NODES.length) * Math.PI * 2;
        return { ...node, index, angle, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
      });
      const link = (x0: number, y0: number, x1: number, y1: number, color: string, alpha: number, width: number, bend = 18) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        const dx = y1 - y0;
        const dy = x0 - x1;
        const norm = Math.hypot(dx, dy) || 1;
        ctx.quadraticCurveTo(mx + (dx / norm) * bend, my + (dy / norm) * bend, x1, y1);
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      const minors: { x: number; y: number; color: string }[] = [];
      for (let i = 0; i < 36; i += 1) {
        const parent = spots[i % spots.length];
        if (!parent) continue;
        const angle = (i / 36) * Math.PI * 2 + 0.15;
        const rad = radius * (i % 2 === 0 ? 0.42 : 0.68);
        minors.push({ x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad, color: parent.color });
      }
      for (let i = 0; i < minors.length; i += 1) {
        const a = minors[i];
        const b = minors[(i + 1) % minors.length];
        const c = minors[(i + 6) % minors.length];
        if (!a || !b || !c) continue;
        link(a.x, a.y, b.x, b.y, a.color, 0.22, 0.7, 10);
        link(a.x, a.y, c.x, c.y, a.color, 0.1, 0.6, 22);
        link(cx, cy, a.x, a.y, a.color, 0.08, 0.6, 8);
      }
      for (let i = 0; i < spots.length; i += 1) {
        const a = spots[i];
        const b = spots[(i + 1) % spots.length];
        const c = spots[(i + 2) % spots.length];
        if (!a || !b || !c) continue;
        link(a.x, a.y, b.x, b.y, a.color, 0.55, 1.1, 28);
        link(a.x, a.y, c.x, c.y, a.color, 0.28, 0.9, 46);
        link(cx, cy, a.x, a.y, a.color, a.index === active ? 0.95 : 0.5, a.index === active ? 1.8 : 1, 12);
        const fan = a.index === active ? 28 : 16;
        for (let n = 0; n < fan; n += 1) {
          const spread = a.angle + (n - fan / 2) * (a.index === active ? 0.07 : 0.05);
          const len = radius * (a.index === active ? 0.28 : 0.16) + (n % 4) * (radius * 0.035);
          const sx = a.x + Math.cos(spread) * len;
          const sy = a.y + Math.sin(spread) * len;
          link(a.x, a.y, sx, sy, a.color, a.index === active ? 0.55 : 0.32, 0.8, 4);
          if (n % 2 === 0) {
            const neighbor = spots[(a.index + 1) % spots.length];
            if (neighbor) link(sx, sy, neighbor.x, neighbor.y, a.color, 0.08, 0.5, 20);
          }
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = n % 4 === 0 ? "#f0c14a" : a.color;
          ctx.shadowColor = a.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, n % 5 === 0 ? 2.6 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      for (const minor of minors) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = minor.color;
        ctx.beginPath();
        ctx.arc(minor.x, minor.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const spot of spots) {
        for (let k = 0; k < 3; k += 1) {
          const t = (time * 0.0004 + spot.index * 0.17 + k * 0.33) % 1;
          ctx.fillStyle = spot.color;
          ctx.shadowColor = spot.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(cx + (spot.x - cx) * t, cy + (spot.y - cy) * t, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      for (const spot of spots) {
        const on = spot.index === active;
        const r = on ? 18 : 8;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, r, 0, Math.PI * 2);
        ctx.fillStyle = spot.color;
        ctx.shadowColor = spot.color;
        ctx.shadowBlur = on ? 22 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#d7e7f5";
        ctx.fillText(spot.label, spot.x, spot.y + r + 12);
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#070b12";
      ctx.strokeStyle = "#e7edf6";
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e7edf6";
      ctx.fillRect(cx - 6, cy - 7, 3.5, 14);
      ctx.fillRect(cx + 2.5, cy - 7, 3.5, 14);
      const cards = [
        { x: w * 0.12, y: h * 0.2 },
        { x: w * 0.88, y: h * 0.22 },
        { x: w * 0.14, y: h * 0.78 },
        { x: w * 0.86, y: h * 0.76 },
      ];
      cards.forEach((card, index) => {
        const spot = spots[index % spots.length];
        if (!spot) return;
        ctx.beginPath();
        ctx.moveTo(card.x, card.y);
        ctx.lineTo(spot.x, spot.y);
        ctx.strokeStyle = spot.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="ws-stage">
      <canvas className="shell-canvas" ref={ref} />
      {prints.map((row, index) => (
        <div className={`ws-float ${row.side}`} key={row.id} style={{ animationDelay: `${index * -1.6}s` }} data-slot={index}>
          <b>{row.symbol}</b>
          <span>{row.side.toUpperCase()}</span>
          <strong>{money(row.notional)}</strong>
          <i />
        </div>
      ))}
    </div>
  );
}

