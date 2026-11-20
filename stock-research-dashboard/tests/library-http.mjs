/** Synthetic local-preview integration checks. Never targets a hosted site. */
import assert from "node:assert/strict";

const origin = new URL(process.argv[2] || "http://127.0.0.1:5173");
if (!["127.0.0.1", "localhost"].includes(origin.hostname)) throw new Error("This test creates fixtures and may run only against a local preview.");
const symbol = `SWTEST${Date.now().toString(36).toUpperCase()}`;
const created = [];
let checks = 0;
let localCookie = "";
const check = (name, work) => Promise.resolve().then(work).then(() => { checks++; console.log(`PASS ${name}`); });

async function raw(path, options = {}) {
  return fetch(new URL(path, origin), { ...options, signal: AbortSignal.timeout(30_000), headers: { Origin: origin.origin, ...(localCookie ? { Cookie: localCookie } : {}), ...options.headers } });
}
async function json(path, options) {
  const response = await raw(path, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${payload.error || "Unexpected API error"}`);
  return payload;
}
function uploadBody(text, { name = "historical-prices.csv", parentId = "", ticker = symbol, visibility = "private" } = {}) {
  const form = new FormData();
  form.set("file", new File([text], name, { type: name.endsWith(".json") ? "application/json" : "text/csv" }));
  form.set("symbol", ticker); form.set("companyName", "Integration test fixture"); form.set("currency", "USD"); form.set("visibility", visibility);
  if (parentId) form.set("parentId", parentId);
  return form;
}
async function upload(text, options = {}) {
  const payload = await json("/api/library", { method: "POST", body: uploadBody(text, options) });
  created.push(payload.item.id);
  return payload.item;
}
async function change(id, action) {
  return json(`/api/library/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
}
const csv = "date,close\n2025-01-02,100\n2025-01-03,105\n2025-01-06,103\n";
let parent, child;
try {
  await check("signed-out requests cannot access private library or spoof an identity", async () => {
    assert.equal((await raw("/api/library")).status, 401);
    assert.equal((await raw("/api/library", { headers: { "oai-authenticated-user-id": "local_seedy", "oai-authenticated-user-email": "seedy@sites.test" } })).status, 401);
    const signIn = await raw("/signin-with-chatgpt?return_to=%2Fdata", { redirect: "manual" });
    assert.equal(signIn.status, 302);
    localCookie = (signIn.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(localCookie, "The official local preview sign-in must set a session cookie.");
  });
  await check("signed-in local administrator and persistent storage are available", async () => {
    const session = await json("/api/me");
    assert.equal(session.user?.role, "admin"); assert.equal(session.storageReady, true);
  });
  await check("all workspace pages render through the running server", async () => {
    for (const path of ["/", "/learning", "/data", "/admin"]) {
      const response = await raw(path); assert.equal(response.status, 200);
      assert.match(await response.text(), /Stockwise|stockwise/);
    }
  });
  await check("a CSV upload persists rows, price analysis, and a protected download", async () => {
    parent = await upload(csv);
    assert.equal(parent.kind, "prices"); assert.equal(parent.rowCount, 3); assert.equal(parent.latest, true);
    const detail = await json(`/api/library/${parent.id}`);
    assert.equal(detail.rows.length, 3);
    assert.equal(detail.analysis.metrics.find(metric => metric.label === "Latest close").value, 103);
    const download = await raw(`/api/library/${parent.id}/download`);
    assert.equal(download.status, 200); assert.match(download.headers.get("content-disposition"), /^attachment/);
    assert.equal(download.headers.get("x-content-type-options"), "nosniff"); assert.equal(await download.text(), csv);
  });
  await check("new uploads connect to the previous file without overwriting it", async () => {
    child = await upload(csv + "2025-01-07,110\n", { parentId: parent.id });
    assert.equal(child.parentId, parent.id);
    assert.equal((await json(`/api/library/${parent.id}`)).item.latest, false);
    const response = await raw("/api/library", { method: "POST", body: uploadBody(csv, { parentId: parent.id }) });
    assert.equal(response.status, 409);
    assert.equal((await json(`/api/library/${parent.id}`)).rows.length, 3);
  });
  await check("versions reject incompatible companies and preserve archive/restore order", async () => {
    const incompatible = await raw("/api/library", { method: "POST", body: uploadBody(csv, { parentId: child.id, ticker: "OTHERCO" }) });
    assert.equal(incompatible.status, 409);
    const archiveParent = await raw(`/api/library/${parent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "archive" }) });
    assert.equal(archiveParent.status, 409);
    await change(child.id, "archive");
    assert.equal((await json(`/api/library/${parent.id}`)).item.latest, true);
    await change(child.id, "restore");
    assert.equal((await json(`/api/library/${parent.id}`)).item.latest, false);
  });
  await check("financial uploads calculate actual ratios from the supplied figures", async () => {
    const financial = await upload("period,revenue,netIncome,assets,liabilities\n2024-12-31,100,10,200,100\n2025-12-31,120,18,240,120\n", { name: "company-financials.csv" });
    const detail = await json(`/api/library/${financial.id}`);
    assert.equal(financial.kind, "financials");
    assert.equal(detail.analysis.metrics.find(metric => metric.label === "Net margin").value, 15);
    const liquidity = detail.analysis.metrics.find(metric => metric.label === "Current ratio"); assert.equal(liquidity.value, null);
  });
  await check("malformed files, credential URLs, and cross-origin writes are rejected", async () => {
    const invalid = await raw("/api/library", { method: "POST", body: uploadBody("date,close\n2025-01-01,100\n2025-01-01,101\n") }); assert.equal(invalid.status, 400);
    const source = await raw("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "source", symbol, companyName: "Test", currency: "USD", visibility: "private", title: "Bad source", url: "https://user:password@example.com" }) }); assert.equal(source.status, 400);
    const cross = await raw("/api/library", { method: "POST", headers: { Origin: "https://another.test", "Content-Type": "application/json" }, body: "{}" }); assert.equal(cross.status, 403);
  });
  await check("website references are saved without scraping their content", async () => {
    const { item } = await json("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "source", symbol, companyName: "Integration test fixture", currency: "USD", visibility: "private", title: "Example source", url: "https://example.com/company" }) });
    created.push(item.id); assert.equal(item.kind, "source");
    const detail = await json(`/api/library/${item.id}`); assert.equal(detail.rows.length, 0); assert.equal(detail.item.url, "https://example.com/company");
  });
  await check("administrator endpoints protect the owner and record upload activity", async () => {
    const me = (await json("/api/me")).user;
    assert.ok((await json("/api/admin/users")).users.some(user => user.id === me.id));
    const demote = await raw("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: me.id, role: "user" }) }); assert.equal(demote.status, 409);
    assert.ok((await json("/api/admin/audit")).events.some(event => event.targetId === parent.id));
  });
} finally {
  for (const id of created.reverse()) {
    try { const detail = await json(`/api/library/${id}`); if (!detail.item.archivedAt) await change(id, "archive"); }
    catch { console.error("A local synthetic fixture could not be archived."); }
  }
}
console.log(`${checks} library HTTP integration checks passed.`);
