"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Building2, Check, ChevronDown, CircleHelp, Database, DollarSign, Download, FileText, Globe, LayoutDashboard, Lightbulb, Loader2, PencilLine, Plus, Search, ShieldCheck, Sparkles, Star, TrendingUp, Wallet, X } from "lucide-react";
import "./workspace-shell.css";
import { DEMO_DATA, DEMO_SYMBOLS, type ResearchData, type SearchResult, type HistoryPoint } from "@/lib/research/data";

type DashboardUser = { id: string; displayName: string; email: string; role: "admin" | "user" };
type View = "overview" | "watchlist" | "notes";
type Range = "1M" | "3M" | "6M" | "1Y" | "ALL";
type Note = { text: string; updatedAt: string; company: string };
type Insight = { summary: string; implications: string[]; caveat: string; mode: "ai" | "demo" };
const NOTE_KEY = "stockwise-notes-v1", WATCH_KEY = "stockwise-watchlist-v1";

function money(value: number | null, currency = "USD", decimals = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value); }
  catch { return `${currency} ${value.toFixed(decimals)}`; }
}
function compact(value: number | null, currency?: string) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${currency ? currency === "USD" ? "$" : `${currency} ` : ""}${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}
function signed(value: number | null, suffix = "") { return value === null || !Number.isFinite(value) ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}${suffix}`; }
function dateLabel(value: string, long = false) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: long ? "long" : "short", day: "numeric", ...(long ? { year: "numeric" } : {}), timeZone: "UTC" });
}
function safeUrl(value: string): string | undefined {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "The service couldn’t complete this request. Please try again.";
    throw new Error(message);
  }
  return payload as T;
}
function Sparkline({ history, positive = true }: { history: HistoryPoint[]; positive?: boolean }) {
  if (!history.length) return <span className="sparkline" />;
  const values = history.slice(-25), min = Math.min(...values.map(p => p.close)), max = Math.max(...values.map(p => p.close));
  const points = values.map((p, i) => `${3 + i / Math.max(values.length - 1, 1) * 70},${3 + (max - p.close) / (max - min || 1) * 22}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 76 28" aria-hidden="true"><polyline points={points} fill="none" stroke={positive ? "#29846b" : "#d57871"} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

function PriceChart({ history, range, symbol, currency, mode }: { history: HistoryPoint[]; range: Range; symbol: string; currency: string; mode: "live" | "demo" }) {
  const [hover, setHover] = useState<number | null>(null);
  const visible = useMemo(() => {
    if (!history.length || range === "ALL") return history;
    const cutoff = new Date(history[history.length - 1].date);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - ({ "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[range]));
    const result = history.filter(p => new Date(p.date) >= cutoff);
    return result.length >= 2 ? result : history;
  }, [history, range]);
  useEffect(() => setHover(null), [range, symbol]);
  if (visible.length < 2) return <div className="empty-state"><BarChart3 size={26} /><p>Price history is unavailable for this company.</p></div>;
  const width = 760, height = 238, left = 8, right = 690, top = 18, bottom = 206;
  const prices = visible.map(p => p.close), low = Math.min(...prices), high = Math.max(...prices), span = high - low || Math.max(high * .06, 1);
  const min = Math.max(0, low - span * .12), max = high + span * .15;
  const coords = visible.map((p, i) => ({ ...p, x: left + i / (visible.length - 1) * (right - left), y: bottom - (p.close - min) / (max - min || 1) * (bottom - top) }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const point = hover === null ? null : coords[Math.min(hover, coords.length - 1)], last = coords[coords.length - 1];
  const color = prices[prices.length - 1] >= prices[0] ? "#268265" : "#c36c63", chartId = `chart-${symbol}`;
  return <div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={`${mode === "demo" ? "Illustrative" : "Historical"} closing prices for ${symbol}, ${range}. ${money(prices[0], currency)} to ${money(prices[prices.length - 1], currency)}.`} onPointerLeave={() => setHover(null)} onPointerMove={event => {
    const bounds = event.currentTarget.getBoundingClientRect(), x = (event.clientX - bounds.left) / bounds.width * width;
    setHover(Math.max(0, Math.min(coords.length - 1, Math.round((x - left) / (right - left) * (coords.length - 1)))));
  }}><defs><linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".16" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3, 4].map(i => { const y = top + i / 4 * (bottom - top); return <g key={i}><line x1={left} x2={right} y1={y} y2={y} stroke="#eaf0ed" strokeDasharray="3 5" /><text x="711" y={y + 4} fontSize="11" fill="#8b9691" fontFamily="inherit">{(max - i / 4 * (max - min)).toFixed(high > 1000 ? 0 : 2)}</text></g>; })}
    <path d={`${path} L${last.x},${bottom} L${left},${bottom} Z`} fill={`url(#${chartId})`} /><path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" /><circle cx={last.x} cy={last.y} r="4" fill={color} stroke="white" strokeWidth="2" />
    {[0, .2, .4, .6, .8, 1].map(f => { const p = coords[Math.round(f * (coords.length - 1))]; return <text key={f} x={p.x} y="233" textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} fontSize="11" fill="#8b9691" fontFamily="inherit">{dateLabel(p.date)}</text>; })}
    {point && <g><line x1={point.x} x2={point.x} y1={top} y2={bottom} stroke="#92b4a6" strokeDasharray="4 4" /><circle cx={point.x} cy={point.y} r="5" fill={color} stroke="white" strokeWidth="2" /><g transform={`translate(${Math.max(8, Math.min(point.x - 63, 557))},${Math.max(5, point.y - 56)})`}><rect width="128" height="43" rx="7" fill="#233b32" /><text x="64" y="17" textAnchor="middle" fontSize="12" fill="white" fontWeight="600">{money(point.close, currency)}</text><text x="64" y="33" textAnchor="middle" fontSize="10" fill="#c7d9cf">{dateLabel(point.date, true)}</text></g></g>}
  </svg></div>;
}

export default function Dashboard() {
  const [data, setData] = useState<ResearchData>(DEMO_DATA.AAPL), [view, setView] = useState<View>("overview"), [range, setRange] = useState<Range>("6M");
  const [query, setQuery] = useState(""), [searchOpen, setSearchOpen] = useState(false), [searchResults, setSearchResults] = useState<SearchResult[]>([]), [searchBusy, setSearchBusy] = useState(false), [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false), [error, setError] = useState(""), [toast, setToast] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>(["AAPL", "MSFT", "NVDA"]), [notes, setNotes] = useState<Record<string, Note>>({}), [storageReady, setStorageReady] = useState(false), [storageAvailable, setStorageAvailable] = useState(true);
  const [sessionUser, setSessionUser] = useState<DashboardUser | null>(null);
  const [storageNamespace, setStorageNamespace] = useState<string | null>(null);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null), [summaryBusy, setSummaryBusy] = useState(false), [summaryError, setSummaryError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false), [glossaryOpen, setGlossaryOpen] = useState(false), [status, setStatus] = useState({ marketConnected: false, aiConnected: false });
  const [knownCompanies, setKnownCompanies] = useState<Record<string, ResearchData>>(DEMO_DATA);
  const searchRef = useRef<HTMLInputElement>(null), searchWrapRef = useRef<HTMLDivElement>(null), summaryRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null), insightRequestRef = useRef<AbortController | null>(null);
  const company = data.company, quote = data.quote, financials = data.financials, isPositive = (quote.changePercent ?? 0) >= 0;
  const selectedNote = notes[company.symbol]?.text || "", noteCount = Object.values(notes).filter(n => n.text.trim()).length;

  const loadCompany = useCallback(async (symbol: string) => {
    requestRef.current?.abort(); insightRequestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setLoading(true); setError(""); setSearchOpen(false); setQuery(""); setView("overview"); setInsight(null); setSummaryError(""); setSummaryBusy(false);
    try {
      const payload = await fetchJson<ResearchData>(`/api/research?symbol=${encodeURIComponent(symbol)}`, { signal: controller.signal });
      if (controller.signal.aborted) return false;
      setData(payload); setKnownCompanies(current => ({ ...current, [payload.company.symbol]: payload }));
      return true;
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "We couldn’t load company information."); return false; }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    fetchJson<{ user: DashboardUser | null }>("/api/me").then(({ user }) => {
      if (!active) return;
      setSessionUser(user);
      if (!user) { setStorageAvailable(false); return; }
      const prefix = `stockwise-account:${user.id}:`;
      setStorageNamespace(prefix);
      try {
        setHasLegacyData(!localStorage.getItem(prefix + "legacy-imported") && Boolean(localStorage.getItem(NOTE_KEY) || localStorage.getItem(WATCH_KEY)));
        const savedNotes = JSON.parse(localStorage.getItem(prefix + NOTE_KEY) || "{}");
        if (savedNotes && typeof savedNotes === "object" && !Array.isArray(savedNotes)) {
          const validated: Record<string, Note> = {};
          Object.entries(savedNotes).forEach(([symbol, value]) => {
            const note = value as Note;
            if (/^[A-Z0-9.^:-]{1,25}$/.test(symbol) && note && typeof note.text === "string" && typeof note.company === "string" && typeof note.updatedAt === "string") validated[symbol] = note;
          });
          setNotes(validated);
        }
        const savedWatchlist = JSON.parse(localStorage.getItem(prefix + WATCH_KEY) || "null");
        if (Array.isArray(savedWatchlist)) setWatchlist(savedWatchlist.filter(item => typeof item === "string" && /^[A-Z0-9.^:-]{1,25}$/.test(item)));
      } catch { setStorageAvailable(false); }
      setStorageReady(true);
    }).catch(() => { if (active) setStorageAvailable(false); });
    fetchJson<{ marketConnected: boolean; aiConnected: boolean }>("/api/status").then(payload => {
      if (!active) return;
      setStatus({ marketConnected: payload.marketConnected === true, aiConnected: payload.aiConnected === true });
      if (payload.marketConnected && !requestRef.current) void loadCompany("AAPL");
    }).catch(() => { if (active) setError("Service connection unavailable. You can still explore the sample dashboard."); });
    return () => { active = false; requestRef.current?.abort(); insightRequestRef.current?.abort(); };
  }, [loadCompany]);
  useEffect(() => {
    if (!storageReady || !storageNamespace) return;
    try { localStorage.setItem(storageNamespace + NOTE_KEY, JSON.stringify(notes)); localStorage.setItem(storageNamespace + WATCH_KEY, JSON.stringify(watchlist)); }
    catch { setStorageAvailable(false); }
  }, [notes, watchlist, storageReady, storageNamespace]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key === "k")) && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setSettingsOpen(false); setGlossaryOpen(false); }
    }
    function clickAway(event: PointerEvent) { if (!searchWrapRef.current?.contains(event.target as Node)) setSearchOpen(false); }
    window.addEventListener("keydown", keyboard); document.addEventListener("pointerdown", clickAway);
    return () => { window.removeEventListener("keydown", keyboard); document.removeEventListener("pointerdown", clickAway); };
  }, []);
  useEffect(() => {
    const q = query.trim().toLowerCase(); setSearchError("");
    setSearchResults(Object.values(knownCompanies).filter(item => !q || `${item.company.name} ${item.company.symbol}`.toLowerCase().includes(q)).map(item => ({ symbol: item.company.symbol, name: item.company.name, exchange: item.company.exchange }))); setSearchBusy(false);
    if (!q || !status.marketConnected) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchBusy(true);
      try { const payload = await fetchJson<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal }); if (!controller.signal.aborted) setSearchResults(payload.results || []); }
      catch (reason) { if (!controller.signal.aborted) setSearchError(reason instanceof Error ? reason.message : "Search is unavailable."); }
      finally { if (!controller.signal.aborted) setSearchBusy(false); }
    }, 400); return () => { clearTimeout(timer); controller.abort(); };
  }, [query, knownCompanies, status.marketConnected]);

  function importLegacyBrowserData() {
    if (!sessionUser || !storageNamespace) return;
    try {
      const oldNotes = JSON.parse(localStorage.getItem(NOTE_KEY) || "{}");
      const recovered: Record<string, Note> = {};
      if (oldNotes && typeof oldNotes === "object" && !Array.isArray(oldNotes)) {
        Object.entries(oldNotes).forEach(([symbol, value]) => {
          const note = value as Note;
          if (/^[A-Z0-9.^:-]{1,25}$/.test(symbol) && note && typeof note.text === "string" && note.text.length <= 20000 && typeof note.company === "string" && typeof note.updatedAt === "string") recovered[symbol] = note;
        });
      }
      const oldWatchlist = JSON.parse(localStorage.getItem(WATCH_KEY) || "[]");
      const recoveredWatchlist = Array.isArray(oldWatchlist) ? oldWatchlist.filter(symbol => typeof symbol === "string" && /^[A-Z0-9.^:-]{1,25}$/.test(symbol)) : [];
      setNotes(current => ({ ...recovered, ...current }));
      setWatchlist(current => Array.from(new Set([...current, ...recoveredWatchlist])));
      localStorage.setItem(storageNamespace + "legacy-imported", "yes");
      setHasLegacyData(false);
      setToast("Earlier browser notes imported. Your existing account notes were kept.");
    } catch { setToast("The older browser data could not be read. It has been left untouched."); }
  }
  function toggleWatch(symbol = company.symbol) {
    if (!sessionUser) { setToast("Sign in before saving a personal watchlist."); return; }
    const exists = watchlist.includes(symbol); setWatchlist(current => exists ? current.filter(s => s !== symbol) : [...current, symbol]); setToast(exists ? `${symbol} removed from your watchlist` : `${symbol} added to your watchlist`);
  }
  function updateNote(text: string) { setNotes(current => ({ ...current, [company.symbol]: { text, company: company.name, updatedAt: new Date().toISOString() } })); }
  function downloadSummary(symbol = company.symbol) {
    const note = notes[symbol]; if (!note?.text.trim()) { setToast("Write a few notes first, then download your summary."); return; }
    const body = `# ${note.company} (${symbol}) — My research summary\n\n${note.text}\n\n---\nSaved: ${dateLabel(note.updatedAt, true)}\nPersonal research notes. For learning only; not investment advice.\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" })), anchor = document.createElement("a"); anchor.href = url; anchor.download = `${symbol.toLowerCase()}-research-summary.md`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setToast("Your research summary was downloaded");
  }
  async function generateInsight() {
    if (data.mode === "live" && !status.aiConnected) { setSettingsOpen(true); return; }
    insightRequestRef.current?.abort(); const controller = new AbortController(); insightRequestRef.current = controller; setSummaryBusy(true); setSummaryError("");
    try {
      const payload = await fetchJson<Insight>("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: company.symbol, news: data.news.slice(0, 4).map(({ id }) => ({ id })) }), signal: controller.signal });
      if (!controller.signal.aborted) setInsight(payload);
    } catch (reason) { if (!controller.signal.aborted) setSummaryError(reason instanceof Error ? reason.message : "The summary couldn’t be created."); }
    finally { if (!controller.signal.aborted) setSummaryBusy(false); }
  }
  function focusSummary() { setView("overview"); setTimeout(() => { document.getElementById("my-summary")?.scrollIntoView({ behavior: "smooth", block: "center" }); summaryRef.current?.focus({ preventScroll: true }); }, 60); }
  const metricCards = [
    { label: "Total revenue", value: financials.revenue, previous: financials.previousRevenue, description: "Money earned from sales", icon: DollarSign },
    { label: "Net profit", value: financials.netIncome, previous: financials.previousNetIncome, description: "What’s left after expenses", icon: TrendingUp },
    { label: "Total assets", value: financials.assets, previous: null, description: "Everything the company owns", icon: Wallet },
    { label: "Total liabilities", value: financials.liabilities, previous: null, description: "Everything the company owes", icon: Building2 },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setView("overview"); }} aria-label="Stockwise home"><span className="brand-mark"><BarChart3 size={23} strokeWidth={2.5} /></span><span className="brand-name">stockwise<span className="brand-tag">RESEARCH, SIMPLIFIED</span></span></a>
      <div className="nav-section-label">WORKSPACE</div><nav className="sidebar-nav" aria-label="Main navigation">
        <button className={`nav-item ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}><LayoutDashboard size={19} className="nav-icon" />Overview</button>
        <button className={`nav-item ${view === "watchlist" ? "active" : ""}`} onClick={() => setView("watchlist")}><Star size={19} className="nav-icon" />My watchlist<span className="nav-count">{watchlist.length}</span></button>
        <button className={`nav-item ${view === "notes" ? "active" : ""}`} onClick={() => setView("notes")}><FileText size={19} className="nav-icon" />Research notes{noteCount > 0 && <span className="nav-count">{noteCount}</span>}</button>
      <a className="nav-item ws-sidebar-link" href="/learning"><BookOpen size={19} className="nav-icon" />Finance academy</a><a className="nav-item ws-sidebar-link" href="/data"><Database size={19} className="nav-icon" />Data library</a>{sessionUser?.role === "admin" && <a className="nav-item ws-sidebar-link" href="/admin"><ShieldCheck size={19} className="nav-icon" />Administration</a>}</nav><div className="nav-section-label">YOUR WATCHLIST<button className="icon-button" aria-label="Search for a company to add" onClick={() => { searchRef.current?.focus(); setSearchOpen(true); }}><Plus size={15} /></button></div>
      <div className="watchlist">{watchlist.slice(0, 6).map(symbol => { const item = knownCompanies[symbol]; return <button className={`watchlist-item ${company.symbol === symbol ? "selected" : ""}`} key={symbol} onClick={() => void loadCompany(symbol)}><span className="company-mark" style={{ background: item?.company.logoColor || "#eef2ef" }}>{item?.company.mark || symbol[0]}</span><span className="watchlist-copy"><strong>{symbol}</strong><span>{item?.company.name || "View company"}</span></span><span className={`watchlist-price ${(item?.quote.changePercent ?? 0) >= 0 ? "positive" : "negative"}`}>{signed(item?.quote.changePercent ?? null, "%")}<small>{item?.mode === "demo" ? "Sample" : item?.quote.asOf || "Not loaded"}</small></span></button>; })}{!watchlist.length && <p className="page-subtitle">Star a company to keep it here.</p>}</div>
      <div className="sidebar-tip"><span className="tip-icon"><Lightbulb size={18} /></span><strong>Small steps.<br />Smarter research.</strong><p>Start with what a company does. The numbers make more sense from there.</p><button onClick={() => setGlossaryOpen(true)}>Learn the basics <ArrowUpRight size={14} /></button></div>
      <div className="sidebar-profile"><span className="avatar">YO</span><span className="profile-copy"><strong>{sessionUser?.displayName || "Your workspace"}</strong><span>{sessionUser ? `${sessionUser.role === "admin" ? "Admin" : "User"} account` : "Sign in to save your work"}</span>{sessionUser && <a className="sidebar-signout" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>}</span><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="About your workspace"><ChevronDown size={16} /></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="search-wrap" ref={searchWrapRef}><form role="search" onSubmit={event => { event.preventDefault(); if (searchResults[0]) void loadCompany(searchResults[0].symbol); else if (status.marketConnected && /^[A-Za-z0-9.^:-]{1,20}$/.test(query.trim())) void loadCompany(query.trim().toUpperCase()); }}><Search size={19} className="search-icon" /><input ref={searchRef} className="search-input" aria-label="Search company name or stock ticker" placeholder="Search a company or stock ticker..." value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); searchWrapRef.current?.querySelector<HTMLButtonElement>(".search-result")?.focus(); } }} autoComplete="off" aria-expanded={searchOpen} aria-controls="company-search-results" /><span className="search-shortcut">⌘ K</span></form>
      {searchOpen && <div className="search-results" id="company-search-results"><div className="nav-section-label">{query ? "SEARCH RESULTS" : "EXPLORE A COMPANY"}{searchBusy && <Loader2 className="loading-spinner" size={14} />}</div>{searchResults.slice(0, 8).map(result => <button className="search-result" key={result.symbol} onClick={() => void loadCompany(result.symbol)}><span className="search-result-symbol">{result.symbol}</span><span>{result.name}</span><small>{result.exchange}</small><ArrowUpRight size={15} /></button>)}{!searchResults.length && !searchBusy && <div className="news-empty">{status.marketConnected ? "No matching companies. Try another name or ticker." : "Try Apple, Microsoft, NVIDIA, Tesla, or Alphabet in this sample workspace."}</div>}{searchError && <p className="notice" role="alert">{searchError}</p>}<div className="keyboard-hint">{status.marketConnected ? "Enter to open a company" : "Sample companies · Connect a data service for more stocks"}<span>esc to close</span></div></div>}
    </div><div className="topbar-right"><span className="demo-indicator"><span />{data.mode === "demo" ? "Sample workspace" : "Research workspace"}</span><button className="icon-button" aria-label="Data sources and workspace information" onClick={() => setSettingsOpen(true)}><CircleHelp size={19} /></button><span className="avatar">YO</span></div></header>

    <main className="page-content">{hasLegacyData && sessionUser && <div className="legacy-import-notice"><div><strong>Have notes from the earlier version?</strong><p>Older browser-only data was found. Import it only if it belongs to you; existing account notes will be kept.</p></div><button className="button button-secondary" onClick={importLegacyBrowserData}>Import earlier notes</button></div>}{view === "overview" && <>
      <div className="page-heading"><div><p className="eyebrow">YOUR RESEARCH STARTS HERE</p><h1 className="page-title">A little research. A clearer picture.</h1><p className="page-subtitle">Get to know the business behind the stock.</p></div><div className="heading-meta"><span className="status-chip"><ShieldCheck size={14} />Built for learning</span><button className="button button-ghost button-small" onClick={() => setSettingsOpen(true)}>{data.mode === "demo" ? "Explore sample data" : "View data sources"}<ArrowUpRight size={14} /></button></div></div>
      <div className="ticker-strip" aria-label="Explore example companies">{DEMO_SYMBOLS.map(symbol => { const item = knownCompanies[symbol] || DEMO_DATA[symbol]; return <button className={`ticker-tile ${company.symbol === symbol ? "active" : ""}`} key={symbol} onClick={() => void loadCompany(symbol)}><div className="ticker-top"><span><strong>{symbol}</strong><span className="ticker-name">{item.company.name.replace(/,? Inc\.?$/, "").replace(" Corporation", "")}</span></span><Sparkline history={item.history} positive={(item.quote.changePercent ?? 0) >= 0} /></div><div className="ticker-bottom"><strong>{money(item.quote.price, item.company.currency)}</strong><span className={(item.quote.changePercent ?? 0) >= 0 ? "positive" : "negative"}>{(item.quote.changePercent ?? 0) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{signed(item.quote.changePercent, "%")}</span></div><span className="ticker-data-label">{item.mode === "demo" ? "Illustrative" : `As of ${item.quote.asOf}`}</span></button>; })}</div>
      {data.mode === "demo" && <p className="demo-disclaimer"><ShieldCheck size={13} />Sample mode: prices, financial figures, and news stories are fictional examples for learning.</p>}
      {error && <div className="notice" role="alert"><CircleHelp size={16} /><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button></div>}
      {data.warnings?.filter(warning => data.mode !== "demo").map((warning, i) => <div className="notice" key={i}><CircleHelp size={16} />{warning}</div>)}
      <div className="company-heading"><div className="company-identity"><span className="company-icon" style={{ background: company.logoColor }}>{company.mark}</span><div><div className="company-title"><h2>{company.name}</h2><span className="company-tag">{company.symbol}</span>{loading && <Loader2 className="loading-spinner" size={18} aria-label="Loading company" />}</div><div className="company-meta"><span>{company.exchange}</span><span>·</span><span>{company.industry}</span><span>·</span><span>{company.currency}</span></div></div></div><div className="company-actions"><button className="button button-secondary button-small" onClick={() => toggleWatch()}><Star size={15} fill={watchlist.includes(company.symbol) ? "currentColor" : "none"} />{watchlist.includes(company.symbol) ? "Watching" : "Add to watchlist"}</button><button className="button button-primary button-small" onClick={focusSummary}><PencilLine size={15} />Write a summary</button></div></div>

      <div className="content-grid" aria-busy={loading}><section className="card price-card"><div className="card-header"><h3 className="card-title">Price overview</h3><span className="card-kicker">{data.mode === "demo" ? "ILLUSTRATIVE DATA" : "LATEST AVAILABLE"}</span></div><div className="price-top"><div><div className="price-value">{money(quote.price, company.currency)}<span>{company.currency}</span></div><div className="price-change"><span className={isPositive ? "positive" : "negative"}>{isPositive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{signed(quote.change)} ({signed(quote.changePercent, "%")})</span><span>vs. previous close</span></div></div><div className="range-switch" aria-label="Chart date range">{(["1M", "3M", "6M", "1Y", "ALL"] as Range[]).map(value => <button key={value} className={`range-button ${range === value ? "active" : ""}`} aria-pressed={range === value} onClick={() => setRange(value)}>{value === "ALL" ? "All" : value}</button>)}</div></div><PriceChart history={data.history} range={range} symbol={company.symbol} currency={company.currency} mode={data.mode} /><div className="chart-legend"><span><i />{data.mode === "demo" ? "Sample closing prices · not market data" : "Daily closing prices"}</span><span>{data.mode === "demo" ? "For exploration only" : `Quote as of ${quote.asOf}`}</span></div>{data.mode === "live" && data.history.length > 0 && <p className="history-coverage">Available history: {dateLabel(data.history[0].date, true)} – {dateLabel(data.history[data.history.length - 1].date, true)}. Ranges show available dates only.</p>}<div className="chart-stats">{[{ label: "Open", value: money(quote.open, company.currency) }, { label: "Day high", value: money(quote.high, company.currency) }, { label: "Day low", value: money(quote.low, company.currency) }, { label: "Volume", value: compact(quote.volume) }].map(stat => <div className="stat-item" key={stat.label}><span className="stat-label">{stat.label}</span><strong className="stat-value">{stat.value}</strong></div>)}</div></section>
      <section className="card assistant-card"><div className="assistant-heading"><span className="assistant-icon"><Sparkles size={22} /></span><span className="assistant-label">YOUR RESEARCH COMPANION</span></div><h3>Less noise.<br />More understanding.</h3><p className="assistant-intro">Make sense of {company.name.replace(/,? Inc\.?$/, "")}’s news, one headline at a time.</p>{insight ? <div className="assistant-output"><span className="status-chip">{insight.mode === "demo" ? "Example explanation · not AI generated" : "AI-generated explanation"}</span><p>{insight.summary}</p><strong>Why it may matter</strong><ul>{insight.implications.map((point, i) => <li key={i}>{point}</li>)}</ul><p className="assistant-note">{insight.caveat}</p></div> : <div className="assistant-points">{["Understand the headlines in plain English", "Explore why the news could matter", "Build your own informed perspective"].map(point => <div className="assistant-point" key={point}><span><Check size={12} /></span>{point}</div>)}</div>}{summaryError && <p className="notice" role="alert">{summaryError}</p>}<div className="assistant-footer"><button className="button button-primary" onClick={() => void generateInsight()} disabled={summaryBusy || loading || !data.news.length}>{summaryBusy ? <Loader2 size={16} className="loading-spinner" /> : <Sparkles size={16} />}{summaryBusy ? "Reading the news..." : insight ? "Refresh explanation" : data.mode === "demo" ? "Explore a sample summary" : status.aiConnected ? "Summarize the news" : "Connect AI to summarize"}{!summaryBusy && <ArrowRight size={16} />}</button><span className="assistant-note"><ShieldCheck size={12} />{data.mode === "demo" ? "Sample explanation. Connect AI for generated summaries." : "AI can make mistakes. Always check the original source."}</span></div></section></div>

      <div className="linked-data-banner"><div><strong><Database size={17} />Bring your own company data</strong><p>Upload historical prices or financials, attach reports, and connect them to earlier files.</p></div><a className="button button-secondary" href={`/data?symbol=${encodeURIComponent(company.symbol)}`}>Open {company.symbol} files<ArrowUpRight size={14} /></a><a className="button button-ghost" href="/learning">Explore formulas<BookOpen size={14} /></a></div>
      <section className="financials-section"><div className="section-heading"><div><h3 className="section-title">The business, in numbers <button className="icon-button" aria-label="Explain financial terms" onClick={() => setGlossaryOpen(true)}><CircleHelp size={14} /></button></h3><p className="section-description">A few fundamentals to help you see the bigger picture.</p></div><span className="card-kicker">{data.mode === "demo" ? "SAMPLE ANNUAL FIGURES" : financials.period}</span></div><div className="financial-grid">{metricCards.map(metric => { const growth = metric.value !== null && metric.previous !== null && metric.previous !== 0 ? (metric.value - metric.previous) / Math.abs(metric.previous) * 100 : null; return <article className="card metric-card" key={metric.label}><div className="metric-top"><span className="metric-label">{metric.label}</span><span className="metric-icon"><metric.icon size={16} /></span></div><div className="metric-value">{compact(metric.value, company.currency)}</div><div className="metric-comparison">{growth !== null ? <><span className={growth >= 0 ? "positive" : "negative"}>{growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{signed(growth, "%")}</span><span>vs. prior year</span></> : <span>{metric.value === null ? "Not available from provider" : data.mode === "demo" ? "Illustrative balance sheet" : financials.period}</span>}</div><p className="metric-description">{metric.description}</p></article>; })}</div></section>

      <div className="content-grid"><section className="card news-card"><div className="card-header"><div><h3 className="card-title">{data.mode === "demo" ? "Inside the headlines" : "Recent company news"}</h3><p className="card-subtitle">{data.mode === "demo" ? "Example stories to practice your research." : "Read the source. Form your own view."}</p></div><span className="company-tag">{data.mode === "demo" ? "EXAMPLES" : `${Math.min(data.news.length, 4)} STORIES`}</span></div><div className="news-list">{data.news.length ? data.news.slice(0, 4).map((news, i) => <article className="news-item" key={news.id}><span className={`news-category news-category-${i % 3}`}>{i % 3 === 0 ? <TrendingUp size={19} /> : i % 3 === 1 ? <Building2 size={19} /> : <Globe size={19} />}</span><div className="news-copy"><div className="news-meta"><span>{news.category || "Company news"}</span><span>·</span><span>{data.mode === "demo" ? "Illustrative story" : dateLabel(news.publishedAt)}</span></div><h4>{safeUrl(news.url) ? <a href={safeUrl(news.url)} target="_blank" rel="noopener noreferrer" aria-label={data.mode === "demo" ? `${news.title} — example story; opens company newsroom` : `${news.title} — opens original article`}>{news.title}</a> : news.title}</h4><p>{news.source}{data.mode === "demo" ? " · link opens company newsroom" : ""}</p></div>{safeUrl(news.url) && <a href={safeUrl(news.url)} target="_blank" rel="noopener noreferrer" className="news-arrow" aria-label={data.mode === "demo" ? `Open ${company.name} newsroom` : `Read ${news.title}`}><ArrowUpRight size={17} /></a>}</article>) : <div className="news-empty">No recent news was returned for this company. Try again later.</div>}</div></section>
      <section className="card company-card"><div className="card-header"><h3 className="card-title">Behind the ticker</h3><Building2 size={17} /></div><p className="company-description">{company.description}</p><div className="company-facts">{[{ label: "Industry", value: company.industry }, { label: "Market cap", value: compact(quote.marketCap, company.currency) }, { label: "P/E ratio", value: quote.peRatio === null ? "—" : quote.peRatio.toFixed(2) }, { label: "52-week range", value: quote.week52Low !== null && quote.week52High !== null ? `${money(quote.week52Low, company.currency)} – ${money(quote.week52High, company.currency)}` : "—" }].map(fact => <div className="company-fact" key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>{safeUrl(company.website) && <a className="company-website" href={safeUrl(company.website)} target="_blank" rel="noopener noreferrer"><Globe size={14} />Visit company website<ArrowUpRight size={14} /></a>}</section></div>

      <section className="card summary-card section-anchor" id="my-summary"><div className="summary-header"><div><div className="card-title"><span className="metric-icon"><PencilLine size={17} /></span><h3>My research summary</h3><span className="company-tag">{company.symbol}</span></div><p className="card-subtitle">Connect the dots in your own words. What stood out to you?</p></div><button className="button button-secondary button-small" onClick={() => downloadSummary()} disabled={!selectedNote.trim()}><Download size={14} />Download summary</button></div><label htmlFor="research-summary" className="sr-only">Your research summary for {company.name}</label><textarea ref={summaryRef} id="research-summary" className="summary-textarea" disabled={!storageReady} placeholder={`What does ${company.name.replace(/,? Inc\.?$/, "")} do? What do the numbers and news tell you?\nNote your observations, questions, and anything you’d like to explore next...`} value={selectedNote} maxLength={20000} onChange={event => updateNote(event.target.value)} /><div className="summary-footer"><span className="summary-hint">{!sessionUser ? <><CircleHelp size={13} /><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in to write and save your summary</a></> : storageAvailable ? <><Check size={13} />{selectedNote.trim() ? "Saved in this browser" : "Your notes will save automatically in this browser"}</> : <><CircleHelp size={13} />Browser storage is unavailable. Download your notes to keep them.</>}</span><span className="word-count">{selectedNote.trim() ? selectedNote.trim().split(/\s+/).length : 0} words</span></div></section>
    </>}

    {view === "watchlist" && <><div className="page-heading"><div><p className="eyebrow">KEEP YOUR CURIOSITY CLOSE</p><h1 className="page-title">My watchlist</h1><p className="page-subtitle">A place for the companies you want to understand better.</p></div><button className="button button-primary" onClick={() => { searchRef.current?.focus(); setSearchOpen(true); }}><Plus size={16} />Find a company</button></div>{error && <p className="notice" role="alert">{error}</p>}<div className="notes-list">{watchlist.length ? watchlist.map(symbol => { const item = knownCompanies[symbol]; return <article className="card saved-note" key={symbol}><div className="company-identity"><span className="company-icon" style={{ background: item?.company.logoColor || "#edf4ef" }}>{item?.company.mark || symbol[0]}</span><div><h3 className="card-title">{item?.company.name || symbol}</h3><p className="card-subtitle">{symbol} · {item?.company.industry || "Saved company"}</p></div></div><div className="watchlist-card-price"><strong>{money(item?.quote.price ?? null, item?.company.currency)}</strong><span className={(item?.quote.changePercent ?? 0) >= 0 ? "positive" : "negative"}>{signed(item?.quote.changePercent ?? null, "%")}</span><small>{item?.mode === "demo" ? "Illustrative data" : item?.quote.asOf || "Open company to load data"}</small></div><div className="company-actions"><button className="button button-secondary button-small" onClick={() => void loadCompany(symbol)}>Research<ArrowRight size={14} /></button><button className="icon-button" aria-label={`Remove ${symbol} from watchlist`} onClick={() => toggleWatch(symbol)}><X size={17} /></button></div></article>; }) : <div className="card empty-state"><Star size={30} /><h3>Your watchlist starts with a little curiosity.</h3><p>Search for a company, then choose “Add to watchlist”.</p></div>}</div></>}

    {view === "notes" && <><div className="page-heading"><div><p className="eyebrow">YOUR THINKING, IN ONE PLACE</p><h1 className="page-title">Research notes</h1><p className="page-subtitle">Your observations today are a starting point for tomorrow.</p></div><button className="button button-primary" onClick={focusSummary}><PencilLine size={16} />Write a summary</button></div><div className="notes-list">{noteCount || editingNote ? Object.entries(notes).filter(([symbol, note]) => note.text.trim() || editingNote === symbol).sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).map(([symbol, note]) => <article className="card saved-note note-preview" key={symbol}><div className="card-header"><div><h3 className="card-title">{note.company}<span className="company-tag">{symbol}</span></h3><p className="card-subtitle">Last edited {dateLabel(note.updatedAt, true)}</p></div><div className="company-actions"><button className="button button-secondary button-small" onClick={() => setEditingNote(editingNote === symbol ? null : symbol)}>{editingNote === symbol ? <Check size={14} /> : <PencilLine size={14} />}{editingNote === symbol ? "Done" : "Edit"}</button><button className="icon-button" aria-label={`Download ${symbol} summary`} onClick={() => downloadSummary(symbol)}><Download size={17} /></button></div></div><>{editingNote === symbol ? <><label htmlFor={`note-${symbol}`} className="sr-only">Edit your research summary for {note.company}</label><textarea autoFocus id={`note-${symbol}`} className="summary-textarea note-editor" value={note.text} maxLength={20000} onChange={event => { const text = event.target.value; setNotes(current => ({ ...current, [symbol]: { ...current[symbol], text, updatedAt: new Date().toISOString() } })); }} /><p className="summary-hint"><Check size={13} />{storageAvailable ? "Saved in this browser" : "Download your notes to keep them"}</p></> : <p className="note-text">{note.text}</p>}</></article>) : <div className="card empty-state"><BookOpen size={30} /><h3>Good research starts with a question.</h3><p>Write your first company summary and it will appear here.</p><button className="button button-primary" onClick={focusSummary}><PencilLine size={15} />Start writing</button></div>}</div></>}

    <footer className="footer-note"><span><ShieldCheck size={14} />For learning and research. Not personalized investment advice.</span><span className="footer-brand">Stay curious. Think independently.</span></footer></main></div>
    {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    {(settingsOpen || glossaryOpen) && <InfoModal glossary={glossaryOpen} marketConnected={status.marketConnected} aiConnected={status.aiConnected} onClose={() => { setSettingsOpen(false); setGlossaryOpen(false); }} />}
  </div>;
}

function InfoModal({ glossary, marketConnected, aiConnected, onClose }: { glossary: boolean; marketConnected: boolean; aiConnected: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); document.body.style.overflow = "hidden";
    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const elements = modalRef.current?.querySelectorAll<HTMLElement>("button, a[href], input, textarea, [tabindex='0']"); if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", trap);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", trap); previous?.focus(); };
  }, []);
  const terms = [{ title: "Revenue", text: "Money earned from selling products or services, before subtracting expenses." }, { title: "Net profit", text: "Money remaining after costs, interest, and taxes. A negative value means the company reported a loss." }, { title: "Assets and liabilities", text: "Assets are things a company owns or controls. Liabilities are what it owes. Balance sheets describe a specific date." }, { title: "Market capitalization", text: "The stock price multiplied by shares outstanding. It describes market value, not the company’s cash balance." }, { title: "P/E ratio", text: "Share price divided by earnings per share. It needs context and may be unavailable when earnings are negative." }, { title: "Daily change", text: "The latest available price minus the previous trading day’s closing price. Quotes can be delayed." }];
  return <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" ref={modalRef}><div className="modal-header"><span className="assistant-icon">{glossary ? <BookOpen size={22} /> : <BarChart3 size={22} />}</span><button className="icon-button" onClick={onClose} aria-label="Close information"><X size={20} /></button></div><h2 id="info-modal-title">{glossary ? "A few basics, simply explained." : "Your space to understand stocks."}</h2><div className="modal-body">{glossary ? terms.map(term => <div className="glossary-term" key={term.title}><h3>{term.title}</h3><p>{term.text}</p></div>) : <><p>Stockwise brings company information, financials, news, and your own thinking into one calm workspace.</p><div className="source-status"><span className="status-chip">{marketConnected ? "Market data connected" : "Sample data mode"}</span><span className="status-chip">{aiConnected ? "AI service connected" : "Example explanations"}</span></div><h3>About the data</h3><p>{marketConnected ? "Data and news come from Alpha Vantage. Availability, quote delays, and limits depend on the provider plan. Each company shows its own quote date. Unavailable values appear as a dash." : "Prices, charts, financial figures, and news stories in sample mode are illustrative, not current market information. Example headline links open the company’s newsroom."}</p><h3>AI and your own summary</h3><p>{aiConnected ? "AI explains supplied news excerpts. It can miss context or make mistakes, so check original sources." : "Sample explanations demonstrate the feature. Connect an AI service for AI-generated summaries."} Personal notes are stored separately for each signed-in account in this browser only. Download them to keep a separate copy.</p><h3>Connect live services</h3><p>The project README explains how to configure private API keys for Alpha Vantage and Gemini. Providers may charge fees or limit requests.</p><p className="assistant-note">News summaries and price trends are not guaranteed predictions or personalized investment advice.</p></>}</div><div className="modal-footer"><button className="button button-primary" onClick={onClose}>Got it<Check size={16} /></button></div></div></div>;
}
