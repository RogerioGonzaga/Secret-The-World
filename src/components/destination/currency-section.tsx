"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Destination } from "@/lib/domain/types";
import { convert, conversionKind } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot, HistoryPoint } from "@/lib/integrations/exchange/types";
import { FRANKFURTER_CURRENCIES } from "@/lib/integrations/exchange/frankfurter";
import { formatDate, formatNumber } from "@/lib/format";
import { SourceNote } from "@/components/ui/source-note";
import { cn } from "@/lib/utils";

const TARGETS = ["BRL", "USD", "EUR"] as const;
const kindLabel = { live: "Taxa de referência", derived: "Derivada de paridade oficial", demo: "Taxa demonstrativa" } as const;

export function CurrencySection({ dest, snapshot }: { dest: Destination; snapshot: ExchangeSnapshot }) {
  const code = dest.currency.code;
  const historyTarget = code === "BRL" ? "USD" : "BRL";
  const hasHistory = (FRANKFURTER_CURRENCIES as readonly string[]).includes(code);
  const [history, setHistory] = useState<{ state: "loading" | "ok" | "error"; points: HistoryPoint[] }>({ state: "loading", points: [] });

  useEffect(() => {
    if (!hasHistory) return;
    const ctrl = new AbortController();
    fetch(`/api/exchange/history?base=${code}&symbol=${historyTarget}&days=365`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { points: HistoryPoint[] }) => setHistory({ state: json.points.length ? "ok" : "error", points: json.points }))
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setHistory({ state: "error", points: [] });
      });
    return () => ctrl.abort();
  }, [code, historyTarget, hasHistory]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Moeda local</p>
          <p className="font-display mt-1 text-3xl">
            {dest.currency.symbol} <span className="text-ink">{code}</span>
          </p>
          <p className="text-sm text-muted">{dest.currency.name}</p>
          <SourceNote provenance={{ sourceId: "iso-4217", collectedAt: null, referenceDate: null, verified: true }} className="mt-2 -ml-1.5" label="Código ISO 4217" />
        </div>
        <ul className="divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-white">
          {TARGETS.filter((t) => t !== code).map((t) => {
            const value = convert(1, code, t, snapshot);
            const kind = conversionKind(code, t, snapshot);
            return (
              <li key={t} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-muted">1 {code} =</p>
                  {kind && <p className={cn("text-[11px]", kind === "demo" ? "text-demo-700" : "text-subtle")}>{kindLabel[kind]}</p>}
                </div>
                <p className="text-lg font-semibold tabular-nums">{value === null ? <span className="text-sm font-normal text-subtle italic">Cotação indisponível</span> : `${formatNumber(value, value < 0.01 ? 6 : 4)} ${t}`}</p>
              </li>
            );
          })}
        </ul>
        <p className="text-xs leading-relaxed text-subtle">
          {snapshot.status === "live" && `Referência do BCE de ${formatDate(snapshot.referenceDate)}, consultada em ${formatDate(snapshot.fetchedAt, true)}.`}
          {snapshot.status === "cached" && `Última cotação obtida: referência de ${formatDate(snapshot.referenceDate)}. ${snapshot.message ?? ""}`}
          {snapshot.status === "demo" && "O serviço de câmbio não está conectado neste ambiente: as taxas acima são DEMONSTRATIVAS e não são cotações reais."}
          {snapshot.status === "unavailable" && "O serviço de câmbio não está disponível no momento."} Bancos e casas de câmbio aplicam spread e tarifas.
        </p>
      </div>
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">
            Histórico de 12 meses: 1 {code} em {historyTarget}
          </h3>
          {hasHistory && <SourceNote provenance={{ sourceId: "frankfurter-ecb", collectedAt: null, referenceDate: "últimos 12 meses", verified: true }} />}
        </div>
        {!hasHistory ? (
          <p className="mt-6 text-sm text-muted">Não há série histórica confiável conectada para {dest.currency.name}: a moeda não é coberta pelas taxas de referência do BCE.</p>
        ) : history.state === "loading" ? (
          <div className="skeleton mt-4 h-64 w-full" aria-label="Carregando histórico" />
        ) : history.state === "error" ? (
          <p className="mt-6 text-sm text-muted">O histórico de câmbio não pôde ser carregado agora. Nenhum valor estimado é exibido no lugar.</p>
        ) : (
          <>
            <div className="mt-4 h-64" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fx" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1e8f8a" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1e8f8a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ebe6dc" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5, 7) + "/" + d.slice(2, 4)} tick={{ fontSize: 11, fill: "#8a939e" }} minTickGap={32} axisLine={false} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#8a939e" }} width={56} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNumber(v, 3)} />
                  <Tooltip formatter={(v) => [formatNumber(Number(v), 4), historyTarget]} labelFormatter={(l) => formatDate(String(l))} />
                  <Area type="monotone" dataKey="rate" stroke="#137572" strokeWidth={2} fill="url(#fx)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">
              Entre {formatDate(history.points[0]!.date)} e {formatDate(history.points.at(-1)!.date)}, 1 {code} variou de {formatNumber(Math.min(...history.points.map((p) => p.rate)), 4)} a{" "}
              {formatNumber(Math.max(...history.points.map((p) => p.rate)), 4)} {historyTarget}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
