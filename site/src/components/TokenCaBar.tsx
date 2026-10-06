"use client";

import { useCallback, useState } from "react";
import {
  explorerTokenUrl,
  getSeatTokenAddress,
  ponsLaunchpadUrl,
  truncateAddress,
  type HexAddress,
} from "@/lib/addresses";
import styles from "./TokenCaBar.module.css";

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 11V3.8A.8.8 0 0 1 4.8 3H11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function TokenCaBar({ address: addressProp }: { readonly address?: HexAddress | null }) {
  const address = addressProp ?? getSeatTokenAddress();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address]);

  if (!address) return null;

  const explorer = explorerTokenUrl(address);
  const pons = ponsLaunchpadUrl(address);

  return (
    <aside className={styles.bar} aria-label="$AXBOOK token contract">
      <div className={styles.inner}>
        <p className={styles.kicker}>
          <span className={styles.pulse} aria-hidden="true" />
          Live · Mainnet $AXBOOK
        </p>
        <span className={styles.ticker}>$AXBOOK</span>
        <code className={styles.addr} title={address}>
          <span className={styles.addrShort}>{truncateAddress(address, 6, 4)}</span>
          <span className={styles.addrLong}>{truncateAddress(address, 10, 8)}</span>
        </code>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.copy}
            onClick={onCopy}
            aria-label={copied ? "Copied contract address" : "Copy contract address"}
          >
            <CopyIcon />
            <span>{copied ? "Copied" : "Copy CA"}</span>
          </button>
          <a className={styles.explorer} href={pons} target="_blank" rel="noopener noreferrer">
            Pons
            <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens pons launchpad in a new tab)</span>
          </a>
          <a className={styles.explorer} href={explorer} target="_blank" rel="noopener noreferrer">
            Explorer
            <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens Blockscout in a new tab)</span>
          </a>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Contract address copied to clipboard." : ""}
      </p>
    </aside>
  );
}
