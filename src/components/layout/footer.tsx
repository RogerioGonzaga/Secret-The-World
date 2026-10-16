import Link from "next/link";
import { Logo } from "./logo";

const columns = [
  {
    title: "Explorar",
    links: [
      { href: "/destinos", label: "Todos os destinos" },
      { href: "/comparar", label: "Comparar cidades" },
      { href: "/custo-de-vida", label: "Calculadora de custo de vida" },
      { href: "/trabalho", label: "Salários e trabalho" },
      { href: "/destino-ideal", label: "Descubra seu destino ideal" },
    ],
  },
  {
    title: "Planejar",
    links: [
      { href: "/favoritos", label: "Favoritos e checklist" },
      { href: "/guias", label: "Guias de mudança" },
      { href: "/destinos?visao=mapa", label: "Mapa de destinos" },
    ],
  },
  {
    title: "LIVORA",
    links: [
      { href: "/sobre", label: "Sobre a LIVORA" },
      { href: "/metodologia", label: "Metodologia e fontes" },
      { href: "/privacidade", label: "Privacidade" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-navy-900 text-white/80">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Uma plataforma para planejar onde morar com clareza financeira e informação transparente sobre a origem de cada dado.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page grid gap-6 py-8 text-xs leading-relaxed text-white/55 md:grid-cols-2">
          <div>
            <p className="font-semibold text-white/75">Fontes de dados</p>
            <p className="mt-1">
              Câmbio: taxas de referência do Banco Central Europeu via{" "}
              <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                Frankfurter
              </a>
              . Mapas: ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                colaboradores do OpenStreetMap
              </a>
              . Fotos: Unsplash. Custos, salários e indicadores ainda são demonstrativos —{" "}
              <Link href="/metodologia" className="underline underline-offset-2 hover:text-white">
                veja a metodologia
              </Link>
              .
            </p>
          </div>
          <div className="md:text-right">
            <p>As informações da LIVORA são estimativas para planejamento e não substituem orientação jurídica, migratória ou financeira profissional.</p>
            <p className="mt-1">© {new Date().getFullYear()} LIVORA. Nenhum link de parceiro ou afiliado nesta versão.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
