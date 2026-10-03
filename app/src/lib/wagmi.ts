/**
 * wagmi / viem configuration for Robinhood Chain.
 *
 * The desk chain is whichever network has a vault. RPC URLs come from env
 * and fall back to the public Robinhood Chain endpoints.
 */
import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { CHAIN } from "@seat/sdk";
import { injected } from "@/lib/injected";

const MAINNET_RPC =
  process.env.NEXT_PUBLIC_RH_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const TESTNET_RPC =
  process.env.NEXT_PUBLIC_RH_TESTNET_RPC_URL ??
  "https://rpc.testnet.chain.robinhood.com";

export const robinhood = defineChain({
  id: CHAIN.MAINNET_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: CHAIN.GAS_ASSET, decimals: 18 },
  rpcUrls: { default: { http: [MAINNET_RPC] } },
});

export const robinhoodTestnet = defineChain({
  id: CHAIN.TESTNET_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: CHAIN.GAS_ASSET, decimals: 18 },
  rpcUrls: { default: { http: [TESTNET_RPC] } },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet, robinhood],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [robinhood.id]: http(MAINNET_RPC),
    [robinhoodTestnet.id]: http(TESTNET_RPC),
  },
  ssr: true,
});
