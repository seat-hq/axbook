"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================================
   AI OFFICE // B2B GROWTH AGENCY — live dashboard
   Faithful reconstruction of the reference frames. Real animated UI:
   ticking counters, marquee feeds, a radial agent graph on canvas, a
   skill-forge state machine, a sweeping schedule, cycling desks and an
   eight-gate method field. All timings live in TIMING below.
   ========================================================================= */

// ---- animation constants -------------------------------------------------
const TIMING = {
  beat: 1100, // sim pulse (counters, roles)
  log: 2100, // new agent-log line
  forge: 1500, // skill-forge step
  activeBeats: 5, // beats the big node stays active
  centreBeats: 3, // beats between CENTRE label changes
};

type Role = {
  code: string;
  name: string;
  color: string;
  icon: "strat" | "outbd" | "paid" | "anlst" | "acct";
};

const ROLES: Role[] = [
  { code: "STRAT", name: "Growth Strategy", color: "#4a86ff", icon: "strat" },
  { code: "OUTBD", name: "Sales Outbound", color: "#39ff7a", icon: "outbd" },
  { code: "PAID", name: "Paid Media", color: "#f0c14a", icon: "paid" },
  { code: "ANLST", name: "Sales Analyst", color: "#a877ff", icon: "anlst" },
  { code: "ACCT", name: "Account Manager", color: "#35c0e0", icon: "acct" },
];

const CENTRES = ["GROK", "STRAT", "OUTBD", "PAID", "ANLST", "ACCT"];

const FEED: { t: string; c?: string }[] = [
  { t: "MANUAL RUNS" },
  { t: "SAVED AS A SKILL", c: "g" },
  { t: "SALES ANALYST · CLIENT I" },
  { t: "DROP-OFF AT FIRST REPLY", c: "r" },
  { t: "FED BACK TO STRATEGY", c: "g" },
  { t: "OUTBOUND", c: "g" },
  { t: "TEACH A TASK" },
  { t: "SALES OUTBOUND" },
  { t: "BROWSER WORKFLOW OBSERVED" },
  { t: "DRAFT SKILL", c: "y" },
  { t: "NEEDS REVIEW", c: "r" },
  { t: "HANDOFF · OUTBD → ACCT" },
  { t: "CLIENT C" },
  { t: "SITE TEARDOWN RESULT PASSED ON" },
  { t: "PICKED UP", c: "g" },
  { t: "APPROVAL" },
  { t: "PAID MEDIA · CLIENT J" },
  { t: "GRANT ACCESS ×3 PREPARED" },
  { t: "WAITING FOR THE OWNER", c: "r" },
  { t: "QUALIFY COMPANY RESULT PASSED ON" },
  { t: "11 COMPANIES CHECKED" },
  { t: "3 QUALIFIED → /workspace/research", c: "g" },
];

const FOOTER: { t: string; c?: string }[] = [
  { t: "SIMPLE" },
  { t: "10 CLIENTS IN PARALLEL", c: "g" },
  { t: "5 AI EMPLOYEES" },
  { t: "PARALLEL CLIENT CAPACITY +50%", c: "g" },
  { t: "10 CLIENTS NOW, 6-7 BEFORE" },
  { t: "ONE PERSISTENT CLOUD COMPUTER" },
  { t: "NO HUMAN IN THE MIDDLE", c: "w" },
  { t: "AVG TASK 3M 60S" },
  { t: "MEDIAN 2M 18S", c: "g" },
  { t: "OWNER TOUCH TIME 12.8 MIN PER CLIENT PER DAY" },
  { t: "IT USED TO BE 36" },
  { t: "THAT IS 13.9 HOURS A WEEK" },
  { t: "ROUTINE RUNS 1,772", c: "g" },
  { t: "4.1 TASKS PER RUN" },
  { t: "I STILL DECIDE STRATEGY, PRICING AND CONTRACTS", c: "w" },
  { t: "THE ROUTINE NO LONGER WAITS FOR ME" },
];

const LOG_MSGS = [
  "inbound mail: Me re an answer",
  "speed vs leads pulled for 3 campaigns",
  "risk on request, needs a plan",
  "16 companies against the ICP",
  "post-positioning options prepared",
  "qualify match: I times in 1.1 min",
  "personalised drafts prepared",
  "channel quality, not just volume",
  "reply triage done on the inbox",
  "qualified batch entered the funnel",
  "result report ready to publish",
  "site teardown result passed on",
  "draft report ready to publish",
  "reply triage came on the index",
  "qualified list for the client report",
  "prospect sweep: I tasks in 4.0 min",
];
const LOG_TAGS = [
  { t: "PASS", c: "pass" },
  { t: "APPROVED", c: "approved" },
  { t: "ROUTED", c: "routed" },
  { t: "FACTION", c: "faction" },
  { t: "CAUTION", c: "caution" },
  { t: "CLIENT 2", c: "client" },
];

const SKILLS = [
  "OUTBOUND DRAFT",
  "SITE TEARDOWN",
  "CLIENT REPLY",
  "AD VARIANT",
  "ICP SCORING",
  "REPORT DIGEST",
  "QUALIFY COMPANY",
];

const TEACH_DRAFTS = ["MENU REVIEW", "MENU REVIEW", "MENU REVIEW"];

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
      ctx.fillText("GROK", grok.x, grok.y - gr - 6);

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
export default function AiOffice() {
  const [beat, setBeat] = useState(0);
  const [clock, setClock] = useState({ hms: "00:00:00", live: true });
  const [stats, setStats] = useState({
    pipeline: 1930,
    tasks24h: 248,
    handoffs: 50,
    clients: 10,
    autonomy: 88.7,
    routinesOk: 97.1,
    tasksMonth: 7203,
    approveMin: 43,
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
        pipeline: 1928 + Math.floor(Math.random() * 11),
        tasks24h: 247 + Math.floor(Math.random() * 3),
        handoffs: 49 + Math.floor(Math.random() * 2),
        clients: 10,
        autonomy: +(88.3 + Math.random() * 0.9).toFixed(1),
        routinesOk: +(97.0 + Math.random() * 0.4).toFixed(1),
        tasksMonth: s.tasksMonth + (r > 0.55 ? 1 : 0),
        approveMin: 40 + Math.floor(Math.random() * 8),
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
        const next = SKILLS[(SKILLS.indexOf(f.skill) + 1) % SKILLS.length];
        return {
          skill: next,
          idx: 0,
          total: 5 + Math.floor(Math.random() * 2),
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
      case "ACCT":
        return { top: "6%", left: "1.5%" };
      case "STRAT":
        return { top: "6%", right: "1.5%" };
      case "ANLST":
        return { top: "42%", left: "1.5%" };
      case "OUTBD":
        return { top: "42%", right: "1.5%" };
      default:
        return { bottom: "9%", left: "1.5%" }; // PAID
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
          <div className="ao-logo">AI</div>
          <div className="ao-brand-tx">
            <div className="ao-brand-k">
              <span className="ao-dot" style={{ width: 5, height: 5 }} />
              <b>FIVE PERSISTENT BOTS</b>
              <span className="ao-chip-xs">AUTONOMY {stats.autonomy}%</span>
            </div>
            <div className="ao-title">
              <span className="b">AI OFFICE</span>
              <span className="s">//</span> B2B GROWTH AGENCY
            </div>
          </div>
        </div>
        <div className="ao-stats">
          <div className="ao-stat">
            <div className="k">Pipeline</div>
            <div className="v">
              {stats.pipeline.toLocaleString()} <span className="ao-livetag">LIVE</span>
            </div>
          </div>
          <div className="ao-stat">
            <div className="k">Tasks 24h</div>
            <div className="v">{stats.tasks24h}</div>
          </div>
          <div className="ao-stat">
            <div className="k">Handoffs</div>
            <div className="v">{stats.handoffs}</div>
          </div>
          <div className="ao-stat">
            <div className="k">Clients</div>
            <div className="v">{stats.clients}</div>
          </div>
        </div>
        <div className="ao-clock">
          <div className="v">
            {clock.hms} <span className="u">UTC</span>
          </div>
          <div className={`st${clock.live ? " live" : ""}`}>
            <b>{clock.live ? "LIVE" : "LOST"}</b> UTC
          </div>
        </div>
      </header>

      {/* ---- feed ---- */}
      <div className="ao-feed">
        <div className="ao-feed-lab">
          <span className="d" />
          LIVE FEED
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
            <span className="t">AI OFFICE · 5 BOTS</span>
            <span className="meta green">ACTIVE</span>
          </div>
          <div className="ao-office-body">
            <div className="ao-office-path">
              /workspace · clients · research · campaigns · reports <b>SHARED</b>
            </div>
            <div className="ao-big">{stats.tasksMonth.toLocaleString()}</div>
            <div className="ao-big-k">Tasks done this month</div>
            <div className="ao-big-note">▲ FIVE ROLES RUNNING IN PARALLEL · {stats.tasks24h} TASKS 24H</div>
            <div className="ao-mini3">
              <div>
                <div className="k">Tasks 24h</div>
                <div className="v">{stats.tasks24h}</div>
              </div>
              <div>
                <div className="k">Routines OK</div>
                <div className="v g">{stats.routinesOk}%</div>
              </div>
              <div>
                <div className="k">Autonomy</div>
                <div className="v g">{stats.autonomy}%</div>
              </div>
            </div>
            <div className="ao-approve">
              <div className="cap">GAUGE / SPREAD</div>
              <svg viewBox="0 0 100 44" preserveAspectRatio="none">
                <path d={approve.area} fill="rgba(255,59,78,0.14)" />
                <path d={approve.line} fill="none" stroke="#ff3b4e" strokeWidth="1" />
              </svg>
              <div className="cap">TIME TO APPROVE · {stats.approveMin} MIN</div>
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
            <span className="t">AGENT LOG</span>
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
            <div className="ao-log-foot">368 TASKS · {stats.handoffs} HANDOFFS · 30 BUILT FOR WD · NO HUMAN IN THE FIELD</div>
          </div>
        </section>

        {/* forge + schedule stack */}
        <div className="ao-stack">
          <section className="ao-panel">
            <div className="ao-ph">
              <span className="ao-dot" />
              <span className="t">SKILL FORGE</span>
              <span className="sub">· MANUAL RUNS → SAVED SKILL</span>
              <span className={`meta ${forge.phase === "save" ? "red" : "green"}`}>
                {forge.phase === "save" ? "SAVING SKILL" : forge.phase === "draft" ? "DRAFT READY" : `RUN ${forge.idx} OF ${forge.total}`}
              </span>
            </div>
            <div className="ao-forge-body">
              <div className="ao-forge-top">
                <div className="ao-forge-left">
                  <div className="ao-forge-lab">MANUAL RUNS WITH THE BOT</div>
                  <div className="ao-forge-name">{forge.skill}</div>
                  <div className="ao-cells">
                    {Array.from({ length: forge.total }).map((_, i) => (
                      <div key={i} className={`ao-cell ${i < forge.idx ? (forge.color === "teach" ? "teach" : "on") : "empty"}`}>
                        {i + 1}
                      </div>
                    ))}
                    {forge.phase !== "run" && <span className={`ao-chip-skill ${forge.phase === "save" ? "save" : "draft"}`}>{forge.phase === "save" ? "SKILL" : "DRAFT"}</span>}
                  </div>
                  <div className="ao-forge-sub">RERUN A MANUAL ROUTINE AS IT IS SAVED</div>
                </div>
                <div className="ao-arrow" />
                <div className="ao-forge-right">
                  <div className="ao-saved-lab">
                    <span>SAVED SKILLS</span>
                    <b>{saved.count}</b>
                  </div>
                  <div className="ao-saved-grid">
                    {savedCells.map((c, i) => (
                      <i key={i} className={`${c.g ? "g" : ""}${c.fresh ? " fresh" : ""}`} />
                    ))}
                  </div>
                  <div className="ao-teach">
                    <div className="ao-saved-lab">
                      <span>TEACH-A-TASK DRAFTS</span>
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
              <span className="t">THE SCHEDULE</span>
              <span className="sub">· THE DAY IS A LOOP</span>
              <span className="meta red">{(beat % 5) + 1} RUNNING</span>
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
                <span>AI · 1 DAY · 1 LOOP</span>
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
          <span className="sub">GROK AGENTS · THE WHOLE AGENCY AS ONE GRAPH · 210 NODES · ARC EDGES · STRAIGHT LINES ARE ARCS ON A HYPERBOLIC DISK</span>
          <span className="meta">SIGNALS {2200 + beat} · HANDOFFS {34 + (beat % 12)}</span>
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
                {d.clients} CLIENTS · {d.tasks} TASKS · {d.skills} SKILLS · {d.routines} ROUTINES
              </div>
              <div className="ao-ncard-sig">SIGNALS THIS SESSION {d.signals}</div>
            </div>
          );
        })}
        <div className="ao-ws-foot">
          <span>
            {pad((beat * 2) % 24)}:{pad((beat * 11) % 60)} HANDOFF · {handoff} → THROUGH /workspace · NO HUMAN IN THE MIDDLE
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
            <span className="t">THE FIVE DESKS</span>
            <span className="sub">· ONE FUNCTION, ONE OWNER</span>
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
                      <span>TASKS 24H</span>
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
            <span className="sub">· EIGHT GATES EVERY TASK GOES THROUGH</span>
            <span className="meta red">GATE 7 · {4 + (beat % 4)} WAITING</span>
          </div>
          <div className="ao-method-body">
            <MethodField />
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
