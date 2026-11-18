/**
 * DayTripper Kalpitiya — automated UI smoke tests (Chromium via Playwright).
 *
 * Prerequisites (one-off):
 *   npm i -D playwright-core && npx playwright-core install chromium
 *
 * Run:
 *   UI_BASE=http://127.0.0.1:5173 node --test tests/ui.smoke.test.js
 *
 * The suite is skipped automatically when Playwright is not installed.
 */
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5173";
const EXECUTABLE =
  process.env.CHROME_PATH ||
  "/home/rahmy/.cache/ms-playwright/chromium-1148/chrome-linux/chrome";

let chromium = null;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  /* not installed */
}

const opts = { skip: chromium ? false : "playwright-core is not installed" };

let browser;
let page;
const consoleErrors = [];

test.before(async () => {
  if (!chromium) return;
  browser = await chromium.launch({
    executablePath: EXECUTABLE,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
});

test.after(async () => {
  if (browser) await browser.close();
});

async function goto(path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

test("TC-UI-01 home page renders the hero and three featured places", opts, async () => {
  await goto("/");
  const h1 = await page.locator("h1").first().innerText();
  assert.match(h1, /Kalpitiya/i);
  assert.equal(await page.locator(".place-card").count(), 3);
});

test("TC-UI-02 catalogue lists every seeded attraction", opts, async () => {
  await goto("/catalogue");
  const count = await page.locator(".place-card").count();
  assert.ok(count >= 10, `expected at least 10 cards, found ${count}`);
});

test("TC-UI-03 search narrows the catalogue and the empty state is friendly", opts, async () => {
  await goto("/catalogue");
  await page.fill('input[type="search"]', "kite");
  await page.waitForTimeout(400);
  const found = await page.locator(".place-card").count();
  assert.ok(found >= 1 && found < 10, `unexpected result count ${found}`);

  await page.fill('input[type="search"]', "zzzz-not-a-place");
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".place-card").count(), 0);
  assert.ok(await page.locator(".empty-state").isVisible());
});

test("TC-UI-04 category chip filters the catalogue", opts, async () => {
  await goto("/catalogue");
  const chip = page.locator(".cat-filters .chip", { hasText: "Water Sports" });
  await chip.first().click();
  await page.waitForTimeout(400);
  const cats = await page.locator(".place-card .cat-chip").allInnerTexts();
  assert.ok(cats.length >= 1);
  for (const c of cats) assert.equal(c.trim(), "Water Sports");
});

test("TC-UI-05 place detail shows facts, tips and an embedded map", opts, async () => {
  await goto("/catalogue");
  await page.locator(".card-title a").first().click();
  await page.waitForTimeout(900);
  assert.ok(await page.locator(".detail-hero h1").isVisible());
  assert.ok((await page.locator(".fact").count()) >= 4, "quick facts are missing");
  assert.ok(await page.locator(".leaflet-container").first().isVisible());
  assert.match(await page.locator(".geo-note").innerText(), /\d\.\d{3,4}, 79\.\d{3,4}/);
});

test("TC-UI-06 map explorer renders OSM tiles, markers and a legend", opts, async () => {
  await goto("/map");
  await page.waitForTimeout(2500);
  assert.ok(await page.locator(".leaflet-container").first().isVisible());
  const markers = await page.locator(".leaflet-marker-icon").count();
  assert.ok(markers >= 10, `expected at least 10 markers, found ${markers}`);
  assert.ok((await page.locator(".legend-row").count()) >= 5);
  assert.match(await page.locator(".osm-credit").innerText(), /OpenStreetMap/i);
});

test("TC-UI-07 a place can be added to the day plan and is scheduled", opts, async () => {
  await goto("/catalogue");
  await page.locator(".card-actions button", { hasText: "Add to plan" }).first().click();
  await page.waitForTimeout(300);
  await goto("/day-plan");
  assert.equal(await page.locator(".plan-row").count(), 1);
  assert.ok(await page.locator(".plan-row .stop-name").isVisible());
  assert.match(await page.locator(".summary-item").first().innerText(), /1/);
});

test("TC-UI-08 the itinerary can be reordered and re-scheduled", opts, async () => {
  await goto("/catalogue");
  const buttons = page.locator(".card-actions button", { hasText: "Add to plan" });
  const n = await buttons.count();
  for (let i = 0; i < Math.min(n, 3); i++) {
    await buttons.nth(i).click();
    await page.waitForTimeout(200);
  }
  await goto("/day-plan");
  const first = await page.locator(".plan-row .stop-name").first().innerText();
  await page.locator('.plan-row .reorder button[aria-label="Move down"]').first().click();
  await page.waitForTimeout(300);
  const newFirst = await page.locator(".plan-row .stop-name").first().innerText();
  assert.notEqual(first, newFirst, "the first stop should change after moving down");
  assert.ok((await page.locator(".plan-row").count()) >= 2);
});

test("TC-UI-09 the start time shifts the computed schedule", opts, async () => {
  await goto("/day-plan");
  await page.fill("#start", "10:00");
  await page.waitForTimeout(300);
  const cells = await page.locator(".plan-row").first().locator("span").allInnerTexts();
  assert.ok(cells.some((c) => c.includes("10:00")), "schedule should start at 10:00");
});

test("TC-UI-10 favourites persist for the session and render on the favourites page", opts, async () => {
  await goto("/catalogue");
  await page.locator(".fav-btn").first().click();
  await page.waitForTimeout(300);
  await goto("/favorites");
  assert.ok((await page.locator(".place-card").count()) >= 1);
});

test("TC-UI-11 the administrator login rejects a wrong password", opts, async () => {
  await goto("/admin");
  await page.fill("#username", "admin");
  await page.fill("#password", "wrong-password");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
  assert.ok(await page.locator(".form-error").isVisible());
  assert.ok(page.url().includes("/admin"));
});

test("TC-UI-12 a valid administrator login opens the dashboard", opts, async () => {
  await goto("/admin");
  await page.fill("#username", process.env.ADMIN_USERNAME || "admin");
  await page.fill("#password", process.env.ADMIN_PASSWORD || "kalpitiya123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  assert.ok(page.url().includes("/admin/dashboard"), `unexpected url ${page.url()}`);
  const rows = await page.locator(".admin-table tbody tr").count();
  assert.ok(rows >= 10, `expected at least 10 admin rows, found ${rows}`);
});

test("TC-UI-13 the admin can open the place form and the category manager", opts, async () => {
  await goto("/admin/dashboard");
  await page.locator(".tabs button", { hasText: /add place/i }).first().click();
  await page.waitForTimeout(500);
  assert.ok(await page.locator(".place-form").isVisible());

  await page.locator(".tabs button", { hasText: /^categories/i }).first().click();
  await page.waitForTimeout(500);
  assert.ok(await page.locator(".cat-list").isVisible());
  assert.ok((await page.locator(".cat-row").count()) >= 12);
});

test("TC-UI-14 no uncaught console errors were raised during the session", opts, async () => {
  // 401s are expected: TC-UI-11 deliberately submits a wrong password.
  const fatal = consoleErrors.filter(
    (e) =>
      !/favicon|ERR_INTERNET_DISCONNECTED|tile/i.test(e) &&
      !/status of 401/.test(e)
  );
  assert.deepEqual(fatal, [], `console errors: ${fatal.join(" | ")}`);
});
