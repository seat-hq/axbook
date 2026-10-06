import { links } from "./links";

export interface NavItem {
  readonly label: string;
  readonly href: string | null;
  readonly external?: boolean;
  readonly hint?: string;
}

export const primaryNav: readonly NavItem[] = [
  { label: "Project", href: "/#project", hint: "Why a desk" },
  { label: "How it works", href: "/#story", hint: "The two piles" },
  { label: "Technology", href: "/#system", hint: "Contracts + keeper" },
  { label: "Economics", href: "/#economics", hint: "NAV, HWM, fees" },
  { label: "Docs", href: "/docs", hint: "Protocol documentation" },
];

export const secondaryNav: readonly NavItem[] = [
  { label: "Product", href: links.product.href, external: true },
  { label: "X", href: links.x.href, external: true },
  { label: "Roadmap", href: "/#status" },
];
