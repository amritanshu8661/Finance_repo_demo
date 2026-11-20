/** Server-only research business logic. Frontend calls the app/api routes. */
import { DEMO_DATA, getDemoResearch, getDemoSummary, type NewsSummary, type ResearchData, type SearchResult } from "@/lib/research/data";
import { serverSetting } from "@/lib/config/server";
import { ResearchError } from "@/lib/research/errors";
import { record, text, validateSymbol } from "@/lib/validation/research";
import { getAlphaVantageResearch, searchAlphaVantageCompanies } from "@/lib/integrations/alpha-vantage/client";
import { geminiConfig, generateGeminiSummary } from "@/lib/integrations/gemini/client";

export { ResearchError, apiError } from "@/lib/research/errors";
export { validateSymbol, nullableNumber } from "@/lib/validation/research";

export function providerStatus() {
  return { marketConnected: Boolean(serverSetting("ALPHA_VANTAGE_API_KEY")), aiConnected: Boolean(serverSetting("GEMINI_API_KEY")) };
}

const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, ttl: number, build: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const task = build().then((value) => {
    if (cache.size > 100) cache.delete(cache.keys().next().value as string);
    cache.set(key, { expires: Date.now() + ttl, value });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}

export async function searchCompanies(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length > 80) throw new ResearchError("Keep company searches under 80 characters.", 400);
  if (!q) return [];
  if (!providerStatus().marketConnected) return Object.values(DEMO_DATA)
    .filter((d) => `${d.company.symbol} ${d.company.name}`.toLowerCase().includes(q.toLowerCase()))
    .map(({ company: c }) => ({ symbol: c.symbol, name: c.name, exchange: c.exchange }));
  return cached(`search:${q.toLowerCase()}`, 60 * 60_000, () => searchAlphaVantageCompanies(q));
}

export async function getResearch(rawSymbol: unknown): Promise<ResearchData> {
  const symbol = validateSymbol(rawSymbol);
  if (!providerStatus().marketConnected) {
    const demo = getDemoResearch(symbol);
    if (!demo) throw new ResearchError("This demo includes AAPL, MSFT, NVDA, TSLA, and GOOGL. A market data connection is needed for other companies.", 404);
    return demo;
  }
  return cached(`research:${symbol}`, 10 * 60_000, () => getAlphaVantageResearch(symbol));
}

export async function summarizeNews(rawSymbol: unknown, rawNews: unknown): Promise<NewsSummary> {
  const symbol = validateSymbol(rawSymbol);
  if (!Array.isArray(rawNews) || rawNews.length === 0) throw new ResearchError("There are no news articles to summarize yet.", 400);
  if (rawNews.length > 8) throw new ResearchError("Summarize up to eight articles at a time.", 400);
  // Never send client-supplied article text to the model. Use this server's
  // provider response so a request cannot substitute arbitrary external text.
  const research = await getResearch(symbol);
  if (research.mode === "demo") return getDemoSummary(symbol);
  const selectedIds = new Set(rawNews.map((n) => text(record(n).id)));
  const articles = research.news.filter((n) => selectedIds.has(n.id)).slice(0, 6);
  if (!articles.length) throw new ResearchError("Refresh the news before requesting a summary.", 400);
  const config = geminiConfig();
  const cacheKey = `summary:${symbol}:${articles.map((a) => a.id).join("|")}`;
  return cached(cacheKey, 30 * 60_000, () => generateGeminiSummary(research.company.name, symbol, articles, config));
}
