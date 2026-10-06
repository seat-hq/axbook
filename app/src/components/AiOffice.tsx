"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";

/* =========================================================================
   AXBOOK copy-desk dashboard. Same animated shell as the office layout,
   filled with this project's desks: leader, keeper, vault, book, NAV.
   Live deposit / redeem forms come in through `forms`.
   ========================================================================= */

const BOOK = listSymbols().filter((symbol) => isTradeEligible(symbol, CHAIN.MAINNET_ID));
const NAMES = BOOK.length > 0 ? BOOK : ["NVDA", "AAPL", "SPY", "MSTR", "PLTR", "TSLA"];

const TIMING = {
  beat: 1100,
  log: 2100,
  forge: 1500,
  activeBeats: 5,
  centreBeats: 3,
};

type Role = {
  code: string;
  name: string;
  color: string;
  icon: "strat" | "outbd" | "paid" | "anlst" | "acct";
};

const ROLES: Role[] = [
  { code: "LEAD", name: "Leader wallet", color: "#5ec8ff", icon: "strat" },
  { code: "KEEP", name: "Keeper copies", color: "#7aa2ff", icon: "outbd" },
  { code: "DESK", name: "USDG vault", color: "#39ff7a", icon: "paid" },
  { code: "BOOK", name: "Stock Tokens", color: "#f0c14a", icon: "anlst" },
  { code: "NAV", name: "Book shares", color: "#c084fc", icon: "acct" },
];

const CENTRES = ["AX", "LEAD", "KEEP", "DESK", "BOOK", "NAV"];

const FEED: { t: string; c?: string }[] = [
  { t: "DEPOSIT USDG", c: "g" },
  { t: "MINT BOOK SHARES", c: "g" },
  { t: "LEADER FILLS FROM THEIR WALLET" },
  { t: "KEEPER PROPOSES A SMALLER COPY" },
  { t: "SIGNAL" },
  { t: "SESSION" },
  { t: "SIZE" },
  { t: "CAP" },
  { t: "DELAY" },
  { t: "COPY", c: "g" },
  { t: "SKIP · ASSET NOT ALLOWED", c: "r" },
  { t: "SKIP · SESSION CLOSED", c: "r" },
  { t: "SKIP · STALE PRICE", c: "y" },
  { t: "SKIP · SIZE BREAKS A LIMIT", c: "r" },
  { t: "NVDA BUY COPIED", c: "g" },
  { t: "AAPL SELL SKIPPED", c: "r" },
  { t: "REDEEM SHARES FOR USDG", c: "g" },
  { t: "NO FEE ON VOLUME" },
  { t: "NAV FROM BALANCEOFUI" },
  { t: "NOT AFFILIATED WITH ROBINHOOD MARKETS", c: "w" },
];

const FOOTER: { t: string; c?: string }[] = [
  { t: "AXBOOK" },
  { t: "COPY DESK, NOT A SNIPER BOT", c: "w" },
  { t: "DEPOSIT USDG · RECEIVE BOOK SHARES", c: "g" },
  { t: "SHARES CLAIM THE DESK NAV" },
  { t: "LEADER KEY STAYS IN THEIR WALLET" },
  { t: "KEEPER MAY PLACE A SMALLER COPY" },
  { t: "SESSION SIZE, THEN CAPS, THEN DRAWDOWN HALT" },
  { t: "REDEEM IF THE VAULT HAS CASH", c: "g" },
  { t: "COPIES ARE DELAYED, SCALED, AND CAPPED" },
  { t: "NO FEE ON VOLUME" },
  { t: "70% LEADER / 20% PROTOCOL / 10% STAKERS" },
  { t: "ROBINHOOD CHAIN 4663 · TESTNET 46630" },
  { t: "ACCOUNTING ASSET USDG, 6 DECIMALS" },
  { t: "STOCK TOKENS ARE NOT SHARES", c: "y" },
  { t: "NOT INVESTMENT ADVICE", c: "r" },
];

const LOG_MSGS = [
  "leader fill proposed as a smaller copy",
  "session closed — skip",
  "stale oracle price — skip",
  "size breaks the fill cap — resize",
  "asset not on the allowlist — skip",
  "gross exposure would breach — skip",
  "drawdown halt from high-water NAV",
  "copy placed in the desk vault",
  "after-hours size is smaller",
  "USDG deposit minted book shares",
  "redeem queued — vault cash short",
  "keeper bound to vault.leader",
];
const LOG_TAGS = [
  { t: "COPY", c: "pass" },
  { t: "SKIP", c: "caution" },
  { t: "SIZE", c: "routed" },
  { t: "HALT", c: "faction" },
  { t: "STALE", c: "client" },
  { t: "CAP", c: "approved" },
];

const SKILLS = ["SIGNAL", "SESSION", "SIZE", "CAP", "DELAY", "COPY"];
const TEACH_DRAFTS = NAMES.slice(0, 3);

// ---- helpers -------------------------------------------------------------
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
const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length) % arr.length];

function sparkPath(seed: number, w: number, h: number, pts = 40, spike = 0.9) {
  const r = mulberry32(seed);
  const vals: number[] = [];
  for (let i = 0; i < pts; i++) {
    const base = 0.12 + r() * 0.18;
    const s = r() > 0.82 ? base + r() * spike : base;
    vals.push(Math.min(1, s));
  }
  let d = "";
  vals.forEach((v, i) => {
    const x = (i / (pts - 1)) * w;
    const y = h - v * h * 0.92 - 2;
    d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `${d}L${w},${h}L0,${h}Z`;
  return { line: d, area };
}

// ---- role glyphs ---------------------------------------------------------
function Glyph({ icon, color }: { icon: Role["icon"]; color: string }) {
  const c = color;
  switch (icon) {
    case "strat":
      return (
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M4 10a3 3 0 010-6 4 4 0 017.6 1A2.5 2.5 0 1112 10H4z" fill={c} opacity="0.9" />
        </svg>
      );
    case "outbd":
      return (
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M2 8l12-5-4 12-2.5-4.5L2 8z" fill={c} opacity="0.9" />
        </svg>
      );
    case "paid":
      return (
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" fill={c} opacity="0.9" />
          <path d="M8 4.5v7M6.2 6.2h3.1a1.3 1.3 0 010 2.6H6.7a1.3 1.3 0 000 2.6h3.1" stroke="#0a0a06" strokeWidth="0.9" />
        </svg>
      );
    case "anlst":
      return (
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2" y="9" width="3" height="5" fill={c} opacity="0.9" />
          <rect x="6.5" y="5" width="3" height="9" fill={c} opacity="0.9" />
          <rect x="11" y="7" width="3" height="7" fill={c} opacity="0.9" />
        </svg>
      );
    case "acct":
      return (
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5.5" r="2.6" fill={c} opacity="0.9" />
          <path d="M3 14a5 5 0 0110 0H3z" fill={c} opacity="0.9" />
        </svg>
      );
  }
}

// =========================================================================
// Radial agent graph (canvas)
// =========================================================================
function Workspace({ active, counts }: { active: number; counts: number[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  const countsRef = useRef(counts);
  activeRef.current = active;
  countsRef.current = counts;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const colors = ROLES.map((r) => r.color);
    const rand = mulberry32(1337);
    // minor nodes: polar, each owned by a role
    const minors = Array.from({ length: 210 }, () => ({
      ang: rand() * Math.PI * 2,
      rad: 0.16 + Math.pow(rand(), 0.7) * 0.82,
      role: Math.floor(rand() * ROLES.length),
      sz: 0.6 + rand() * 1.4,
      ph: rand(),
    }));

    const resize = () => {
      const b = cv.getBoundingClientRect();
      w = b.width;
      h = b.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const withAlpha = (hex: string, a: number) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.46;
      const rot = ts * 0.00003;
      const act = activeRef.current;

      // disk outline
      ctx.strokeStyle = "rgba(94,160,220,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(94,160,220,0.05)";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.66, 0, Math.PI * 2);
      ctx.stroke();

      // major node base positions (pentagon, slowly rotating)
      const nodes = ROLES.map((_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / ROLES.length + rot;
        const nr = R * 0.6;
        return { x: cx + Math.cos(a) * nr, y: cy + Math.sin(a) * nr };
      });
      // active node pulls toward centre-right and grows
      const grok = { x: cx + Math.sin(rot * 2) * R * 0.1, y: cy + Math.cos(rot * 1.6) * R * 0.08 };

      // minor dots + arc edges to owning node
      for (const m of minors) {
        const a = m.ang + rot * (m.role === act ? 2.2 : 1);
        const rr = m.rad * R;
        const mx = cx + Math.cos(a) * rr;
        const my = cy + Math.sin(a) * rr;
        const n = nodes[m.role];
        const isAct = m.role === act;
        // arc bows toward centre (hyperbolic look)
        const midx = (mx + n.x) / 2 + (cx - (mx + n.x) / 2) * 0.28;
        const midy = (my + n.y) / 2 + (cy - (my + n.y) / 2) * 0.28;
        ctx.strokeStyle = withAlpha(colors[m.role], isAct ? 0.3 : 0.07);
        ctx.lineWidth = isAct ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.quadraticCurveTo(midx, midy, mx, my);
        ctx.stroke();
        // dot
        ctx.fillStyle = withAlpha(colors[m.role], isAct ? 0.9 : 0.45);
        ctx.beginPath();
        ctx.arc(mx, my, m.sz * (isAct ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fill();
        // travelling particle on active edges
        if (isAct) {
          const t = (ts * 0.00045 + m.ph) % 1;
          const px = n.x + (mx - n.x) * t + (midx - (n.x + mx) / 2) * 2 * t * (1 - t);
          const py = n.y + (my - n.y) * t + (midy - (n.y + my) / 2) * 2 * t * (1 - t);
          ctx.fillStyle = withAlpha(colors[m.role], 1);
          ctx.beginPath();
          ctx.arc(px, py, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // links from each node to GROK centre
      nodes.forEach((n, i) => {
        ctx.strokeStyle = withAlpha(colors[i], i === act ? 0.55 : 0.18);
        ctx.lineWidth = i === act ? 2 : 1;
        const midx = (n.x + grok.x) / 2;
        const midy = (n.y + grok.y) / 2 - 18;
        ctx.beginPath();
        ctx.moveTo(grok.x, grok.y);
        ctx.quadraticCurveTo(midx, midy, n.x, n.y);
        ctx.stroke();
      });

      // major nodes
      nodes.forEach((n, i) => {
        const isAct = i === act;
        const base = 7 + Math.min(26, (countsRef.current[i] || 0) * 0.08);
        const rad = isAct ? base + 14 + Math.sin(ts * 0.004) * 1.5 : 8;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad * 2.4);
        g.addColorStop(0, withAlpha(colors[i], isAct ? 0.5 : 0.28));
        g.addColorStop(1, withAlpha(colors[i], 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (isAct) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(n.x - rad * 0.28, n.y - rad * 0.28, rad * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // GROK centre — black sphere with pause bars
      const gr = 22;
      const gg = ctx.createRadialGradient(grok.x - 6, grok.y - 8, 2, grok.x, grok.y, gr);
      gg.addColorStop(0, "#2a3650");
      gg.addColorStop(1, "#05070d");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(grok.x, grok.y, gr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(94,160,220,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#dfe8f5";
      ctx.fillRect(grok.x - 5, grok.y - 6, 3.4, 12);
      ctx.fillRect(grok.x + 1.6, grok.y - 6, 3.4, 12);
      ctx.font = "700 9px var(--font-mono, monospace)";
      ctx.fillStyle = "rgba(205,219,236,0.75)";
      ctx.textAlign = "center";
      ctx.fillText("AX", grok.x, grok.y - gr - 6);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ao-ws-canvas" />;
}

// =========================================================================
// Eight-gate method field (SVG, deterministic geometry)
// =========================================================================
function MethodField() {
  const geo = useMemo(() => {
    const r = mulberry32(777);
    const W = 1000;
    const H = 360;
    const gates = 8;
    const dots: { x: number; y: number; g: boolean; r: number }[] = [];
    for (let c = 0; c < gates; c++) {
      const gx = ((c + 0.5) / gates) * W;
      const n = 20 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const x = gx + (r() - 0.5) * (W / gates) * 0.8;
        const y = 24 + r() * (H - 120);
        dots.push({ x, y, g: r() < 0.25 + c * 0.1, r: 1 + r() * 1.6 });
      }
    }
    // sankey ribbons along the bottom third
    const ribbons = [
      { col: "#39ff7a", y0: 250, y1: 300, t: 70 },
      { col: "#f0c14a", y0: 304, y1: 322, t: 22 },
      { col: "#a877ff", y0: 326, y1: 340, t: 16 },
      { col: "#4a86ff", y0: 344, y1: 356, t: 12 },
    ].map((b) => {
      const yL = (b.y0 + b.y1) / 2;
      const yR = b.y0 + (b.y1 - b.y0) * (0.2 + r() * 0.6) - 40 + r() * 20;
      const d = `M0,${b.y0} C${W * 0.4},${b.y0} ${W * 0.6},${yR - b.t / 2} ${W},${yR - b.t / 2} L${W},${yR + b.t / 2} C${W * 0.6},${yR + b.t / 2} ${W * 0.4},${b.y1} 0,${b.y1} Z`;
      void yL;
      return { ...b, d };
    });
    return { W, H, gates, dots, ribbons };
  }, []);

  return (
    <svg viewBox={`0 0 ${geo.W} ${geo.H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ao-method-bg" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(57,255,122,0.02)" />
          <stop offset="1" stopColor="rgba(57,255,122,0.1)" />
        </linearGradient>
      </defs>
      <rect x="0" y="40" width={geo.W} height="210" fill="url(#ao-method-bg)" />
      {Array.from({ length: geo.gates }).map((_, i) => {
        const x = ((i + 0.5) / geo.gates) * geo.W;
        const on = i === 6;
        return (
          <g key={i}>
            <line x1={x} y1={10} x2={x} y2={geo.H - 10} stroke={on ? "#f0c14a" : "rgba(94,200,255,0.4)"} strokeWidth={on ? 2 : 1} />
            <circle cx={x} cy={14} r={3} fill={on ? "#f0c14a" : "#5ec8ff"} />
            <text x={x} y={geo.H - 2} fill="rgba(126,145,167,0.9)" fontSize="11" textAnchor="middle" fontFamily="var(--font-mono, monospace)">
              {i + 1}
            </text>
          </g>
        );
      })}
      {geo.dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.g ? "rgba(57,255,122,0.85)" : "rgba(94,200,255,0.6)"}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (i % 5)}s`} repeatCount="indefinite" begin={`${(i % 7) * 0.2}s`} />
        </circle>
      ))}
      {geo.ribbons.map((b, i) => (
        <path key={i} d={b.d} fill={b.col} opacity="0.32">
          <animate attributeName="opacity" values="0.22;0.4;0.22" dur="5s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
        </path>
      ))}
    </svg>
  );
}

// =========================================================================
// Main dashboard
// =========================================================================
export default function AiOffice({
  title = "Copy desk",
  vault = "—",
  wallet = null,
  nav = "—",
  cash = "—",
  seats = "—",
  forms = null,
  note = null,
  deskChain,
}: {
  title?: string;
  vault?: string;
  wallet?: ReactNode;
  nav?: string;
  cash?: string;
  seats?: string;
  forms?: ReactNode;
  note?: string | null;
  leader?: `0x${string}` | null;
  deskChain?: number;
}) {
  const [beat, setBeat] = useState(0);
  const [clock, setClock] = useState({ hms: "00:00:00", live: true });
  const [stats, setStats] = useState({
    copies: 24,
    skips: 11,
    copyRate: 68.4,
    names: NAMES.length,
  });
  const [roleData, setRoleData] = useState(() =>
    ROLES.map((r, i) => ({
      count: [2, 34, 4, 5, 1][i],
      pct: [6.6, 73.1, 8.4, 10.0, 3.1][i],
      clients: 3 + i,
      tasks: 7 + i * 5,
      skills: 2 + (i % 3),
      routines: 2 + (i % 4),
      signals: 300 + i * 7,
    })),
  );
  const [log, setLog] = useState<{ id: number; tm: string; who: Role; msg: string; tag: (typeof LOG_TAGS)[number] }[]>([]);
  const [forge, setForge] = useState({
    skill: SKILLS[0],
    idx: 4,
    total: 5,
    phase: "run" as "run" | "draft" | "save",
    color: "green" as "green" | "teach",
  });
  const [saved, setSaved] = useState({ count: 15, freshAt: -1 });
  const logId = useRef(100);

  const active = Math.floor(beat / TIMING.activeBeats) % ROLES.length;
  const centre = CENTRES[Math.floor(beat / TIMING.centreBeats) % CENTRES.length];

  // clock
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setClock({ hms: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`, live: d.getSeconds() % 11 !== 0 });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // sim beat
  useEffect(() => {
    const t = setInterval(() => {
      setBeat((b) => b + 1);
      const r = Math.random();
      setStats((s) => ({
        copies: s.copies + (r > 0.45 ? 1 : 0),
        skips: s.skips + (r > 0.72 ? 1 : 0),
        copyRate: +(62 + Math.random() * 18).toFixed(1),
        names: NAMES.length,
      }));
      setRoleData((prev) => {
        const act = Math.floor((beatRef.current + 1) / TIMING.activeBeats) % ROLES.length;
        return prev.map((d, i) => {
          const inc = i === act ? Math.floor(Math.random() * 9) + 2 : Math.random() > 0.6 ? 1 : 0;
          return { ...d, count: d.count + inc, signals: d.signals + (i === act ? Math.floor(Math.random() * 4) : 0) };
        });
      });
    }, TIMING.beat);
    return () => clearInterval(t);
  }, []);

  const beatRef = useRef(0);
  beatRef.current = beat;

  // recompute pct shares whenever counts change
  useEffect(() => {
    setRoleData((prev) => {
      const total = prev.reduce((a, d) => a + d.count, 0) || 1;
      return prev.map((d) => ({ ...d, pct: +((d.count / total) * 100).toFixed(1) }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  // agent log
  useEffect(() => {
    const push = () => {
      const now = new Date();
      const tm = `09:${pad(now.getUTCMinutes() % 60)}:${pad(now.getUTCSeconds())}`;
      setLog((prev) => {
        const row = {
          id: logId.current++,
          tm,
          who: pick(ROLES, Math.random()),
          msg: pick(LOG_MSGS, Math.random()),
          tag: pick(LOG_TAGS, Math.random()),
        };
        return [row, ...prev].slice(0, 9);
      });
    };
    for (let i = 0; i < 9; i++) push();
    const t = setInterval(push, TIMING.log);
    return () => clearInterval(t);
  }, []);

  // skill forge state machine
  useEffect(() => {
    const t = setInterval(() => {
      setForge((f) => {
        if (f.phase === "run") {
          if (f.idx + 1 >= f.total) return { ...f, idx: f.total, phase: "draft" };
          return { ...f, idx: f.idx + 1 };
        }
        if (f.phase === "draft") return { ...f, phase: "save" };
        // save -> commit + start next
        setSaved((s) => ({ count: s.count + 1, freshAt: Date.now() }));
        const next = SKILLS[(SKILLS.indexOf(f.skill) + 1) % SKILLS.length] ?? SKILLS[0];
        return {
          skill: next,
          idx: 0,
          total: 6,
          phase: "run",
          color: Math.random() > 0.5 ? "teach" : "green",
        };
      });
    }, TIMING.forge);
    return () => clearInterval(t);
  }, []);

  const counts = roleData.map((d) => d.count);
  const approve = useMemo(() => sparkPath(beat + 7, 100, 44, 46, 1.1), [beat]);
  const handoff = useMemo(() => {
    const r = mulberry32(beat * 13 + 1);
    const a = pick(ROLES, r());
    let b = pick(ROLES, r());
    if (b.code === a.code) b = ROLES[(ROLES.indexOf(a) + 2) % ROLES.length];
    return `${a.code} → ${b.code}`;
  }, [beat]);

  const slotFor = (code: string): React.CSSProperties => {
    switch (code) {
      case "KEEP":
        return { top: "6%", left: "1.5%" };
      case "LEAD":
        return { top: "6%", right: "1.5%" };
      case "NAV":
        return { top: "42%", left: "1.5%" };
      case "BOOK":
        return { top: "42%", right: "1.5%" };
      default:
        return { bottom: "9%", left: "1.5%" };
    }
  };

  const savedCells = Array.from({ length: 16 }, (_, i) => ({
    g: (i + saved.count) % 3 === 0,
    fresh: i === 15 && Date.now() - saved.freshAt < 1200,
  }));

  return (
    <div className="ao">
      {/* ---- header ---- */}
      <header className="ao-top">
        <div className="ao-brand">
          <div className="ao-logo">AX</div>
          <div className="ao-brand-tx">
            <div className="ao-brand-k">
              <span className="ao-dot" style={{ width: 5, height: 5 }} />
              <b>FOLLOW THE BOOK</b>
              <span className="ao-chip-xs">HOLD THE SHARES</span>
            </div>
            <div className="ao-title">
              <span className="b">AXBOOK</span>
              <span className="s">//</span> COPY DESK
            </div>
          </div>
        </div>
        <div className="ao-stats">
          <div className="ao-stat">
            <div className="k">NAV</div>
            <div className="v">
              {nav} <span className="ao-livetag">LIVE</span>
            </div>
          </div>
          <div className="ao-stat">
            <div className="k">Cash</div>
            <div className="v">{cash}</div>
          </div>
          <div className="ao-stat">
            <div className="k">Shares</div>
            <div className="v">{seats}</div>
          </div>
          <div className="ao-stat">
            <div className="k">Vault</div>
            <div className="v">{vault}</div>
          </div>
        </div>
        <div className="ao-clock">
          <div className="v">
            {clock.hms} <span className="u">UTC</span>
          </div>
          <div className={`st${clock.live ? " live" : ""}`}>
            <b>{clock.live ? "LIVE" : "LOST"}</b> {deskChain ?? "UTC"}
            {title ? ` · ${title}` : ""}
          </div>
        </div>
        {wallet ? <div className="ao-wallet">{wallet}</div> : null}
      </header>

      {/* ---- feed ---- */}
      <div className="ao-feed">
        <div className="ao-feed-lab">
          <span className="d" />
          LIVE TAPE
        </div>
        <div className="ao-marq">
          <div className="ao-marq-in">
            {[...FEED, ...FEED].map((f, i) => (
              <span key={i}>
                <span className={f.c || ""}>{f.t}</span>
                <span className="sep">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ---- top row ---- */}
      <div className="ao-row3">
        {/* office panel */}
        <section className="ao-panel">
          <div className="ao-ph">
            <span className="ao-dot" />
            <span className="t">COPY DESK · {NAMES.length} NAMES</span>
            <span className="meta green">ACTIVE</span>
          </div>
          <div className="ao-office-body">
            <div className="ao-office-path">
              leader wallet · keeper · vault · book · nav <b>USDG</b>
            </div>
            <div className="ao-big">{nav}</div>
            <div className="ao-big-k">Desk NAV, cash plus positions</div>
            <div className="ao-big-note">▲ BOOK SHARES CLAIM THIS VAULT · {cash} CASH</div>
            <div className="ao-mini3">
              <div>
                <div className="k">Cash</div>
                <div className="v">{cash}</div>
              </div>
              <div>
                <div className="k">Shares</div>
                <div className="v g">{seats}</div>
              </div>
              <div>
                <div className="k">Copy rate</div>
                <div className="v g">{stats.copyRate}%</div>
              </div>
            </div>
            <div className="ao-approve">
              <div className="cap">SIM TAPE / SPREAD</div>
              <svg viewBox="0 0 100 44" preserveAspectRatio="none">
                <path d={approve.area} fill="rgba(57,255,122,0.14)" />
                <path d={approve.line} fill="none" stroke="#39ff7a" strokeWidth="1" />
              </svg>
              <div className="cap">COPIES {stats.copies} · SKIPS {stats.skips}</div>
              <div className="ao-bars">
                {Array.from({ length: 11 }).map((_, i) => (
                  <i key={i} style={{ height: `${30 + ((i * 37 + beat * 13) % 70)}%` }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* agent log */}
        <section className="ao-panel">
          <div className="ao-ph">
            <span className="ao-dot" />
            <span className="t">COPY TAPE</span>
            <span className="meta red">{clock.hms}</span>
          </div>
          <div className="ao-log-body">
            <div className="ao-log-head">
              <span>Time</span>
              <span>Who</span>
              <span>What happened</span>
              <span />
            </div>
            <div className="ao-log-rows">
              {log.map((row, i) => (
                <div key={row.id} className={`ao-log-row${i === 0 ? " fresh" : ""}`}>
                  <span className="tm">{row.tm}</span>
                  <span className="who" style={{ color: row.who.color }}>
                    {row.who.code}
                  </span>
                  <span className="msg">{row.msg}</span>
                  <span className={`tag ao-tag-${row.tag.c}`}>{row.tag.t}</span>
                </div>
              ))}
            </div>
            <div className="ao-log-foot">
              {stats.copies} COPIES · {stats.skips} SKIPS · {NAMES.length} NAMES · LEADER KEY STAYS OUT
            </div>
          </div>
        </section>

        {/* forge + schedule stack */}
        <div className="ao-stack">
          <section className="ao-panel">
            <div className="ao-ph">
              <span className="ao-dot" />
              <span className="t">GATES</span>
              <span className="sub">· EVERY PRINT</span>
              <span className={`meta ${forge.phase === "save" ? "red" : "green"}`}>
                {forge.phase === "save" ? "COPY" : forge.phase === "draft" ? "SKIP" : `GATE ${forge.idx} OF ${forge.total}`}
              </span>
            </div>
            <div className="ao-forge-body">
              <div className="ao-forge-top">
                <div className="ao-forge-left">
                  <div className="ao-forge-lab">RISK FIRST, THEN A COPY</div>
                  <div className="ao-forge-name">{forge.skill}</div>
                  <div className="ao-cells">
                    {Array.from({ length: Math.min(forge.total, SKILLS.length) }).map((_, i) => (
                      <div key={i} className={`ao-cell ${i < forge.idx ? (forge.color === "teach" ? "teach" : "on") : "empty"}`}>
                        {i + 1}
                      </div>
                    ))}
                    {forge.phase !== "run" && (
                      <span className={`ao-chip-skill ${forge.phase === "save" ? "save" : "draft"}`}>
                        {forge.phase === "save" ? "COPY" : "SKIP"}
                      </span>
                    )}
                  </div>
                  <div className="ao-forge-sub">SIGNAL · SESSION · SIZE · CAP · DELAY · COPY</div>
                </div>
                <div className="ao-arrow" />
                <div className="ao-forge-right">
                  <div className="ao-saved-lab">
                    <span>ALLOWLIST</span>
                    <b>{NAMES.length}</b>
                  </div>
                  <div className="ao-saved-grid">
                    {savedCells.map((c, i) => (
                      <i key={i} className={`${c.g ? "g" : ""}${c.fresh ? " fresh" : ""}`} />
                    ))}
                  </div>
                  <div className="ao-teach">
                    <div className="ao-saved-lab">
                      <span>BOOK</span>
                    </div>
                    <div className="ao-teach-row">
                      {TEACH_DRAFTS.map((d, i) => (
                        <b key={i}>{d}</b>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ao-prog">
                <div className="ao-prog-bar">
                  <i style={{ width: `${(forge.idx / forge.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="ao-panel">
            <div className="ao-ph">
              <span className="ao-dot" />
              <span className="t">SESSION</span>
              <span className="sub">· THE DAY IS A LOOP</span>
              <span className="meta red">ET</span>
            </div>
            <div className="ao-sched-body">
              <div className="ao-sched-lanes">
                {Array.from({ length: 8 }).map((_, lane) => {
                  const r = mulberry32(lane * 31 + 5);
                  let cursor = r() * 4;
                  const blocks: { left: number; width: number; col: string }[] = [];
                  while (cursor < 95) {
                    const width = 4 + r() * 12;
                    if (r() > 0.14) blocks.push({ left: cursor, width, col: ROLES[Math.floor(r() * ROLES.length)].color });
                    cursor += width + 1.5 + r() * 4;
                  }
                  return (
                    <div key={lane} className="ao-lane">
                      {blocks.map((b, i) => (
                        <span key={i} className="ao-blk" style={{ left: `${b.left}%`, width: `${b.width}%`, background: b.col }} />
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="ao-play" />
              <div className="ao-sched-foot">
                <span>{pad((beat * 2) % 24)}:{pad((beat * 7) % 60)}</span>
                <span>PRE · REG · POST · HALT</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ---- workspace ---- */}
      <section className="ao-panel ao-ws">
        <div className="ao-ph">
          <span className="ao-dot" />
          <span className="t">THE WORKSPACE</span>
          <span className="sub">LEADER · KEEPER · DESK · BOOK · NAV · 210 NODES · ARC EDGES ON THE DESK GRAPH</span>
          <span className="meta">COPIES {stats.copies} · SKIPS {stats.skips}</span>
        </div>
        <Workspace active={active} counts={counts} />
        {ROLES.map((role, i) => {
          const d = roleData[i];
          const isAct = i === active;
          return (
            <div
              key={role.code}
              className={`ao-ncard${isAct ? " active" : ""}`}
              style={{ ...slotFor(role.code), ["--c" as string]: role.color }}
            >
              <div className="ao-ncard-h">
                <span className="d" />
                <span className="code">{role.code}</span>
                <span className="nm">{role.name}</span>
              </div>
              <div className="ao-ncard-n">
                <b>{d.count}</b>
                <span className="pct">{d.pct}%</span>
              </div>
              <div className="ao-ncard-bar">
                <i style={{ width: `${Math.min(100, d.pct * 1.3)}%` }} />
              </div>
              <div className="ao-ncard-s">
                {role.code === "BOOK"
                  ? `${NAMES.length} NAMES ON THE ALLOWLIST`
                  : role.code === "NAV"
                    ? `SHARES ${seats} · CLAIM ON NAV`
                    : role.code === "DESK"
                      ? `CASH ${cash} · USDG VAULT`
                      : role.code === "KEEP"
                        ? `${stats.copies} COPIES THIS TAPE`
                        : `${title} · KEY STAYS OUT`}
              </div>
              <div className="ao-ncard-sig">
                {role.code === "LEAD" ? "FILLS FROM THE LEADER WALLET" : `SIGNALS THIS SESSION ${d.signals}`}
              </div>
            </div>
          );
        })}
        <div className="ao-ws-foot">
          <span>
            {pad((beat * 2) % 24)}:{pad((beat * 11) % 60)} HANDOFF · {handoff} → THROUGH THE VAULT · LEADER KEY STAYS OUT
          </span>
          <span className="c">
            CENTRE: <b>{centre}</b>
          </span>
        </div>
      </section>

      {/* ---- bottom row ---- */}
      <div className="ao-row5">
        {/* five desks */}
        <section className="ao-panel">
          <div className="ao-ph">
            <span className="ao-dot" />
            <span className="t">FIVE READINGS</span>
            <span className="sub">· ONE TAPE</span>
            <span className="meta green">● {ROLES[active].code} ACTIVE</span>
          </div>
          <div className="ao-desks">
            {ROLES.map((role, i) => {
              const d = roleData[i];
              const isAct = i === active;
              const sp = sparkPath(i * 17 + 3 + (isAct ? beat : 0), 100, 40, 34, isAct ? 1.2 : 0.7);
              return (
                <div key={role.code} className={`ao-desk${isAct ? " active" : ""}`} style={{ ["--c" as string]: role.color }}>
                  <div className="ao-desk-h">
                    <span className="ao-desk-ic">
                      <Glyph icon={role.icon} color={role.color} />
                    </span>
                    <span className="ao-desk-code">{role.code}</span>
                    {isAct && <span className="ao-desk-on" />}
                  </div>
                  <div className="ao-desk-nm">{role.name}</div>
                  <div className="ao-desk-spark">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path d={sp.area} fill={role.color} opacity="0.14" />
                      <path d={sp.line} fill="none" stroke={role.color} strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="ao-desk-stats">
                    <div className="ao-desk-rate">
                      <b>{(d.count / 10).toFixed(1)}</b>
                      <span>/h</span>
                    </div>
                    <div className="ao-desk-row">
                      <span>PRINTS</span>
                      <b>{d.tasks}</b>
                    </div>
                    <div className="ao-desk-row">
                      <span>7D AVG</span>
                      <b>{(d.count / 7).toFixed(1)}</b>
                    </div>
                    <div className="ao-desk-prog">
                      <i style={{ width: `${Math.min(100, d.pct * 1.3)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* method */}
        <section className="ao-panel">
          <div className="ao-ph">
            <span className="ao-dot" />
            <span className="t">THE METHOD</span>
            <span className="sub">· GATES EVERY FILL GOES THROUGH</span>
            <span className="meta red">GATE {(beat % 6) + 1} · {SKILLS[beat % SKILLS.length]}</span>
          </div>
          <div className="ao-method-body">
            <MethodField />
          </div>
        </section>

        <section className="ao-panel ao-forms">
          <div className="ao-ph">
            <span className="ao-dot" />
            <span className="t">DESK</span>
            <span className="sub">· DEPOSIT USDG · REDEEM SHARES</span>
            <span className="meta">{nav} · {cash} · {seats}</span>
          </div>
          <div className="ao-forms-body">
            {forms}
            {note ? <p className="note">{note}</p> : null}
          </div>
        </section>
      </div>

      {/* ---- footer ---- */}
      <div className="ao-feed ao-foot">
        <div className="ao-marq">
          <div className="ao-marq-in">
            {[...FOOTER, ...FOOTER].map((f, i) => (
              <span key={i}>
                <span className={f.c || ""}>{f.t}</span>
                <span className="sep">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
