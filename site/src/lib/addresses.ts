/** Robinhood Chain mainnet. */
export const MAINNET_CHAIN_ID = 4663 as const;

const BLOCKSCOUT_BASE = "https://robinhoodchain.blockscout.com";

/** pons launchpad — where $AXBOOK is launched / traded. */
const PONS_LAUNCHPAD_BASE = "https://www.ponsfamily.com/launchpad";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export type HexAddress = `0x${string}`;

export function isHexAddress(value: string): value is HexAddress {
  return ADDRESS_RE.test(value);
}

/** `$AXBOOK` on mainnet; unset until TGE env is configured. */
export function getSeatTokenAddress(): HexAddress | null {
  const raw = process.env.NEXT_PUBLIC_SEAT_TOKEN_ADDRESS?.trim();
  if (!raw) return null;
  return isHexAddress(raw) ? raw : null;
}

export function truncateAddress(address: HexAddress, head = 6, tail = 4): string {
  return `${address.slice(0, 2 + head)}…${address.slice(-tail)}`;
}

/** On-chain token details (Robinhood Chain Blockscout). */
export function explorerTokenUrl(address: HexAddress): string {
  return `${BLOCKSCOUT_BASE}/token/${address}`;
}

/** ponsfamily.com launch page for the token. */
export function ponsLaunchpadUrl(address: HexAddress): string {
  return `${PONS_LAUNCHPAD_BASE}/${address}`;
}
