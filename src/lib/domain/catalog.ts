import type {
  ClimateType,
  ContinentId,
  CostItemId,
  IndicatorId,
  ProfessionId,
  Setting,
  CitySize,
} from "./types";

export const continents: Record<ContinentId, { label: string; description: string }> = {
  europa: { label: "Europa", description: "Mobilidade, transporte público e história em cada esquina." },
  "america-do-norte": { label: "América do Norte", description: "Mercados de trabalho amplos e cidades multiculturais." },
  "america-do-sul": { label: "América do Sul", description: "Proximidade cultural, fuso parecido e idiomas familiares." },
  asia: { label: "Ásia", description: "Dinamismo econômico e custo de vida muito variado." },
  oceania: { label: "Oceania", description: "Qualidade de vida ao ar livre e salários elevados." },
  africa: { label: "África", description: "Paisagens marcantes e ecossistemas em crescimento." },
};

export const climateLabels: Record<ClimateType, string> = {
  quente: "Quente",
  ameno: "Ameno",
  frio: "Frio",
};

export const sizeLabels: Record<CitySize, string> = {
  grande: "Cidade grande",
  media: "Cidade média",
  pequena: "Cidade pequena",
};

export const settingLabels: Record<Setting, string> = {
  praia: "Praia",
  natureza: "Natureza",
  urbano: "Vida urbana",
};

export const professionLabels: Record<ProfessionId, string> = {
  software: "Desenvolvimento de software",
  enfermagem: "Enfermagem",
  professor: "Ensino (professor)",
  design: "Design (UX/UI e gráfico)",
  financas: "Finanças e contabilidade",
  marketing: "Marketing",
  atendimento: "Atendimento ao cliente",
  engenharia: "Engenharia civil",
};

export const costItemLabels: Record<CostItemId, { label: string; detail: string }> = {
  rent1Center: { label: "Aluguel 1 quarto · centro", detail: "Apartamento de 1 quarto em região central, sem contas." },
  rent1Outside: { label: "Aluguel 1 quarto · fora do centro", detail: "Apartamento de 1 quarto fora da região central." },
  rent3Center: { label: "Aluguel 3 quartos · centro", detail: "Usado apenas no cálculo familiar." },
  rent3Outside: { label: "Aluguel 3 quartos · fora do centro", detail: "Usado apenas no cálculo familiar." },
  groceries: { label: "Supermercado", detail: "Alimentação preparada em casa." },
  restaurants: { label: "Restaurantes", detail: "Refeições e cafés fora de casa." },
  transport: { label: "Transporte público", detail: "Passe mensal ou gasto equivalente." },
  utilities: { label: "Energia e água", detail: "Contas básicas do imóvel." },
  internet: { label: "Internet", detail: "Banda larga residencial." },
  health: { label: "Saúde e seguro", detail: "Seguro ou plano e despesas não cobertas por contribuições obrigatórias." },
  leisure: { label: "Academia e lazer", detail: "Academia, cultura e entretenimento." },
  misc: { label: "Despesas diversas", detail: "Higiene, vestuário, celular e imprevistos pequenos." },
};

export interface IndicatorMeta {
  label: string;
  description: string;
  methodology: string;
  limitations: string;
}

export const indicatorMeta: Record<IndicatorId, IndicatorMeta> = {
  safety: {
    label: "Segurança",
    description: "Percepção e registros de criminalidade e segurança pessoal.",
    methodology: "Escala 0–100, maior é mais seguro. Na versão final: índices oficiais de criminalidade por habitante, normalizados.",
    limitations: "Estatísticas criminais variam muito entre bairros e entre metodologias nacionais.",
  },
  health: {
    label: "Saúde",
    description: "Acesso e qualidade do sistema de saúde.",
    methodology: "Escala 0–100. Na versão final: indicadores como expectativa de vida e cobertura (OMS/Banco Mundial).",
    limitations: "Dados nacionais podem não refletir a realidade de uma cidade específica.",
  },
  education: {
    label: "Educação",
    description: "Oferta e qualidade de escolas e universidades.",
    methodology: "Escala 0–100. Na versão final: resultados educacionais oficiais e oferta de ensino.",
    limitations: "Não considera escolas internacionais nem custos de mensalidade.",
  },
  mobility: {
    label: "Mobilidade",
    description: "Facilidade de se deslocar sem carro.",
    methodology: "Escala 0–100. Na versão final: cobertura de transporte público e tempo médio de deslocamento.",
    limitations: "A experiência depende muito do bairro escolhido.",
  },
  air: {
    label: "Qualidade do ar",
    description: "Inverso da poluição atmosférica: maior é ar mais limpo.",
    methodology: "Escala 0–100. Na versão final: média anual de PM2.5 (OMS) convertida para escala.",
    limitations: "Medições podem ser esparsas e variar por estação do ano.",
  },
  climate: {
    label: "Clima",
    description: "Conforto térmico ao longo do ano.",
    methodology: "Escala 0–100. Na versão final: dias por ano em faixa de temperatura confortável.",
    limitations: "Conforto climático é subjetivo; use também o gráfico mensal.",
  },
  internet: {
    label: "Internet e infraestrutura digital",
    description: "Velocidade e disponibilidade de conexão.",
    methodology: "Escala 0–100. Na versão final: velocidades medianas de banda larga fixa.",
    limitations: "Velocidades medianas não garantem a qualidade em um endereço específico.",
  },
  green: {
    label: "Áreas verdes",
    description: "Parques e natureza acessíveis.",
    methodology: "Escala 0–100. Na versão final: área verde por habitante a partir de dados geográficos abertos.",
    limitations: "Mapeamentos abertos podem ser incompletos.",
  },
  culture: {
    label: "Lazer e cultura",
    description: "Oferta cultural, gastronômica e de entretenimento.",
    methodology: "Escala 0–100. Na versão final: densidade de equipamentos culturais por habitante.",
    limitations: "Quantidade não mede qualidade nem preço.",
  },
};
