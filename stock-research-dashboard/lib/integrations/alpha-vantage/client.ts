/** Server-only Alpha Vantage connection and provider response mapping. */
import { serverSetting } from "@/lib/config/server";
import { ResearchError } from "@/lib/research/errors";
import { nullableNumber, record, records, text } from "@/lib/validation/research";
import type { NewsItem, ResearchData, SearchResult } from "@/lib/research/data";

type ProviderRecord = Record<string, unknown>;

async function alpha(fn: string, params: Record<string, string>): Promise<ProviderRecord> {
  const url = new URL("https://www.alphavantage.co/query");
  url.search = new URLSearchParams({ function: fn, ...params, apikey: serverSetting("ALPHA_VANTAGE_API_KEY") }).toString();
  let response: Response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(15_000) }); }
  catch { throw new ResearchError("The market data service did not respond. Please try again shortly.", 504); }
  if (response.status === 429) throw new ResearchError("The market data service's request limit has been reached. Please wait before trying again.", 429);
  if (!response.ok) throw new ResearchError("The market data service is temporarily unavailable.");
  let body: ProviderRecord;
  try { body = record(await response.json()); }
  catch { throw new ResearchError("The market data service returned an unreadable response."); }
  if (body.Note || body.Information) {
    const message = text(body.Note || body.Information);
    throw new ResearchError(/premium|subscription|entitlement/i.test(message)
      ? "This data needs a provider plan or entitlement that is not enabled for the configured key."
      : "The provider could not supply this data. Check your API key and plan, or wait for your request limit to reset.", 429);
  }
  if (body["Error Message"]) throw new ResearchError("The provider could not find data for that ticker.", 404);
  return body;
}

export async function searchAlphaVantageCompanies(query: string): Promise<SearchResult[]> {
  const data = await alpha("SYMBOL_SEARCH", { keywords: query });
  return records(data.bestMatches).slice(0, 8).map((r) => ({ symbol: text(r["1. symbol"]), name: text(r["2. name"]), exchange: text(r["4. region"]) })).filter((r) => r.symbol && r.name);
}

function safeHttps(value: unknown): string {
  try { const url = new URL(text(value)); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : ""; }
  catch { return ""; }
}

function newsDate(value: unknown): string {
  const s = text(value);
  if (/^\d{8}T\d{6}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  return Number.isFinite(Date.parse(s)) ? new Date(s).toISOString() : "";
}

export async function getAlphaVantageResearch(symbol: string): Promise<ResearchData> {
  const first = await Promise.allSettled([alpha("OVERVIEW", { symbol }), alpha("GLOBAL_QUOTE", { symbol })]);
  const overview = first[0].status === "fulfilled" ? first[0].value : {};
  const quote = first[1].status === "fulfilled" ? record(first[1].value["Global Quote"]) : {};
  const warnings: string[] = [];
  if (!overview.Symbol && !quote["01. symbol"]) {
    const failure = first.find((r) => r.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    throw new ResearchError("No company or quote data was found for that ticker.", 404);
  }
  first.forEach((r, i) => { if (r.status === "rejected") warnings.push(`${i === 0 ? "Company details" : "Stock quote"}: ${r.reason instanceof Error ? r.reason.message : "Unavailable"}`); });
  const requests = [
    ["Price history", "TIME_SERIES_DAILY", { symbol, outputsize: "compact" }],
    ["Income statement", "INCOME_STATEMENT", { symbol }],
    ["Balance sheet", "BALANCE_SHEET", { symbol }],
    ["News", "NEWS_SENTIMENT", { tickers: symbol, sort: "LATEST", limit: "6" }],
  ] as const;
  const extra = await Promise.allSettled(requests.map(([, fn, params]) => alpha(fn, params)));
  const [daily, income, balance, news] = extra.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    warnings.push(`${requests[i][0]}: ${r.reason instanceof Error ? r.reason.message : "Unavailable"}`);
    return {};
  });
  const annual = records(income.annualReports);
  const latest = annual[0] ?? {};
  const previous = annual[1] ?? {};
  const annualBalance = records(balance.annualReports);
  const latestBalance = latest.fiscalDateEnding
    ? annualBalance.find((r) => r.fiscalDateEnding === latest.fiscalDateEnding) ?? {}
    : annualBalance[0] ?? {};
  const period = text(latest.fiscalDateEnding || latestBalance.fiscalDateEnding);
  // A quote can succeed even when the overview is unavailable. Do not invent
  // USD for an international stock whose quote currency could not be checked.
  const rawCurrency = text(overview.Currency).toUpperCase();
  const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : "";
  if (!currency) warnings.push("The provider did not supply the quote currency. Price amounts are shown without a currency label; financial amounts are hidden until their currency can be verified.");
  const incomeCurrency = text(latest.reportedCurrency);
  const balanceCurrency = text(latestBalance.reportedCurrency);
  const incomeMatches = Boolean(currency) && (!incomeCurrency || incomeCurrency === currency);
  const balanceMatches = Boolean(currency) && (!balanceCurrency || balanceCurrency === currency);
  if (currency && (!incomeMatches || !balanceMatches)) warnings.push("Some financial figures are hidden because their reporting currency differs from the stock's quoted currency.");
  const series = record(daily["Time Series (Daily)"]);
  const history = Object.entries(series).flatMap(([date, row]) => {
    const close = nullableNumber(record(row)["4. close"]);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && close !== null ? [{ date, close }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (!history.length && !warnings.some((w) => w.startsWith("Price history:"))) warnings.push("Price history is not available for this ticker.");
  if (history.length) warnings.push("The price chart uses unadjusted daily closing prices and may reflect stock splits. Up to 100 recent trading days are available with the compact data endpoint.");
  const feed: NewsItem[] = records(news.feed).flatMap((r, i) => {
    const url = safeHttps(r.url);
    if (!url || !text(r.title)) return [];
    return [{ id: `${symbol}-${i}-${text(r.time_published)}`, title: text(r.title), source: text(r.source) || "News source", url, publishedAt: newsDate(r.time_published), description: text(r.summary), category: text(records(r.topics)[0]?.topic) || "Company news" }];
  });
  if (!feed.length && !warnings.some((w) => w.startsWith("News:"))) warnings.push("No recent news was returned for this ticker.");
  return {
    company: { symbol, name: text(overview.Name) || symbol, industry: text(overview.Industry) || "Industry unavailable", description: text(overview.Description) || "A company description is not available from this provider.", exchange: text(overview.Exchange) || "Exchange unavailable", currency, website: safeHttps(overview.OfficialSite), logoColor: "#3c7e67", mark: symbol.slice(0, 1) },
    quote: { price: nullableNumber(quote["05. price"]), change: nullableNumber(quote["09. change"]), changePercent: nullableNumber(quote["10. change percent"]), asOf: text(quote["07. latest trading day"]) || "Unavailable", open: nullableNumber(quote["02. open"]), high: nullableNumber(quote["03. high"]), low: nullableNumber(quote["04. low"]), previousClose: nullableNumber(quote["08. previous close"]), volume: nullableNumber(quote["06. volume"]), marketCap: nullableNumber(overview.MarketCapitalization), peRatio: nullableNumber(overview.PERatio), week52High: nullableNumber(overview["52WeekHigh"]), week52Low: nullableNumber(overview["52WeekLow"]) },
    history,
    financials: { period: period ? `Year ended ${period}` : "Reporting period unavailable", revenue: incomeMatches ? nullableNumber(latest.totalRevenue) : null, netIncome: incomeMatches ? nullableNumber(latest.netIncome) : null, assets: balanceMatches ? nullableNumber(latestBalance.totalAssets) : null, liabilities: balanceMatches ? nullableNumber(latestBalance.totalLiabilities) : null, previousRevenue: incomeMatches && (!previous.reportedCurrency || previous.reportedCurrency === currency) ? nullableNumber(previous.totalRevenue) : null, previousNetIncome: incomeMatches && (!previous.reportedCurrency || previous.reportedCurrency === currency) ? nullableNumber(previous.netIncome) : null },
    news: feed,
    mode: "live" as const,
    warnings: ["Latest available provider data; quotes may be delayed or end-of-day, depending on your plan. This is not a real-time market feed.", ...warnings],
  };
}
