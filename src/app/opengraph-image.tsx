import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0a1530 0%, #172a52 55%, #0a6a5c 100%)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#0e1d3d" />
            <circle cx="24.6" cy="7.6" r="2.4" fill="#f26b3a" />
            <path d="M16 27c-.45 0-.9-.2-1.2-.55C11.3 22.7 7.6 18.7 7.6 14.2a8.4 8.4 0 0 1 16.8 0c0 4.5-3.7 8.5-7.2 12.25-.3.35-.75.55-1.2.55Z" fill="#12a38a" />
            <path d="M12.3 14.9 16 11.6l3.7 3.3M13.5 14v3.9h5V14" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
            Partiu<span style={{ color: "#93dcc9", marginLeft: 12 }}>Morar</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05, maxWidth: 980, fontWeight: 600 }}>{siteConfig.tagline}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#93dcc9" }}>
          <span>Custo de vida · Salários · Moedas · Qualidade de vida</span>
          <span style={{ color: "#f26b3a" }}>partiumorar.com.br</span>
        </div>
      </div>
    ),
    size,
  );
}
