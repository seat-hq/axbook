"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar({ deskChain }: { deskChain: number }) {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const injected = connectors[0];
  const onDesk = isConnected && chainId === deskChain;

  if (!isConnected) {
    return (
      <button
        className="btn btn-on"
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
        type="button"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  return (
    <div className="wallet-bar">
      <span className="wallet-addr">{shortAddr(address ?? "")}</span>
      {onDesk ? (
        <span className="net-live">Mainnet</span>
      ) : (
        <button
          className="btn btn-on"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: deskChain })}
          type="button"
        >
          {isSwitching ? "Switching…" : "Switch network"}
        </button>
      )}
      <button className="btn" onClick={() => disconnect()} type="button">
        Disconnect
      </button>
    </div>
  );
}
