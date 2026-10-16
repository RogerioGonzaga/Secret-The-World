import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

/**
 * Completa os metadados de uma página com Open Graph e Twitter coerentes com o título,
 * a descrição e a URL canônica dela. Sem isso, o Next.js herdaria o Open Graph da home.
 */
export function withSocial(meta: Metadata & { title: string; description: string }): Metadata {
  const canonical = typeof meta.alternates?.canonical === "string" ? meta.alternates.canonical : undefined;
  const title = `${meta.title} · ${siteConfig.name}`;
  // Metadados próprios substituem os da home por inteiro, então a imagem padrão precisa ser repetida aqui.
  const images = meta.openGraph?.images ?? [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — ${siteConfig.tagline}` }];
  return {
    ...meta,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: siteConfig.name,
      title,
      description: meta.description,
      ...(canonical ? { url: canonical } : {}),
      ...meta.openGraph,
      images,
    },
    twitter: { card: "summary_large_image", title, description: meta.description, images, ...meta.twitter },
  };
}
