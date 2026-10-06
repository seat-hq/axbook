import { FlowsDiagram } from "./FlowsDiagram";
import styles from "./Flows.module.css";

export function Flows() {
  return (
    <section id="flows" className={`sec sec--grid ${styles.sec}`} aria-labelledby="flows-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="eyebrow">
            <b>07</b> How value flows
          </p>
          <h2 id="flows-title" className="display h-lg">
            Trade signals in. Risk decisions. <em>NAV out.</em>
          </h2>
          <p className="lede">
            Two different things move through Axbook. Information about Alex&apos;s trades. And your capital. They never
            share a path.
          </p>
          <ul className={styles.legend}>
            <li data-kind="signal">
              <i aria-hidden="true" /> Signal flow
            </li>
            <li className={styles.neq} aria-label="is not">
              ≠
            </li>
            <li data-kind="capital">
              <i aria-hidden="true" /> Capital flow
            </li>
          </ul>
        </div>

        <figure className={styles.fig}>
          <FlowsDiagram />
          <figcaption className={styles.lists}>
            <div>
              <h3 className={`mono ${styles.listTitle}`} data-kind="signal">
                Signal flow — information
              </h3>
              <ol>
                <li>Alex trades from his own wallet.</li>
                <li>The keeper observes the fill as a signal.</li>
                <li>The risk module accepts, resizes or rejects it.</li>
                <li>An accepted signal becomes a copy instruction to the vault.</li>
              </ol>
            </div>
            <div>
              <h3 className={`mono ${styles.listTitle}`} data-kind="capital">
                Capital flow — money
              </h3>
              <ol>
                <li>You deposit USDG into the desk vault.</li>
                <li>The vault swaps its own USDG for allowlisted assets.</li>
                <li>Cash plus asset value is the NAV.</li>
                <li>NAV divided by shares is what each book share claims.</li>
                <li>Redeeming shares returns USDG to you — from the vault.</li>
              </ol>
            </div>
            <p className={styles.never}>
              There is no path from Alex&apos;s wallet into the vault, and none from the vault back to Alex — except his
              share of desk fees: the performance fee on profit above the high-water mark, and the small AUM fee.
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
