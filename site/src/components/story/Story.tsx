"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import { getGsap } from "@/motion/gsap";
import { useInitialMediaQuery, useReducedMotion } from "@/motion/hooks";
import { EXAMPLE_LABEL } from "@/lib/story";
import { beats, STAGES, type Beat } from "./beats";
import { AlexPanel, VaultPanel } from "./Panels";
import { Center } from "./Centers";
import styles from "./Story.module.css";

const N = beats.length;
const stageStart = STAGES.map((_, s) => beats.findIndex((b) => b.stage === s));

function summary(b: Beat): string {
  return `Stage ${b.stage + 1} of ${STAGES.length}: ${STAGES[b.stage]}. ${b.title} ${b.body.join(" ")}`;
}

function Narration({ beat, headingLevel = 3 }: { beat: Beat; headingLevel?: 3 | 4 }) {
  const H = headingLevel === 3 ? "h3" : "h4";
  return (
    <div className={styles.narr} key={beat.id}>
      <p className={`mono ${styles.stageTag}`}>
        {String(beat.stage + 1).padStart(2, "0")} — {STAGES[beat.stage]}
      </p>
      <H className={`display ${styles.beatTitle}`}>{beat.title}</H>
      {beat.body.map((p) => (
        <p key={p} className={styles.beatBody}>
          {p}
        </p>
      ))}
    </div>
  );
}

function Rail({ index, go }: { index: number; go: (i: number) => void }) {
  const beat = beats[index];
  return (
    <nav className={styles.rail} aria-label="Story stages">
      <button type="button" className={styles.railBtn} onClick={() => go(index - 1)} disabled={index <= 0}>
        <span aria-hidden="true">←</span> Prev
      </button>
      <ol className={styles.railStages}>
        {STAGES.map((name, s) => {
          const active = beat?.stage === s;
          const subs = beats.filter((b) => b.stage === s).length;
          const subIdx = active ? index - (stageStart[s] ?? 0) : -1;
          return (
            <li key={name}>
              <button
                type="button"
                className={styles.railStage}
                data-active={active}
                data-done={(beat?.stage ?? 0) > s}
                aria-current={active ? "step" : undefined}
                onClick={() => go(stageStart[s] ?? 0)}
              >
                <span className="mono">{String(s + 1).padStart(2, "0")}</span>
                <span className={styles.railName}>{name}</span>
                <span className={styles.railSubs} aria-hidden="true">
                  {Array.from({ length: subs }, (_, k) => (
                    <i key={k} data-on={active && k <= subIdx} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" className={styles.railBtn} onClick={() => go(index + 1)} disabled={index >= N - 1}>
        Next <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

function Pinned() {
  const pinRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ST | null>(null);
  const [index, setIndex] = useState(0);
  const beat = beats[index] ?? beats[0]!;
  const crossing = beat.center === "tape" || beat.center === "size";

  useEffect(() => {
    const el = pinRef.current;
    if (!el) return;
    const { gsap, ScrollTrigger } = getGsap();
    let alive = true;
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: `+=${(N - 1) * 22}%`,
        pin: true,
        anticipatePin: 1,
        snap: { snapTo: 1 / (N - 1), duration: { min: 0.18, max: 0.38 }, delay: 0.05, ease: "power2.inOut" },
        onUpdate: (self) => {
          if (alive) setIndex(Math.round(self.progress * (N - 1)));
        },
      });
      stRef.current = st;
    }, el);
    return () => {
      alive = false;
      stRef.current = null;
      // Revert only this pin. A global ScrollTrigger.refresh() here measures
      // nodes Next has already detached and throws removeChild on null.
      try {
        ctx.revert();
      } catch {
        /* route change detached the pin spacer first */
      }
    };
  }, []);

  const go = useCallback((i: number) => {
    const st = stRef.current;
    const target = Math.max(0, Math.min(N - 1, i));
    if (!st) return;
    window.scrollTo({ top: st.start + ((st.end - st.start) * target) / (N - 1) + 1, behavior: "smooth" });
  }, []);

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div ref={pinRef} className={styles.pin} onKeyDown={onKey}>
      <div className={`wrap ${styles.pinInner}`}>
        <div className={styles.board} data-crossing={crossing} data-center={beat.center}>
          <div className={styles.colAlex}>
            <AlexPanel alex={beat.alex} />
          </div>
          <div className={styles.wall} aria-hidden="true">
            <span className={styles.wallLine} />
            <span className={styles.wallLabel}>custody wall</span>
            <span className={styles.signal}>
              <i />
              <b className="mono">signal</b>
            </span>
          </div>
          <div className={styles.colCenter}>
            <Narration beat={beat} />
            <div className={styles.centerVis} key={beat.id}>
              <Center kind={beat.center} />
            </div>
          </div>
          <div className={styles.colVault}>
            <VaultPanel vault={beat.vault} />
          </div>
        </div>
        <Rail index={index} go={go} />
        <p className="sr-only" aria-live="polite">
          {summary(beat)}
        </p>
      </div>
    </div>
  );
}

function Stacked() {
  const listRef = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const beat = beats[index] ?? beats[0]!;

  useEffect(() => {
    setReady(true);
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-beat]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setIndex(Number((e.target as HTMLElement).dataset.beat));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={styles.stack}>
      {ready ? (
        <div className={styles.sticky} aria-hidden="true">
          <div className={`wrap ${styles.stickyInner}`}>
            <AlexPanel alex={beat.alex} compact />
            <VaultPanel vault={beat.vault} compact />
          </div>
        </div>
      ) : null}
      <ol ref={listRef} className={`wrap ${styles.cards}`}>
        {beats.map((b, i) => (
          <li key={b.id} data-beat={i} className={styles.card} data-active={i === index}>
            <Narration beat={b} />
            <div className={styles.cardVis}>
              <Center kind={b.center} />
            </div>
            <details className={styles.cardState}>
              <summary>Desk state at this step</summary>
              <div className={styles.cardStateInner}>
                <AlexPanel alex={b.alex} />
                <VaultPanel vault={b.vault} />
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Story() {
  const wide = useInitialMediaQuery("(min-width: 1024px) and (min-height: 700px)");
  const reduced = useReducedMotion();
  const pinned = wide === true && reduced === false;

  return (
    <section id="story" className={styles.section} aria-labelledby="story-title">
      <div className={`wrap ${styles.head}`}>
        <p className="eyebrow">
          <b>04</b> The story
        </p>
        <h2 id="story-title" className="display h-xl">
          Two <em>piles.</em>
        </h2>
        <div className={styles.headSide}>
          <p className="lede">
            Alex leads. You and Sam join the desk. Watch one example run end to end — deposits, a filtered copy, a
            price move, a fee, a loss, and a way out. {pinned ? "Scroll, or use the stage controls." : ""}
          </p>
          <p className="example-tag">{EXAMPLE_LABEL}</p>
        </div>
      </div>
      {pinned ? <Pinned /> : <Stacked />}
    </section>
  );
}
