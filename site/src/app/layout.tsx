import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter_Tight, JetBrains_Mono, Montserrat } from "next/font/google";
import { Nav } from "@/components/Nav";
import { TokenCaBar } from "@/components/TokenCaBar";
import { Footer } from "@/components/Footer";
import { getSeatTokenAddress } from "@/lib/addresses";
import { MotionBoot, motionHeadScript } from "@/motion/MotionBoot";
import { siteUrl, links } from "@/lib/links";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter_Tight({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

const brand = Montserrat({ subsets: ["latin"], weight: ["600"], variable: "--font-montserrat", display: "swap" });

const description =
  "Axbook is a copy desk, not a sniper bot. Deposit USDG into a separate desk vault, receive book shares that claim the desk's NAV, and let a risk engine decide which of a leader's Stock Token trades get copied — smaller, filtered and capped.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Axbook — Copy desk, not sniper bot",
    template: "%s · Axbook",
  },
  description,
  keywords: [
    "copy trading",
    "wallet copy trading",
    "stock token trading",
    "risk-managed copy trading",
    "vault-based trading",
    "trading desk",
    "NAV",
    "book shares",
    "Robinhood Chain",
    "USDG",
  ],
  openGraph: {
    type: "website",
    siteName: "Axbook",
    title: "Axbook — Copy desk, not sniper bot",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axbook — Copy desk, not sniper bot",
    description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#07140e",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Axbook",
  url: siteUrl,
  description,
  logo: `${siteUrl}/brand/seat-mark-light.svg`,
  sameAs: [links.github.href, links.x.href].filter(Boolean),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const seatTokenAddress = getSeatTokenAddress();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} ${brand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionHeadScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={seatTokenAddress ? "has-token-bar" : undefined}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        {seatTokenAddress ? <TokenCaBar address={seatTokenAddress} /> : null}
        <div id="main">
          <main>{children}</main>
          <Footer />
        </div>
        <MotionBoot />
      </body>
    </html>
  );
}
