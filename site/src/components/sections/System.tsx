"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/Icons";
import styles from "./System.module.css";

interface Layer {
  readonly id: string;
  readonly name: string;
  readonly icon: IconName;
  readonly side: "alex" | "engine" | "desk" | "front";
  readonly job: string;
  readonly files: readonly string[];
  readonly detail: readonly string[];
}

const layers: readonly Layer[] = [
  {
    id: "leader",
    name: "Leader wallet",
    icon: "wallet",
    side: "alex",
    job: "Alex's own wallet on Robinhood Chain. Off-protocol.",
    files: [],
    detail: ["Opted-in leaders trade official Stock Tokens with their own keys.", "Axbook never holds or signs with this key."],
  },
  {
    id: "observe",
    name: "Market observation",
    icon: "eye",
    side: "engine",
    job: "Reads the leader's fills and prices.",
    files: ["keeper/src/indexer.ts", "keeper/src/fills.ts", "keeper/src/market.ts"],
    detail: ["Fill-tape rows are labeled source=fixture or source=chain. Fixtures are never labeled live.", "Prices come from Chainlink AggregatorV3 feeds."],
  },
  {
    id: "keeper",
    name: "Keeper",
    icon: "keeper",
    side: "engine",
    job: "Turns fills into copy signals. Fails closed.",
    files: ["keeper/src/signaler.ts", "keeper/src/executor.ts", "keeper/src/session.ts"],
    detail: [
      "Bound to vault.leader() — the keeper doesn't pick a leader.",
      "Runs a paper executor unless live guards pass (router configured, token trade-eligible on that chain).",
    ],
  },
  {
    id: "risk",
    name: "Risk engine",
    icon: "gate",
    side: "engine",
    job: "Accept, resize or reject — deterministically.",
    files: ["contracts/src/RiskModule.sol"],
    detail: ["Allowlist, session sizing, price staleness, drawdown halt, then fill / position / gross caps.", "Re-evaluated on-chain inside every executeCopy call."],
  },
  {
    id: "exec",
    name: "Execution",
    icon: "signal",
    side: "desk",
    job: "A restricted swap surface. No arbitrary calldata.",
    files: ["contracts/src/SwapAdapter.sol", "contracts/src/ExactInputRouter02.sol"],
    detail: ["Allowlisted tokens only, minimum-out required, proceeds returned to the vault.", "Uniswap SwapRouter02 on chain 4663; reverts where no router is configured."],
  },
  {
    id: "vault",
    name: "Vault",
    icon: "vault",
    side: "desk",
    job: "Holds USDG and copies. Issues book shares.",
    files: ["contracts/src/DeskVault.sol", "contracts/src/DeskFactory.sol"],
    detail: ["One DeskVault per leader, created by the factory.", "Deposit, redeem (instant or queued), pause, deposit cap."],
  },
  {
    id: "nav",
    name: "NAV / share accounting",
    icon: "nav",
    side: "desk",
    job: "What the desk is worth, and what each share claims.",
    files: ["contracts/src/libraries/NavLib.sol", "contracts/src/FeeModule.sol", "sdk/src/nav.ts"],
    detail: ["NAV uses balanceOfUI() × oracle price — never raw balanceOf().", "High-water performance fee plus AUM accrual; 70 / 20 / 10 split on Phase 2 desks."],
  },
  {
    id: "front",
    name: "Frontend",
    icon: "front",
    side: "front",
    job: "The product: deposit, shares, fill tape.",
    files: ["app/"],
    detail: ["Reads NAV, shares, cash and leader from the vault.", "Falls back to the paper blotter when the connected chain has no vault."],
  },
];

export function System() {
  const [active, setActive] = useState("risk");
  const layer = layers.find((l) => l.id === active) ?? layers[0]!;

  return (
    <section id="system" className={`sec sec--grid ${styles.sec}`} aria-labelledby="system-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="eyebrow">
            <b>11</b> The system
          </p>
          <h2 id="system-title" className="display h-lg">
            Eight layers. <em>One boundary.</em>
          </h2>
          <p className="lede">
            Everything above the risk engine is information. Everything below it is the desk&apos;s own capital, moved by
            its own contracts.
          </p>
        </div>

        <div className={styles.layout}>
          <ol className={styles.stack} role="tablist" aria-orientation="vertical" aria-label="System layers">
            {layers.map((l, i) => (
              <li key={l.id} role="presentation" style={{ "--i": i } as React.CSSProperties}>
                <button
                  type="button"
                  role="tab"
                  id={`layer-tab-${l.id}`}
                  aria-selected={l.id === active}
                  aria-controls="layer-panel"
                  className={styles.layer}
                  data-side={l.side}
                  onClick={() => setActive(l.id)}
                  onKeyDown={(e) => {
                    const dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
                    if (!dir) return;
                    e.preventDefault();
                    const next = layers[(i + dir + layers.length) % layers.length]!;
                    setActive(next.id);
                    document.getElementById(`layer-tab-${next.id}`)?.focus();
                  }}
                  tabIndex={l.id === active ? 0 : -1}
                >
                  <span className={`mono ${styles.num}`}>{String(i + 1).padStart(2, "0")}</span>
                  <Icon name={l.icon} size={22} />
                  <span className={styles.layerName}>{l.name}</span>
                  <span className={styles.layerJob}>{l.job}</span>
                </button>
                {l.id === "risk" ? (
                  <div className={styles.boundary} aria-hidden="true">
                    <span className="mono">information above · capital below</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          <div id="layer-panel" role="tabpanel" aria-labelledby={`layer-tab-${layer.id}`} className={styles.panel} data-side={layer.side}>
            <p className={`mono ${styles.panelKicker}`}>Layer {layers.indexOf(layer) + 1} of {layers.length}</p>
            <h3 className={`display ${styles.panelTitle}`} key={layer.id}>
              {layer.name}
            </h3>
            <ul className={styles.panelList}>
              {layer.detail.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            {layer.files.length > 0 ? (
              <div className={styles.files}>
                <p className={`mono ${styles.panelKicker}`}>In the repo</p>
                <ul>
                  {layer.files.map((f) => (
                    <li key={f}>
                      <span className="mono">
                        <Icon name="code" size={14} /> {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link href="/docs" className={styles.explore}>
              Explore the architecture in the docs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
