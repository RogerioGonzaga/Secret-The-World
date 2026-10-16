import type { Indicator } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { SourceNote } from "./source-note";

/** Exibe um indicador 0–100 ou "Dados indisponíveis" (o repositório já remove valores demonstrativos em produção). */
export function ScoreBar({
  label,
  indicator,
  methodology,
  limitations,
  description,
  compact,
}: {
  label: string;
  indicator: Indicator;
  methodology?: string;
  limitations?: string;
  description?: string;
  compact?: boolean;
}) {
  const score = indicator.score;
  return (
    <div className={cn("print-break", compact ? "py-1.5" : "py-3")}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("font-medium text-ink", compact ? "text-sm" : "text-[15px]")}>{label}</p>
          {description && !compact && <p className="text-xs text-muted">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {score === null ? (
            <span className="text-xs text-subtle italic">Dados indisponíveis</span>
          ) : (
            <span className="text-sm font-semibold tabular-nums text-ink">
              {score}
              <span className="text-xs font-normal text-subtle">/100</span>
            </span>
          )}
          {!compact && <SourceNote provenance={indicator.provenance} methodology={methodology} limitations={limitations} label=" " />}
        </div>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? undefined}
        aria-valuetext={score === null ? "Dados indisponíveis" : `${score} de 100`}
      >
        {score !== null && (
          <div
            className={cn("h-full rounded-full transition-[width] duration-700", score >= 75 ? "bg-teal-500" : score >= 50 ? "bg-navy-600" : "bg-copper-500")}
            style={{ width: `${score}%` }}
          />
        )}
      </div>
    </div>
  );
}
