import { Icon, type IconName } from "@/components/Icons";
import { PrimitiveTrack } from "./PrimitiveTrack";
import styles from "./Primitive.module.css";

export interface PrimitiveStep {
  readonly icon: IconName;
  readonly name: string;
  readonly line: string;
  readonly tone: "alex" | "neutral" | "desk";
}

export const primitiveSteps: readonly PrimitiveStep[] = [
  { icon: "wallet", name: "Leader wallet", line: "Alex trades from his own wallet. His key stays with him.", tone: "alex" },
  { icon: "signal", name: "Trade signal", line: "The keeper observes his fills. Information, not money.", tone: "alex" },
  { icon: "gate", name: "Risk engine", line: "Asset, session, price, drawdown and size are checked. Uncertain = skip.", tone: "neutral" },
  { icon: "vault", name: "Desk vault", line: "The desk trades its own USDG — a smaller copy, by design.", tone: "desk" },
  { icon: "nav", name: "NAV", line: "Cash plus the value of copied positions. It can go down.", tone: "desk" },
  { icon: "shares", name: "Book shares", line: "Your pro-rata claim on NAV. Redeem them to leave.", tone: "desk" },
];

export function Primitive() {
  return (
    <section id="primitive" className={`sec sec--void ${styles.sec}`} aria-labelledby="primitive-title">
      <div className="wrap">
        <p className="eyebrow">
          <b>03</b> The new primitive
        </p>
        <h2 id="primitive-title" className={`display h-xl ${styles.title}`}>
          Axbook changes the <em>primitive.</em>
        </h2>

        <div className={styles.versus}>
          <div className={styles.col} data-reveal>
            <p className={`mono ${styles.colLabel}`}>Wallet copy</p>
            <p className={styles.colBig}>You follow a wallet.</p>
            <p className={styles.colSmall}>Its trades are replicated into your wallet.</p>
          </div>
          <div className={styles.vs} aria-hidden="true">
            →
          </div>
          <div className={`${styles.col} ${styles.colDesk}`} data-reveal style={{ "--reveal-i": 1 } as React.CSSProperties}>
            <p className={`mono ${styles.colLabel}`}>Desk participation</p>
            <p className={styles.colBig}>You join a desk.</p>
            <p className={styles.colSmall}>
              You deposit into a vault. You receive shares. Shares represent a claim on NAV.
            </p>
          </div>
        </div>

        <PrimitiveTrack steps={primitiveSteps}>
          <ol className={styles.steps}>
            {primitiveSteps.map((s, i) => (
              <li key={s.name} className={styles.step} data-tone={s.tone} data-step={i}>
                <span className={styles.stepIcon}>
                  <Icon name={s.icon} size={30} />
                </span>
                <span className={`mono ${styles.stepNum}`}>0{i + 1}</span>
                <h3 className={styles.stepName}>{s.name}</h3>
                <p className={styles.stepLine}>{s.line}</p>
              </li>
            ))}
          </ol>
        </PrimitiveTrack>
      </div>
    </section>
  );
}
