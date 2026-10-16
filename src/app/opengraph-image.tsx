import { ImageResponse } from "next/og";

export const alt = "LIVORA — Descubra onde viver melhor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #071320 0%, #12283e 60%, #0f5f5d 100%)", color: "white" }}>
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 10, fontWeight: 600 }}>LIVORA</div>
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, maxWidth: 960 }}>Seu próximo capítulo começa em algum lugar do mundo.</div>
        <div style={{ display: "flex", fontSize: 28, color: "#a9d6d1" }}>Custo de vida · Salários · Câmbio · Qualidade de vida</div>
      </div>
    ),
    size,
  );
}
