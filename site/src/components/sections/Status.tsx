import styles from "./Status.module.css";

const phases = [
  {
    n: "Phase 0",
    title: "Paper copy",
    state: "Shipped",
    tone: "done",
    items: ["Keeper observes fills, risk module decides, no funds move", "Every decision explainable: copied, resized or skipped"],
  },
  {
    n: "Phase 1",
    title: "Testnet desks",
    state: "Shipped on testnet 46630",
    tone: "done",
    items: ["Factory + cash vault, USDG deposit / redeem", "Keeper bound to vault.leader()", "50,000 USDG-capped mainnet desk wired; broadcast is guarded"],
  },
  {
    n: "Phase 2",
    title: "Open desks + $AXBOOK",
    state: "Code shipped · TGE not broadcast",
    tone: "partial",
    items: ["Fixed 1B $AXBOOK, no mint", "70 / 20 / 10 fee split, stake-to-list, extra desks", "12-month LP lock"],
  },
  {
    n: "Later",
    title: "Non-binding",
    state: "Not scheduled",
    tone: "later",
    items: ["Buyback-and-burn", "Vesting and merkle airdrop", "Ungated AUM", "Phase 3 tools"],
  },
] as const;

export function Status() {
  return (
    <section id="status" className={`sec sec--tight sec--paper ${styles.sec}`} aria-labelledby="status-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="eyebrow">
            <b>12</b> Status
          </p>
          <h2 id="status-title" className="display h-md">
            Where the project actually is.
          </h2>
          <p className={styles.sub}>From the litepaper. No dates — nothing here is a promise.</p>
        </div>
        <ol className={styles.phases}>
          {phases.map((p) => (
            <li key={p.n} className={styles.phase} data-tone={p.tone}>
              <p className={`mono ${styles.n}`}>{p.n}</p>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={`mono ${styles.state}`}>{p.state}</p>
              <ul>
                {p.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
