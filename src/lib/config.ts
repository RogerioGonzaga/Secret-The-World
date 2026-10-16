/**
 * Configuração pública da aplicação. Apenas valores NEXT_PUBLIC_* chegam ao navegador;
 * segredos ficam em process.env no servidor e nunca devem ser importados por componentes de cliente.
 */
export type DataMode = "demo" | "production";

export const siteConfig = {
  name: "LIVORA",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Descubra onde seu dinheiro rende mais, compare custo de vida, salários e qualidade de vida em cidades do mundo todo.",
  locale: "pt-BR",
};

/**
 * "demo": exibe dados demonstrativos sinalizados (padrão em desenvolvimento).
 * "production": oculta qualquer valor demonstrativo e mostra "Dados indisponíveis".
 */
export const dataMode: DataMode =
  process.env.NEXT_PUBLIC_LIVORA_DATA_MODE === "production" ? "production" : "demo";

export const showDemoData = dataMode === "demo";
