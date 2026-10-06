"use client";

import { useRef, useState, type ReactNode } from "react";
import { useGsap, useInitialMediaQuery } from "@/motion/hooks";
import type { PrimitiveStep } from "./Primitive";
import styles from "./Primitive.module.css";

/** Pins the six-step strip on wide screens and walks through it with scroll. */
export function PrimitiveTrack({ steps, children }: { steps: readonly PrimitiveStep[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const wide = useInitialMediaQuery("(min-width: 980px)") === true;
  const [active, setActive] = useState(-1);

  useGsap(
    ref,
    ({ gsap }) => {
      if (!wide) return;
      const n = steps.length;
      gsap.set("[data-step]", { opacity: 0.22 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top top+=90",
          end: `+=${n * 20}%`,
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => setActive(Math.min(n - 1, Math.floor(self.progress * n * 0.999))),
          onLeaveBack: () => setActive(-1),
        },
      });
      tl.fromTo(`.${styles.fill}`, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: n }, 0);
      steps.forEach((_, i) => {
        tl.to(`[data-step='${i}']`, { opacity: 1, duration: 0.3, ease: "none" }, i);
        tl.fromTo(
          `[data-step='${i}'] .${styles.stepIcon}`,
          { scale: 0.7 },
          { scale: 1, duration: 0.4, ease: "back.out(2)" },
          i,
        );
      });
      return () => setActive(-1);
    },
    [wide],
  );

  const current = steps[active];

  return (
    <div ref={ref} className={styles.track} data-wide={wide}>
      <div className={styles.caption} aria-hidden="true">
        {current ? (
          <p key={current.name} className={`display ${styles.captionWord}`} data-tone={current.tone}>
            {current.name}
          </p>
        ) : (
          <p className={`display ${styles.captionWord} ${styles.captionIdle}`}>Wallet → shares</p>
        )}
      </div>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.fill} />
        <span className={styles.boundary}>
          <span className="mono">custody boundary — only the signal crosses</span>
        </span>
      </div>
      {children}
    </div>
  );
}
