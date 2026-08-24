const { test, expect } = require("@playwright/test");

const diagnosticsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [] };
  diagnosticsByPage.set(page, diagnostics);
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!url.startsWith("https://fonts.googleapis.com") && !url.startsWith("https://fonts.gstatic.com")) {
      diagnostics.requestFailures.push(`${request.method()} ${url}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push(`${response.status()} ${response.url()}`);
  });
});

test.afterEach(async ({ page }) => {
  const diagnostics = diagnosticsByPage.get(page);
  expect.soft(diagnostics.consoleErrors, "browser console errors").toEqual([]);
  expect.soft(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect.soft(diagnostics.requestFailures, "failed game requests").toEqual([]);
  expect.soft(diagnostics.httpErrors, "HTTP responses with status >= 400").toEqual([]);
});

test("loads local assets, starts classroom mode, plays a question, and survives refresh", async ({ page }) => {
  const response = await page.goto("/gamesThe/", { waitUntil: "networkidle" });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle("SQUADSUM | Sticks Tuition");
  await expect(page.getByText("Know the players. Add the numbers. Own the classroom.")).toBeVisible();

  await page.getByRole("button", { name: /CLASSROOM MODE/ }).click();
  await expect(page.getByRole("heading", { name: "Which players should appear?" })).toBeVisible();
  await expect(page.locator(".club-tile")).toHaveCount(20);
  await expect(page.locator('.club-tile img[src^="/gamesThe/clubs/"]').first()).toBeVisible();

  await page.getByRole("button", { name: /START GAME/ }).click();
  const answerInput = page.getByRole("textbox", { name: /Enter the name/ });
  await expect(answerInput).toBeFocused();
  await expect(page.locator('.player-card__portrait > img[src^="/gamesThe/players/"]').first()).toBeVisible();
  await expect(page.locator('.question-club img[src^="/gamesThe/clubs/"]')).toBeVisible();

  await answerInput.fill("not a footballer");
  await page.getByRole("button", { name: "SUBMIT" }).click();
  await expect(page.getByText("TRY AGAIN")).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /CLASSROOM MODE/ })).toBeVisible();
});
