import styles from "./Compare.module.css";

const wallet = ["Leader wallet", "Follower wallet", "Trade replication"];
const seat = [
  "Leader wallet",
  "Signal observation",
  "Risk filter",
  "Scaled execution",
  "Desk vault",
  "NAV",
  "Book shares",
  "Redemption",
];

const rows: readonly [string, string, string][] = [
  ["What you hold", "Tokens in your own wallet", "Book shares — a claim on desk NAV"],
  ["Where capital sits", "Your wallet", "The desk vault contract"],
  ["Unit of copying", "Individual trades", "A portfolio: filtered, scaled, capped"],
  ["Leaving", "Sell your positions", "Redeem shares at NAV — from cash, or queued"],
  ["What you rely on", "Your wallet and the copy tool", "Vault, risk module, keeper and price oracle"],
];

export function Compare() {
  return (
    <section id="why" className={`sec sec--paper ${styles.sec}`} aria-labelledby="compare-title">
      <div className="wrap">
        <p className="eyebrow">
          <b>05</b> Why a desk
        </p>
        <h2 id="compare-title" className={`display h-lg ${styles.title}`}>
          Same idea of following a leader. <em>Different ownership primitive.</em>
        </h2>
        <p className={styles.lede}>
          Both models let a leader&apos;s activity shape your exposure. This isn&apos;t better-or-worse — it&apos;s a
          different architecture, with different things to trust.
        </p>

        <div className={styles.pipes}>
          <figure className={styles.pipe} data-kind="wallet">
            <figcaption className="mono">Wallet copy model</figcaption>
            <ol>
              {wallet.map((n, i) => (
                <li key={n} data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
                  {n}
                </li>
              ))}
            </ol>
          </figure>
          <figure className={styles.pipe} data-kind="seat">
            <figcaption className="mono">Axbook desk model</figcaption>
            <ol>
              {seat.map((n, i) => (
                <li
                  key={n}
                  data-reveal
                  data-side={i === 0 ? "alex" : i < 4 ? "engine" : "desk"}
                  style={{ "--reveal-i": i } as React.CSSProperties}
                >
                  {n}
                </li>
              ))}
            </ol>
          </figure>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Architectural comparison of wallet copying and desk participation</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Aspect</span>
                </th>
                <th scope="col">Wallet copy</th>
                <th scope="col">Axbook desk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, a, b]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
