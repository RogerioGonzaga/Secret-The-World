/**
 * Configuração pública da aplicação. Apenas valores NEXT_PUBLIC_* chegam ao navegador;
 * segredos ficam em process.env no servidor e nunca devem ser importados por componentes de cliente.
 */
export type DataMode = "demo" | "production";

/** Domínio oficial. NEXT_PUBLIC_SITE_URL só deve sobrescrevê-lo em ambientes de teste ou prévia. */
export const OFFICIAL_URL = "https://partiumorar.com.br";

export const siteConfig = {
  name: "Partiu Morar",
  tagline: "Seu próximo destino começa aqui.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || OFFICIAL_URL).replace(/\/$/, ""),
  description:
    "Descubra onde vale a pena morar: compare custo de vida, salários, moedas, oportunidades de trabalho e qualidade de vida em cidades do mundo todo.",
  locale: "pt-BR",
};

/**
 * "demo": exibe dados demonstrativos sinalizados (padrão em desenvolvimento).
 * "production": oculta qualquer valor demonstrativo e mostra "Dados indisponíveis".
 */
export const dataMode: DataMode =
  process.env.NEXT_PUBLIC_LIVORA_DATA_MODE === "production" ? "production" : "demo";

export const showDemoData = dataMode === "demo";
