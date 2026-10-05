/**
 * Every external or cross-site URL used by the site.
 *
 * `href: null` means the destination does not exist yet. The UI renders
 * those as disabled "Launching soon" states instead of guessing a URL.
 * Set a value through the matching NEXT_PUBLIC_* env var or edit it here.
 */
export interface SiteLink {
  readonly label: string;
  readonly href: string | null;
  readonly description: string;
  readonly external: boolean;
}

const env = (value: string | undefined): string | null =>
  value && value.trim().length > 0 ? value.trim() : null;

export const links = {
  product: {
    label: "Product",
    href: env(process.env.NEXT_PUBLIC_SEAT_PRODUCT_URL) ?? "https://app.seatdesks.xyz",
    description: "The desk blotter: deposit, seats, fill tape.",
    external: true,
  },
  github: {
    label: "GitHub",
    href: "https://github.com/seat-hq/seat",
    description: "Contracts, keeper, SDK and docs. MIT licensed.",
    external: true,
  },
  x: {
    label: "X",
    href: env(process.env.NEXT_PUBLIC_SEAT_X_URL) ?? "https://x.com/seatdesks_xyz",
    description: "Announcements and release notes.",
    external: true,
  },
  discussions: {
    label: "Technical discussions",
    href: "https://github.com/seat-hq/seat/issues",
    description: "Open issues and design questions in the repo.",
    external: true,
  },
  docs: {
    label: "Docs",
    href: "/docs",
    description: "Litepaper, risk, allowlist and phase runbooks.",
    external: false,
  },
} as const satisfies Record<string, SiteLink>;

export type LinkKey = keyof typeof links;

/** Shown next to destinations that are not published yet. */
export const unpublishedLabel = "Launching soon";

export const siteUrl =
  env(process.env.NEXT_PUBLIC_SEAT_SITE_URL) ?? "http://localhost:3100";
