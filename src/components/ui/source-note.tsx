"use client";

import * as Popover from "@radix-ui/react-popover";
import { ExternalLink, Info } from "lucide-react";
import { sourceById } from "@/lib/data/seed/sources";
import type { Provenance } from "@/lib/domain/types";
import { dataKindLabels, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Botão discreto que abre a proveniência completa de um dado: fonte, datas, metodologia e limitações. */
export function SourceNote({
  provenance,
  methodology,
  limitations,
  className,
  label,
}: {
  provenance: Provenance;
  methodology?: string;
  limitations?: string;
  className?: string;
  label?: string;
}) {
  const source = sourceById.get(provenance.sourceId);
  if (!source) return null;
  const isDemo = source.kind === "demo";
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition hover:bg-sand-100",
          isDemo ? "text-demo-700" : "text-muted",
          className,
        )}
        aria-label={`Fonte do dado: ${source.name}`}
      >
        <Info className="size-3.5" aria-hidden />
        {label ?? (isDemo ? "Demonstrativo" : "Fonte")}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-sand-200 bg-white p-4 text-sm shadow-lift data-[state=open]:animate-fade-up"
        >
          <p className={cn("text-xs font-semibold tracking-wide uppercase", isDemo ? "text-demo-700" : "text-teal-600")}>{dataKindLabels[source.kind]}</p>
          <p className="mt-1 font-semibold text-ink">{source.name}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-subtle">Coleta</dt>
            <dd className="text-navy-800">{formatDate(provenance.collectedAt)}</dd>
            <dt className="text-subtle">Referência</dt>
            <dd className="text-navy-800">{provenance.referenceDate ?? "—"}</dd>
            {provenance.currency && (
              <>
                <dt className="text-subtle">Moeda</dt>
                <dd className="text-navy-800">{provenance.currency}</dd>
              </>
            )}
            {provenance.unit && (
              <>
                <dt className="text-subtle">Unidade</dt>
                <dd className="text-navy-800">{provenance.unit}</dd>
              </>
            )}
            <dt className="text-subtle">Verificado</dt>
            <dd className="text-navy-800">{provenance.verified ? "Sim" : "Não"}</dd>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <span className="font-medium text-navy-800">Metodologia: </span>
            {methodology ?? source.methodology}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-medium text-navy-800">Limitações: </span>
            {limitations ?? source.limitations}
          </p>
          {provenance.notes && <p className="mt-2 text-xs text-muted">{provenance.notes}</p>}
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline">
              Abrir fonte <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
