/**
 * DayTripper Kalpitiya — API integration tests (black-box, against a live API).
 *
 * Start an isolated instance first:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/daytripper_test \
 *   ADMIN_PASSWORD=testpass123 PORT=5002 node server/index.js
 * Then: API_BASE=http://127.0.0.1:5002 node --test tests/api.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE || "http://127.0.0.1:5002";
const USER = process.env.ADMIN_USERNAME || "admin";
const PASS = process.env.ADMIN_PASSWORD || "testpass123";

/** Minimal cookie jar so we can assert on session behaviour. */
class Session {
  constructor() {
    this.cookie = "";
  }
  async request(path, { method = "GET", body } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.cookie) headers.Cookie = this.cookie;
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      const pair = c.split(";")[0];
      if (pair.startsWith("sid=")) this.cookie = pair;
    }
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  }
}

const guest = new Session();
let admin = null;
const created = { placeId: null, categoryId: null, categoryName: null };
const STAMP = Date.now().toString(36).slice(-5);

async function login() {
  const s = new Session();
  const res = await s.request("/api/auth/login", {
    method: "POST",
    body: { username: USER, password: PASS },
  });
  assert.equal(res.status, 200, "admin login should succeed");
  admin = s;
  return s;
}

const validPlace = (over = {}) => ({
  name: "Test Point",
  category: "Sightseeing",
  distanceKm: 3.4,
  description:
    "A generated test location used by the automated integration suite.",
  openingHours: "Daily 08:00-17:00",
  visitDurationMin: 60,
  entranceFee: "Free",
  tips: "Carry water.",
  latitude: 8.05,
  longitude: 79.9,
  ...over,
});

test("TC-A-01 health endpoint reports ok", async () => {
  const res = await guest.request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.status, "ok");
});

test("TC-A-02 public catalogue returns only active, non-deleted places", async () => {
  const res = await guest.request("/api/places");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 10, "at least 10 seeded places");
  for (const p of res.data) {
    assert.equal(p.isDeleted, undefined, "soft-delete flag must not leak");
    assert.equal(p.adminNotes, undefined, "admin notes must not leak");
  }
});

test("TC-A-03 default sort is ascending distance", async () => {
  const res = await guest.request("/api/places");
  const distances = res.data.map((p) => p.distanceKm);
  assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
});

test("TC-A-04 sort=name returns A-Z order", async () => {
  const res = await guest.request("/api/places?sort=name");
  const names = res.data.map((p) => p.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
});

test("TC-A-05 free-text search is case-insensitive over name/description", async () => {
  const res = await guest.request("/api/places?q=KITE");
  assert.equal(res.status, 200);
  assert.ok(res.data.length >= 1, "expected at least one kite-related place");
  const hit = res.data.find((p) => /kite/i.test(p.name + " " + p.description));
  assert.ok(hit);
});

test("TC-A-06 search treats regular-expression metacharacters as literal text", async () => {
  const res = await guest.request("/api/places?q=.*");
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 0, "'.*' must not match every record");
});

test("TC-A-07 category filter narrows the catalogue and never errors on empty sets", async () => {
  const res = await guest.request("/api/places?category=Water%20Sports");
  assert.equal(res.status, 200);
  assert.ok(res.data.length >= 1);
  for (const p of res.data) assert.equal(p.category, "Water Sports");

  const empty = await guest.request("/api/places?category=Monument");
  assert.equal(empty.status, 200);
  assert.ok(Array.isArray(empty.data));
});

test("TC-A-08 category summary endpoint returns counts for used categories only", async () => {
  const res = await guest.request("/api/places/categories");
  assert.equal(res.status, 200);
  assert.ok(res.data.length >= 1);
  for (const c of res.data) assert.ok(c.count > 0);
  assert.ok(res.data.some((c) => c.name === "Water Sports"));
});

test("TC-A-09 single place lookup returns the public view", async () => {
  const list = await guest.request("/api/places");
  const res = await guest.request(`/api/places/${list.data[0].id}`);
  assert.equal(res.status, 200);
  assert.equal(res.data.name, list.data[0].name);
  assert.equal(res.data.adminNotes, undefined);
});

test("TC-A-10 unknown and malformed place ids return 404", async () => {
  const res1 = await guest.request("/api/places/64b7f9f0f0f0f0f0f0f0f0f0");
  const res2 = await guest.request("/api/places/not-an-id");
  assert.equal(res1.status, 404);
  assert.equal(res2.status, 404);
});

test("TC-A-11 unknown routes return a JSON 404", async () => {
  const res = await guest.request("/api/does-not-exist");
  assert.equal(res.status, 404);
  assert.equal(res.data.message, "Not found");
});

test("TC-A-12 login rejects missing credentials with 400", async () => {
  const s = new Session();
  const res = await s.request("/api/auth/login", { method: "POST", body: {} });
  assert.equal(res.status, 400);
});

test("TC-A-13 login rejects a wrong password with 401", async () => {
  const s = new Session();
  const res = await s.request("/api/auth/login", {
    method: "POST",
    body: { username: USER, password: "definitely-wrong" },
  });
  assert.equal(res.status, 401);
  assert.match(res.data.message, /invalid/i);
});

test("TC-A-14 admin endpoints reject anonymous callers with 401", async () => {
  const res1 = await guest.request("/api/places/admin/all");
  assert.equal(res1.status, 401, "GET /api/places/admin/all must require auth");
  const res2 = await guest.request("/api/places", { method: "POST", body: {} });
  assert.equal(res2.status, 401, "POST /api/places must require auth");
  const res3 = await guest.request("/api/categories", {
    method: "POST",
    body: { name: "x" },
  });
  assert.equal(res3.status, 401, "POST /api/categories must require auth");
});

test("TC-A-15 session endpoint reports the signed-in administrator", async () => {
  await login();
  const res = await admin.request("/api/auth/session");
  assert.equal(res.status, 200);
  assert.equal(res.data.user.username, USER);
  assert.equal(res.data.user.role, "admin");
});

test("TC-A-16 logout destroys the session", async () => {
  const s = new Session();
  await s.request("/api/auth/login", {
    method: "POST",
    body: { username: USER, password: PASS },
  });
  const out = await s.request("/api/auth/logout", { method: "POST" });
  assert.equal(out.status, 200);
  const after = await s.request("/api/auth/session");
  assert.equal(after.data.user, null);
});

test("TC-A-17 admin list exposes soft-deleted records", async () => {
  await login();
  const res = await admin.request("/api/places/admin/all");
  assert.equal(res.status, 200);
  assert.ok(res.data.length >= 10);
  assert.ok("active" in res.data[0]);
});

test("TC-A-18 create place persists a valid record (201)", async () => {
  await login();
  const res = await admin.request("/api/places", {
    method: "POST",
    body: validPlace({ name: "Integration Test Point" }),
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.place.name, "Integration Test Point");
  created.placeId = res.data.place.id;
});

test("TC-A-19 create place rejects invalid payload with a field-level error list", async () => {
  await login();
  const res = await admin.request("/api/places", {
    method: "POST",
    body: validPlace({
      name: "",
      category: "Not A Category",
      distanceKm: 40,
      latitude: 40,
      longitude: 200,
      visitDurationMin: 5,
      description: "short",
    }),
  });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.data.errors));
  const joined = res.data.errors.join(" | ").toLowerCase();
  assert.match(joined, /name is required/);
  assert.match(joined, /invalid category/);
  assert.match(joined, /distance/);
  assert.match(joined, /latitude/);
  assert.match(joined, /longitude/);
  assert.match(joined, /visit duration/);
});

test("TC-A-20 update place (PUT) replaces the record", async () => {
  await login();
  const res = await admin.request(`/api/places/${created.placeId}`, {
    method: "PUT",
    body: validPlace({ name: "Updated Test Point", distanceKm: 4.2 }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.place.name, "Updated Test Point");
  assert.equal(res.data.place.distanceKm, 4.2);
});

test("TC-A-21 partial update (PATCH) changes only the supplied fields", async () => {
  await login();
  const res = await admin.request(`/api/places/${created.placeId}`, {
    method: "PATCH",
    body: { visitDurationMin: 90 },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.place.visitDurationMin, 90);
  assert.equal(res.data.place.name, "Updated Test Point");
});

test("TC-A-22 soft delete hides the place from the public catalogue", async () => {
  await login();
  const res = await admin.request(`/api/places/${created.placeId}`, {
    method: "DELETE",
  });
  assert.equal(res.status, 200);

  const pub = await guest.request("/api/places");
  assert.ok(
    !pub.data.some((p) => p.id === created.placeId),
    "soft-deleted place must not appear publicly"
  );

  const direct = await guest.request(`/api/places/${created.placeId}`);
  assert.equal(direct.status, 404);
});

test("TC-A-23 restore brings a soft-deleted place back to the public catalogue", async () => {
  await login();
  const res = await admin.request(`/api/places/restore/${created.placeId}`, {
    method: "POST",
  });
  assert.equal(res.status, 200);
  const pub = await guest.request("/api/places");
  assert.ok(pub.data.some((p) => p.id === created.placeId));
});

test("TC-A-24 bulk update reports success and invalid counts", async () => {
  await login();
  const list = await admin.request("/api/places/admin/all");
  const ids = list.data.slice(0, 3).map((p) => p.id);
  const res = await admin.request("/api/places/bulk-update", {
    method: "POST",
    body: { ids, updates: { visitDurationMin: 75 } },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.successCount, 3);
  assert.equal(res.data.invalidCount, 0);

  const bad = await admin.request("/api/places/bulk-update", {
    method: "POST",
    body: { ids, updates: { distanceKm: 99 } },
  });
  assert.equal(bad.status, 200);
  assert.equal(bad.data.successCount, 0);
  assert.equal(bad.data.invalidCount, 3);
});

test("TC-A-25 bulk update rejects an empty selection and empty patch", async () => {
  await login();
  const noIds = await admin.request("/api/places/bulk-update", {
    method: "POST",
    body: { ids: [], updates: { active: true } },
  });
  assert.equal(noIds.status, 400);

  const noUpdates = await admin.request("/api/places/bulk-update", {
    method: "POST",
    body: { ids: [created.placeId], updates: {} },
  });
  assert.equal(noUpdates.status, 400);
});

test("TC-A-26 category manager creates a category and rejects duplicates", async () => {
  await login();
  const name = `Test Category ${STAMP}`;
  const res = await admin.request("/api/categories", {
    method: "POST",
    body: { name },
  });
  assert.equal(res.status, 201);
  created.categoryId = res.data.category.id;
  created.categoryName = name;

  const dupe = await admin.request("/api/categories", {
    method: "POST",
    body: { name },
  });
  assert.equal(dupe.status, 400);
  assert.match(dupe.data.message, /already exists/i);
});

test("TC-A-27 renaming a category cascades to the places that use it", async () => {
  await login();
  await admin.request(`/api/places/${created.placeId}`, {
    method: "PATCH",
    body: { category: created.categoryName },
  });

  const renamed = `Renamed Category ${STAMP}`;
  const res = await admin.request(`/api/categories/${created.categoryId}`, {
    method: "PUT",
    body: { name: renamed },
  });
  assert.equal(res.status, 200);

  const after = await admin.request("/api/places/admin/all");
  const moved = after.data.find((p) => p.id === created.placeId);
  assert.equal(moved.category, renamed);
  created.categoryName = renamed;
});

test("TC-A-28 a category in use cannot be deleted (409)", async () => {
  await login();
  const res = await admin.request(`/api/categories/${created.categoryId}`, {
    method: "DELETE",
  });
  assert.equal(res.status, 409);
  assert.match(res.data.message, /referenced/i);
});

test("TC-A-29 an unused category can be deleted", async () => {
  await login();
  // free the category first by moving the test place back to a seed category
  await admin.request(`/api/places/${created.placeId}`, {
    method: "PATCH",
    body: { category: "Sightseeing" },
  });
  const res = await admin.request(`/api/categories/${created.categoryId}`, {
    method: "DELETE",
  });
  assert.equal(res.status, 200);
  created.categoryId = null;
});

test("TC-A-30 invalid JSON body returns 400 instead of 500", async () => {
  await login();
  const res = await fetch(`${BASE}/api/places`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: "{not-json",
  });
  assert.equal(res.status, 400);
});

test("TC-A-31 cleanup — the test place and category are removed", async () => {
  await login();
  const del = await admin.request(`/api/places/${created.placeId}`, {
    method: "DELETE",
  });
  assert.equal(del.status, 200);
});
