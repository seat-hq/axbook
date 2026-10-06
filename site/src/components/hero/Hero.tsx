import { LinkButton } from "@/components/LinkButton";
import { HeroScene } from "./HeroScene";
import styles from "./Hero.module.css";

const facts = [
  ["Books", "NVDA · AAPL · SPY"],
  ["Accounting", "USDG"],
  ["Chain", "Robinhood Chain"],
  ["Status", "Testnet shipped · mainnet capped"],
] as const;

export function Hero() {
  return (
    <section className={`${styles.hero} sec--grid`} aria-labelledby="hero-title">
      <div className={`wrap ${styles.inner}`}>
        <p className={`eyebrow ${styles.eyebrow}`}>
          <b>Axbook</b> · Copy desks for Stock Tokens
        </p>
        <div className={styles.stage}>
          <HeroScene />
        </div>
        <div className={styles.copy}>
          <h1 id="hero-title" className={`display ${styles.title}`}>
            <span className={styles.line}>
              <span style={{ "--d": 0 } as React.CSSProperties}>Copy desk,</span>
            </span>
            <span className={styles.line}>
              <span style={{ "--d": 1 } as React.CSSProperties}>
                <em>not</em> sniper bot.
              </span>
            </span>
          </h1>
          <div className={styles.side}>
            <p className={styles.lede}>
              You don&apos;t copy someone&apos;s wallet. You join a separate desk. Your USDG buys book shares, the desk
              copies selected trades — smaller, filtered, capped — and your shares claim its NAV.
            </p>
            <div className={styles.ctas}>
              <LinkButton href="#story" variant="primary" dir="down">
                Understand the desk
              </LinkButton>
              <LinkButton to="product">Open product</LinkButton>
              <LinkButton to="docs" magnetic={false}>
                Read docs
              </LinkButton>
            </div>
          </div>
        </div>
        <dl className={styles.facts}>
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
