/**
 * Documentation content layer.
 *
 * Two content sources, one model:
 *
 *  1. `site/content/docs/<section>/<page>.md` — the authored documentation
 *     pages, with YAML frontmatter (title, description, order, status).
 *  2. `<repo>/docs/*.md` — the canonical repository documents (litepaper,
 *     risk, allowlist, phase runbooks). Rendered under the `runbooks`
 *     section so the site never forks from the repo's source of truth.
 *
 * Everything is read from disk at build time; pages are fully static.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DOCS_SECTIONS, getSection } from "./config";

export type PageStatus = "implemented" | "experimental" | "planned" | "not-implemented";

export interface Heading {
  readonly depth: 2 | 3;
  readonly text: string;
  readonly id: string;
}

export interface DocPage {
  /** `<section>/<page>` — also the URL under /docs. */
  readonly slug: string;
  readonly section: string;
  readonly page: string;
  readonly title: string;
  readonly description: string;
  readonly status: PageStatus | null;
  readonly order: number;
  readonly body: string;
  readonly headings: readonly Heading[];
  readonly minutes: number;
  /** Repo-relative source path, shown as a citation and edit link. */
  readonly sourcePath: string;
  /** True for pages rendered from the repository docs/ folder. */
  readonly fromRepo: boolean;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");
const REPO_DOCS_DIR = path.join(process.cwd(), "..", "docs");

/** Repo docs published under /docs/runbooks, in reading order. */
const REPO_RUNBOOKS: readonly { file: string; description: string }[] = [
  { file: "litepaper", description: "The Axbook litepaper: desks, accounting, sessions, components, roadmap." },
  { file: "phase-1", description: "Phase 1 runbook: testnet desks on Robinhood Chain 46630." },
  { file: "phase-1-live", description: "Cited 4663 facts: Stock Tokens, Chainlink feeds, SwapRouter02, the $50k cap." },
  { file: "phase-2", description: "Phase 2: open desks, fixed-supply $AXBOOK, 70/20/10 fees, stake-to-list." },
  { file: "mainnet-day", description: "The Phase 2 mainnet-day checklist for broadcasting on 4663." },
  { file: "risk", description: "Risk disclosure: fail-closed rules, market, copy, contract and operational risk." },
  { file: "allowlist", description: "Asset allowlist and the verification promotion process." },
  { file: "not-affiliated", description: "Axbook is independent and not affiliated with Robinhood Markets." },
];

/** Repo files referenced from docs but intentionally not published. */
const UNPUBLISHED_REPO_FILES = new Set(["Idea.md", "project_structure.md"]);

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

const plain = (s: string): string =>
  s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

function extractHeadings(body: string): Heading[] {
  const out: Heading[] = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(##|###)\s+(.+)$/.exec(line);
    if (m && m[1] && m[2]) {
      const text = plain(m[2]);
      out.push({ depth: m[1].length as 2 | 3, text, id: slugify(text) });
    }
  }
  return out;
}

const minutesOf = (body: string): number =>
  Math.max(1, Math.round(body.split(/\s+/).length / 220));

const VALID_STATUS = new Set<PageStatus>([
  "implemented",
  "experimental",
  "planned",
  "not-implemented",
]);

function loadAuthoredPages(): DocPage[] {
  const pages: DocPage[] = [];
  for (const section of DOCS_SECTIONS) {
    if (section.slug === "runbooks") continue;
    const dir = path.join(CONTENT_DIR, section.slug);
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const pageSlug = file.replace(/\.md$/, "");
      const status =
        typeof data.status === "string" && VALID_STATUS.has(data.status as PageStatus)
          ? (data.status as PageStatus)
          : null;
      pages.push({
        slug: `${section.slug}/${pageSlug}`,
        section: section.slug,
        page: pageSlug,
        title: String(data.title ?? pageSlug),
        description: String(data.description ?? ""),
        status,
        order: typeof data.order === "number" ? data.order : 100,
        body: content.trim(),
        headings: extractHeadings(content),
        minutes: minutesOf(content),
        sourcePath: `site/content/docs/${section.slug}/${file}`,
        fromRepo: false,
      });
    }
  }
  return pages;
}

function splitRepoTitle(raw: string): { title: string; body: string } {
  const m = /^#\s+(.+)\n/.exec(raw);
  if (!m || !m[1]) return { title: "Untitled", body: raw };
  return { title: plain(m[1]), body: raw.slice(m[0].length) };
}

function loadRepoRunbooks(): DocPage[] {
  return REPO_RUNBOOKS.flatMap((r, i) => {
    const file = path.join(REPO_DOCS_DIR, `${r.file}.md`);
    if (!fs.existsSync(file)) return [];
    const { title, body } = splitRepoTitle(fs.readFileSync(file, "utf8"));
    return [
      {
        slug: `runbooks/${r.file}`,
        section: "runbooks",
        page: r.file,
        title,
        description: r.description,
        status: null,
        order: i + 1,
        body: body.trim(),
        headings: extractHeadings(body),
        minutes: minutesOf(body),
        sourcePath: `docs/${r.file}.md`,
        fromRepo: true,
      } satisfies DocPage,
    ];
  });
}

let cache: DocPage[] | null = null;

/** All documentation pages, ordered by section then frontmatter order. */
export function getDocsPages(): DocPage[] {
  if (cache) return cache;
  const authored = loadAuthoredPages();
  const runbooks = loadRepoRunbooks();
  const sectionOrder = new Map(DOCS_SECTIONS.map((s, i) => [s.slug, i]));
  cache = [...authored, ...runbooks].sort((a, b) => {
    const sa = sectionOrder.get(a.section) ?? 999;
    const sb = sectionOrder.get(b.section) ?? 999;
    if (sa !== sb) return sa - sb;
    if (a.order !== b.order) return a.order - b.order;
    return a.page.localeCompare(b.page);
  });
  return cache;
}

export function getDocPage(slug: string): DocPage | undefined {
  return getDocsPages().find((p) => p.slug === slug);
}

export interface SectionWithPages {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly pages: readonly DocPage[];
}

/** Sections in config order, each with their ordered pages. */
export function getDocsTree(): SectionWithPages[] {
  const pages = getDocsPages();
  return DOCS_SECTIONS.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    pages: pages.filter((p) => p.section === s.slug),
  })).filter((s) => s.pages.length > 0);
}

/** Previous / next page in the flattened reading order. */
export function getAdjacentPages(slug: string): {
  prev: DocPage | null;
  next: DocPage | null;
} {
  const pages = getDocsPages();
  const i = pages.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? (pages[i - 1] ?? null) : null,
    next: i >= 0 && i < pages.length - 1 ? (pages[i + 1] ?? null) : null,
  };
}

/**
 * Resolve a link target inside documentation content.
 *
 * - Absolute URLs, anchors and site paths pass through.
 * - `/docs/...` paths pass through (validated by the content test).
 * - Relative `*.md` links inside repo runbooks resolve to the runbooks
 *   section, or to GitHub for files the site does not publish.
 * - Returns `null` for intentionally unpublished files (rendered as text).
 */
export function resolveDocsHref(href: string, githubBase: string | null): string | null {
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
  const clean = href.replace(/^\.\//, "");
  const [file, hash] = clean.split("#");
  if (!file) return href;
  const base = path.basename(file);
  if (UNPUBLISHED_REPO_FILES.has(base)) return null;
  const stem = base.replace(/\.md$/, "");
  if (base.endsWith(".md") && REPO_RUNBOOKS.some((r) => r.file === stem)) {
    return `/docs/runbooks/${stem}${hash ? `#${hash}` : ""}`;
  }
  if (!githubBase) return null;
  const repoPath = file.startsWith("../") ? file.slice(3) : `docs/${file}`;
  return `${githubBase}/blob/main/${repoPath}${hash ? `#${hash}` : ""}`;
}

/** Plain-text excerpt used by the search index. */
export function searchText(body: string, max = 4000): string {
  const noFences = body.replace(/```[\s\S]*?```/g, " ");
  const noDirectives = noFences.replace(/^:::.*$/gm, " ");
  const noMd = noDirectives
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`|>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return noMd.slice(0, max);
}

export interface SearchEntry {
  readonly slug: string;
  readonly title: string;
  readonly section: string;
  readonly description: string;
  readonly headings: string;
  readonly text: string;
}

/** Build-time search index; shipped to the client as a lazy chunk. */
export function getSearchIndex(): SearchEntry[] {
  return getDocsPages().map((p) => ({
    slug: p.slug,
    title: p.title,
    section: getSection(p.section)?.title ?? p.section,
    description: p.description,
    headings: p.headings.map((h) => h.text).join(" · "),
    text: searchText(p.body),
  }));
}
