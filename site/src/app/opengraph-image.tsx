import { ImageResponse } from "next/og";

export const alt = "Axbook — Follow the book. Hold the shares. Leader wallet and desk vault, two separate piles.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#10141c";
const PAPER = "#eef2f8";
const COBALT = "#5b8cff";
const DIM = "#9aa6b8";
const DESK = "#5b8cff";
const ALEX = "#7ec8e0";
const LINE = "#2a3344";

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="${COBALT}" stroke-width="3.2"/><g fill="${PAPER}"><polygon points="18,44 46,34 46,66 18,76"/><polygon points="54,34 82,44 82,76 54,66"/></g></svg>`;
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
          background: INK,
          color: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} alt="" />
          <div style={{ fontSize: 32, letterSpacing: 4, fontWeight: 600 }}>AXBOOK</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, lineHeight: 1, letterSpacing: -2 }}>Follow the book.</div>
          <div style={{ fontSize: 88, lineHeight: 1.08, letterSpacing: -2, color: COBALT }}>Hold the shares.</div>
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
