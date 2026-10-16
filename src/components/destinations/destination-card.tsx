import Link from "next/link";
import { Coins, ShieldCheck, Thermometer } from "lucide-react";
import type { Destination } from "@/lib/domain/types";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { computeLivoraIndex } from "@/lib/calc/livora-index";
import { climateLabels } from "@/lib/domain/catalog";
import { formatMoney } from "@/lib/format";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { CityImage } from "@/components/ui/city-image";
import { FavoriteButton } from "@/components/favorites/actions";
import { cn } from "@/lib/utils";

const tagLabels: Record<string, string> = {
  tendencia: "Em alta",
  remoto: "Bom para remotos",
  oportunidades: "Mercado amplo",
  economico: "Custo menor",
};

export function avgHigh(dest: Destination) {
  const v = dest.climate.monthlyHighC.value;
  return v ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

export function DestinationCard({
  dest,
  snapshot,
  displayCurrency = "BRL",
  compatibility,
  className,
  priority,
}: {
  dest: Destination;
  snapshot: ExchangeSnapshot | null;
  displayCurrency?: string;
  compatibility?: number;
  className?: string;
  priority?: boolean;
}) {
  const cost = referenceMonthlyCost(dest.costs);
  const converted = dest.currency.code === displayCurrency ? null : convert(cost, dest.currency.code, displayCurrency, snapshot);
  const index = computeLivoraIndex(dest).value;
  const temp = avgHigh(dest);
  const safety = dest.quality.safety.score;

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <div className="relative">
        <CityImage src={dest.image.url} alt={dest.image.alt} name={dest.name} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3]" priority={priority} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {dest.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink shadow-card">
                {tagLabels[tag]}
              </span>
            ))}
          </div>
          <FavoriteButton slug={dest.slug} name={dest.name} className="relative z-10" />
        </div>
        {compatibility !== undefined && (
          <span className="absolute bottom-3 left-3 rounded-full bg-navy-900/90 px-2.5 py-1 text-xs font-semibold text-white">{compatibility}% compatível</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg leading-snug font-semibold text-ink">
              <Link href={`/destinos/${dest.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {dest.name}
              </Link>
            </h3>
            <p className="text-sm text-muted">
              {dest.country.name} · {dest.currency.code}
            </p>
          </div>
          {index !== null && (
            <div className="text-right" title="Índice Partiu Morar (0–100). Veja os componentes na página do destino.">
              <p className="text-lg leading-none font-semibold tabular-nums text-teal-700">{index}</p>
              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-subtle uppercase">Índice</p>
            </div>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-sand-100 pt-4 text-sm">
          <div>
            <dt className="flex items-center gap-1 text-xs text-subtle">
              <Coins className="size-3.5" aria-hidden /> Custo/mês
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatMoney(cost, dest.currency.code, { compact: true })}</dd>
            {converted !== null && <dd className="text-xs tabular-nums text-muted">≈ {formatMoney(converted, displayCurrency, { compact: true })}</dd>}
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-subtle">
              <Thermometer className="size-3.5" aria-hidden /> Clima
            </dt>
            <dd className="mt-0.5 font-semibold text-ink">{climateLabels[dest.climate.type]}</dd>
            {temp !== null && <dd className="text-xs text-muted">máx. média {temp} °C</dd>}
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-subtle">
              <ShieldCheck className="size-3.5" aria-hidden /> Segurança
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-ink">{safety === null ? <span className="text-xs font-normal text-subtle italic">Indisponível</span> : `${safety}/100`}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-subtle">Custo estimado para 1 pessoa, perfil intermediário.</p>
      </div>
    </article>
  );
}
