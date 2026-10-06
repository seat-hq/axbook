"use client";

import { useRef } from "react";
import { useGsap } from "@/motion/hooks";
import styles from "./Manifesto.module.css";

const pairs: readonly [string, string, string][] = [
  ["Copy", "Participate", "You don't mirror trades. You hold a share of a desk."],
  ["Wallet", "Desk", "The unit is a managed vault, not someone else's address."],
  ["Trade", "NAV", "What you own is measured as net asset value, not a trade list."],
  ["Follower", "Shareholder", "Your claim is pro-rata, and it's redeemable."],
  ["Mirror", "Risk-adjusted exposure", "Filtered, session-sized, capped — smaller by design."],
  ["Private key", "Custody separation", "His key stays his. Your capital stays in the desk."],
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useGsap(
    ref,
    ({ gsap }) => {
      gsap.utils.toArray<HTMLElement>("[data-pair]").forEach((row) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: "top 85%", end: "top 45%", scrub: 0.6 },
        });
        tl.fromTo(row.querySelector("[data-old]"), { opacity: 1 }, { opacity: 0.28, ease: "none" }, 0)
          .fromTo(row.querySelector("[data-strike]"), { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0)
          .fromTo(
            row.querySelector("[data-new]"),
            { opacity: 0, xPercent: -6, filter: "blur(6px)" },
            { opacity: 1, xPercent: 0, filter: "blur(0px)", ease: "none" },
            0.15,
          );
      });
    },
    [],
  );

  return (
    <section ref={ref} id="manifesto" className={`sec sec--void ${styles.sec}`} aria-labelledby="manifesto-title">
      <div className="wrap">
        <p className="eyebrow">
          <b>09</b> What makes Axbook new
        </p>
        <h2 id="manifesto-title" className="sr-only">
          Six shifts in the primitive
        </h2>
        <ol className={styles.list}>
          {pairs.map(([from, to, why]) => (
            <li key={from} data-pair className={styles.row}>
              <p className={`display ${styles.pair}`}>
                <span className={styles.old} data-old>
                  {from}
                  <span className={styles.strike} data-strike aria-hidden="true" />
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
                <span className="sr-only">becomes</span>
                <span className={styles.new} data-new>
                  {to}
                </span>
              </p>
              <p className={styles.why}>{why}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
