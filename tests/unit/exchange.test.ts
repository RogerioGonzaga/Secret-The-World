import { convert, conversionKind } from "@/lib/integrations/exchange/convert";
import { getExchangeSnapshot, __resetExchangeCache } from "@/lib/integrations/exchange/service";
import { fetchHistory } from "@/lib/integrations/exchange/frankfurter";
import { snapshot } from "./fixtures";

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("câmbio", () => {
  beforeEach(() => __resetExchangeCache());

  it("faz conversão cruzada via EUR", () => {
    expect(convert(6, "BRL", "EUR", snapshot)).toBeCloseTo(1);
    expect(convert(120, "USD", "BRL", snapshot)).toBeCloseTo(600);
    expect(convert(10, "XYZ", "BRL", snapshot)).toBeNull();
    expect(conversionKind("BRL", "AED", snapshot)).toBe("derived");
  });

  it("usa a Frankfurter e deriva o AED pela paridade oficial com o USD", async () => {
    const fetchMock = vi.fn(() => ok({ amount: 1, base: "EUR", date: "2026-10-15", rates: { USD: 1.1, BRL: 6.1 } }));
    const s = await getExchangeSnapshot(fetchMock);
    expect(s.status).toBe("live");
    expect(s.referenceDate).toBe("2026-10-15");
    expect(s.rates.AED).toBeCloseTo(1.1 * 3.6725);
    expect(s.rateKinds.AED).toBe("derived");
    expect(s.rateKinds.BRL).toBe("live");
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toContain("/latest?base=EUR");
  });

  it("mantém a última cotação válida quando a API falha", async () => {
    await getExchangeSnapshot(() => ok({ base: "EUR", date: "2026-10-15", rates: { USD: 1.1 } }));
    const s = await getExchangeSnapshot(() => Promise.reject(new Error("offline")));
    expect(s.status).toBe("cached");
    expect(s.referenceDate).toBe("2026-10-15");
  });

  it("recorre a taxas demonstrativas sinalizadas sem conexão (modo demo)", async () => {
    const s = await getExchangeSnapshot(() => Promise.resolve(new Response("erro", { status: 500 })));
    expect(s.status).toBe("demo");
    expect(Object.values(s.rateKinds).every((k) => k === "demo")).toBe(true);
  });

  it("rejeita respostas fora do formato esperado", async () => {
    const s = await getExchangeSnapshot(() => ok({ foo: "bar" }));
    expect(s.status).toBe("demo");
  });

  it("lê séries históricas ordenadas", async () => {
    const points = await fetchHistory("EUR", "BRL", "2026-01-01", "2026-01-05", () =>
      ok({ base: "EUR", rates: { "2026-01-05": { BRL: 6.2 }, "2026-01-02": { BRL: 6.1 } } }),
    );
    expect(points).toEqual([{ date: "2026-01-02", rate: 6.1 }, { date: "2026-01-05", rate: 6.2 }]);
  });
});
