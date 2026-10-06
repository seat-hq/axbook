import type { Metadata } from "next";
import Link from "next/link";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { MermaidDiagram } from "@/components/docs/MermaidDiagram";
import { StatusBadge } from "@/components/docs/Callout";
import { getDocsTree } from "@/lib/docs/content";
import { links } from "@/lib/links";
import styles from "@/components/docs/docs.module.css";

export const metadata: Metadata = {
  title: "Axbook Documentation",
  description:
    "Technical documentation for the Axbook copy-desk protocol on Robinhood Chain: smart contracts, keeper, SDK, NAV accounting, risk engine, deployment and operations.",
  alternates: { canonical: "/docs" },
};

const ARCHITECTURE = `flowchart TD
  leader["Leader wallet<br/>(opted-in Stock Token trader)"]
  chain["Robinhood Chain<br/>4663 / 46630"]
  keeper["Keeper<br/>observe · normalize · evaluate"]
  app["Application<br/>desk blotter"]
  sdk["@seat/sdk<br/>registry + NAV math"]
  subgraph contracts["Smart contracts"]
    factory["DeskFactory"]
    vault["DeskVault<br/>USDG + Stock Tokens · book shares"]
    risk["RiskModule<br/>caps · sessions · drawdown"]
    swap["SwapAdapter<br/>restricted router"]
    fee["FeeModule<br/>HWM + AUM · 70/20/10"]
  end
  oracle["ChainlinkOracle<br/>AggregatorV3 feeds"]
  leader -->|"trades"| chain
  chain -->|"Transfer logs"| keeper
  keeper -->|"executeCopy (keeper-only)"| vault
  vault --> risk
  vault --> swap
  vault --> fee
  vault --> oracle
  factory -->|"one vault per leader"| vault
  app --> sdk
  app -->|"deposit / redeem / reads"| contracts`;

const STATUS: readonly {
  title: string;
  status: string;
  note: string;
}[] = [
  {
    title: "Phase 0 — paper copy",
    status: "implemented",
    note: "Deterministic risk pipeline and paper executor. Shipped; no funds move.",
  },
  {
    title: "Phase 1 — testnet desks (46630)",
    status: "implemented",
    note: "Factory + cash vault deployed, USDG deposit/redeem in the blotter. Live swaps fail closed (no cited 46630 router).",
  },
  {
    title: "Capped mainnet desk (4663)",
    status: "implemented",
    note: "Wired in code with cited MAG7 tokens, feeds and SwapRouter02. Broadcast is guarded by CONFIRM_MAINNET; $50k deposit cap per desk.",
  },
  {
    title: "Phase 2 — $AXBOOK, staking, open desks",
    status: "implemented",
    note: "Code shipped and tested. TGE requires CONFIRM_MAINNET + CONFIRM_SEAT_TGE; no $AXBOOK contract is deployed yet.",
  },
  {
    title: "Buyback-and-burn, bond slashing, Phase 3+",
    status: "implemented",
    note: "Named as later work in the litepaper. No code exists for these items.",
  },
];

export default function DocsIndex() {
  const tree = getDocsTree();
  return (
    <div className={styles.landing}>
      <p className={styles.landingEyebrow}>Axbook Protocol Documentation</p>
      <h1 className={styles.landingTitle}>Axbook</h1>
      <p className={styles.landingTagline}>Copy desks for programmable capital.</p>
      <p className={styles.landingLede}>
        Axbook is a copy-desk protocol on Robinhood Chain. A desk is a USDG-denominated vault that
        copies the trades of an opted-in leader across a small set of verified official Stock
        Tokens. Depositors hold book shares — a pro-rata claim on desk equity (NAV). A keeper
        observes leader fills, evaluates them against deterministic on-chain risk rules, resizes
        or skips them, and executes permitted copies through a restricted swap adapter. Axbook is
        experimental, unaudited, and not affiliated with Robinhood Markets.
      </p>
      <div className={styles.landingCtas}>
        <Link href="/docs/introduction/what-is-seat" className={styles.ctaPrimary}>
          Start: What is Axbook?
        </Link>
        <Link href="/docs/development/setup" className={styles.ctaSecondary}>
          Developer setup
        </Link>
        <DocsSearch />
      </div>

      <section className={styles.landingSection} aria-labelledby="arch">
        <h2 id="arch" className={styles.landingH2}>
          Architecture at a glance
        </h2>
        <MermaidDiagram code={ARCHITECTURE} />
      </section>

      <section className={styles.landingSection} aria-labelledby="status">
        <h2 id="status" className={styles.landingH2}>
          Current status
        </h2>
        <div className={styles.statusGrid}>
          {STATUS.map((s) => (
            <div className={styles.statusCard} key={s.title}>
              <div className={styles.statusCardHead}>
                <span className={styles.statusCardTitle}>{s.title}</span>
                <StatusBadge value={s.status} />
              </div>
              <p className={styles.statusCardDesc}>{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.landingSection} aria-labelledby="sections">
        <h2 id="sections" className={styles.landingH2}>
          Read the docs
        </h2>
        {tree.map((section) => (
          <div key={section.slug} style={{ marginBottom: "1.8rem" }}>
            <p className={styles.cardSection} style={{ marginBottom: "0.7rem" }}>
              {section.title}
            </p>
            <div className={styles.cardGrid}>
              {section.pages.map((p) => (
                <Link href={`/docs/${p.slug}`} className={styles.card} key={p.slug}>
                  <span className={styles.cardTitle}>{p.title}</span>
                  {p.description ? (
                    <span className={styles.cardDesc}>{p.description}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.landingSection} aria-labelledby="repo">
        <h2 id="repo" className={styles.landingH2}>
          Source of truth
        </h2>
        <p className={styles.landingLede}>
          Every page cites the file it was checked against. Where documentation and code disagree,
          the code wins — and the disagreement is called out, not hidden. The canonical runbooks
          are rendered directly from the repository&apos;s <code>docs/</code> folder.
        </p>
        {links.github.href ? (
          <a
            className={styles.ctaSecondary}
            href={links.github.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/seat-hq/seat<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </section>
    </div>
  );
}
