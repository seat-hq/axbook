"use client";

import { useEffect, useRef } from "react";
import { useGsap, useInView, useInitialMediaQuery } from "@/motion/hooks";
import styles from "./Hero.module.css";

type Pt = readonly [number, number];

interface Geo {
  readonly w: number;
  readonly h: number;
  readonly axis: "x" | "y";
  readonly wallet: Pt;
  readonly walletSize: Pt;
  readonly vault: Pt;
  readonly vaultSize: Pt;
  readonly gates: readonly number[];
  readonly gateSpan: number;
  readonly divider: readonly [number, number, number, number];
  readonly readout: Pt;
}

const H: Geo = {
  w: 1200,
  h: 520,
  axis: "x",
  wallet: [190, 250],
  walletSize: [240, 150],
  vault: [990, 250],
  vaultSize: [270, 270],
  gates: [520, 620, 720],
  gateSpan: 170,
  divider: [360, 60, 360, 450],
  readout: [990, 440],
};

const V: Geo = {
  w: 420,
  h: 740,
  axis: "y",
  wallet: [210, 86],
  walletSize: [260, 130],
  vault: [210, 548],
  vaultSize: [300, 210],
  gates: [276, 336, 396],
  gateSpan: 260,
  divider: [40, 186, 380, 186],
  readout: [210, 686],
};

const GATES = ["ASSET", "SESSION", "SIZE"] as const;

function HeroSceneGraphic({ vertical }: { readonly vertical: boolean }) {
  const g = vertical ? V : H;
  const root = useRef<SVGSVGElement>(null);
  const inView = useInView(root);

  const [wx, wy] = g.wallet;
  const [ww, wh] = g.walletSize;
  const [vx, vy] = g.vault;
  const [vw, vh] = g.vaultSize;
  const along = (t: number): Pt => (g.axis === "x" ? [t, wy] : [wx, t]);
  const start = g.axis === "x" ? wx + ww / 2 : wy + wh / 2;
  const end = g.axis === "x" ? vx - vw / 2 : vy - vh / 2;
  const [sx, sy] = along(start);
  const [ex, ey] = along(end);
  const d = (v: number): Record<string, number> => (g.axis === "x" ? { x: v } : { y: v });

  const loopRef = useRef<gsap.core.Timeline | null>(null);

  useGsap(
    root,
    ({ gsap }) => {
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-h='wallet']", { opacity: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 1.1 })
        .from("[data-h='wallet-label']", { opacity: 0, ...d(-14) }, "-=0.7")
        .from("[data-h='divider']", { strokeDashoffset: 600, duration: 1.2, ease: "power2.inOut" }, "-=0.2")
        .from("[data-h='side']", { opacity: 0, stagger: 0.12 }, "<0.2")
        .from("[data-h='gate']", { opacity: 0, scaleY: 0, scaleX: 0, transformOrigin: "50% 50%", stagger: 0.1 }, "<0.3")
        .from("[data-h='vault']", { opacity: 0, scale: 0.92, transformOrigin: "50% 50%", duration: 1 }, "<0.2")
        .from("[data-h='cash']", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9 }, "-=0.4")
        .from("[data-h='nvda']", { scaleY: 0, transformOrigin: "50% 100%" }, "-=0.2")
        .from("[data-h='readout']", { opacity: 0, ...d(10), stagger: 0.12 }, "-=0.4");

      const pulse = "[data-h='pulse']";
      const travel = end - start;
      const gatePos = (i: number): number => (g.gates[i] ?? 0) - start;

      const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
      // Cycle A: copied, resized.
      loop
        .set(pulse, { ...d(0), opacity: 0, scale: 1, transformOrigin: "50% 50%" })
        .set("[data-h='pulse-core']", { fill: "var(--alex)" })
        .to("[data-h='wallet']", { scale: 1.03, transformOrigin: "50% 50%", yoyo: true, repeat: 1, duration: 0.18 })
        .to(pulse, { opacity: 1, duration: 0.2 }, "<")
        .to(pulse, { ...d(gatePos(0)), duration: 0.9, ease: "power2.in" })
        .to("[data-h='gate-0']", { fill: "var(--desk)", duration: 0.12, yoyo: true, repeat: 1 })
        .to(pulse, { ...d(gatePos(1)), duration: 0.4, ease: "none" })
        .to("[data-h='gate-1']", { fill: "var(--desk)", duration: 0.12, yoyo: true, repeat: 1 })
        .to(pulse, { ...d(gatePos(2)), duration: 0.4, ease: "none" })
        .to("[data-h='gate-2']", { fill: "var(--desk)", duration: 0.12, yoyo: true, repeat: 1 })
        .to(pulse, { scale: 0.42, duration: 0.45, ease: "back.out(2)" }, "<")
        .to("[data-h='pulse-core']", { fill: "var(--desk)", duration: 0.3 }, "<")
        .to("[data-h='tag-resize']", { opacity: 1, duration: 0.2 }, "<")
        .to(pulse, { ...d(travel), duration: 0.8, ease: "power2.inOut" })
        .to("[data-h='tag-resize']", { opacity: 0, duration: 0.3 }, "<0.4")
        .to(pulse, { opacity: 0, duration: 0.2 })
        .to("[data-h='nvda']", { scaleY: 1.12, transformOrigin: "50% 100%", yoyo: true, repeat: 1, duration: 0.25 }, "<")
        .to("[data-h='nav-dot']", { opacity: 1, yoyo: true, repeat: 1, duration: 0.25 }, "<")
        // Cycle B: skipped at the session gate.
        .set(pulse, { ...d(0), scale: 1 }, "+=1.1")
        .set("[data-h='pulse-core']", { fill: "var(--alex)" })
        .to(pulse, { opacity: 1, duration: 0.2 })
        .to(pulse, { ...d(gatePos(1) - 26), duration: 1.1, ease: "power2.in" })
        .to("[data-h='gate-1']", { fill: "var(--loss)", duration: 0.12 })
        .to("[data-h='pulse-core']", { fill: "var(--loss)", duration: 0.12 }, "<")
        .to("[data-h='tag-skip']", { opacity: 1, duration: 0.2 }, "<")
        .to(pulse, { opacity: 0, scale: 0.2, duration: 0.5, delay: 0.5 })
        .to("[data-h='tag-skip']", { opacity: 0, duration: 0.3 }, "<0.3")
        .to("[data-h='gate-1']", { fill: "var(--line-2)", duration: 0.3 }, "<");

      intro.eventCallback("onComplete", () => {
        loopRef.current = loop;
        if (root.current?.dataset.inview === "true") loop.play();
      });
      return () => {
        loopRef.current = null;
      };
    },
    [vertical],
  );

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (inView) loop.play();
    else loop.pause();
  }, [inView]);

  const gateRect = (pos: number): { x: number; y: number; width: number; height: number } =>
    g.axis === "x"
      ? { x: pos - 3, y: wy - g.gateSpan / 2, width: 6, height: g.gateSpan }
      : { x: wx - g.gateSpan / 2, y: pos - 3, width: g.gateSpan, height: 6 };

  const gateLabel = (pos: number): Pt => (g.axis === "x" ? [pos, wy - g.gateSpan / 2 - 16] : [wx - g.gateSpan / 2, pos - 10]);
  const [d1, d2, d3, d4] = g.divider;
  const tagPos = along((g.gates[2] ?? 0) + (g.axis === "x" ? 60 : 36));
  const skipPos = along(g.gates[1] ?? 0);

  return (
    <svg
      ref={root}
      data-inview={inView}
      className={styles.scene}
      viewBox={`0 0 ${g.w} ${g.h}`}
      role="img"
      aria-labelledby="hero-scene-title hero-scene-desc"
    >
      <title id="hero-scene-title">Alex&apos;s wallet and the desk vault are separate</title>
      <desc id="hero-scene-desc">
        A trade signal leaves Alex&apos;s wallet, passes asset, session and size gates, and a smaller copy lands in the
        desk vault, which holds USDG cash and copied positions. The vault&apos;s NAV is split into book shares. Some
        signals are skipped at a gate.
      </desc>

      {/* Separation line */}
      <line
        data-h="divider"
        x1={d1}
        y1={d2}
        x2={d3}
        y2={d4}
        className={styles.divider}
        strokeDasharray="6 8"
      />
      <text
        data-h="side"
        className={styles.sideLabel}
        x={g.axis === "x" ? d1 - 16 : 44}
        y={g.axis === "x" ? d2 + 6 : d2 - 12}
        textAnchor={g.axis === "x" ? "end" : "start"}
      >
        ALEX · HIS CUSTODY
      </text>
      <text
        data-h="side"
        className={styles.sideLabel}
        x={g.axis === "x" ? d1 + 16 : 44}
        y={g.axis === "x" ? d2 + 6 : d2 + 26}
      >
        DESK · YOUR CAPITAL
      </text>

      {/* Signal rail */}
      <line x1={sx} y1={sy} x2={ex} y2={ey} className={styles.rail} strokeDasharray="2 7" />

      {/* Alex's wallet */}
      <g transform={`translate(${wx} ${wy})`}>
        <g data-h="wallet">
          <rect x={-ww / 2} y={-wh / 2} width={ww} height={wh} rx={16} className={styles.wallet} />
          <rect x={-ww / 2 + 18} y={-wh / 2 + 18} width={ww - 36} height={10} rx={5} className={styles.walletStrap} />
          <g transform={`translate(${ww / 2 - 44} ${wh / 2 - 38})`} className={styles.key}>
            <circle cx="0" cy="0" r="9" />
            <line x1="9" y1="0" x2="26" y2="0" />
            <line x1="20" y1="0" x2="20" y2="7" />
            <line x1="25" y1="0" x2="25" y2="6" />
          </g>
          <text x={-ww / 2 + 20} y={6} className={styles.nodeTitle}>
            ALEX&apos;S WALLET
          </text>
        </g>
        <text data-h="wallet-label" x={-ww / 2 + 20} y={wh / 2 - 22} className={styles.nodeSub}>
          his key · his money
        </text>
      </g>

      {/* Gates */}
      {g.gates.map((pos, i) => {
        const [lx, ly] = gateLabel(pos);
        return (
          <g key={GATES[i]} data-h="gate">
            <rect data-h={`gate-${i}`} {...gateRect(pos)} rx={3} className={styles.gate} />
            <text
              x={lx}
              y={ly}
              className={styles.gateLabel}
              textAnchor={g.axis === "x" ? "middle" : "start"}
            >
              {GATES[i]}
            </text>
          </g>
        );
      })}

      {/* Desk vault */}
      <g transform={`translate(${vx} ${vy})`}>
        <g data-h="vault">
          <rect x={-vw / 2} y={-vh / 2} width={vw} height={vh} rx={20} className={styles.vault} />
          <text x={-vw / 2 + 22} y={-vh / 2 + 36} className={styles.nodeTitle}>
            DESK VAULT
          </text>
          <text x={-vw / 2 + 22} y={-vh / 2 + 60} className={styles.nodeSub}>
            your USDG + copies
          </text>
          <g transform={`translate(0 ${vh / 2 - 22})`}>
            <rect data-h="cash" x={-vw / 2 + 22} y={-78} width={vw * 0.46} height={78} rx={6} className={styles.cash} />
            <text x={-vw / 2 + 34} y={-14} className={styles.blockLabel}>
              USDG
            </text>
            <rect
              data-h="nvda"
              x={-vw / 2 + 30 + vw * 0.46}
              y={-58}
              width={vw * 0.38}
              height={58}
              rx={6}
              className={styles.nvda}
            />
            <text x={-vw / 2 + 42 + vw * 0.46} y={-14} className={styles.blockLabelDark}>
              NVDA
            </text>
          </g>
        </g>
      </g>

      {/* Readout */}
      <g transform={`translate(${g.readout[0]} ${g.readout[1]})`}>
        <g data-h="readout">
          <circle data-h="nav-dot" cx={-vw / 2 + 6} cy={-5} r={4} className={styles.navDot} />
          <text x={-vw / 2 + 18} y={0} className={styles.readout}>
            NAV = cash + positions
          </text>
        </g>
        <g data-h="readout">
          <text x={-vw / 2 + 18} y={26} className={styles.readoutDim}>
            ÷ BOOK SHARES = your claim
          </text>
        </g>
      </g>

      {/* Pulse */}
      <g data-h="pulse" style={{ opacity: 0 }}>
        <circle data-h="pulse-core" cx={sx} cy={sy} r={13} fill="var(--alex)" />
        <circle cx={sx} cy={sy} r={22} className={styles.pulseRing} />
      </g>
      <text data-h="tag-resize" x={tagPos[0]} y={tagPos[1] - (g.axis === "x" ? 30 : 0)} className={styles.tagResize} style={{ opacity: 0 }} textAnchor={g.axis === "x" ? "middle" : "end"} dx={g.axis === "x" ? 0 : -24}>
        RESIZED
      </text>
      <text
        data-h="tag-skip"
        x={g.axis === "x" ? skipPos[0] : wx + g.gateSpan / 2}
        y={g.axis === "x" ? skipPos[1] + g.gateSpan / 2 + 30 : (g.gates[1] ?? 0) - 10}
        className={styles.tagSkip}
        style={{ opacity: 0 }}
        textAnchor={g.axis === "x" ? "middle" : "end"}
      >
        SKIPPED
      </text>
    </svg>
  );
}

export function HeroScene() {
  const mq = useInitialMediaQuery("(max-width: 720px)");
  if (mq === null) {
    return <HeroSceneGraphic vertical={false} />;
  }
  return <HeroSceneGraphic vertical={mq} />;
}
