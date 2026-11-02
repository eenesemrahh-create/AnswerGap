import { ImageResponse } from "next/og";

// The preview a shared link shows, for every page that has none of its own.
// English in all five languages: a crawler sends no locale to choose by.
export const alt = "GetTopQuestions: find the questions worth answering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#171420",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "#5b45e0",
            }}
          >
            G
          </div>
          GetTopQuestions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Find the questions worth answering
          </div>
          <div style={{ fontSize: 34, color: "#c9c4dc" }}>
            See which questions no page really targets.
          </div>
        </div>
      </div>
    ),
    size
  );
}
