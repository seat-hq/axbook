import styles from "./Questions.module.css";

const questions = [
  { q: "Who controls the capital?", a: "A desk vault contract holds it — not the leader.", href: "#trust" },
  { q: "How is risk sized?", a: "Session multiplier first, then fill, position and gross caps.", href: "#risk" },
  { q: "What happens when markets close?", a: "Closed session means skip. Uncertain means do not trade.", href: "#story" },
  { q: "What happens when a follower wants to leave?", a: "Redeem shares at NAV — paid from cash, or queued.", href: "#story" },
  { q: "What does ownership actually mean?", a: "Book shares: a pro-rata claim on the desk's NAV.", href: "#primitive" },
  {
    q: "How do the leader's wallet and the follower's capital stay separate?",
    a: "They never share custody. The signal crosses over; the money doesn't.",
    href: "#flows",
  },
];

export function Questions() {
  return (
    <section className={`sec sec--paper ${styles.sec}`} aria-labelledby="questions-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.left}>
          <p className="eyebrow">
            <b>02</b> The problem
          </p>
          <h2 id="questions-title" className={`display h-lg ${styles.title}`}>
            What happens when copying becomes a <em>portfolio?</em>
          </h2>
          <figure className={styles.chain} aria-label="The familiar wallet copy model">
            <div className={styles.node}>
              <span className="mono">01</span> Leader wallet
            </div>
            <div className={styles.arrow} aria-hidden="true" />
            <div className={styles.node}>
              <span className="mono">02</span> Follower wallet
            </div>
            <div className={styles.arrow} aria-hidden="true" />
            <div className={styles.node}>
              <span className="mono">03</span> Copied trades
            </div>
            <figcaption>
              The familiar model. A wallet shows you <strong>what</strong> someone trades. Copying it doesn&apos;t, on its
              own, give you a risk structure, custody separation, portfolio construction or a redemption model.
            </figcaption>
          </figure>
        </div>
        <ol className={styles.list}>
          {questions.map((item, i) => (
            <li key={item.q} data-reveal style={{ "--reveal-i": i % 2 } as React.CSSProperties}>
              <span className={`mono ${styles.num}`}>Q{i + 1}</span>
              <h3 className={styles.q}>{item.q}</h3>
              <a className={styles.a} href={item.href}>
                <span className="mono" aria-hidden="true">
                  Axbook →
                </span>{" "}
                {item.a}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
