/**
 * Write app/src/lib/addresses.ts from Foundry broadcasts.
 *
 * Reads DeployTestnet 46630, DeployMainnet 4663, then overlays DeployPhase2
 * 4663 when present. Does not invent addresses.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "app", "src", "lib", "addresses.ts");

const OFFICIAL_TESTNET_USDG = "0x7e955252e15c84f5768b83c41a71f9eba181802f" as const;
const OFFICIAL_MAINNET_USDG = "0x5fc5360d0400a0fd4f2af552add042d716f1d168" as const;

type Entry = {
  riskModule: `0x${string}` | null;
  swapAdapter: `0x${string}` | null;
  feeModule: `0x${string}` | null;
  deskFactory: `0x${string}` | null;
  deskVault: `0x${string}` | null;
  chainlinkOracle: `0x${string}` | null;
  usdg: `0x${string}` | null;
  seatToken: `0x${string}` | null;
  stakingPool: `0x${string}` | null;
  lpLocker: `0x${string}` | null;
};

const FALLBACK_TESTNET: Entry = {
  riskModule: "0x48a0733a5b7b7ae1c98d29712cc639f33bcb2147",
  swapAdapter: "0xff8851ea3699781c6c331ee9530d7831cc465f02",
  feeModule: "0x475d9d5a7d1b839845ee1073c5a0c51320064408",
  deskFactory: "0x4c58691ad3395d9a9fa078b2d86a1c5d90a73e10",
  deskVault: "0x8ff6ef04312679a0112b5229c6911cbc026e73ff",
  chainlinkOracle: null,
  usdg: OFFICIAL_TESTNET_USDG,
  seatToken: null,
  stakingPool: null,
  lpLocker: null,
};

interface BroadcastTx {
  contractName?: string;
  contractAddress?: string;
  transactionType?: string;
}

interface BroadcastFile {
  transactions?: BroadcastTx[];
}

function asAddr(value: string | undefined): `0x${string}` | null {
  if (!value) return null;
  const v = value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return null;
  return v.toLowerCase() as `0x${string}`;
}

function findAddr(txs: BroadcastTx[], name: string): `0x${string}` | null {
  const all = findAllAddrs(txs, name);
  return all[0] ?? null;
}

function findAllAddrs(txs: BroadcastTx[], name: string): `0x${string}`[] {
  const out: `0x${string}`[] = [];
  for (const tx of txs) {
    if (tx.contractName === name && tx.contractAddress) {
      const addr = asAddr(tx.contractAddress);
      if (addr && !out.includes(addr)) out.push(addr);
    }
  }
  return out;
}

function loadBroadcast(rel: string): BroadcastTx[] | null {
  const path = join(ROOT, rel);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as BroadcastFile;
  return raw.transactions ?? [];
}

function emptyMainnet(): Entry {
  return {
    riskModule: null,
    swapAdapter: null,
    feeModule: null,
    deskFactory: null,
    deskVault: null,
    chainlinkOracle: null,
    usdg: OFFICIAL_MAINNET_USDG,
    seatToken: null,
    stakingPool: null,
    lpLocker: null,
  };
}

function fromBroadcast(txs: BroadcastTx[], usdg: `0x${string}` | null): Entry {
  return {
    riskModule: findAddr(txs, "RiskModule"),
    swapAdapter: findAddr(txs, "SwapAdapter"),
    feeModule: findAddr(txs, "FeeModule"),
    deskFactory: findAddr(txs, "DeskFactory"),
    deskVault: findAddr(txs, "DeskVault"),
    chainlinkOracle: findAddr(txs, "ChainlinkOracle"),
    usdg,
    seatToken: findAddr(txs, "SeatToken"),
    stakingPool: findAddr(txs, "StakingPool"),
    lpLocker: findAddr(txs, "LpLocker"),
  };
}

function renderEntry(name: string, entry: Entry): string {
  return `const ${name}: AddressEntry = {
  riskModule: ${jsonAddr(entry.riskModule)},
  swapAdapter: ${jsonAddr(entry.swapAdapter)},
  feeModule: ${jsonAddr(entry.feeModule)},
  deskFactory: ${jsonAddr(entry.deskFactory)},
  deskVault: ${jsonAddr(entry.deskVault)},
  chainlinkOracle: ${jsonAddr(entry.chainlinkOracle)},
  usdg: ${jsonAddr(entry.usdg)},
  seatToken: ${jsonAddr(entry.seatToken)},
  stakingPool: ${jsonAddr(entry.stakingPool)},
  lpLocker: ${jsonAddr(entry.lpLocker)},
};`;
}

function jsonAddr(addr: `0x${string}` | null): string {
  return addr ? `"${addr}"` : "null";
}

function main(): void {
  const testnetTxs = loadBroadcast(
    "broadcast/DeployTestnet.s.sol/46630/run-latest.json",
  );
  const mainnetTxs = loadBroadcast(
    "broadcast/DeployMainnet.s.sol/4663/run-latest.json",
  );
  const phase2Txs = loadBroadcast(
    "broadcast/DeployPhase2.s.sol/4663/run-latest.json",
  );

  const testnet: Entry = testnetTxs
    ? { ...fromBroadcast(testnetTxs, asAddr(process.env.USDG_ADDRESS) ?? OFFICIAL_TESTNET_USDG) }
    : FALLBACK_TESTNET;

  let mainnet: Entry = mainnetTxs
    ? fromBroadcast(mainnetTxs, asAddr(process.env.USDG_ADDRESS) ?? OFFICIAL_MAINNET_USDG)
    : emptyMainnet();
  if (phase2Txs) {
    mainnet = fromBroadcast(
      phase2Txs,
      asAddr(process.env.USDG_ADDRESS) ?? OFFICIAL_MAINNET_USDG,
    );
    const extraVaults = findAllAddrs(phase2Txs, "DeskVault");
    if (extraVaults.length > 1) {
      console.log("[write-addresses] extra 4663 desks:", extraVaults.slice(1));
    }
  }

  if (!testnetTxs) {
    console.log("[write-addresses] no 46630 broadcast; keeping fallback testnet vault");
  }
  if (!mainnetTxs && !phase2Txs) {
    console.log("[write-addresses] no 4663 broadcast; mainnet Axbook modules stay null");
  }

  const body = `/**
 * Deployed contract addresses.
 *
 * Generated by scripts/write-addresses.ts from Foundry broadcasts.
 * \`usdg\` is the vault \`asset()\` (not deployed by this repo).
 * 4663 \`usdg\` is the official mainnet token; Axbook vaults stay null until
 * a CONFIRM_MAINNET deploy. Do not hand-edit invented addresses.
 */
import { CHAIN } from "@seat/sdk";

export interface AddressEntry {
  readonly riskModule: \`0x\${string}\` | null;
  readonly swapAdapter: \`0x\${string}\` | null;
  readonly feeModule: \`0x\${string}\` | null;
  readonly deskFactory: \`0x\${string}\` | null;
  readonly deskVault: \`0x\${string}\` | null;
  readonly chainlinkOracle: \`0x\${string}\` | null;
  readonly usdg: \`0x\${string}\` | null;
  readonly seatToken: \`0x\${string}\` | null;
  readonly stakingPool: \`0x\${string}\` | null;
  readonly lpLocker: \`0x\${string}\` | null;
}

export const EMPTY: AddressEntry = {
  riskModule: null,
  swapAdapter: null,
  feeModule: null,
  deskFactory: null,
  deskVault: null,
  chainlinkOracle: null,
  usdg: null,
  seatToken: null,
  stakingPool: null,
  lpLocker: null,
};

${renderEntry("TESTNET", testnet)}

/** Official 4663 USDG. Axbook modules stay null until a guarded deploy. */
${renderEntry("MAINNET", mainnet)}

/** Addresses keyed by chain id. Filled from deploy logs + cited USDG only. */
export const ADDRESSES: Record<number, AddressEntry> = {
  [CHAIN.MAINNET_ID]: MAINNET,
  [CHAIN.TESTNET_ID]: TESTNET,
};

export function getAddresses(chainId: number): AddressEntry {
  return ADDRESSES[chainId] ?? EMPTY;
}

export function hasTestnetVault(entry: AddressEntry): boolean {
  return entry.deskVault !== null;
}

/** Writes allowed on 4663 or 46630 when that chain has a real vault address. */
export function canWriteOnChain(chainId: number, entry: AddressEntry): boolean {
  if (chainId !== CHAIN.MAINNET_ID && chainId !== CHAIN.TESTNET_ID) return false;
  return entry.deskVault !== null;
}
`;

  writeFileSync(OUT, body);
  console.log("[write-addresses] wrote 46630:", testnet);
  console.log("[write-addresses] wrote 4663:", mainnet);
}

main();
