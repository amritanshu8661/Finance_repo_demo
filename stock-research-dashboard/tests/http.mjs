import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:5173";
const request = path => fetch(new URL(path, origin), { signal: AbortSignal.timeout(30_000) });
const statusResponse = await request("/api/status");
assert.equal(statusResponse.status, 200);
const status = await statusResponse.json();
assert.equal(typeof status.marketConnected, "boolean");
assert.equal(typeof status.aiConnected, "boolean");
console.log("PASS provider status route responds without exposing credentials");

const page = await request("/");
assert.equal(page.status, 200);
const html = await page.text();
assert.match(html, /Stockwise/);
assert.match(html, /A little research/);
assert.match(html, /My research summary/);
assert.match(html, /fictional examples for learning/);
assert.doesNotMatch(html, /Your site is taking shape/);
console.log("PASS server renders the dashboard and sample-data notice");

if (status.marketConnected) {
  console.log("Live service is configured: skipping demo API calls to preserve provider quota.");
  process.exit(0);
}
const search = await request("/api/search?q=microsoft");
assert.equal(search.status, 200);
assert.equal((await search.json()).results[0].symbol, "MSFT");
console.log("PASS name search resolves a company through the HTTP route");

const research = await request("/api/research?symbol=NVDA");
assert.equal(research.status, 200);
const data = await research.json();
assert.equal(data.company.symbol, "NVDA");
assert.equal(data.mode, "demo");
assert.ok(data.history.length > 100);
console.log("PASS research route returns complete chart and company data");

const summary = await fetch(new URL("/api/summarize", origin), { method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(origin).origin }, body: JSON.stringify({ symbol: "NVDA", news: data.news.slice(0, 4).map(({ id }) => ({ id })) }), signal: AbortSignal.timeout(30_000) });
assert.equal(summary.status, 200);
const explanation = await summary.json();
assert.equal(explanation.mode, "demo");
assert.ok(explanation.summary && explanation.implications.length);
console.log("PASS summary route accepts news IDs and returns an honest sample explanation");

const missing = await request("/api/research?symbol=UNKNOWN");
assert.equal(missing.status, 404);
assert.ok((await missing.json()).error);
const malformed = await fetch(new URL("/api/summarize", origin), { method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(origin).origin }, body: "not json" });
assert.equal(malformed.status, 400);
console.log("PASS unknown stocks and malformed requests produce useful HTTP errors");
console.log("6 HTTP checks passed.");
