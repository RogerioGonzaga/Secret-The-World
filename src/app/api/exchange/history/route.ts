import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FRANKFURTER_CURRENCIES, fetchHistory } from "@/lib/integrations/exchange/frankfurter";

const querySchema = z.object({
  base: z.enum(FRANKFURTER_CURRENCIES),
  symbol: z.enum(FRANKFURTER_CURRENCIES),
  days: z.coerce.number().int().min(7).max(730).default(365),
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Série histórica de câmbio (dias úteis do BCE). Apenas moedas cobertas pela Frankfurter. */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos ou moeda sem histórico disponível." }, { status: 400 });
  }
  const { base, symbol, days } = parsed.data;
  if (base === symbol) return NextResponse.json({ error: "Moedas iguais." }, { status: 400 });
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  try {
    const points = await fetchHistory(base, symbol, iso(start), iso(end));
    return NextResponse.json(
      { base, symbol, sourceId: "frankfurter-ecb", points },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ error: "Histórico de câmbio indisponível no momento." }, { status: 503 });
  }
}
