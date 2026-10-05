import { RiskMachine } from "./RiskMachine";
import { pct, risk, session, fees } from "@/lib/protocol";
import { usd } from "@/lib/story";
import styles from "./Risk.module.css";

const controls: readonly { name: string; text: string; src: string }[] = [
  { name: "Asset allowlist", text: "Only verified, enabled Stock Tokens — never identified by symbol alone.", src: "docs/allowlist.md" },
  {
    name: "Market-session awareness",
    text: `Regular ${pct(session.regularBps.value)}, pre-market and after hours ${pct(session.afterHoursBps.value)}, closed skip.`,
    src: "keeper/src/session.ts",
  },
  { name: "Copy filtering", text: "Every signal is accepted, resized or rejected — with a stated reason.", src: "RiskModule.sol" },
  { name: "Scaled execution", text: "Session multiplier first, then caps. The copy is smaller by design.", src: "RiskModule.sol" },
  {
    name: "Position caps",
    text: `Per fill ${usd(risk.maxFillUsdg.value)} · per position ${usd(risk.maxPositionUsdg.value)} · gross ${usd(risk.maxGrossUsdg.value)} USDG.`,
    src: "DeployMainnet.s.sol defaults",
  },
  { name: "Price freshness", text: `Oracle price older than ${risk.maxStalenessSec.value}s means skip.`, src: "DeskVault.sol" },
  {
    name: "Halt conditions",
    text: `Drawdown ≥ ${pct(risk.maxDrawdownBps.value)} from high-water NAV halts new copies. The owner can pause.`,
    src: "RiskModule.sol · DeskVault.sol",
  },
  { name: "Restricted swaps", text: "Allowlisted tokens only, no arbitrary calldata, minimum-out required.", src: "SwapAdapter.sol" },
  { name: "Redemption liquidity", text: "Paid from the vault's cash when there is enough of it.", src: "DeskVault.sol" },
  { name: "Queue mechanics", text: "Otherwise the fixed claim queues first-in, first-out.", src: "DeskVault.sol" },
  { name: "High-water mark", text: "Performance fee only on NAV/share above the previous peak.", src: "FeeModule.sol" },
  {
    name: "Fees",
    text: `${pct(fees.performanceBps.value)} performance, ${pct(fees.aumBpsPerYear.value)}/yr AUM. No volume fee.`,
    src: "DeployPhase2.s.sol",
  },
  { name: "Deposit cap", text: `${usd(risk.depositCapUsdg.value)} USDG per desk on mainnet. No ungated AUM.`, src: "README.md" },
];

export function Risk() {
  return (
    <section id="risk" className={`sec sec--void ${styles.sec}`} aria-labelledby="risk-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="eyebrow">
            <b>06</b> Risk is part of the product
          </p>
          <h2 id="risk-title" className="display h-lg">
            Trades are filtered <em>before</em> they reach the vault.
          </h2>
          <p className="lede">
            The core rule is simple: uncertain means do not trade. Pick a trade and watch where it stops. This runs a
            TypeScript port of <code className="mono">RiskModule.evaluate</code> with the repo&apos;s default parameters.
          </p>
        </div>
        <RiskMachine />
        <ul className={styles.controls}>
          {controls.map((c, i) => (
            <li key={c.name} data-reveal style={{ "--reveal-i": i % 4 } as React.CSSProperties}>
              <h3 className={styles.cName}>{c.name}</h3>
              <p className={styles.cText}>{c.text}</p>
              <p className={`mono ${styles.cSrc}`}>{c.src}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
