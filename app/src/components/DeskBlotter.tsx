"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAIN } from "@seat/sdk";
import { decodeEventLog, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { deskFactoryAbi, deskVaultAbi, erc20Abi, stakingPoolAbi } from "@/abis";
import { SeatTerminal } from "@/components/SeatTerminal";
import { WalletBar } from "@/components/WalletBar";
import { canWriteOnChain, getAddresses } from "@/lib/addresses";
import { formatNav } from "@/lib/desks";

function shortError(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "shortMessage" in err &&
    typeof err.shortMessage === "string" &&
    err.shortMessage.length > 0
  ) {
    return err.shortMessage;
  }
  if (err instanceof Error) {
    if (err.message.includes("does not match the target chain")) {
      return "Approve the Robinhood Chain network in your wallet, then try again.";
    }
    const line = err.message.split("\n")[0] ?? fallback;
    return line.length > 160 ? `${line.slice(0, 157)}…` : line;
  }
  return fallback;
}

function shortAddr(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function DeskBlotter() {
  const { address, chainId: walletChain, connector, isConnected } = useAccount();
  const activeChain =
    getAddresses(CHAIN.MAINNET_ID).deskVault !== null
      ? CHAIN.MAINNET_ID
      : CHAIN.TESTNET_ID;
  const addrs = getAddresses(activeChain);
  const factory = addrs.deskFactory;
  const [queryDesk, setQueryDesk] = useState<`0x${string}` | null>(null);
  const [factoryDesks, setFactoryDesks] = useState<`0x${string}`[]>([]);
  const publicClient = usePublicClient({ chainId: activeChain });
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("desk");
    if (q && /^0x[0-9a-fA-F]{40}$/.test(q)) {
      setQueryDesk(q.toLowerCase() as `0x${string}`);
    }
  }, []);

  useEffect(() => {
    if (!factory || !publicClient) {
      setFactoryDesks(addrs.deskVault ? [addrs.deskVault] : []);
      return;
    }
    void (async () => {
      try {
        const n = (await publicClient.readContract({
          address: factory,
          abi: deskFactoryAbi,
          functionName: "deskCount",
        })) as bigint;
        const rows: `0x${string}`[] = [];
        for (let i = 0; i < Number(n); i++) {
          const d = (await publicClient.readContract({
            address: factory,
            abi: deskFactoryAbi,
            functionName: "allDesks",
            args: [BigInt(i)],
          })) as `0x${string}`;
          rows.push(d.toLowerCase() as `0x${string}`);
        }
        setFactoryDesks(rows);
      } catch {
        setFactoryDesks(addrs.deskVault ? [addrs.deskVault] : []);
      }
    })();
  }, [factory, publicClient, addrs.deskVault]);

  const vault =
    (queryDesk &&
    factoryDesks.some((d) => d.toLowerCase() === queryDesk.toLowerCase())
      ? queryDesk
      : (factoryDesks[0] ?? addrs.deskVault)) ?? null;
  const onChain = vault !== null;

  const canWrite =
    isConnected && canWriteOnChain(activeChain, addrs) && Boolean(address);

  async function ensureDeskChain() {
    const current = connector ? await connector.getChainId() : walletChain;
    if (current === activeChain) return;
    await switchChainAsync({ chainId: activeChain });
  }

  const readEnabled = onChain;
  const userEnabled = onChain && Boolean(address);

  const { data: leader } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "leader",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "totalAssetsUsdg",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: totalShares, refetch: refetchShares } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "totalShares",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: navShare, refetch: refetchNav } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "navPerShare",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: cash, refetch: refetchCash } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "cashUsdg",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: userShares, refetch: refetchUser } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "sharesOf",
    args: address ? [address] : undefined,
    chainId: activeChain,
    query: { enabled: userEnabled },
  });
  const { data: queueLen, refetch: refetchQueue } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "withdrawQueueLength",
    chainId: activeChain,
    query: { enabled: readEnabled },
  });
  const { data: depositCap } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "depositCapUsdg",
    chainId: activeChain,
    query: { enabled: readEnabled && activeChain === CHAIN.MAINNET_ID },
  });
  const { data: assetFromVault } = useReadContract({
    address: vault ?? undefined,
    abi: deskVaultAbi,
    functionName: "asset",
    chainId: activeChain,
    query: { enabled: readEnabled && addrs.usdg === null },
  });

  const usdg =
    addrs.usdg ??
    (typeof assetFromVault === "string" ? (assetFromVault as `0x${string}`) : null);

  const [depositAmt, setDepositAmt] = useState("");
  const [redeemAmt, setRedeemAmt] = useState("");
  const [busy, setBusy] = useState<
    "idle" | "approve" | "deposit" | "redeem" | "stake" | "list"
  >("idle");
  const [note, setNote] = useState<string | null>(null);
  const [stakeAmt, setStakeAmt] = useState("");
  const [listLeader, setListLeader] = useState("");

  const { data: listingBond } = useReadContract({
    address: factory ?? undefined,
    abi: deskFactoryAbi,
    functionName: "listingBondSeat",
    chainId: activeChain,
    query: { enabled: factory !== null && addrs.seatToken !== null },
  });

  const refreshVault = useCallback(async () => {
    await Promise.all([
      refetchAssets(),
      refetchShares(),
      refetchNav(),
      refetchCash(),
      refetchUser(),
      refetchQueue(),
    ]);
  }, [
    refetchAssets,
    refetchCash,
    refetchNav,
    refetchQueue,
    refetchShares,
    refetchUser,
  ]);

  const asBig = (value: unknown): bigint | null =>
    typeof value === "bigint" ? value : null;

  const navUsdg = onChain ? asBig(totalAssets) : null;
  const navPer = onChain ? asBig(navShare) : null;
  const cashUsdg = onChain ? asBig(cash) : null;
  const shares = onChain ? asBig(totalShares) : null;
  const mine = onChain ? asBig(userShares) : null;
  const queued = onChain ? asBig(queueLen) : null;

  const leaderLabel = useMemo(() => {
    if (!onChain) return "—";
    if (typeof leader === "string") return shortAddr(leader);
    return "…";
  }, [leader, onChain]);

  const depositDisabled = !canWrite || busy !== "idle" || !usdg || !vault;
  const redeemDisabled = !canWrite || busy !== "idle" || !vault;
  const stakeDisabled =
    !canWrite || busy !== "idle" || !addrs.seatToken || !addrs.stakingPool;
  const listDisabled =
    !canWrite ||
    busy !== "idle" ||
    !addrs.seatToken ||
    !factory ||
    listingBond === undefined;

  async function onDeposit() {
    if (!vault || !usdg || !address || !publicClient) return;
    setNote(null);
    let amount: bigint;
    try {
      amount = parseUnits(depositAmt.trim(), 6);
    } catch {
      setNote("Enter a valid USDG amount.");
      return;
    }
    if (amount <= 0n) {
      setNote("Amount must be greater than zero.");
      return;
    }
    try {
      setBusy("approve");
      await ensureDeskChain();
      const approveHash = await writeContractAsync({
        address: usdg,
        abi: erc20Abi,
        functionName: "approve",
        args: [vault, amount],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      setBusy("deposit");
      const depHash = await writeContractAsync({
        address: vault,
        abi: deskVaultAbi,
        functionName: "deposit",
        args: [amount],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash: depHash });
      setNote("Deposit confirmed (instant mint).");
      setDepositAmt("");
      await refreshVault();
    } catch (err) {
      setNote(shortError(err, "Deposit failed."));
    } finally {
      setBusy("idle");
    }
  }

  async function onRedeem() {
    if (!vault || !address || !publicClient) return;
    setNote(null);
    let sharesIn: bigint;
    try {
      sharesIn = parseUnits(redeemAmt.trim(), 6);
    } catch {
      setNote("Enter a valid share amount.");
      return;
    }
    if (sharesIn <= 0n) {
      setNote("Shares must be greater than zero.");
      return;
    }
    try {
      setBusy("redeem");
      await ensureDeskChain();
      const hash = await writeContractAsync({
        address: vault,
        abi: deskVaultAbi,
        functionName: "redeem",
        args: [sharesIn],
        chainId: activeChain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const wasQueued = receipt.logs.some((log) => {
        try {
          const decoded = decodeEventLog({
            abi: deskVaultAbi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "WithdrawQueued";
        } catch {
          return false;
        }
      });
      setNote(
        wasQueued
          ? "Redeem queued — cash unavailable or vault paused."
          : "Redeem confirmed (instant USDG).",
      );
      setRedeemAmt("");
      await refreshVault();
    } catch (err) {
      setNote(shortError(err, "Redeem failed."));
    } finally {
      setBusy("idle");
    }
  }

  async function onStake() {
    if (!addrs.seatToken || !addrs.stakingPool || !publicClient) return;
    setNote(null);
    let amount: bigint;
    try {
      amount = parseUnits(stakeAmt.trim(), 18);
    } catch {
      setNote("Enter a valid $AXBOOK amount.");
      return;
    }
    if (amount <= 0n) {
      setNote("Amount must be greater than zero.");
      return;
    }
    try {
      setBusy("stake");
      await ensureDeskChain();
      const approveHash = await writeContractAsync({
        address: addrs.seatToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [addrs.stakingPool, amount],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      const hash = await writeContractAsync({
        address: addrs.stakingPool,
        abi: stakingPoolAbi,
        functionName: "stake",
        args: [amount],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setNote("Stake confirmed.");
      setStakeAmt("");
    } catch (err) {
      setNote(shortError(err, "Stake failed."));
    } finally {
      setBusy("idle");
    }
  }

  async function onListDesk() {
    if (!factory || !addrs.seatToken || !publicClient) return;
    setNote(null);
    const leaderAddr = listLeader.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(leaderAddr)) {
      setNote("Enter a leader address.");
      return;
    }
    const bond = typeof listingBond === "bigint" ? listingBond : 0n;
    if (bond <= 0n) {
      setNote("Listing bond is not configured.");
      return;
    }
    try {
      setBusy("list");
      await ensureDeskChain();
      const approveHash = await writeContractAsync({
        address: addrs.seatToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [factory, bond],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      const hash = await writeContractAsync({
        address: factory,
        abi: deskFactoryAbi,
        functionName: "listDesk",
        args: [leaderAddr as `0x${string}`],
        chainId: activeChain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setNote("Desk listed. Refresh to see it in the picker.");
      setListLeader("");
      const n = (await publicClient.readContract({
        address: factory,
        abi: deskFactoryAbi,
        functionName: "deskCount",
      })) as bigint;
      const rows: `0x${string}`[] = [];
      for (let i = 0; i < Number(n); i++) {
        const d = (await publicClient.readContract({
          address: factory,
          abi: deskFactoryAbi,
          functionName: "allDesks",
          args: [BigInt(i)],
        })) as `0x${string}`;
        rows.push(d.toLowerCase() as `0x${string}`);
      }
      setFactoryDesks(rows);
    } catch (err) {
      setNote(shortError(err, "List desk failed."));
    } finally {
      setBusy("idle");
    }
  }

  return (
    <SeatTerminal
      cash={cashUsdg !== null ? formatNav(cashUsdg) : "—"}
      deskChain={activeChain}
      forms={
        <>
      {factoryDesks.length > 1 ? (
        <div className="chips">
          {factoryDesks.map((d) => (
            <button
              className={
                d.toLowerCase() === vault?.toLowerCase() ? "chip chip-on" : "chip"
              }
              key={d}
              onClick={() => {
                setQueryDesk(d);
                const url = new URL(window.location.href);
                url.searchParams.set("desk", d);
                window.history.replaceState({}, "", url.toString());
              }}
              type="button"
            >
              {shortAddr(d)}
            </button>
          ))}
        </div>
      ) : null}
        <div className="tickets">
          <form
            className="ticket"
            onSubmit={(event) => {
              event.preventDefault();
              void onDeposit();
            }}
          >
            <h2>Deposit</h2>
            <div className="field">
              <label className="field-label" htmlFor="deposit-usdg">
                USDG
              </label>
              <input
                className="input"
                disabled={depositDisabled}
                id="deposit-usdg"
                inputMode="decimal"
                onChange={(e) => setDepositAmt(e.target.value)}
                placeholder="0.00"
                value={depositAmt}
              />
            </div>
            <button className="btn btn-on" disabled={depositDisabled} type="submit">
              {busy === "approve"
                ? "Approving…"
                : busy === "deposit"
                  ? "Depositing…"
                  : "Deposit"}
            </button>
          </form>
          <form
            className="ticket"
            onSubmit={(event) => {
              event.preventDefault();
              void onRedeem();
            }}
          >
            <h2>Redeem</h2>
            <div className="field">
              <label className="field-label" htmlFor="redeem-shares">
                Shares
              </label>
              <input
                className="input"
                disabled={redeemDisabled}
                id="redeem-shares"
                inputMode="decimal"
                onChange={(e) => setRedeemAmt(e.target.value)}
                placeholder="0.00"
                value={redeemAmt}
              />
            </div>
            <button className="btn btn-on" disabled={redeemDisabled} type="submit">
              {busy === "redeem" ? "Redeeming…" : "Redeem"}
            </button>
          </form>
        </div>
        {addrs.seatToken && addrs.stakingPool ? (
          <form
            className="ticket"
            onSubmit={(event) => {
              event.preventDefault();
              void onStake();
            }}
            style={{ marginTop: 12 }}
          >
            <h2>Stake</h2>
            <div className="field">
              <label className="field-label" htmlFor="stake-seat">
                AXBOOK
              </label>
              <input
                className="input"
                disabled={stakeDisabled}
                id="stake-seat"
                inputMode="decimal"
                onChange={(e) => setStakeAmt(e.target.value)}
                placeholder="0.00"
                value={stakeAmt}
              />
            </div>
            <button className="btn btn-on" disabled={stakeDisabled} type="submit">
              {busy === "stake" ? "Staking…" : "Stake"}
            </button>
          </form>
        ) : null}
        {addrs.seatToken && factory ? (
          <form
            className="ticket"
            onSubmit={(event) => {
              event.preventDefault();
              void onListDesk();
            }}
            style={{ marginTop: 12 }}
          >
            <h2>List a desk</h2>
            <div className="field">
              <label className="field-label" htmlFor="list-leader">
                Leader
              </label>
              <input
                className="input"
                disabled={listDisabled}
                id="list-leader"
                onChange={(e) => setListLeader(e.target.value)}
                placeholder="0x"
                value={listLeader}
              />
            </div>
            <button className="btn btn-on" disabled={listDisabled} type="submit">
              {busy === "list"
                ? "Listing…"
                : `List · ${
                    typeof listingBond === "bigint"
                      ? formatUnits(listingBond, 18)
                      : "…"
                  } AXBOOK`}
            </button>
          </form>
        ) : null}
        {!canWrite ? (
          <p className="hint">Connect a wallet on Robinhood Chain to deposit or redeem.</p>
        ) : null}
          <p className="legal">
            <strong>Mainnet.</strong> NAV includes open positions. Axbook is not affiliated
            with Robinhood Markets. Stock Tokens are not shares. This is not investment advice.
          </p>
        </>
      }
      leader={typeof leader === "string" ? (leader as `0x${string}`) : null}
      nav={navUsdg !== null ? formatNav(navUsdg) : "—"}
      note={note}
      seats={shares !== null ? formatNav(shares) : "—"}
      title={leaderLabel}
      vault={vault ? shortAddr(vault) : "—"}
      wallet={<WalletBar deskChain={activeChain} />}
    />
  );
}
