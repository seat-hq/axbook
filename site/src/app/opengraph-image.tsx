import { ImageResponse } from "next/og";

export const alt = "Axbook — Copy desk, not sniper bot. Leader wallet and desk vault, two separate piles.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#1c3b2e";
const CREAM = "#fcf6ea";
const GOLD = "#bb9757";
const DIM = "#b9c4b8";
const DESK = "#35d07f";
const ALEX = "#d8b36e";
const LINE = "#3a5a4b";

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="${GOLD}" stroke-width="3.2"/><rect x="29.2" y="24.2" width="41.6" height="6.9" rx="1.6" fill="${CREAM}"/><rect x="27.2" y="33.3" width="45.6" height="43.6" rx="7.3" fill="${CREAM}"/></svg>`;
const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background: GREEN,
          color: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} alt="" />
          <div style={{ fontSize: 32, letterSpacing: 4, fontWeight: 600 }}>AXBOOK</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 100, lineHeight: 1, letterSpacing: -3 }}>Copy desk,</div>
          <div style={{ fontSize: 100, lineHeight: 1.08, letterSpacing: -3, color: GOLD }}>not sniper bot.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 22px",
              border: `2px solid ${ALEX}`,
              borderRadius: 14,
              color: ALEX,
              fontSize: 22,
            }}
          >
            Leader wallet
            <span style={{ color: DIM, fontSize: 16, marginTop: 4 }}>the desk cannot spend this</span>
          </div>
          <div style={{ display: "flex", flex: 1, borderTop: `2px dashed ${LINE}` }} />
          <div style={{ color: DIM, fontSize: 18 }}>signal only</div>
          <div style={{ display: "flex", flex: 1, borderTop: `2px dashed ${LINE}` }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 22px",
              border: `2px solid ${DESK}`,
              borderRadius: 14,
              color: DESK,
              fontSize: 22,
            }}
          >
            Desk vault
            <span style={{ color: DIM, fontSize: 16, marginTop: 4 }}>the leader cannot withdraw this</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
