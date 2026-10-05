type Tone = "inherit" | "dark" | "light" | "badge";

/**
 * Official SEAT mark: a chair inside a gold ring.
 * The ring is the desk. The chair is the seat you take.
 * `inherit` follows the surrounding ink (cream on the dark site, forest on paper).
 */
function Chair({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <rect x="39" y="22" width="22" height="26" rx="5" />
      <rect x="25" y="44" width="50" height="13" rx="3.5" />
      <rect x="32" y="54" width="10" height="20" rx="3" />
      <rect x="58" y="54" width="10" height="20" rx="3" />
    </g>
  );
}

export function Mark({ size = 26, tone = "inherit" }: { size?: number; tone?: Tone }) {
  if (tone === "badge") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx="50" cy="50" r="48.6" fill="none" stroke="var(--brand-gold)" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="45.5" fill="var(--brand-green)" />
        <Chair fill="var(--brand-cream)" />
      </svg>
    );
  }
  const glyph =
    tone === "light" ? "var(--brand-green)" : tone === "dark" ? "var(--brand-cream)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--brand-gold)" strokeWidth="3.2" />
      <Chair fill={glyph} />
    </svg>
  );
}

export function Wordmark({ size = 26, tone = "inherit" }: { size?: number; tone?: Tone }) {
  return (
    <span
      className="wordmark"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.6em",
        fontFamily: "var(--font-brand)",
        fontWeight: 600,
        letterSpacing: "0.16em",
        fontSize: size * 0.62,
        lineHeight: 1,
      }}
    >
      <Mark size={size} tone={tone} />
      <span style={{ marginRight: "-0.16em" }}>SEAT</span>
    </span>
  );
}
