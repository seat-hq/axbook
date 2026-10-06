/**
 * Documentation information architecture.
 *
 * Sections are ordered here; pages are ordered by frontmatter `order`.
 * Page source lives in `site/content/docs/<section>/<page>.md`.
 * Repo runbooks (repo `docs/*.md`) are appended as the `runbooks` section
 * by the loader — they are not files under `site/content/docs`.
 */

export interface DocsSection {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
}

export const DOCS_SECTIONS: readonly DocsSection[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description: "What Axbook is, why it exists, and how the pieces fit together.",
  },
  {
    slug: "concepts",
    title: "Concepts",
    description: "Protocol vocabulary, explained in plain English and then technically.",
  },
  {
    slug: "journeys",
    title: "User Journeys",
    description: "Step-by-step walks of the leader and depositor lifecycles.",
  },
  {
    slug: "architecture",
    title: "Protocol Architecture",
    description: "Components, responsibilities, dependencies and failure modes.",
  },
  {
    slug: "contracts",
    title: "Smart Contracts",
    description: "Contract-by-contract reference: state, interface, events, invariants.",
  },
  {
    slug: "accounting",
    title: "NAV & Accounting",
    description: "NAV, book shares, deposits, withdrawals, fees and the high-water mark.",
  },
  {
    slug: "risk",
    title: "Risk Engine",
    description: "Caps, sessions, staleness, drawdown halts and the fail-closed rule.",
  },
  {
    slug: "keeper",
    title: "Keeper",
    description: "The off-chain operator: fill sources, pipeline, execution modes, tape.",
  },
  {
    slug: "sdk",
    title: "SDK",
    description: "@seat/sdk — the official token registry and fixed-point NAV math.",
  },
  {
    slug: "application",
    title: "Application",
    description: "The desk blotter: pages, data flow, configuration and API.",
  },
  {
    slug: "development",
    title: "Development",
    description: "Setup, environment variables, commands, testing and project layout.",
  },
  {
    slug: "networks",
    title: "Networks",
    description: "Robinhood Chain 4663 / 46630: endpoints, tokens and contract addresses.",
  },
  {
    slug: "deployment",
    title: "Deployment",
    description: "Guarded deploys: testnet, capped mainnet desk, and the Phase 2 TGE.",
  },
  {
    slug: "operations",
    title: "Operations",
    description: "Runbooks: monitoring, failure modes, recovery and emergency procedures.",
  },
  {
    slug: "security",
    title: "Security",
    description: "Trust assumptions, admin privileges, limitations and reporting.",
  },
  {
    slug: "economics",
    title: "Economics",
    description: "Fees, the high-water mark, $AXBOOK, staking and the listing bond.",
  },
  {
    slug: "reference",
    title: "Reference",
    description: "FAQ and glossary.",
  },
  {
    slug: "runbooks",
    title: "Runbooks & Papers",
    description: "The canonical documents rendered from the repository docs/ folder.",
  },
] as const;

export type DocsSectionSlug = (typeof DOCS_SECTIONS)[number]["slug"];

export function getSection(slug: string): DocsSection | undefined {
  return DOCS_SECTIONS.find((s) => s.slug === slug);
}
