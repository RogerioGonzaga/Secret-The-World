import { expect, test } from "@playwright/test";

test.describe("fluxos principais", () => {
  test("homepage tem busca com sugestões que leva ao destino", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Seu próximo capítulo");
    const search = page.getByRole("combobox", { name: /pesquisar cidade/i });
    await search.fill("lisb");
    await expect(page.getByRole("option", { name: /Lisboa/ })).toBeVisible();
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/destinos\/lisboa-portugal/);
    await expect(page.getByRole("heading", { level: 1, name: "Lisboa" })).toBeVisible();
  });

  test("filtros alteram resultados e ficam na URL", async ({ page }) => {
    await page.goto("/destinos");
    const count = page.locator("#resultados strong");
    const total = Number(await count.textContent());
    if (await page.getByRole("button", { name: /^Filtros/ }).isVisible()) await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByLabel("Continente").selectOption("asia");
    await expect(page).toHaveURL(/continente=asia/);
    const filtered = Number(await count.textContent());
    expect(filtered).toBeLessThan(total);
    await page.reload();
    await expect(page.getByLabel("Continente")).toHaveValue("asia");
    expect(Number(await count.textContent())).toBe(filtered);
  });

  test("calculadora recalcula ao mudar renda", async ({ page }) => {
    await page.goto("/custo-de-vida?cidade=porto-portugal");
    await expect(page.getByLabel("Cidade onde deseja morar")).toHaveValue("porto-portugal");
    await page.getByLabel("Renda mensal").fill("3000");
    await page.getByLabel("Moeda da renda").selectOption("EUR");
    await expect(page.getByText("Sobra por mês")).toBeVisible();
    await expect(page.getByText("Hipóteses usadas no cálculo")).toBeVisible();
  });

  test("bruto sem dados tributários pede renda líquida", async ({ page }) => {
    await page.goto("/custo-de-vida?cidade=buenos-aires-argentina");
    await page.getByText("Bruto", { exact: true }).click();
    await expect(page.getByText(/O valor bruto não será tratado como líquido/)).toBeVisible();
  });

  test("comparador aceita três cidades pela URL", async ({ page }) => {
    await page.goto("/comparar?cidades=lisboa-portugal,berlim-alemanha,bangkok-tailandia");
    const table = page.getByRole("table", { name: /Comparação detalhada/ });
    await expect(table.getByRole("columnheader", { name: /Berlim/ })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: /Custo de vida mensal/ })).toBeVisible();
  });

  test("favoritos persistem no navegador", async ({ page }) => {
    await page.goto("/destinos/madrid-espanha");
    await page.getByRole("button", { name: "Salvar destino" }).click();
    await page.goto("/favoritos");
    await expect(page.getByRole("link", { name: "Madri" }).first()).toBeVisible();
  });

  test("questionário gera recomendações explicadas", async ({ page }) => {
    await page.goto("/destino-ideal");
    for (let i = 0; i < 7; i++) await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: /Ver recomendações/ }).click();
    await expect(page.getByRole("heading", { name: "Seus destinos recomendados" })).toBeVisible();
    await expect(page.getByText("Por que recomendamos").first()).toBeVisible();
    await expect(page.getByText(/compatível com suas respostas/).first()).toBeVisible();
  });

  test("destino inexistente mostra 404 amigável", async ({ page }) => {
    const res = await page.goto("/destinos/atlantida");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Destino não encontrado")).toBeVisible();
  });
});
