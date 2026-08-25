const { test, expect } = require("@playwright/test");

const GAME_URL = "/maths-games/myrebus/";
const diagnosticsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [] };
  diagnosticsByPage.set(page, diagnostics);
  page.on("console", (message) => { if (message.type() === "error") diagnostics.consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => diagnostics.pageErrors.push(error.message));
  page.on("requestfailed", (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()}`));
  page.on("response", (response) => { if (response.status() >= 400) diagnostics.httpErrors.push(`${response.status()} ${response.url()}`); });
  await page.addInitScript(() => {
    let seed = 0x5eed1234;
    Math.random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 0x1_0000_0000;
    };
  });
});

test.afterEach(async ({ page }) => {
  const diagnostics = diagnosticsByPage.get(page);
  expect.soft(diagnostics.consoleErrors, "browser console errors").toEqual([]);
  expect.soft(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect.soft(diagnostics.requestFailures, "failed requests").toEqual([]);
  expect.soft(diagnostics.httpErrors, "HTTP errors").toEqual([]);
});

async function openCategories(page, viewport = { width: 1366, height: 768 }) {
  await page.setViewportSize(viewport);
  const response = await page.goto(GAME_URL, { waitUntil: "networkidle" });
  expect(response.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: "MY REBUS", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /create a rebus board/i }).click();
  await expect(page.getByRole("heading", { name: /what is your class into/i })).toBeVisible();
}

async function buildCitiesBoard(page) {
  await page.getByRole("button", { name: /Cities/ }).click();
  await expect(page.locator("[data-selection-summary]")).toHaveText("1 category selected");
  await page.getByRole("button", { name: /Create 6 rebuses/ }).click();
  await expect(page.locator("[data-board-grid] [data-card]")).toHaveCount(6);
  await expect(page.locator("[data-screen=loading]")).toBeHidden();
}

test("Game Lab entry opens the exact direct route and refreshes successfully", async ({ page }) => {
  await page.goto("/maths-games.html", { waitUntil: "networkidle" });
  const card = page.getByRole("link", { name: /MY REBUS/ });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", "/maths-games/myrebus/");
  await card.click();
  await expect(page).toHaveURL(/\/maths-games\/myrebus\/$/);
  await expect(page.getByRole("heading", { name: "MY REBUS", exact: true })).toBeVisible();
  const response = await page.reload({ waitUntil: "networkidle" });
  expect(response.status()).toBeLessThan(400);
  await expect(page.getByRole("button", { name: /create a rebus board/i })).toBeVisible();
});

test("all categories render in five columns and Random Mix stays exclusive", async ({ page }) => {
  await openCategories(page);
  const tiles = page.locator("[data-category]");
  await expect(tiles).toHaveCount(20);
  expect(await page.locator("[data-category-grid]").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length)).toBe(5);
  await page.getByRole("button", { name: /Cities/ }).click();
  await page.getByRole("button", { name: /Food/ }).click();
  await expect(page.locator("[data-selection-summary]")).toHaveText("2 categories selected");
  await page.getByRole("button", { name: /Random Mix/ }).click();
  await expect(page.getByRole("button", { name: /Random Mix/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Cities/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /Football/ }).click();
  await expect(page.getByRole("button", { name: /Random Mix/ })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: /Football/ })).toHaveAttribute("aria-pressed", "true");
});

test("six-card board supports independent wrong, hint, reveal and solved states", async ({ page }) => {
  await openCategories(page);
  await buildCitiesBoard(page);
  const cards = page.locator("[data-card]");
  await expect(cards).toHaveCount(6);
  await expect(page.locator("[data-board-status]")).toHaveText("0 / 6 complete");

  const goldCard = page.locator("[data-card]", { has: page.locator('img[alt="A shiny gold medal"]') });
  await expect(goldCard).toHaveCount(1);
  await goldCard.locator("[data-answer-input]").fill("  GOLD---coast!!  ");
  await goldCard.locator("[data-answer-input]").press("Enter");
  await expect(goldCard).toHaveAttribute("data-state", "solved");
  await expect(goldCard.locator("[data-answer-state]")).toContainText("GOLD COAST");
  await expect(page.locator("[data-board-status]")).toHaveText("1 / 6 complete");

  const openCardIndex = await cards.evaluateAll((nodes) => nodes.findIndex((node) => !node.hasAttribute("data-state")));
  const openCard = cards.nth(openCardIndex);
  await openCard.locator("[data-hint-button]").click();
  await expect(openCard.locator("[data-hint]")).toBeVisible();
  await openCard.locator("[data-answer-input]").fill("definitely wrong");
  await openCard.locator("[data-answer-form]").evaluate((form) => form.requestSubmit());
  await expect(openCard.locator("[data-feedback]")).toHaveText("✕ Try again");
  await expect(openCard.locator("[data-reveal-button]")).toBeVisible();
  await expect(goldCard).toHaveAttribute("data-state", "solved");
  await openCard.locator("[data-reveal-button]").click();
  await expect(openCard).toHaveAttribute("data-state", "revealed");
  await expect(page.locator("[data-board-status]")).toHaveText("2 / 6 complete");

  const firstIds = await cards.locator("img").evaluateAll((images) => images.map((image) => image.src));
  await cards.first().evaluate((node) => { node.dataset.testOldBoard = "true"; });
  await page.getByRole("button", { name: "New board", exact: true }).click();
  await expect(page.locator("[data-test-old-board]")).toHaveCount(0);
  await expect(cards).toHaveCount(6);
  const secondIds = await cards.locator("img").evaluateAll((images) => images.map((image) => image.src));
  expect(secondIds).not.toEqual(firstIds);
});

test("completion keeps all six answers on screen and change categories returns to selection", async ({ page }) => {
  await openCategories(page, { width: 1440, height: 900 });
  await page.getByRole("button", { name: /Random Mix/ }).click();
  await page.getByRole("button", { name: /Create 6 rebuses/ }).click();
  const cards = page.locator("[data-card]");
  await expect(cards).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    const card = cards.nth(index);
    await card.locator("[data-answer-input]").fill("not the answer");
    await card.locator("[data-answer-form]").evaluate((form) => form.requestSubmit());
    await card.locator("[data-reveal-button]").click();
    await expect(card).toHaveAttribute("data-state", "revealed");
  }
  await expect(page.locator("[data-complete-banner]")).toBeVisible();
  await expect(page.locator("[data-complete-banner]")).toContainText("Board complete");
  await expect(page.locator("[data-answer-panel]:visible")).toHaveCount(6);
  await expect(cards).toHaveCount(6);
  await page.getByRole("button", { name: "Change categories", exact: true }).click();
  await expect(page.getByRole("heading", { name: /what is your class into/i })).toBeVisible();
});

for (const viewport of [
  { name: "1366x768 projector", width: 1366, height: 768 },
  { name: "1920x1080 projector", width: 1920, height: 1080 },
]) {
  test(`${viewport.name} keeps all six cards visible in a 3 by 2 grid`, async ({ page }, testInfo) => {
    await openCategories(page, viewport);
    await buildCitiesBoard(page);
    const cards = page.locator("[data-card]");
    const metrics = await cards.evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    }));
    expect(metrics).toHaveLength(6);
    expect(new Set(metrics.map((item) => Math.round(item.left))).size).toBe(3);
    expect(new Set(metrics.map((item) => Math.round(item.top))).size).toBe(2);
    expect(Math.max(...metrics.map((item) => item.right))).toBeLessThanOrEqual(viewport.width + 1);
    expect(Math.max(...metrics.map((item) => item.bottom))).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: `.visual-check/myrebus-${viewport.width}x${viewport.height}-board.png`, fullPage: true });
    await testInfo.attach(`${viewport.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}
