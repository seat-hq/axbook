type Tone = "inherit" | "dark" | "light" | "badge";

/**
 * Official Axbook mark: an open book inside a cobalt ring.
 * The ring is the desk. The book is the copied book.
 * `inherit` follows the surrounding ink (paper on the dark site, ink on paper).
 */
function Book({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <polygon points="18,44 46,34 46,66 18,76" />
      <polygon points="54,34 82,44 82,76 54,66" />
    </g>
  );
}

export function Mark({ size = 26, tone = "inherit" }: { size?: number; tone?: Tone }) {
  if (tone === "badge") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx="50" cy="50" r="48.6" fill="none" stroke="#8eabff" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="45.5" fill="var(--brand-ink)" />
        <Book fill="var(--brand-paper)" />
      </svg>
    );
  }
  const glyph =
    tone === "light" ? "var(--brand-ink)" : tone === "dark" ? "var(--brand-paper)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--brand-cobalt)" strokeWidth="3.2" />
      <Book fill={glyph} />
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
        letterSpacing: "0.08em",
        fontSize: size * 0.62,
        lineHeight: 1,
      }}
    >
      <Mark size={size} tone={tone} />
      <span style={{ marginRight: "-0.08em" }}>AXBOOK</span>
    </span>
  );
}
