/** Shared display types and deliberately fictional data for the learning workspace. */
export interface Company {
  symbol: string;
  name: string;
  industry: string;
  description: string;
  exchange: string;
  currency: string;
  website: string;
  logoColor: string;
  mark: string;
}

export interface Quote {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  asOf: string;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  week52High: number | null;
  week52Low: number | null;
}

export interface HistoryPoint { date: string; close: number }

export interface Financials {
  period: string;
  revenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  previousRevenue: number | null;
  previousNetIncome: number | null;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  category: string;
}

export interface ResearchData {
  company: Company;
  quote: Quote;
  history: HistoryPoint[];
  financials: Financials;
  news: NewsItem[];
  mode: "demo" | "live";
  warnings: string[];
}

export interface SearchResult { symbol: string; name: string; exchange: string }

export interface NewsSummary {
  summary: string;
  implications: string[];
  caveat: string;
  mode: "ai" | "demo";
}

// These prices, financials, histories and headlines are invented examples.
// They are not a historical snapshot, current market data or factual news reports.
const fixtures = [
  {
    symbol: "AAPL", name: "Apple Inc.", industry: "Consumer electronics", mark: "A", logoColor: "#25282b",
    website: "https://www.apple.com", newsroom: "https://www.apple.com/newsroom/",
    description: "Apple designs consumer electronics, including the iPhone and Mac, and offers software and digital services. Its business connects devices, apps, and services in one ecosystem.",
    price: 237.49, change: 3.21, marketCap: 3.58e12, peRatio: 35.8, revenue: 394.3e9, netIncome: 96.9e9, assets: 364.9e9, liabilities: 303.4e9, previousRevenue: 378.7e9, previousNetIncome: 91.2e9,
    headlines: ["Example: Apple expands its services offering", "Example: A closer look at Apple's product roadmap", "Example: What a change in supply costs could mean"],
    descriptions: ["In this fictional news example, Apple introduces a new services offering for its device users. No actual announcement is represented.", "This fictional article explores how a future product refresh might affect customer demand. It does not describe an actual product announcement.", "This learning example considers a possible increase in component costs and its effect on profit margins. It is not a factual news report."],
  },
  {
    symbol: "MSFT", name: "Microsoft Corporation", industry: "Software & cloud services", mark: "M", logoColor: "#156da4",
    website: "https://www.microsoft.com", newsroom: "https://news.microsoft.com/",
    description: "Microsoft develops software and cloud services, including Windows, Microsoft 365, and Azure. It also builds business applications, gaming products, and developer tools.",
    price: 428.76, change: 4.82, marketCap: 3.19e12, peRatio: 36.4, revenue: 252.4e9, netIncome: 91.2e9, assets: 512.6e9, liabilities: 245.8e9, previousRevenue: 228.1e9, previousNetIncome: 82.6e9,
    headlines: ["Example: Microsoft adds tools for cloud customers", "Example: Enterprise software demand in focus", "Example: Understanding data center investment"],
    descriptions: ["This fictional example describes a new set of cloud tools and how they might help business customers. It is not an actual announcement.", "This fictional report explores a possible shift in business software spending. No real survey or earnings result is represented.", "This fictional learning article examines how building data centers could increase capacity and near-term costs."],
  },
  {
    symbol: "NVDA", name: "NVIDIA Corporation", industry: "Semiconductors", mark: "N", logoColor: "#699c1f",
    website: "https://www.nvidia.com", newsroom: "https://nvidianews.nvidia.com/",
    description: "NVIDIA designs graphics processors and computing platforms used in gaming, data centers, artificial intelligence, and professional visualization.",
    price: 142.87, change: 3.46, marketCap: 3.49e12, peRatio: 51.6, revenue: 132.7e9, netIncome: 73.1e9, assets: 118.4e9, liabilities: 34.9e9, previousRevenue: 96.8e9, previousNetIncome: 48.3e9,
    headlines: ["Example: NVIDIA introduces a computing platform", "Example: AI infrastructure spending explained", "Example: Chip supply remains a research question"],
    descriptions: ["In this invented news example, NVIDIA previews a computing platform. It is not a real launch or announcement.", "This fictional article explores how a hypothetical increase in AI infrastructure budgets might influence chip demand.", "This learning example looks at how production capacity and delivery times can affect a semiconductor business."],
  },
  {
    symbol: "TSLA", name: "Tesla, Inc.", industry: "Automotive & clean energy", mark: "T", logoColor: "#ca3844",
    website: "https://www.tesla.com", newsroom: "https://ir.tesla.com/",
    description: "Tesla designs and sells electric vehicles, energy storage systems, and solar products. Its business also includes charging infrastructure and related software.",
    price: 328.50, change: -5.68, marketCap: 1.06e12, peRatio: 78.1, revenue: 99.8e9, netIncome: 8.9e9, assets: 126.5e9, liabilities: 52.3e9, previousRevenue: 95.4e9, previousNetIncome: 10.2e9,
    headlines: ["Example: Tesla expands its energy storage lineup", "Example: Vehicle pricing and margins in focus", "Example: A look at charging network growth"],
    descriptions: ["This fictional report describes an imagined energy storage product. It does not represent a real company announcement.", "This learning example explores the possible relationship between lower vehicle prices, demand, and profit per vehicle.", "This fictional article considers how a larger charging network could influence customer experience and operating costs."],
  },
  {
    symbol: "GOOGL", name: "Alphabet Inc.", industry: "Internet & digital advertising", mark: "G", logoColor: "#4276dd",
    website: "https://abc.xyz", newsroom: "https://blog.google/",
    description: "Alphabet is Google's parent company. Its businesses include search, digital advertising, YouTube, cloud services, and other technology ventures.",
    price: 192.34, change: 1.87, marketCap: 2.35e12, peRatio: 24.7, revenue: 352.6e9, netIncome: 105.8e9, assets: 462.7e9, liabilities: 132.4e9, previousRevenue: 318.4e9, previousNetIncome: 88.6e9,
    headlines: ["Example: Google develops new search experiences", "Example: Cloud services demand under the lens", "Example: Digital advertising trends explained"],
    descriptions: ["This fictional example discusses an imagined search feature and possible changes to user behavior. No actual announcement is represented.", "This fictional report explores how a hypothetical shift in business cloud spending might affect revenue.", "This learning article considers how advertiser budgets and user engagement may affect an advertising business."],
  },
];

function illustrativeHistory(price: number, seed: number): HistoryPoint[] {
  const dates: string[] = [];
  const end = Date.UTC(2026, 10, 13);
  for (let t = Date.UTC(2025, 10, 17); t <= end; t += 86_400_000) {
    const d = new Date(t);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) dates.push(d.toISOString().slice(0, 10));
  }
  const lastWave = Math.sin((dates.length - 1) * 0.16 + seed) * 0.025 + Math.cos((dates.length - 1) * 0.48) * 0.009;
  return dates.map((date, i) => ({
    date,
    close: Math.round(price * (0.77 + (i / (dates.length - 1)) * 0.23 + Math.sin(i * 0.16 + seed) * 0.025 + Math.cos(i * 0.48) * 0.009 - lastWave) * 100) / 100,
  }));
}

export const DEMO_SYMBOLS: string[] = fixtures.map((f) => f.symbol);

export const DEMO_DATA: Record<string, ResearchData> = Object.fromEntries(fixtures.map((f, index) => [f.symbol, {
  company: { symbol: f.symbol, name: f.name, industry: f.industry, description: f.description, exchange: "NASDAQ", currency: "USD", website: f.website, logoColor: f.logoColor, mark: f.mark },
  quote: {
    price: f.price, change: f.change, changePercent: Math.round(f.change / (f.price - f.change) * 10000) / 100,
    asOf: "2026-11-13", open: Math.round((f.price - f.change * 0.8) * 100) / 100,
    high: Math.round(f.price * 1.008 * 100) / 100, low: Math.round(f.price * 0.978 * 100) / 100,
    previousClose: Math.round((f.price - f.change) * 100) / 100, volume: (42 + index * 12) * 1e6,
    marketCap: f.marketCap, peRatio: f.peRatio, week52High: Math.round(f.price * 1.09 * 100) / 100, week52Low: Math.round(f.price * 0.68 * 100) / 100,
  },
  history: illustrativeHistory(f.price, index + 1),
  financials: { period: "Illustrative annual figures", revenue: f.revenue, netIncome: f.netIncome, assets: f.assets, liabilities: f.liabilities, previousRevenue: f.previousRevenue, previousNetIncome: f.previousNetIncome },
  news: f.headlines.map((title, i) => ({ id: `${f.symbol}-example-${i}`, title, source: "Example news", url: f.newsroom, publishedAt: `2026-11-${13 - i}T12:00:00Z`, description: f.descriptions[i], category: ["Company update", "Industry outlook", "Research notes"][i] })),
  mode: "demo" as const,
  warnings: ["Demo workspace: prices, financial figures, charts, and news are illustrative examples, not current or historical market data. Example news links open the company's newsroom, not a corresponding article."],
}]));

export function getDemoResearch(symbol: string): ResearchData | undefined {
  return DEMO_DATA[symbol.toUpperCase()];
}

export function getDemoSummary(symbol: string): NewsSummary {
  const data = getDemoResearch(symbol);
  return {
    summary: `These fictional ${data?.company.name ?? symbol} headlines illustrate three research themes: new offerings, customer demand, and operating costs. Read the original source material when working with real news; a headline alone rarely tells the whole story.`,
    implications: [
      "A new offering could support revenue growth, but adoption and pricing would need to be checked.",
      "Customer demand may affect sales; compare news with the company's actual financial reports.",
      "Higher operating or supply costs could reduce profits even when revenue grows.",
    ],
    caveat: "This is a written sample explanation of fictional news, not an AI-generated result. It is for learning and is not a prediction or personalized investment advice.",
    mode: "demo",
  };
}
