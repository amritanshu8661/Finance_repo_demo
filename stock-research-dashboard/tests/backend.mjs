/** Run with: node tests/backend.mjs. No network calls or API keys are needed. */
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({ entryPoints: ["services/research.ts"], bundle: true, platform: "node", format: "esm", write: false });
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const dataBundle = await build({ entryPoints: ["lib/research/data.ts"], bundle: true, platform: "node", format: "esm", write: false });
const data = await import(`data:text/javascript;base64,${Buffer.from(dataBundle.outputFiles[0].text).toString("base64")}`);
const originalFetch = globalThis.fetch;
const saved = Object.fromEntries(["ALPHA_VANTAGE_API_KEY", "GEMINI_API_KEY", "GEMINI_MODEL"].map((k) => [k, process.env[k]]));
let checks = 0;
function check(label, run) {
  return Promise.resolve().then(run).then(() => { checks++; console.log(`PASS ${label}`); });
}

try {
  delete process.env.ALPHA_VANTAGE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;

  await check("demo fixtures are explicit, complete, chronological, and coherent", () => {
    assert.equal(data.DEMO_SYMBOLS.length, 5);
    for (const symbol of data.DEMO_SYMBOLS) {
      const d = data.getDemoResearch(symbol);
      assert.equal(d.mode, "demo");
      assert.match(d.warnings.join(" "), /illustrative/);
      assert.equal(d.history.at(-1).close, d.quote.price);
      assert.ok(d.history.length > 250);
      assert.ok(d.history.every((p, i) => i === 0 || p.date > d.history[i - 1].date));
      assert.ok(d.news.every((n) => n.source === "Example news" && n.title.startsWith("Example:")));
    }
  });
  await check("ticker validation rejects malformed requests", () => {
    assert.equal(api.validateSymbol(" aapl "), "AAPL");
    assert.equal(api.validateSymbol("reliance.bse"), "RELIANCE.BSE");
    for (const input of [null, "", "a/b", "a?key=secret", "x".repeat(30)]) assert.throws(() => api.validateSymbol(input), { status: 400 });
  });
  await check("missing provider figures remain missing rather than zero", () => {
    for (const input of [null, undefined, "", "  ", "None", "NaN", false]) assert.equal(api.nullableNumber(input), null);
    assert.equal(api.nullableNumber("0"), 0);
    assert.equal(api.nullableNumber("-12.4"), -12.4);
    assert.equal(api.nullableNumber("1.23%"), 1.23);
  });
  await check("demo search and unavailable ticker errors", async () => {
    assert.deepEqual(api.providerStatus(), { marketConnected: false, aiConnected: false });
    assert.equal((await api.searchCompanies("apple"))[0].symbol, "AAPL");
    assert.equal((await api.searchCompanies("   ")).length, 0);
    await assert.rejects(api.getResearch("UNLISTED"), { status: 404 });
  });
  await check("demo summary is a written sample, even if AI is configured", async () => {
    process.env.GEMINI_API_KEY = "test-placeholder";
    globalThis.fetch = () => { throw new Error("Demo mode must not call an AI service"); };
    const summary = await api.summarizeNews("AAPL", data.DEMO_DATA.AAPL.news);
    assert.equal(summary.mode, "demo");
    assert.match(summary.caveat, /not an AI-generated result/);
    delete process.env.GEMINI_API_KEY;
  });

  process.env.ALPHA_VANTAGE_API_KEY = "test-placeholder";
  const requests = [];
  const responseFor = (fn, symbol) => {
    if (symbol === "QUOTA") return { Information: "API request limit reached" };
    if (fn === "OVERVIEW") return { Symbol: symbol, Name: "Test Company", Currency: symbol === "UNKNOWNCURRENCY" ? "" : "USD", Industry: "Software", Exchange: "NASDAQ", Description: "A test fixture.", OfficialSite: "javascript:alert(1)", MarketCapitalization: "1000000", PERatio: "None" };
    if (fn === "GLOBAL_QUOTE") return { "Global Quote": { "01. symbol": symbol, "05. price": "105.25", "09. change": "5.25", "10. change percent": "5.25%", "07. latest trading day": "2026-11-13" } };
    if (fn === "TIME_SERIES_DAILY") return symbol === "PARTIAL" ? { Information: "API request limit reached" } : { "Time Series (Daily)": { "2026-11-13": { "4. close": "105.25" }, "2026-11-12": { "4. close": "100" }, bad: { "4. close": "None" } } };
    if (fn === "INCOME_STATEMENT") return { annualReports: [{ fiscalDateEnding: "2025-12-31", reportedCurrency: "USD", totalRevenue: "1000", netIncome: "120" }, { fiscalDateEnding: "2024-12-31", reportedCurrency: "USD", totalRevenue: "900", netIncome: "100" }] };
    if (fn === "BALANCE_SHEET") return { annualReports: [{ fiscalDateEnding: "2026-06-30", totalAssets: "9999", totalLiabilities: "9999" }, { fiscalDateEnding: "2025-12-31", reportedCurrency: "USD", totalAssets: "3000", totalLiabilities: "2000" }] };
    if (fn === "NEWS_SENTIMENT") return { feed: [{ title: "A test headline", url: "https://example.com/news", source: "Test source", time_published: "20261113T120000", summary: "A factual-looking test description.", topics: [{ topic: "Technology" }] }, { title: "Unsafe link", url: "javascript:alert(1)" }] };
    if (fn === "SYMBOL_SEARCH") return { bestMatches: [{ "1. symbol": "TEST", "2. name": "Test Company", "4. region": "United States" }] };
    throw new Error(`Unexpected provider function ${fn}`);
  };
  globalThis.fetch = async (url) => {
    const u = new URL(url);
    const fn = u.searchParams.get("function");
    const symbol = u.searchParams.get("symbol") ?? u.searchParams.get("tickers");
    requests.push({ fn, symbol });
    return Response.json(responseFor(fn, symbol));
  };
  let live;
  await check("live mapping preserves reporting period and filters unsafe links", async () => {
    live = await api.getResearch("TEST");
    assert.equal(live.mode, "live");
    assert.equal(live.quote.price, 105.25);
    assert.equal(live.quote.peRatio, null);
    assert.equal(live.financials.assets, 3000);
    assert.equal(live.financials.previousRevenue, 900);
    assert.equal(live.company.website, "");
    assert.deepEqual(live.history.map((p) => p.date), ["2026-11-12", "2026-11-13"]);
    assert.equal(live.news.length, 1);
    assert.equal(live.news[0].publishedAt, "2026-11-13T12:00:00Z");
    assert.ok(live.warnings.some((w) => w.includes("unadjusted")));
    assert.equal(requests.length, 6);
  });
  await check("cached company lookup avoids repeated API consumption", async () => {
    const before = requests.length;
    const again = await api.getResearch("TEST");
    assert.equal(again.company.symbol, "TEST");
    assert.equal(requests.length, before);
  });
  await check("provider limits never silently switch to demonstration prices", async () => {
    await assert.rejects(api.getResearch("QUOTA"), { status: 429 });
  });
  await check("partial provider failure is shown as missing data with an explanation", async () => {
    const partial = await api.getResearch("PARTIAL");
    assert.equal(partial.mode, "live");
    assert.equal(partial.history.length, 0);
    assert.ok(partial.warnings.some((w) => w.startsWith("Price history:")));
    assert.equal(partial.quote.price, 105.25);
  });
  await check("missing currency is never silently labelled as USD", async () => {
    const unknown = await api.getResearch("UNKNOWNCURRENCY");
    assert.equal(unknown.company.currency, "");
    assert.equal(unknown.quote.price, 105.25);
    assert.equal(unknown.financials.revenue, null);
    assert.ok(unknown.warnings.some((w) => w.includes("quote currency")));
  });
  await check("AI without an API key returns a useful setup error", async () => {
    await assert.rejects(api.summarizeNews("TEST", live.news), { status: 503 });
  });
  await check("AI receives provider text, never substituted client article text", async () => {
    process.env.GEMINI_API_KEY = "test-placeholder";
    let sent;
    globalThis.fetch = async (_url, init) => {
      sent = JSON.parse(init.body);
      assert.equal(init.headers["x-goog-api-key"], "test-placeholder");
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: "A sample AI explanation.", implications: ["Demand could change."], caveat: "Check the source and its context." }) }] } }] });
    };
    const summary = await api.summarizeNews("TEST", [{ ...live.news[0], description: "CLIENT_TEXT_MUST_NOT_REACH_MODEL" }]);
    assert.equal(summary.mode, "ai");
    assert.equal(summary.summary, "A sample AI explanation.");
    assert.ok(!JSON.stringify(sent).includes("CLIENT_TEXT_MUST_NOT_REACH_MODEL"));
    assert.ok(JSON.stringify(sent).includes("A factual-looking test description."));
  });
  await check("summary input limits and error responses are safe", async () => {
    await assert.rejects(api.summarizeNews("TEST", []), { status: 400 });
    await assert.rejects(api.summarizeNews("TEST", Array(9).fill({})), { status: 400 });
    const error = api.apiError(new Error("secret-key-must-not-leak"));
    assert.equal(error.status, 500);
    assert.ok(!(await error.text()).includes("secret-key"));
  });
  console.log(`\n${checks} backend checks passed.`);
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
