"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Info, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import type { Destination, ProfessionId, Setting, CitySize, ClimateType } from "@/lib/domain/types";
import { defaultAnswers, rankDestinations, type Importance, type QuizAnswers } from "@/lib/calc/compatibility";
import { professionLabels, settingLabels, sizeLabels, climateLabels } from "@/lib/domain/catalog";
import { userCurrencies } from "@/lib/data/seed/currencies";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { computeBudget } from "@/lib/calc/cost-of-living";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CityImage } from "@/components/ui/city-image";
import { FavoriteButton } from "@/components/favorites/actions";
import { clearQuizAnswers, saveQuizAnswers, useStoredQuizAnswers } from "./storage";
import { cn } from "@/lib/utils";

const LANGS = ["Português", "Inglês", "Espanhol", "Francês", "Alemão"];
const importanceLabels = ["Não importa", "Pouco", "Importante", "Essencial"];

function Choice({ selected, onClick, children, description }: { selected: boolean; onClick: () => void; children: React.ReactNode; description?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
        selected ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20" : "border-sand-300 bg-white hover:border-navy-600/40",
      )}
    >
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-teal-600 bg-teal-600 text-white" : "border-sand-300")}>
        {selected && <CheckCircle2 className="size-3.5" aria-hidden />}
      </span>
      <span>
        <span className="block font-medium text-ink">{children}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
    </button>
  );
}

function ImportanceScale({ value, onChange, label }: { value: Importance; onChange: (v: Importance) => void; label: string }) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {importanceLabels.map((l, i) => (
          <button key={l} type="button" aria-pressed={value === i} onClick={() => onChange(i as Importance)} className={cn("rounded-xl border px-3 py-2.5 text-sm transition", value === i ? "border-teal-500 bg-teal-50 font-medium text-teal-700" : "border-sand-300 bg-white hover:border-navy-600/40")}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Quiz({ destinations, snapshot }: { destinations: Destination[]; snapshot: ExchangeSnapshot }) {
  const stored = useStoredQuizAnswers();
  // Remonta quando as respostas salvas são lidas do navegador, sem setState em efeito.
  return <QuizFlow key={stored ? "salvo" : "novo"} destinations={destinations} snapshot={snapshot} initial={stored} />;
}

function QuizFlow({ destinations, snapshot, initial }: { destinations: Destination[]; snapshot: ExchangeSnapshot; initial: QuizAnswers | null }) {
  const [answers, setAnswers] = useState<QuizAnswers>(initial ?? defaultAnswers);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(initial !== null);

  const set = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => setAnswers((a) => ({ ...a, [key]: value }));
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const numberOrNull = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v.replace(/\D/g, ""))));

  const steps: { title: string; hint?: string; body: React.ReactNode }[] = [
    {
      title: "Você pretende morar sozinho ou com família?",
      hint: "Isso muda o tipo de imóvel e todas as despesas consideradas.",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice selected={answers.household === "individual"} onClick={() => set("household", "individual")} description="Apartamento de 1 quarto">Sozinho(a)</Choice>
          <Choice selected={answers.household === "familia"} onClick={() => set("household", "familia")} description="2 adultos e 1 criança, 3 quartos">Com família</Choice>
        </div>
      ),
    },
    {
      title: "Qual orçamento mensal você terá disponível para viver?",
      hint: "Opcional. Usamos para comparar com o custo de vida estimado de cada cidade.",
      body: (
        <div className="flex max-w-md gap-2">
          <label htmlFor="q-budget" className="sr-only">Orçamento mensal</label>
          <input id="q-budget" inputMode="numeric" className="input" placeholder="Ex.: 10000" value={answers.budget ?? ""} onChange={(e) => set("budget", numberOrNull(e.target.value))} />
          <select aria-label="Moeda do orçamento" className="input w-24" value={answers.budgetCurrency} onChange={(e) => set("budgetCurrency", e.target.value)}>
            {userCurrencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      ),
    },
    {
      title: "Como você pretende trabalhar?",
      body: (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice selected={answers.remote} onClick={() => set("remote", true)} description="Mantenho meu trabalho ou clientes atuais">Trabalho remoto</Choice>
            <Choice selected={!answers.remote} onClick={() => set("remote", false)} description="Quero procurar trabalho no destino">Emprego local</Choice>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-prof" className="label">Profissão ou área</label>
              <select id="q-prof" className="input" value={answers.profession ?? ""} onChange={(e) => set("profession", (e.target.value || null) as ProfessionId | null)}>
                <option value="">Prefiro não informar</option>
                {(Object.keys(professionLabels) as ProfessionId[]).map((p) => <option key={p} value={p}>{professionLabels[p]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-income" className="label">Renda líquida atual (opcional)</label>
              <div className="flex gap-2">
                <input id="q-income" inputMode="numeric" className="input" value={answers.income ?? ""} onChange={(e) => set("income", numberOrNull(e.target.value))} />
                <select aria-label="Moeda da renda" className="input w-24" value={answers.incomeCurrency} onChange={(e) => set("incomeCurrency", e.target.value)}>
                  {userCurrencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <p className="mt-1 text-xs text-subtle">Para remotos sem orçamento definido, a renda é usada como orçamento.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Que clima você prefere?",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["quente", "ameno", "frio", "indiferente"] as const).map((c) => (
            <Choice key={c} selected={answers.climate === c} onClick={() => set("climate", c)}>
              {c === "indiferente" ? "Tanto faz" : climateLabels[c as ClimateType]}
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Quais idiomas você fala com confiança?",
      hint: "Selecione todos que se aplicam.",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {LANGS.map((l) => <Choice key={l} selected={answers.languages.includes(l)} onClick={() => set("languages", toggle(answers.languages, l))}>{l}</Choice>)}
        </div>
      ),
    },
    {
      title: "Que tipo de lugar combina com você?",
      body: (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 font-medium">Porte da cidade</legend>
            <div className="grid gap-3 sm:grid-cols-4">
              {(["grande", "media", "pequena", "indiferente"] as const).map((s) => (
                <Choice key={s} selected={answers.size === s} onClick={() => set("size", s)}>{s === "indiferente" ? "Tanto faz" : sizeLabels[s as CitySize]}</Choice>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-medium">Você prefere (opcional, pode escolher mais de um)</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(settingLabels) as Setting[]).map((s) => <Choice key={s} selected={answers.settings.includes(s)} onClick={() => set("settings", toggle(answers.settings, s))}>{settingLabels[s]}</Choice>)}
            </div>
          </fieldset>
        </div>
      ),
    },
    {
      title: "O que pesa mais na sua decisão?",
      body: (
        <div className="space-y-6">
          <ImportanceScale label="Segurança" value={answers.safety} onChange={(v) => set("safety", v)} />
          <ImportanceScale label="Oportunidades profissionais" value={answers.career} onChange={(v) => set("career", v)} />
        </div>
      ),
    },
    {
      title: "Nacionalidade (opcional)",
      hint: "Usamos apenas para destacar observações migratórias conhecidas, como acordos do Mercosul e da CPLP. Não afeta a pontuação e fica salva somente no seu navegador.",
      body: (
        <div className="grid gap-3 sm:grid-cols-3">
          <Choice selected={answers.nationality === null} onClick={() => set("nationality", null)}>Prefiro não informar</Choice>
          <Choice selected={answers.nationality === "BR"} onClick={() => set("nationality", "BR")}>Brasileira</Choice>
          <Choice selected={answers.nationality === "PT"} onClick={() => set("nationality", "PT")} description="Ou outra nacionalidade da UE">Portuguesa</Choice>
        </div>
      ),
    },
  ];

  const ranked = useMemo(() => (done ? rankDestinations(destinations, answers, snapshot).slice(0, 6) : []), [done, destinations, answers, snapshot]);

  if (done) {
    return (
      <div className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-medium">Seus destinos recomendados</h2>
            <p className="mt-1 text-sm text-muted">Ordenados pela compatibilidade com suas respostas. Abra “Como calculamos” em cada destino para ver o peso de cada preferência.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDone(false); setStep(0); }}>Editar respostas</Button>
            <Button variant="ghost" onClick={() => { clearQuizAnswers(); setAnswers(defaultAnswers); setDone(false); setStep(0); }}>
              <RotateCcw aria-hidden /> Recomeçar
            </Button>
          </div>
        </div>
        <p className="mt-4 flex gap-2 rounded-xl bg-sand-100 p-4 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
          A compatibilidade é uma soma ponderada de critérios simples, não uma previsão científica. Critérios sem dados ficam fora do cálculo e aparecem como informações desconhecidas.
        </p>
        <ol className="mt-8 space-y-6">
          {ranked.map(({ dest, result }, i) => {
            const cost = computeBudget(dest.costs, "intermediario", answers.household).total;
            return (
              <li key={dest.slug} className="grid overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card md:grid-cols-[18rem_1fr]">
                <div className="relative">
                  <CityImage src={dest.image.url} alt={dest.image.alt} name={dest.name} sizes="18rem" className="h-48 md:h-full" />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold">#{i + 1}</span>
                  <FavoriteButton slug={dest.slug} name={dest.name} className="absolute top-3 right-3" />
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{dest.name}</h3>
                      <p className="text-sm text-muted">{dest.country.name} · custo intermediário {formatMoney(cost, dest.currency.code)}/mês</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold tabular-nums text-teal-700">{result.score}%</p>
                      <p className="text-xs text-subtle">compatível com suas respostas</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-teal-700"><CheckCircle2 className="size-4" aria-hidden /> Por que recomendamos</p>
                      <ul className="mt-1.5 space-y-1 text-muted">{result.reasons.length ? result.reasons.slice(0, 4).map((r) => <li key={r}>{r}</li>) : <li>Nenhum critério se destacou fortemente.</li>}</ul>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-copper-600"><ShieldAlert className="size-4" aria-hidden /> Pontos de atenção</p>
                      <ul className="mt-1.5 space-y-1 text-muted">{result.attention.length ? result.attention.slice(0, 3).map((r) => <li key={r}>{r}</li>) : <li>Nenhum critério com pontuação baixa.</li>}</ul>
                    </div>
                  </div>
                  {dest.work.demandAreas.length > 0 && <p className="mt-3 text-sm text-muted"><strong className="text-navy-800">Oportunidades: </strong>{dest.work.demandAreas.join(", ")}.</p>}
                  {result.nationalityNote && <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-700">{result.nationalityNote}</p>}
                  {result.unknowns.length > 0 && (
                    <p className="mt-3 flex gap-1.5 text-xs text-subtle"><CircleHelp className="size-3.5 shrink-0" aria-hidden /> Desconhecido: {result.unknowns.join(" · ")}</p>
                  )}
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-medium text-navy-800">Como calculamos</summary>
                    <table className="mt-2 w-full text-xs">
                      <thead className="text-subtle"><tr><th scope="col" className="text-left font-medium">Critério</th><th scope="col" className="text-right font-medium">Peso</th><th scope="col" className="text-right font-medium">Atendido</th></tr></thead>
                      <tbody>
                        {result.criteria.map((c) => (
                          <tr key={c.id} className="border-t border-sand-100">
                            <th scope="row" className="py-1.5 text-left font-normal">{c.label}<span className="block text-subtle">{c.explanation}</span></th>
                            <td className="py-1.5 text-right tabular-nums">{c.weight}</td>
                            <td className="py-1.5 text-right tabular-nums">{c.fraction === null ? "sem dado" : `${Math.round(c.fraction * 100)}%`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                  <Link href={`/destinos/${dest.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
                    Ver perfil completo <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/destinos?ordem=compatibilidade" className="text-sm font-medium text-navy-800 underline underline-offset-2">Ver todos os destinos ordenados por compatibilidade</Link>
        </div>
      </div>
    );
  }

  const current = steps[step]!;
  const last = step === steps.length - 1;
  return (
    <div className="container-page max-w-3xl py-10">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-subtle">
          <span>Pergunta {step + 1} de {steps.length}</span>
          <span>Sem cadastro</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-200" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label="Progresso do questionário">
          <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <div key={step} className="animate-fade-up rounded-3xl border border-sand-200 bg-white p-6 shadow-card md:p-8">
        <h2 className="font-display text-2xl font-medium md:text-3xl">{current.title}</h2>
        {current.hint && <p className="mt-2 text-sm text-muted">{current.hint}</p>}
        <div className="mt-6">{current.body}</div>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft aria-hidden /> Voltar
        </Button>
        <Button
          variant={last ? "secondary" : "primary"}
          onClick={() => {
            if (last) {
              saveQuizAnswers(answers);
              setDone(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else setStep((s) => s + 1);
          }}
        >
          {last ? <><Sparkles aria-hidden /> Ver recomendações</> : <>Continuar <ArrowRight aria-hidden /></>}
        </Button>
      </div>
    </div>
  );
}
