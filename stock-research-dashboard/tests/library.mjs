/** Parser, storage, access-control, and migration checks. No network or real files. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";

let checks = 0;
async function check(label, run) { await run(); checks++; console.log(`PASS ${label}`); }
async function bundled(entry, stubRuntime = false) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", write: false, plugins: stubRuntime ? [{ name: "library-test-runtime", setup(build) {
    build.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: "runtime", namespace: "test" }));
    build.onResolve({ filter: /(?:^@\/lib\/integrations\/sites\/auth$|\/lib\/integrations\/sites\/auth\.ts$)/ }, () => ({ path: "identity", namespace: "test" }));
    build.onLoad({ filter: /.*/, namespace: "test" }, ({ path }) => ({ contents: path === "runtime" ? "export const env=globalThis.__libraryEnv;" : "export async function getChatGPTUser(){return globalThis.__libraryIdentity||null;}" }));
  } }] : [] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}
const parser = await bundled("lib/validation/library.ts");
const encode = text => new TextEncoder().encode(text);
const priceCsv = "date,close,open,high,low,volume\n2025-01-02,100,99,101,98,1000\n2025-01-03,110,100,112,99,1200\n2025-01-06,99,110,111,98,1300\n";
const financialCsv = await readFile("public/templates/financials.csv", "utf8");
const schema = await readFile("drizzle/0000_chief_krista_starr.sql", "utf8");
const quotaSchema = await readFile("drizzle/0001_library_storage_quota.sql", "utf8");

await check("CSV parsing supports BOM, quotes, CRLF, and quoted thousands", () => {
  const rows = parser.parseCsv('\uFEFFdate,close,volume\r\n2025-01-02,"100","1,000"\r\n');
  assert.equal(rows[1][2], "1,000");
  assert.equal(parser.parseDataFile("prices.csv", encode('\uFEFFdate,close,volume\r\n2025-01-02,"100","1,000"\r\n')).rows[0].volume, 1000);
  assert.deepEqual(parser.parseCsv('a,b\n"hello, world","a""b"\n'), [["a", "b"], ["hello, world", 'a"b']]);
});
await check("malformed CSV and inconsistent row lengths are rejected", () => {
  for (const input of ['date,close\n"2025-01-02,100', 'date,close\n2025-01-02,100,extra', 'date,close\n2025-01-02,"100"oops']) assert.throws(() => parser.parseDataFile("prices.csv", encode(input)));
});
await check("dates are real, unique, chronological, and company-specific", () => {
  assert.throws(() => parser.parseDataFile("prices.csv", encode("date,close\n2025-02-30,100")));
  assert.throws(() => parser.parseDataFile("prices.csv", encode("date,close\n2025-01-02,100\n2025-01-02,101")));
  assert.throws(() => parser.parseDataFile("prices.csv", encode("symbol,date,close\nOTHER,2025-01-02,100"), "AAPL"));
  const sorted = parser.parseDataFile("prices.csv", encode("date,close\n2025-01-03,101\n2025-01-02,100"));
  assert.equal(sorted.rows[0].date, "2025-01-02");
});
await check("numeric validation preserves missing values and zero without executing formulas", () => {
  assert.equal(parser.numericValue("0", "profit", 2), 0);
  assert.equal(parser.numericValue("  ", "profit", 2), null);
  assert.equal(parser.numericValue("(1,000)", "profit", 2), -1000);
  for (const value of ["=SUM(1,2)", "Infinity", "NaN", true, "1,00", 1e30]) assert.throws(() => parser.numericValue(value, "profit", 2));
});
await check("duplicate aliases, unknown columns, and mixed data are rejected", () => {
  for (const input of ["date,close,price\n2025-01-02,100,100", "date,close,script\n2025-01-02,100,bad", "date,close,revenue\n2025-01-02,100,1000"]) assert.throws(() => parser.parseDataFile("prices.csv", encode(input)));
});
await check("OHLC constraints and positive close are enforced", () => {
  for (const input of ["date,close\n2025-01-02,0", "date,close,open,high,low\n2025-01-02,100,120,110,90", "date,close,high,low\n2025-01-02,100,99,90", "date,close,volume\n2025-01-02,100,-1"]) assert.throws(() => parser.parseDataFile("prices.csv", encode(input)));
});
await check("price analysis never invents financial statements", () => {
  const result = parser.parseDataFile("prices.csv", encode(priceCsv));
  assert.equal(result.kind, "prices");
  assert.equal(result.analysis.metrics.find(m => m.label === "Price return").value, -1.0000000000000009);
  assert.ok(!result.analysis.metrics.some(m => /revenue|assets|margin/i.test(m.label)));
  assert.match(result.analysis.warnings.join(" "), /cannot determine revenue/);
});
await check("financial ratios use proper averages and stated assumptions", () => {
  const result = parser.parseDataFile("financials.csv", encode(financialCsv));
  assert.equal(result.kind, "financials");
  const metrics = Object.fromEntries(result.analysis.metrics.map(m => [m.label, m]));
  assert.equal(metrics["Net margin"].value, 12);
  assert.equal(metrics["Current ratio"].value, 2);
  assert.equal(metrics["Return on assets"].value, 9);
  assert.equal(metrics["Free cash flow (OCF less CapEx)"].value, 130000);
  assert.ok(metrics["Days sales outstanding"].value > 0);
});
await check("missing or zero denominators produce unavailable ratios", () => {
  const result = parser.parseDataFile("data.json", encode(JSON.stringify({ kind: "financials", rows: [{ period: "2025-12-31", revenue: 0, netIncome: 0, currentAssets: 100, currentLiabilities: 0 }] })));
  const metrics = Object.fromEntries(result.analysis.metrics.map(m => [m.label, m.value]));
  assert.equal(metrics["Revenue"], 0);
  assert.equal(metrics["Net margin"], null);
  assert.equal(metrics["Current ratio"], null);
  assert.equal(metrics["Return on assets"], null);
});
await check("upload row and file size limits are enforced", () => {
  assert.throws(() => parser.parseDataFile("prices.csv", new Uint8Array(5 * 1024 * 1024 + 1)), { status: 413 });
  const rows = Array.from({ length: 10001 }, (_, i) => ({ date: `2025-01-${String(i).padStart(2, "0")}`, close: 100 }));
  assert.throws(() => parser.parseDataFile("prices.json", encode(JSON.stringify({ kind: "prices", rows }))));
});
await check("CSV exports escape spreadsheet formulas and preserve numeric negatives", () => {
  assert.equal(parser.safeCsvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(parser.safeCsvCell("  @SUM(1)"), "'  @SUM(1)");
  assert.equal(parser.safeCsvCell(-12), "-12");
  assert.equal(parser.safeCsvCell('a,"b"'), '"a,""b"""');
});
await check("attachment validation checks recognizable signatures and valid ZIP pairs", () => {
  assert.equal(parser.validateAttachment("report.pdf", encode("%PDF-1.7")), "application/pdf");
  assert.match(parser.validateAttachment("report.xlsx", new Uint8Array([0x50, 0x4b, 3, 4])), /spreadsheet/);
  assert.throws(() => parser.validateAttachment("report.docx", new Uint8Array([0x50, 0x4b, 3, 6])));
  assert.throws(() => parser.validateAttachment("report.exe", encode("MZ")));
});

class Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.database, this.sql, args); }
  async first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  async all() { return { success: true, results: this.database.prepare(this.sql).all(...this.args) }; }
  async run() { return this.runSync(); }
  runSync() { const result = this.database.prepare(this.sql).run(...this.args); return { success: true, meta: { changes: Number(result.changes) } }; }
}
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON"); sqlite.exec(schema); sqlite.exec(quotaSchema);
const db = { prepare: sql => new Statement(sqlite, sql), async batch(statements) { sqlite.exec("BEGIN"); try { const result = statements.map(statement => statement.runSync()); sqlite.exec("COMMIT"); return result; } catch (error) { sqlite.exec("ROLLBACK"); throw error; } } };
const objects = new Map();
const bucket = {
  async put(key, body) { objects.set(key, typeof body === "string" ? encode(body) : new Uint8Array(body)); },
  async delete(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key); },
  async get(key) { const bytes = objects.get(key); return bytes ? { body: new Response(bytes).body, size: bytes.byteLength, async json() { return JSON.parse(new TextDecoder().decode(bytes)); } } : null; },
};
globalThis.__libraryEnv = { DB: db, BUCKET: bucket, STOCKWISE_ADMIN_EMAILS: "OWNER@example.test", STOCKWISE_ADMIN_USER_IDS: "Opaque-Admin-ID" };
globalThis.__libraryIdentity = null;
const auth = await bundled("services/library-access.ts", true), store = await bundled("services/library.ts", true);
function identity(id, email, displayName = id) { globalThis.__libraryIdentity = { userId: id, email, displayName, fullName: null }; }
const sourceInput = { kind: "source", title: "Company investor relations", url: "https://example.com/investors", symbol: "TEST", companyName: "Test Company", currency: "USD", visibility: "private" };
let owner, alice, bob, first, child;

await check("no first-caller administrator and exact opaque admin identifiers", async () => {
  assert.equal(await auth.getLibraryUser(), null);
  identity("alice", "alice@example.test"); alice = await auth.getLibraryUser(); assert.equal(alice.role, "user");
  assert.equal(auth.isRootAdmin({ id: "opaque-admin-id", email: "nobody@example.test" }), false);
  assert.equal(auth.isRootAdmin({ id: "Opaque-Admin-ID", email: "nobody@example.test" }), true);
  identity("owner", "owner@example.test"); owner = await auth.getLibraryUser(); assert.equal(owner.role, "admin");
  identity("bob", "bob@example.test"); bob = await auth.getLibraryUser(); assert.equal(bob.role, "user");
});
await check("mutation origin checks reject absent, null, and foreign origins", () => {
  const make = origin => new Request("https://stockwise.example/api/library", { method: "POST", headers: origin === undefined ? {} : { Origin: origin } });
  for (const origin of [undefined, "null", "https://evil.example"]) assert.throws(() => auth.assertSameOrigin(make(origin)), { status: 403 });
  auth.assertSameOrigin(make("https://stockwise.example"));
});
await check("streamed request limits do not trust a false content length", async () => {
  const request = new Request("https://stockwise.example/api/library", { method: "POST", headers: { "Content-Length": "1" }, body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(50)); controller.enqueue(new Uint8Array(50)); controller.close(); } }), duplex: "half" });
  await assert.rejects(auth.readBoundedBody(request, 60), { status: 413 });
});
await check("ordinary users cannot publish shared files or change roles", async () => {
  await assert.rejects(store.createLibrarySource(alice, { ...sourceInput, visibility: "shared" }), { status: 403 });
  await assert.rejects(store.changeUserRole(alice, bob.id, "admin"), { status: 403 });
  await assert.rejects(store.listUsers(alice), { status: 403 });
});
await check("source links are HTTPS bookmarks and never fetched", async () => {
  for (const url of ["http://example.com", "javascript:alert(1)", "https://user:password@example.com"]) assert.throws(() => store.validateSourceUrl(url));
  const originalFetch = globalThis.fetch; globalThis.fetch = () => { throw new Error("A source bookmark must not fetch external content"); };
  try { const source = await store.createLibrarySource(alice, sourceInput); assert.equal(source.kind, "source"); assert.equal((await store.libraryDetail(alice, source.id)).rows.length, 0); }
  finally { globalThis.fetch = originalFetch; }
});
await check("uploads persist parsed data and private ownership", async () => {
  first = await store.createLibraryUpload(alice, { symbol: "TEST", companyName: "Test Company", currency: "USD", visibility: "private" }, new File([priceCsv], "prices.csv", { type: "text/csv" }));
  assert.equal(first.ownerId, alice.id); assert.equal(first.rowCount, 3); assert.equal(first.kind, "prices");
  assert.equal((await store.libraryDetail(alice, first.id)).rows.length, 3);
  await assert.rejects(store.libraryDetail(bob, first.id), { status: 404 });
  await assert.rejects(store.downloadLibraryFile(bob, first.id), { status: 404 });
  assert.equal((await store.libraryDetail(owner, first.id)).item.id, first.id);
});
await check("version links enforce company, kind, currency, visibility, and access", async () => {
  const meta = { symbol: "TEST", companyName: "Test Company", currency: "USD", visibility: "private", parentId: first.id };
  await assert.rejects(store.createLibraryUpload(bob, meta, new File([priceCsv], "prices.csv")), { status: 404 });
  await assert.rejects(store.createLibraryUpload(alice, { ...meta, currency: "INR" }, new File([priceCsv], "prices.csv")), { status: 409 });
  await assert.rejects(store.createLibraryUpload(alice, meta, new File([financialCsv], "financials.csv")), { status: 409 });
  child = await store.createLibraryUpload(owner, meta, new File([priceCsv], "prices-v2.csv"));
  assert.equal(child.ownerId, alice.id, "administrator version preserves original owner access");
  assert.equal((await store.libraryDetail(alice, child.id)).item.parentId, first.id);
  assert.equal((await store.libraryDetail(alice, first.id)).item.latest, false);
  await assert.rejects(store.createLibraryUpload(alice, meta, new File([priceCsv], "prices-v3.csv")), { status: 409 });
});
await check("archive and restore preserve a valid version chain", async () => {
  await assert.rejects(store.changeLibraryItem(alice, first.id, "archive"), { status: 409 });
  await store.changeLibraryItem(alice, child.id, "archive");
  await store.changeLibraryItem(alice, first.id, "archive");
  await assert.rejects(store.changeLibraryItem(alice, child.id, "restore"), { status: 409 });
  assert.ok((await store.listLibrary(alice, "TEST", true)).some(item => item.id === first.id));
  await store.changeLibraryItem(alice, first.id, "restore"); await store.changeLibraryItem(alice, child.id, "restore");
  assert.equal((await store.libraryDetail(alice, child.id)).item.archivedAt, null);
});
await check("visibility changes cannot break version access", async () => {
  await assert.rejects(store.changeLibraryItem(owner, first.id, "share"), { status: 409 });
  const shared = await store.createLibrarySource(owner, { ...sourceInput, visibility: "shared" });
  assert.equal((await store.libraryDetail(bob, shared.id)).item.visibility, "shared");
  await assert.rejects(store.changeLibraryItem(bob, shared.id, "archive"), { status: 403 });
  await store.changeLibraryItem(owner, shared.id, "archive");
  await assert.rejects(store.libraryDetail(bob, shared.id), { status: 404 });
});
await check("downloads force attachment handling and prevent content sniffing", async () => {
  const response = await store.downloadLibraryFile(alice, first.id);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(response.headers.get("Content-Disposition"), /^attachment;/);
  assert.equal(await response.text(), priceCsv);
});
await check("root administrator and self-demotion safeguards are enforced", async () => {
  await store.changeUserRole(owner, bob.id, "admin");
  const adminBob = { ...bob, role: "admin" };
  await assert.rejects(store.changeUserRole(adminBob, owner.id, "user"), { status: 409 });
  await assert.rejects(store.changeUserRole(adminBob, bob.id, "user"), { status: 409 });
  await store.changeUserRole(owner, bob.id, "user");
});
await check("audit log records uploads, versions, archive, restore, and role changes", async () => {
  const events = await store.listAudit(owner);
  for (const action of ["file.uploaded", "file.version_created", "file.archived", "file.restored", "user.role_changed"]) assert.ok(events.some(event => event.action === action));
  await assert.rejects(store.listAudit(alice), { status: 403 });
});
await check("database triggers stop direct version and last-admin race bypasses", () => {
  assert.throws(() => sqlite.prepare("UPDATE library_items SET visibility='shared' WHERE id=?").run(first.id), /sharing/);
  assert.throws(() => sqlite.prepare("UPDATE library_items SET archived_at='2026-01-01' WHERE id=?").run(first.id), /latest version/);
  assert.throws(() => sqlite.prepare("UPDATE library_users SET role='user' WHERE id=?").run(owner.id), /administrator/);
});
await check("error responses hide internal failures and stay uncached", async () => {
  const response = auth.libraryError(new Error("PRIVATE_STORAGE_KEY_MUST_NOT_LEAK"));
  assert.equal(response.status, 500); assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.ok(!(await response.text()).includes("PRIVATE_STORAGE_KEY"));
});
await check("account quota checks include incoming bytes and inherited version owner", async () => {
  const bytes = sqlite.prepare("SELECT SUM(size) AS bytes FROM library_items WHERE owner_id=?").get(alice.id).bytes;
  const capacity = 250 * 1024 * 1024;
  sqlite.prepare("INSERT INTO library_items (id,symbol,company_name,title,kind,size,currency,owner_id,owner_name,created_at) VALUES ('quota-fixture','QUOTA','Fixture','Quota fixture','attachment',?,'USD',?,'Alice','2025-01-01')").run(capacity - Number(bytes) - 1, alice.id);
  await assert.rejects(store.createLibraryUpload(alice, { symbol: "NEW", currency: "USD", visibility: "private" }, new File([priceCsv], "new.csv")), { status: 413 });
  await assert.rejects(store.createLibraryUpload(owner, { symbol: "TEST", currency: "USD", visibility: "private", parentId: child.id }, new File([priceCsv], "new-version.csv")), { status: 413 });
  assert.throws(() => sqlite.prepare("INSERT INTO library_items (id,symbol,company_name,title,kind,size,currency,owner_id,owner_name,created_at) VALUES ('quota-race','QUOTA','Fixture','Quota race','attachment',2,'USD',?,'Alice','2025-01-01')").run(alice.id), /quota exceeded/);
});
await check("an existing user promoted through the configured owner allowlist persists as admin", async () => {
  globalThis.__libraryEnv.STOCKWISE_ADMIN_EMAILS += ",alice@example.test";
  identity(alice.id, alice.email);
  const configured = await auth.getLibraryUser();
  assert.equal(configured.role, "admin");
  assert.equal(sqlite.prepare("SELECT role FROM library_users WHERE id=?").get(alice.id).role, "admin");
});
sqlite.close();
console.log(`\n${checks} library checks passed.`);
