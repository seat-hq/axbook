import { fees, pct, phase1FeeNote, seatToken } from "@/lib/protocol";
import { story, usd, EXAMPLE_LABEL } from "@/lib/story";
import styles from "./Economics.module.css";

const u = story.up;

// Illustrative NAV/share path for the high-water-mark chart.
const path = [1.0, 1.04, 1.1, 1.06, 1.03, 1.08, 1.14];

function HwmChart() {
  const W = 560;
  const H = 240;
  const x = (i: number): number => 40 + (i * (W - 70)) / (path.length - 1);
  const y = (v: number): number => H - 30 - ((v - 0.98) / (1.16 - 0.98)) * (H - 60);
  const line = path.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
  let hwm = path[0] ?? 1;
  const steps: string[] = [];
  path.forEach((v, i) => {
    hwm = Math.max(hwm, v);
    steps.push(`${i ? "L" : "M"} ${x(i)} ${y(hwm)}`);
    if (i < path.length - 1) steps.push(`L ${x(i + 1)} ${y(hwm)}`);
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-labelledby="hwm-t">
      <title id="hwm-t">
        Illustrative NAV per share rising to 1.10, falling to 1.03, recovering to 1.08 and then 1.14. A performance fee
        applies only on the rise from 1.00 to 1.10 and from 1.10 to 1.14.
      </title>
      <path d={steps.join(" ")} className={styles.hwm} />
      <path d={line} className={styles.nav} pathLength={1} />
      <path d={`M ${x(0)} ${y(1.0)} L ${x(1)} ${y(1.04)} L ${x(2)} ${y(1.1)}`} className={styles.feeSeg} />
      <path d={`M ${x(5.6)} ${y(1.1)} L ${x(6)} ${y(1.14)}`} className={styles.feeSeg} />
      {path.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3.5} className={styles.dot} />
      ))}
      <text x={x(2)} y={y(1.1) - 10} textAnchor="middle" className={styles.lbl}>
        1.10 new high
      </text>
      <text x={x(4)} y={y(1.03) + 20} textAnchor="middle" className={styles.lbl}>
        1.03 · no fee
      </text>
      <text x={x(5)} y={y(1.08) + 20} textAnchor="middle" className={styles.lbl}>
        1.08 · still no fee
      </text>
      <text x={x(6) - 4} y={y(1.14) - 10} textAnchor="end" className={styles.lbl}>
        1.14 · fee on 1.10→1.14
      </text>
      <text x={x(3.5)} y={y(1.1) - 6} textAnchor="middle" className={`${styles.hwmLbl} ${styles.hwmMid}`}>
        high-water mark
      </text>
      <text x={0} y={14} className={styles.hwmLbl}>
        amber = the only stretches that earn a performance fee
      </text>
    </svg>
  );
}

export function Economics() {
  const split = [
    { k: "Leader", sub: "Alex", bps: fees.leaderShareBps.value, v: u.split.alex, tone: "alex" },
    { k: "Protocol", sub: "treasury", bps: fees.protocolShareBps.value, v: u.split.protocol, tone: "ink" },
    { k: "Stakers", sub: "$AXBOOK stakers", bps: fees.stakerShareBps.value, v: u.split.stakers, tone: "desk" },
  ];
  return (
    <section id="economics" className={`sec sec--paper ${styles.sec}`} aria-labelledby="econ-title">
      <div className="wrap">
        <p className="eyebrow">
          <b>08</b> The economic engine
        </p>
        <h2 id="econ-title" className={`display h-lg ${styles.title}`}>
          The rise is real. <em>The fee comes from the profit.</em>
        </h2>

        <div className={styles.grid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>High-water mark</h3>
            <p className={styles.cardText}>
              The performance fee is {pct(fees.performanceBps.value)} of profit <strong>above</strong> the desk&apos;s
              previous peak NAV/share. After a drawdown, the desk has to get back above that peak before any performance
              fee is charged again.
            </p>
            <HwmChart />
            <p className="example-tag">Illustrative path — not a forecast.</p>
          </article>

          <article className={styles.card} data-reveal>
            <h3 className={styles.cardTitle}>One gain, followed through</h3>
            <ol className={styles.flow}>
              <li>
                <span className="mono">+{usd(u.gain)}</span>
                <span>USDG gain above the high-water mark — NVDA went from {usd(story.copy.spend)} to {usd(u.nvda)}</span>
              </li>
              <li>
                <span className="mono">× {pct(fees.performanceBps.value)}</span>
                <span>performance fee</span>
              </li>
              <li>
                <span className="mono">= {usd(u.perfFee)}</span>
                <span>USDG fee, taken from the profit</span>
              </li>
            </ol>
            <div className={styles.split}>
              {split.map((s, i) => (
                <div key={s.k} className={styles.splitRow} style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.splitName}>
                    {s.k} <span className="dim">· {s.sub}</span>
                  </span>
                  <span className={styles.splitTrack}>
                    <span data-tone={s.tone} style={{ "--w": `${s.bps / 100}%` } as React.CSSProperties} />
                  </span>
                  <span className="mono">
                    {pct(s.bps)} · {usd(s.v)}
                  </span>
                </div>
              ))}
            </div>
            <p className={styles.after}>
              <span className="mono">{usd(u.nav)} → {usd(u.navAfterFee)}</span> NAV ·{" "}
              <span className="mono">1.10 → {u.navPerShareAfterFee.toFixed(2)}</span> per share. Everything left belongs
              to shareholders.
            </p>
            <p className="example-tag">{EXAMPLE_LABEL}</p>
          </article>
        </div>

        <ul className={styles.facts}>
          <li>
            <h3>AUM fee</h3>
            <p>
              {pct(fees.aumBpsPerYear.value)} a year, accrued continuously on desk equity — roughly{" "}
              {usd((20_000 * fees.aumBpsPerYear.value) / 10_000)} USDG a year on a 20,000 USDG desk. Split the same way.
            </p>
          </li>
          <li>
            <h3>No volume fee</h3>
            <p>The desk doesn&apos;t charge per trade. Copying more often doesn&apos;t earn anyone more.</p>
          </li>
          <li>
            <h3>Leader incentive</h3>
            <p>
              Alex earns {pct(fees.leaderShareBps.value)} of desk fees — the performance fee on profit above the
              high-water mark, and the AUM fee. He never gets custody of the desk.
            </p>
          </li>
          <li>
            <h3>$AXBOOK staking</h3>
            <p>
              Fixed supply of {seatToken.totalSupply} $AXBOOK, no mint after deploy. Stakers claim USDG from the{" "}
              {pct(fees.stakerShareBps.value)} fee share. Staking a bond can list a new desk.
            </p>
          </li>
        </ul>
        <p className={styles.footnote}>
          Phase 2 desk defaults from <code>DeployPhase2.s.sol</code>. {phase1FeeNote} $AXBOOK TGE on mainnet has not been
          broadcast.
        </p>
      </div>
    </section>
  );
}
