"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "@/motion/hooks";
import styles from "./Flows.module.css";

interface Node {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly sub: string;
  readonly kind: "alex" | "engine" | "desk" | "you";
  readonly w?: number;
}

const nodes: readonly Node[] = [
  { id: "leader", x: 130, y: 100, label: "Leader activity", sub: "Alex's wallet", kind: "alex" },
  { id: "signal", x: 370, y: 100, label: "Signal", sub: "observed fill", kind: "alex" },
  { id: "keeper", x: 610, y: 100, label: "Keeper", sub: "reads vault.leader()", kind: "engine" },
  { id: "risk", x: 850, y: 100, label: "Risk module", sub: "accept · resize · reject", kind: "engine" },
  { id: "you", x: 130, y: 330, label: "You", sub: "USDG", kind: "you" },
  { id: "vault", x: 850, y: 330, label: "Desk vault", sub: "cash + positions", kind: "desk", w: 200 },
  { id: "assets", x: 1090, y: 330, label: "Assets", sub: "NVDA · AAPL · SPY", kind: "desk", w: 150 },
  { id: "nav", x: 850, y: 520, label: "NAV", sub: "cash + Σ value", kind: "desk" },
  { id: "shares", x: 490, y: 520, label: "Book shares", sub: "claim on NAV", kind: "desk" },
];

const signalPaths = [
  { id: "s1", d: "M 210 100 L 290 100" },
  { id: "s2", d: "M 450 100 L 530 100" },
  { id: "s3", d: "M 690 100 L 770 100" },
  { id: "s4", d: "M 850 130 L 850 296" },
];

const capitalPaths = [
  { id: "c1", d: "M 190 330 L 750 330", label: "deposit USDG", lx: 470, ly: 318 },
  { id: "c2", d: "M 950 318 L 1015 318", label: "swap", lx: 982, ly: 306 },
  { id: "c3", d: "M 1015 344 L 950 344", label: "", lx: 0, ly: 0 },
  { id: "c4", d: "M 850 364 L 850 490", label: "valued", lx: 862, ly: 432 },
  { id: "c5", d: "M 770 520 L 570 520", label: "÷ shares", lx: 670, ly: 508 },
  { id: "c6", d: "M 410 520 L 130 520 L 130 362", label: "redeem → USDG", lx: 270, ly: 508 },
];

export function FlowsDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, "100px");
  const reduced = useReducedMotion();
  const animate = inView && reduced === false;

  return (
    <svg ref={ref} viewBox="0 0 1200 600" className={styles.svg} aria-hidden="true">
      <defs>
        <marker id="arrSig" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--alex)" />
        </marker>
        <marker id="arrCap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--desk)" />
        </marker>
      </defs>

      <rect x="30" y="40" width="920" height="120" rx="18" className={styles.laneSignal} />
      <text x="48" y="30" className={styles.laneLabel}>
        SIGNAL FLOW — information only
      </text>
      <rect x="30" y="250" width="1150" height="330" rx="18" className={styles.laneCapital} />
      <text x="1170" y="240" textAnchor="end" className={styles.laneLabel}>
        CAPITAL FLOW — USDG and tokens, inside the desk
      </text>

      {/* The line that is never drawn. */}
      <line x1="130" y1="140" x2="130" y2="296" className={styles.noPath} />
      <g transform="translate(130 218)">
        <circle r="13" className={styles.noPathBadge} />
        <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" className={styles.noPathX} />
      </g>
      <text x="152" y="214" className={styles.noPathLabel}>
        no capital path
      </text>
      <text x="152" y="232" className={styles.noPathSub}>
        Alex can&apos;t withdraw vault funds
      </text>

      {signalPaths.map((p) => (
        <path key={p.id} id={`flow-${p.id}`} d={p.d} className={styles.signalPath} markerEnd="url(#arrSig)" />
      ))}
      <text x="862" y="214" className={styles.pathLabelSig}>
        copy instruction
      </text>

      {capitalPaths.map((p) => (
        <g key={p.id}>
          <path id={`flow-${p.id}`} d={p.d} className={styles.capitalPath} markerEnd="url(#arrCap)" />
          {p.label ? (
            <text x={p.lx} y={p.ly} className={styles.pathLabel} textAnchor="middle">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}

      {nodes.map((n) => {
        const w = n.w ?? 160;
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`} className={styles.node} data-kind={n.kind}>
            <rect x={-w / 2} y={-30} width={w} height={60} rx={12} />
            <text y={-4} textAnchor="middle" className={styles.nodeLabel}>
              {n.label}
            </text>
            <text y={16} textAnchor="middle" className={styles.nodeSub}>
              {n.sub}
            </text>
          </g>
        );
      })}

      {animate ? (
        <g>
          {signalPaths.map((p, i) => (
            <circle key={p.id} r="4" className={styles.pSignal}>
              <animateMotion dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite">
                <mpath href={`#flow-${p.id}`} />
              </animateMotion>
            </circle>
          ))}
          {capitalPaths.map((p, i) => (
            <rect key={p.id} x="-5" y="-5" width="10" height="10" rx="2" className={styles.pCapital}>
              <animateMotion dur={p.id === "c6" ? "3.2s" : "2.2s"} begin={`${0.3 + i * 0.35}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={`#flow-${p.id}`} />
              </animateMotion>
            </rect>
          ))}
        </g>
      ) : null}
    </svg>
  );
}
