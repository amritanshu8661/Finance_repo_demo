import assert from "node:assert/strict";
import { build } from "esbuild";

const bundled = await build({
  entryPoints: ["lib/validation/research-request.ts"], bundle: true, platform: "node", format: "esm", write: false,
  plugins: [{ name: "test-identity", setup(plugin) {
    plugin.onResolve({ filter: /^@\/lib\/integrations\/sites\/auth$/ }, () => ({ path: "identity", namespace: "identity" }));
    plugin.onLoad({ filter: /.*/, namespace: "identity" }, () => ({ contents: "export async function getChatGPTUser(){ return globalThis.__researchTestUser || null; }", loader: "js" }));
  } }],
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
const saved = process.env.ALPHA_VANTAGE_API_KEY;
const request = (body, headers = {}) => new Request("https://stockwise.test/api/summarize", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://stockwise.test", ...headers }, body,
});
try {
  delete process.env.ALPHA_VANTAGE_API_KEY;
  assert.deepEqual(await api.readSummaryBody(request('{"symbol":"AAPL","news":[{"id":"1"}]}')), { symbol: "AAPL", news: [{ id: "1" }] });
  console.log("PASS valid bounded summary requests are accepted");
  for (const raw of ["null", "[]", "not json"]) await assert.rejects(api.readSummaryBody(request(raw)), { status: 400 });
  console.log("PASS malformed summary JSON is rejected");
  await assert.rejects(api.readSummaryBody(request("{}", { "Content-Length": "25001" })), { status: 413 });
  await assert.rejects(api.readSummaryBody(request(JSON.stringify({ text: "€".repeat(9000) }))), { status: 413 });
  console.log("PASS declared and actual UTF-8 byte limits are enforced");
  await assert.rejects(api.authorizeResearch(request("{}", { Origin: "https://another.test" }), true), { status: 403 });
  const noOrigin = request("{}"); noOrigin.headers.delete("Origin");
  await assert.rejects(api.authorizeResearch(noOrigin, true), { status: 403 });
  console.log("PASS cross-origin and missing-origin mutations are rejected");
  await api.authorizeResearch(request("{}"), true);
  process.env.ALPHA_VANTAGE_API_KEY = "unit-test-placeholder";
  await assert.rejects(api.authorizeResearch(request("{}")), { status: 401 });
  globalThis.__researchTestUser = { userId: "test-user", email: "user@example.test" };
  await api.authorizeResearch(request("{}"), true);
  console.log("PASS connected services require a trusted signed-in identity");
  console.log("5 research request security checks passed.");
} finally {
  delete globalThis.__researchTestUser;
  if (saved === undefined) delete process.env.ALPHA_VANTAGE_API_KEY; else process.env.ALPHA_VANTAGE_API_KEY = saved;
}
