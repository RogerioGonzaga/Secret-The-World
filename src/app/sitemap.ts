import type { MetadataRoute } from "next";
import { getArticles, getDestinations } from "@/lib/data/repository";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const statics = ["", "/destinos", "/comparar", "/custo-de-vida", "/trabalho", "/destino-ideal", "/guias", "/metodologia", "/sobre", "/privacidade"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...getDestinations().map((d) => ({ url: `${base}/destinos/${d.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getArticles().map((a) => ({ url: `${base}/guias/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
