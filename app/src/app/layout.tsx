import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter_Tight, JetBrains_Mono, Montserrat } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import "./terminal.css";

const inter = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
});

const brand = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEAT — Copy desk",
  description:
    "USDG copy desks for official Stock Tokens on Robinhood Chain. Not affiliated with Robinhood Markets. Not investment advice.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${inter.variable} ${mono.variable} ${brand.variable}`} lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
