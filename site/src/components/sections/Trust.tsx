import styles from "./Trust.module.css";

interface Actor {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly tone: "alex" | "you" | "desk" | "engine" | "owner";
  readonly groups: readonly { readonly label: string; readonly items: readonly string[]; readonly kind?: "no" }[];
}

const actors: readonly Actor[] = [
  {
    id: "alex",
    name: "Alex",
    role: "Leader",
    tone: "alex",
    groups: [
      { label: "Owns", items: ["His personal wallet", "His private keys", "His own trades and results"] },
      { label: "Receives", items: ["70% of desk fees, paid by the vault to his payee address"] },
      {
        label: "Cannot",
        kind: "no",
        items: ["Withdraw desk vault funds", "Decide what the desk copies — the risk module does"],
      },
    ],
  },
  {
    id: "you",
    name: "You",
    role: "Depositor",
    tone: "you",
    groups: [
      { label: "Owns", items: ["Book shares — a pro-rata claim on desk NAV"] },
      { label: "Can", items: ["Deposit USDG (up to the desk cap)", "Redeem shares at NAV — paid from cash, or queued"] },
      { label: "Cannot", kind: "no", items: ["Access Alex's private key", "Direct the vault's trades"] },
    ],
  },
  {
    id: "vault",
    name: "Desk vault",
    role: "DeskVault contract",
    tone: "desk",
    groups: [
      { label: "Contains", items: ["Depositors' USDG", "Copied positions in allowlisted Stock Tokens"] },
      { label: "Represents", items: ["Collective NAV = cash + Σ(balanceOfUI × oracle price) − fee liabilities"] },
      { label: "Fixed at creation", items: ["Its leader address — immutable, one vault per leader"] },
      { label: "Has no", kind: "no", items: ["Owner withdraw or sweep function"] },
    ],
  },
  {
    id: "keeper",
    name: "Keeper",
    role: "Off-chain operator",
    tone: "engine",
    groups: [
      { label: "Can", items: ["Watch the vault's leader and submit copy calls", "Process the withdrawal queue when cash is available (anyone can)"] },
      {
        label: "Cannot",
        kind: "no",
        items: [
          "Skip the on-chain risk check — the vault re-runs it on every copy",
          "Swap into tokens that aren't allowlisted",
          "Send swap proceeds anywhere but back to the vault",
        ],
      },
    ],
  },
  {
    id: "owner",
    name: "Owner / operator",
    role: "Governance in the current phase",
    tone: "owner",
    groups: [
      {
        label: "Can",
        items: ["Set risk caps, session sizing and allowlist", "Set keeper, oracle, fee module and fee recipients", "Pause deposits and copies — redemptions then queue"],
      },
      { label: "Why it matters", items: ["This is a real trust assumption today. It's disclosed, not hidden."] },
    ],
  },
];

export function Trust() {
  return (
    <section id="trust" className={`sec ${styles.sec}`} aria-labelledby="trust-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="eyebrow">
            <b>10</b> Trust architecture
          </p>
          <h2 id="trust-title" className="display h-lg">
            Your capital. His wallet. <em>One separate desk.</em>
          </h2>
          <p className="lede">
            Not &ldquo;trust us&rdquo;. Boundaries you can read in the contracts: who owns what, who can do what, and what
            nobody can do.
          </p>
        </div>

        <ul className={styles.actors}>
          {actors.map((a, i) => (
            <li key={a.id} className={styles.actor} data-tone={a.tone} data-reveal style={{ "--reveal-i": i } as React.CSSProperties}>
              <header>
                <h3 className={styles.name}>{a.name}</h3>
                <p className={`mono ${styles.role}`}>{a.role}</p>
              </header>
              {a.groups.map((g) => (
                <div key={g.label} className={styles.group} data-kind={g.kind}>
                  <p className={`mono ${styles.groupLabel}`}>{g.label}</p>
                  <ul>
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
