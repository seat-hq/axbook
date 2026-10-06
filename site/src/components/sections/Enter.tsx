import Link from "next/link";
import { LinkButton } from "@/components/LinkButton";
import { links, unpublishedLabel, type LinkKey } from "@/lib/links";
import { Icon, type IconName } from "@/components/Icons";
import styles from "./Enter.module.css";

const eco: readonly { key: LinkKey; icon: IconName; kicker: string }[] = [
  { key: "docs", icon: "code", kicker: "Read" },
  { key: "product", icon: "front", kicker: "Use" },
  { key: "x", icon: "eye", kicker: "Follow" },
];

export function Enter() {
  return (
    <>
      <section id="enter" className={`sec ${styles.enter}`} aria-labelledby="enter-title">
        <div className={`wrap ${styles.enterInner}`}>
          <p className="eyebrow">
            <b>13</b> From story to product
          </p>
          <h2 id="enter-title" className={`display ${styles.big}`}>
            That was the desk.
            <br />
            <em>Now explore the system.</em>
          </h2>
          <p className="lede">
            The product is the desk blotter: connect a wallet, read a desk&apos;s NAV, deposit USDG for seats, redeem
            them, and watch the fill tape — every row labeled fixture or chain.
          </p>
          <div className={styles.ctas}>
            <LinkButton to="product" variant="primary">
              Enter the desk
            </LinkButton>
            <LinkButton to="docs">Read the docs</LinkButton>
          </div>
        </div>
      </section>

      <section id="ecosystem" className={`sec sec--tight ${styles.eco}`} aria-labelledby="eco-title">
        <div className="wrap">
          <h2 id="eco-title" className={`mono ${styles.ecoTitle}`}>
            The Axbook ecosystem
          </h2>
          <ul className={styles.grid}>
            {eco.map(({ key, icon, kicker }) => {
              const l = links[key];
              const body = (
                <>
                  <span className={styles.cardTop}>
                    <Icon name={icon} size={22} />
                    <span className="mono">{kicker}</span>
                  </span>
                  <span className={styles.cardName}>
                    {l.label} {l.href ? <span aria-hidden="true">{l.external ? "↗" : "→"}</span> : <span className="tbd">{unpublishedLabel}</span>}
                  </span>
                  <span className={styles.cardDesc}>{l.description}</span>
                </>
              );
              return (
                <li key={key}>
                  {!l.href ? (
                    <span className={styles.card} aria-disabled="true">
                      {body}
                    </span>
                  ) : l.external ? (
                    <a className={styles.card} href={l.href} target="_blank" rel="noopener noreferrer">
                      {body}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link className={styles.card} href={l.href}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
