"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAIN, isTradeEligible, listSymbols } from "@seat/sdk";
import { decodeEventLog, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { deskFactoryAbi, deskVaultAbi, erc20Abi, stakingPoolAbi } from "@/abis";
import { WalletBar } from "@/components/WalletBar";
import { canWriteOnChain, getAddresses } from "@/lib/addresses";
import { formatNav } from "@/lib/desks";
import { parseUsdgField, type RecordedFill } from "@/lib/fills";

const BOOK = listSymbols().filter((symbol) =>
  isTradeEligible(symbol, CHAIN.MAINNET_ID),
);

function sessionLabel(session: string): string {
  if (session === "regular") return "Regular";
  if (session === "after_hours") return "After hours";
  if (session === "pre_market") return "Pre-market";
  if (session === "closed") return "Closed";
  return session.replaceAll("_", " ");
}

function sideClass(side: string): string {
  const value = side.toLowerCase();
  if (value === "buy") return "side side-buy";
  if (value === "sell") return "side side-sell";
  return "side";
}

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
  const { address, isConnected } = useAccount();
  const walletChain = useChainId();
  const activeChain =
    getAddresses(CHAIN.MAINNET_ID).deskVault !== null
      ? CHAIN.MAINNET_ID
      : CHAIN.TESTNET_ID;
  const onDeskChain = isConnected && walletChain === activeChain;
  const addrs = getAddresses(activeChain);
  const factory = addrs.deskFactory;
  const [queryDesk, setQueryDesk] = useState<`0x${string}` | null>(null);
  const [factoryDesks, setFactoryDesks] = useState<`0x${string}`[]>([]);
  const publicClient = usePublicClient({ chainId: activeChain });
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("desk");
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
    onDeskChain && canWriteOnChain(activeChain, addrs) && Boolean(address);

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
  const [fills, setFills] = useState<RecordedFill[]>([]);
  const [stakeAmt, setStakeAmt] = useState("");
  const [listLeader, setListLeader] = useState("");

  const { data: listingBond } = useReadContract({
    address: factory ?? undefined,
    abi: deskFactoryAbi,
    functionName: "listingBondSeat",
    chainId: activeChain,
    query: { enabled: factory !== null && addrs.seatToken !== null },
  });

  const loadFills = useCallback(async () => {
    try {
      const res = await fetch("/api/fills", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { fills?: RecordedFill[] };
      setFills(Array.isArray(json.fills) ? json.fills : []);
    } catch {
      setFills([]);
    }
  }, []);

  useEffect(() => {
    void loadFills();
    const id = window.setInterval(() => void loadFills(), 12_000);
    return () => window.clearInterval(id);
  }, [loadFills]);

  const refreshVault = useCallback(async () => {
    await Promise.all([
      refetchAssets(),
      refetchShares(),
      refetchNav(),
      refetchCash(),
      refetchUser(),
      refetchQueue(),
    ]);
    await loadFills();
  }, [
    loadFills,
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
      setNote("Enter a valid $SEAT amount.");
      return;
    }
    if (amount <= 0n) {
      setNote("Amount must be greater than zero.");
      return;
    }
    try {
      setBusy("stake");
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

  const tape = vault
    ? fills.filter(
        (f) =>
          f.source !== "fixture" &&
          (!f.desk || f.desk.toLowerCase() === vault.toLowerCase()),
      )
    : fills.filter((f) => f.source !== "fixture");

  return (
    <main className="container">
      <header className="topbar">
        <div className="brand-lockup">
          <div>
            <div className="brand">SEAT</div>
            <p className="tagline">Copy desk for official Stock Tokens</p>
          </div>
          {onChain ? (
            <span className="live-pill">
              <span className="live-dot" />
              Mainnet
            </span>
          ) : null}
        </div>
        <WalletBar deskChain={activeChain} />
      </header>

      <section className="desk-head">
        <div>
          <div className="kicker">Leader</div>
          <div className="desk-title">{leaderLabel}</div>
          {onChain && vault ? (
            <div className="desk-meta">
              Vault <span className="mono">{shortAddr(vault)}</span>
            </div>
          ) : (
            <div className="desk-meta">Desk unavailable</div>
          )}
        </div>
      </section>

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

      <section className="metrics" aria-label="Desk figures">
        <div className="card">
          <div className="label">NAV</div>
          <div className="value">
            {navUsdg !== null ? formatNav(navUsdg) : "—"}
            {navUsdg !== null ? <span className="unit">USDG</span> : null}
          </div>
        </div>
        <div className="card">
          <div className="label">NAV / seat</div>
          <div className="value">
            {navPer !== null ? formatNav(navPer) : "—"}
            {navPer !== null ? <span className="unit">USDG</span> : null}
          </div>
        </div>
        <div className="card">
          <div className="label">Cash</div>
          <div className="value">
            {cashUsdg !== null ? formatNav(cashUsdg) : "—"}
            {cashUsdg !== null ? <span className="unit">USDG</span> : null}
          </div>
        </div>
        <div className="card">
          <div className="label">Shares</div>
          <div className="value">{shares !== null ? formatNav(shares) : "—"}</div>
        </div>
        <div className="card">
          <div className="label">Your seats</div>
          <div className="value">{mine !== null ? formatNav(mine) : "—"}</div>
        </div>
        <div className="card">
          <div className="label">
            {typeof depositCap === "bigint" && depositCap > 0n
              ? "Deposit cap"
              : "Queue"}
          </div>
          <div className="value">
            {typeof depositCap === "bigint" && depositCap > 0n ? (
              <>
                {formatNav(depositCap)}
                <span className="unit">USDG</span>
              </>
            ) : queued !== null ? (
              queued.toString()
            ) : (
              "—"
            )}
          </div>
        </div>
      </section>
      <p className="caption">
        NAV marks cash plus open positions. Cash is USDG still in the vault.
      </p>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Book</h2>
        </div>
        <div className="symbols">
          {BOOK.map((symbol) => (
            <span className="symbol" key={symbol}>
              {symbol}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Copies</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Leader</th>
                <th>Copied</th>
                <th>Slippage</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {tape.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={7}>
                    No copies yet.
                  </td>
                </tr>
              ) : (
                tape.map((f) => {
                  const intended = parseUsdgField(f.intendedUsdg);
                  const executed = parseUsdgField(f.executedUsdg);
                  const skipped =
                    f.action === "skip" || f.action === "reject" || executed === 0n;
                  return (
                    <tr key={`${f.source}-${f.fillId}`}>
                      <td className="mono">{formatTime(f.timestamp)}</td>
                      <td>{f.symbol}</td>
                      <td className={sideClass(f.side)}>{f.side}</td>
                      <td className="mono">{formatNav(intended)}</td>
                      <td className="mono" title={skipped ? f.reason : undefined}>
                        {skipped ? "Skipped" : formatNav(executed)}
                      </td>
                      <td className="mono">{f.slippageBps} bps</td>
                      <td className="session">{sessionLabel(f.session)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
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
                SEAT
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
                  } SEAT`}
            </button>
          </form>
        ) : null}
        {!canWrite ? (
          <p className="hint">Connect a wallet on Robinhood Chain to deposit or redeem.</p>
        ) : null}
        {note ? <p className="note">{note}</p> : null}
      </section>

      <footer className="legal">
        <strong>Mainnet.</strong> Figures are read from the desk. NAV includes
        open positions. SEAT is not affiliated with Robinhood Markets. Stock
        Tokens are not shares. This is not investment advice.
      </footer>
    </main>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}
