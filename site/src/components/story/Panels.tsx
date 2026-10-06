"use client";

import { CountUp } from "@/motion/CountUp";
import type { AlexState, VaultState } from "./beats";
import { navOf, npsOf } from "./beats";
import styles from "./Story.module.css";

export function AlexPanel({ alex, compact = false }: { alex: AlexState; compact?: boolean }) {
  return (
    <section className={styles.alex} data-tone={alex.tone} data-compact={compact} aria-label="Alex's wallet">
      <header className={styles.panelHead}>
        <span className={styles.keyIcon} aria-hidden="true">
          <svg viewBox="0 0 32 16" width="30" height="15">
            <circle cx="7" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12.5 8H30M24 8v5M29 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h3 className={styles.panelTitle}>Alex&apos;s wallet</h3>
          <p className={styles.panelSub}>his key, his money</p>
        </div>
      </header>
      {!compact && (
        <dl className={styles.alexRows}>
          <div>
            <dt>Private key</dt>
            <dd>With Alex</dd>
          </div>
          <div>
            <dt>Balance</dt>
            <dd>Private — not part of the desk</dd>
          </div>
        </dl>
      )}
      <p className={styles.alexStatus} aria-live="off">
        <span className={styles.dot} aria-hidden="true" />
        <span key={alex.status} className={styles.swapIn}>
          {alex.status}
        </span>
      </p>
      {!compact && <p className={styles.panelFoot}>you cannot spend this</p>}
    </section>
  );
}

export function VaultPanel({ vault, compact = false }: { vault: VaultState; compact?: boolean }) {
  const nav = navOf(vault);
  const nps = npsOf(vault);
  const cashPct = nav === 0 ? 0 : (vault.cash / nav) * 100;
  const youPct = vault.shares === 0 ? 0 : (vault.you / vault.shares) * 100;
  const samPct = vault.shares === 0 ? 0 : (vault.sam / vault.shares) * 100;

  return (
    <section className={styles.vault} data-tone={vault.tone} data-compact={compact} aria-label="Desk vault">
      <header className={styles.panelHead}>
        <span className={styles.vaultIcon} aria-hidden="true" />
        <div>
          <h3 className={styles.panelTitle}>
            Desk vault {vault.alternate ? <span className="chip chip--alex">alternate</span> : null}
          </h3>
          <p className={styles.panelSub}>your USDG + copies</p>
        </div>
      </header>

      <div className={styles.navBlock}>
        <p className={styles.navLabel}>NAV / share</p>
        <p className={`mono ${styles.navBig}`} data-tone={vault.tone}>
          {vault.shares === 0 ? "—" : <CountUp value={nps} digits={2} />}
          <span className={styles.navUnit}> USDG</span>
        </p>
        {vault.note ? <p className={styles.navNote}>{vault.note}</p> : null}
      </div>

      <div className={styles.compBar} aria-hidden="true">
        <span className={styles.compCash} style={{ width: `${cashPct}%` }} />
        <span className={styles.compNvda} data-tone={vault.tone} style={{ width: `${nav === 0 ? 0 : 100 - cashPct}%` }} />
      </div>

      <dl className={styles.vaultRows}>
        <div>
          <dt>
            <i className={styles.swCash} aria-hidden="true" /> Cash
          </dt>
          <dd className="mono">
            <CountUp value={vault.cash} /> USDG
          </dd>
        </div>
        <div>
          <dt>
            <i className={styles.swNvda} data-tone={vault.tone} aria-hidden="true" /> NVDA
          </dt>
          <dd className="mono">
            <CountUp value={vault.nvda} /> USDG
          </dd>
        </div>
        <div className={styles.navRow}>
          <dt>NAV</dt>
          <dd className="mono">
            <CountUp value={nav} /> USDG
          </dd>
        </div>
        {!compact && (
          <div>
            <dt>Book shares</dt>
            <dd className="mono">
              <CountUp value={vault.shares} />
            </dd>
          </div>
        )}
      </dl>

      {!compact && (
        <div className={styles.own}>
          <div className={styles.ownBar} aria-hidden="true">
            <span className={styles.ownYou} style={{ width: `${youPct}%` }} />
            <span className={styles.ownSam} style={{ width: `${samPct}%` }} />
          </div>
          <p className={`mono ${styles.ownLegend}`}>
            <span>
              You <CountUp value={youPct} digits={youPct % 1 === 0 ? 0 : 1} suffix="%" />
            </span>
            <span>
              Sam <CountUp value={samPct} digits={samPct % 1 === 0 ? 0 : 1} suffix="%" />
            </span>
          </p>
        </div>
      )}
      {!compact && <p className={styles.panelFoot}>your shares claim this NAV</p>}
    </section>
  );
}
