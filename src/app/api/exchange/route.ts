import { NextResponse } from "next/server";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";

export const revalidate = 3600;

/** Taxas de câmbio relativas a 1 EUR, com status e data de referência. */
export async function GET() {
  const snapshot = await getExchangeSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
