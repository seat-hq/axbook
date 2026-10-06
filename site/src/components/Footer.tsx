import Link from "next/link";
import { links, unpublishedLabel } from "@/lib/links";
import { primaryNav } from "@/lib/nav";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

const ext = [links.product, links.github, links.x, links.discussions];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Wordmark size={40} />
            <p className={styles.tag}>Follow the book. Hold the shares.</p>
            <p className={styles.small}>
              USDG desks that copy opted-in Stock Token traders on Robinhood Chain. Shares represent a claim on desk NAV.
            </p>
          </div>
          <nav aria-label="Footer" className={styles.cols}>
            <div>
              <h2 className={styles.colTitle}>Project</h2>
              <ul>
                {primaryNav.map((n) =>
                  n.href ? (
                    <li key={n.label}>
                      <Link href={n.href}>{n.label}</Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
            <div>
              <h2 className={styles.colTitle}>Elsewhere</h2>
              <ul>
                {ext.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className={styles.off}>
                        {l.label} <span className="tbd">{unpublishedLabel}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className={styles.disclaimer} role="note" aria-label="Risk disclosure">
          <p>
            <strong>Risk.</strong> Axbook is experimental software. You can lose money. There are no guarantees of profit,
            capital preservation, liquidity, execution or correctness. Contracts are unaudited. A leader&apos;s past
            behavior does not predict future results, and a desk will not match leader performance because copies are
            delayed, scaled and capped. Every number on this site is an illustrative example unless it is explicitly
            cited to the code. This is not investment advice.
          </p>
          <p>
            <strong>Not affiliated with Robinhood Markets.</strong> Stock Tokens may be subject to jurisdictional
            restrictions and are not the same as directly owning shares.
          </p>
        </div>

        <div className={styles.bottom}>
          <span>MIT licensed · Built in the open</span>
          <Link href="/docs/risk">Read the full risk document →</Link>
        </div>
      </div>
    </footer>
  );
}
