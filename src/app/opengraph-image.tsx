import { ImageResponse } from "next/og";
import { startingPriceLabel } from "@/lib/site";

export const alt = "WebGeele — caixa de e-mail profissional com domínio próprio";
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
          color: "white",
          background: "linear-gradient(135deg, #663ce6 0%, #5530d1 55%, #e66aaf 130%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="122 90 258 324" fill="white">
            <path d="M127 163 250 94l124 66-58 32-64-27-65 37v74l-60-35z" />
            <path d="M127 262l58 34v79l-58-32z" />
            <path d="M256 228h120v115l-126 68-60-33 126-65v-36h-58l-45-21z" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700 }}>WebGeele</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Caixa de e-mail profissional com seu domínio
          </span>
          <span style={{ fontSize: 34, opacity: 0.85 }}>
            {`A partir de ${startingPriceLabel}/mês · Webmail · Antispam · Migração`}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
