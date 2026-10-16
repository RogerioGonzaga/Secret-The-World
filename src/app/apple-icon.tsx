import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone para a tela inicial do iOS (PNG gerado a partir do mesmo símbolo do favicon). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0e1d3d" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <circle cx="24.6" cy="7.6" r="2.4" fill="#f26b3a" />
          <path d="M16 27c-.45 0-.9-.2-1.2-.55C11.3 22.7 7.6 18.7 7.6 14.2a8.4 8.4 0 0 1 16.8 0c0 4.5-3.7 8.5-7.2 12.25-.3.35-.75.55-1.2.55Z" fill="#12a38a" />
          <path d="M12.3 14.9 16 11.6l3.7 3.3M13.5 14v3.9h5V14" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
