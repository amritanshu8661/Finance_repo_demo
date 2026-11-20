"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleAlert, Database, FileChartColumn, FileJson, FileSpreadsheet, FileText, FolderOpen, History, Link2, Loader2, LockKeyhole, Plus, RefreshCw, Search, ShieldCheck, UploadCloud, Users, X } from "lucide-react";
import type { Analysis, LibraryItem, LibraryUser } from "@/lib/library/contracts";
import "./data-workspace.css";

type Session = { user: LibraryUser | null; storageReady: boolean; adminConfigured: boolean };
type Detail = { item: LibraryItem; rows: Record<string, unknown>[]; analysis: Analysis };
type KindFilter = "all" | "prices" | "financials" | "attachment" | "source";
type UploadMode = "file" | "source";
const MAX_BYTES = 5 * 1024 * 1024;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "The request could not be completed. Please try again.";
    throw new Error(error);
  }
  return payload as T;
}

function kindLabel(kind: LibraryItem["kind"]) {
  return ({ prices: "Price history", financials: "Financial statements", attachment: "Attachment", source: "Website source" })[kind];
}
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
function fileSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function validWebsite(value: string): string | null {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function metricValue(value: number | null, unit: string, currency: string) {
  if (value === null || !Number.isFinite(value)) return "Needs more data";
  if (unit === "money") {
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2, notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard" }).format(value); }
    catch { return `${currency} ${value.toLocaleString()}`; }
  }
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  return `${formatted}${unit === "percent" ? "%" : unit === "ratio" ? "×" : unit === "days" ? " days" : ""}`;
}
function KindIcon({ kind, size = 20 }: { kind: LibraryItem["kind"]; size?: number }) {
  return kind === "prices" ? <FileChartColumn size={size} /> : kind === "financials" ? <FileSpreadsheet size={size} /> : kind === "source" ? <Link2 size={size} /> : <FileText size={size} />;
}

function HistoryChart({ points, currency }: { points: { date: string; close: number }[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;
  const values = points.map(point => point.close), minimum = Math.min(...values), maximum = Math.max(...values), span = maximum - minimum || Math.max(Math.abs(maximum) * .1, 1);
  const top = maximum + span * .1, bottom = Math.max(0, minimum - span * .1), width = 780, height = 232, left = 12, right = 700;
  const stride = Math.max(1, Math.floor(points.length / 600));
  const sampled = points.filter((_, i) => i % stride === 0 || i === points.length - 1);
  const coords = sampled.map((point, i) => ({ ...point, x: left + i / (sampled.length - 1) * (right - left), y: 188 - (point.close - bottom) / (top - bottom || 1) * 170 }));
  const path = coords.map((point, i) => `${i ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const selected = hover === null ? null : coords[Math.min(hover, coords.length - 1)];
  return <div className="dl-history-chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Uploaded closing prices from ${points[0].date} to ${points[points.length - 1].date}. First close ${points[0].close} ${currency}; last close ${points[points.length - 1].close} ${currency}.`} onPointerLeave={() => setHover(null)} onPointerMove={event => {
      const bounds = event.currentTarget.getBoundingClientRect(), x = (event.clientX - bounds.left) / bounds.width * width;
      setHover(Math.max(0, Math.min(coords.length - 1, Math.round((x - left) / (right - left) * (coords.length - 1)))));
    }}>
      <defs><linearGradient id="uploaded-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#268265" stopOpacity=".2" /><stop offset="100%" stopColor="#268265" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3].map(index => { const y = 18 + index / 3 * 170; return <g key={index}><line x1={left} x2={right} y1={y} y2={y} stroke="#e4ece6" strokeDasharray="3 5" /><text x="718" y={y + 4}>{(top - index / 3 * (top - bottom)).toFixed(2)}</text></g>; })}
      <path d={`${path} L${right},188 L${left},188 Z`} fill="url(#uploaded-chart-fill)" />
      <path d={path} fill="none" stroke="#268265" strokeWidth="2.4" strokeLinejoin="round" />
      {[0, .25, .5, .75, 1].map(fraction => { const point = coords[Math.round(fraction * (coords.length - 1))]; return <text key={fraction} x={point.x} y="219" textAnchor={fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}>{point.date}</text>; })}
      {selected && <g><line x1={selected.x} x2={selected.x} y1="18" y2="188" stroke="#83ab97" strokeDasharray="4 4" /><circle cx={selected.x} cy={selected.y} r="5" fill="#176951" stroke="white" strokeWidth="2" /><g transform={`translate(${Math.max(12, Math.min(selected.x - 71, 560))},${Math.max(2, selected.y - 56)})`}><rect width="142" height="43" rx="7" fill="#233b32" /><text x="71" y="17" textAnchor="middle" className="dl-chart-value">{metricValue(selected.close, "money", currency)}</text><text x="71" y="32" textAnchor="middle" className="dl-chart-date">{selected.date}</text></g></g>}
    </svg>
    <p><span className="dl-chart-dot" />Uploaded closing prices · {currency}<span>{points.length.toLocaleString()} observations</span></p>
  </div>;
}

export default function DataWorkspace() {
  const [session, setSession] = useState<Session | null>(null), [sessionLoading, setSessionLoading] = useState(true);
  const [items, setItems] = useState<LibraryItem[]>([]), [listLoading, setListLoading] = useState(false), [detail, setDetail] = useState<Detail | null>(null), [detailLoading, setDetailLoading] = useState(false);
  const [parentItems, setParentItems] = useState<LibraryItem[]>([]), [parentError, setParentError] = useState("");
  const [error, setError] = useState(""), [success, setSuccess] = useState(""), [filter, setFilter] = useState<KindFilter>("all"), [companyFilter, setCompanyFilter] = useState(""), [appliedCompany, setAppliedCompany] = useState("");
  const [showArchived, setShowArchived] = useState(false), [selectedId, setSelectedId] = useState<string | null>(null), [uploadOpen, setUploadOpen] = useState(false), [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [symbol, setSymbol] = useState(""), [companyName, setCompanyName] = useState(""), [currency, setCurrency] = useState("USD"), [visibility, setVisibility] = useState<"private" | "shared">("private"), [parentId, setParentId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null), [sourceTitle, setSourceTitle] = useState(""), [sourceUrl, setSourceUrl] = useState(""), [saving, setSaving] = useState(false), [actionBusy, setActionBusy] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const listSequence = useRef(0), detailController = useRef<AbortController | null>(null), uploaderRef = useRef<HTMLDivElement>(null), detailRef = useRef<HTMLElement>(null);
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const initialSymbol = (params.get("symbol") || "").toUpperCase().trim();
    setCompanyFilter(initialSymbol); setAppliedCompany(initialSymbol); setSymbol(initialSymbol);
    const file = params.get("file"); if (file) setSelectedId(file);
    const controller = new AbortController();
    request<Session>("/api/me", { signal: controller.signal }).then(setSession).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "We couldn’t check your sign-in."); }).finally(() => { if (!controller.signal.aborted) setSessionLoading(false); });
    return () => { controller.abort(); detailController.current?.abort(); };
  }, []);

  const reloadItems = useCallback(async (selectedCompany: string, archived: boolean) => {
    const sequence = ++listSequence.current;
    setListLoading(true); setItems([]);
    const params = new URLSearchParams();
    if (selectedCompany.trim()) params.set("symbol", selectedCompany.trim().toUpperCase());
    if (archived) params.set("archived", "1");
    try {
      const payload = await request<{ items: LibraryItem[] }>(`/api/library?${params}`);
      if (sequence === listSequence.current) setItems(payload.items);
    } catch (reason) { if (sequence === listSequence.current) setError(reason instanceof Error ? reason.message : "We couldn’t load your files."); }
    finally { if (sequence === listSequence.current) setListLoading(false); }
  }, []);

  useEffect(() => {
    if (session?.user && session.storageReady) void reloadItems(appliedCompany, showArchived);
  }, [session, appliedCompany, showArchived, reloadItems]);

  useEffect(() => {
    if (!selectedId || !session?.user || !session.storageReady) { setDetail(null); return; }
    detailController.current?.abort();
    const controller = new AbortController(); detailController.current = controller;
    setDetailLoading(true); setDetail(null);
    request<Detail>(`/api/library/${encodeURIComponent(selectedId)}`, { signal: controller.signal }).then(payload => { if (!controller.signal.aborted) setDetail(payload); }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "This file could not be opened."); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedId, session]);

  useEffect(() => { setParentId(""); }, [symbol, currency, visibility, uploadMode]);
  useEffect(() => { if (uploadOpen) uploaderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [uploadOpen]);
  useEffect(() => { if (detail) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [detail?.item.id]);
  useEffect(() => {
    const clean = symbol.trim().toUpperCase();
    setParentError(""); setParentItems([]);
    if (!uploadOpen || !session?.user || !session.storageReady || !/^[A-Z0-9][A-Z0-9.\-:^]{0,24}$/.test(clean)) { setParentItems([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      request<{ items: LibraryItem[] }>(`/api/library?symbol=${encodeURIComponent(clean)}`, { signal: controller.signal }).then(payload => { if (!controller.signal.aborted) setParentItems(payload.items); }).catch(reason => { if (!controller.signal.aborted) { setParentItems([]); setParentError(reason instanceof Error ? reason.message : "Previous-file connections could not be loaded."); } });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [symbol, uploadOpen, session]);

  const visibleItems = useMemo(() => items.filter(item => filter === "all" || item.kind === filter), [items, filter]);
  const parentOptions = parentItems.filter(item => {
    if (!item.latest || item.archivedAt || item.symbol !== symbol.trim().toUpperCase() || item.currency !== currency || item.visibility !== visibility) return false;
    if (uploadMode === "source") return item.kind === "source";
    if (item.kind === "source") return false;
    if (uploadFile && /\.(pdf|xlsx|docx)$/i.test(uploadFile.name)) return item.kind === "attachment";
    if (uploadFile && /\.(csv|json)$/i.test(uploadFile.name)) return item.kind === "prices" || item.kind === "financials";
    return true;
  });
  const canManage = detail && session?.user && (isAdmin || (detail.item.ownerId === session.user.id && detail.item.visibility === "private"));
  const previewRows = detail?.rows?.slice(0, 15) || [];
  const previewColumns = Array.from(new Set(previewRows.flatMap(row => Object.keys(row)))).slice(0, 18);

  function openItem(id: string) {
    setSelectedId(id); setError("");
    const url = new URL(window.location.href); url.searchParams.set("file", id); window.history.replaceState(null, "", url);
  }
  function openUpload(mode: UploadMode) {
    setUploadMode(mode); setUploadOpen(true); setUploadError(""); setSuccess("");
  }
  function chooseFile(file: File | null) {
    setUploadError(""); setParentId("");
    if (file && file.size > MAX_BYTES) { setUploadError("Choose a file smaller than 5 MB."); setUploadFile(null); return; }
    if (file && !/\.(csv|json|pdf|xlsx|docx)$/i.test(file.name)) { setUploadError("Use a CSV, JSON, PDF, XLSX, or DOCX file."); setUploadFile(null); return; }
    setUploadFile(file);
  }
  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setUploadError(""); setError(""); setSuccess("");
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9.\-:^]{0,24}$/.test(cleanSymbol)) { setUploadError("Enter a valid stock ticker, such as AAPL."); return; }
    if (!companyName.trim()) { setUploadError("Add the company’s name so you can find this file later."); return; }
    if (uploadMode === "file" && !uploadFile) { setUploadError("Choose a file to upload."); return; }
    if (uploadMode === "source" && (!sourceTitle.trim() || !validWebsite(sourceUrl))) { setUploadError("Add a title and a complete HTTPS website address."); return; }
    setSaving(true);
    try {
      let created: { item: LibraryItem };
      if (uploadMode === "file") {
        const form = new FormData(); form.set("file", uploadFile!); form.set("symbol", cleanSymbol); form.set("companyName", companyName.trim()); form.set("currency", currency); form.set("visibility", isAdmin ? visibility : "private"); if (parentId) form.set("parentId", parentId);
        created = await request<{ item: LibraryItem }>("/api/library", { method: "POST", body: form });
      } else {
        created = await request<{ item: LibraryItem }>("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "source", title: sourceTitle.trim(), url: validWebsite(sourceUrl), symbol: cleanSymbol, companyName: companyName.trim(), currency, visibility: isAdmin ? visibility : "private", ...(parentId ? { parentId } : {}) }) });
      }
      setUploadFile(null); setSourceTitle(""); setSourceUrl(""); setParentId(""); setUploadOpen(false); setShowArchived(false); setFilter("all"); setCompanyFilter(cleanSymbol); setAppliedCompany(cleanSymbol);
      await reloadItems(cleanSymbol, false); openItem(created.item.id);
      setSuccess(uploadMode === "source" ? "Website reference saved. Open it from this company’s library." : "File uploaded and connected to this company. Open its details below.");
    } catch (reason) { setUploadError(reason instanceof Error ? reason.message : "The file could not be saved."); }
    finally { setSaving(false); }
  }
  async function updateItem(action: "archive" | "restore" | "share" | "unshare") {
    if (!detail) return;
    setActionBusy(action); setError(""); setSuccess("");
    try {
      const payload = await request<{ item: LibraryItem }>(`/api/library/${encodeURIComponent(detail.item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      setDetail(current => current ? { ...current, item: payload.item } : current);
      await reloadItems(appliedCompany, showArchived);
      setSuccess(action === "archive" ? "File archived. You can restore it from the Archived list." : action === "restore" ? "File restored to the active library." : action === "share" ? "This file is now shared with signed-in workspace users." : "This file is private again.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The file could not be updated."); }
    finally { setActionBusy(null); }
  }

  return <div className="dl-workspace">
    <div className="dl-page-heading"><div><p className="dl-eyebrow">YOUR DATA, WITH CONTEXT</p><h1>Company data library</h1><p>Bring historical data, company reports, and source links into one connected place.</p></div><div className="dl-heading-actions"><button className="dl-button dl-button-secondary" onClick={() => openUpload("source")} disabled={!session?.user || !session.storageReady}><Link2 size={16} />Add website source</button><button className="dl-button dl-button-primary" onClick={() => openUpload("file")} disabled={!session?.user || !session.storageReady}><Plus size={17} />Upload a file</button></div></div>
    {sessionLoading ? <div className="dl-state"><Loader2 className="dl-spin" size={24} /><p>Opening your data workspace…</p></div> : !session?.user ? <div className="dl-state dl-card"><LockKeyhole size={30} /><h2>Sign in to work with your files.</h2><p>Your private data belongs to your account. Shared company files are available after sign-in.</p><a className="dl-button dl-button-primary" href="/signin-with-chatgpt?return_to=%2Fdata" target="_top">Sign in with ChatGPT<ArrowRight size={16} /></a></div> : <>
      <div className="dl-info-strip"><span><ShieldCheck size={16} />{isAdmin ? "Admin workspace" : "Your private workspace"}</span><p>{isAdmin ? "Manage your files, publish shared datasets, and connect each upload to the previous version." : "See your private files and shared company datasets. Only admins can publish shared files."}</p><span className="dl-role-badge">{session.user.role}</span></div>
      {!session.storageReady && <div className="dl-message dl-message-warning" role="status"><Database size={18} /><div><strong>File storage is not connected yet.</strong><p>Uploads need the project’s database and file-storage bindings. Your administrator can finish the setup described in the README.</p></div></div>}
      {error && <div className="dl-message dl-message-error" role="alert"><CircleAlert size={17} /><span>{error}</span><button onClick={() => setError("")} className="dl-icon-button" aria-label="Dismiss error"><X size={16} /></button></div>}
      {success && <div className="dl-message dl-message-success" role="status"><Check size={17} /><span>{success}</span><button onClick={() => setSuccess("")} className="dl-icon-button" aria-label="Dismiss message"><X size={16} /></button></div>}

      {uploadOpen && <section className="dl-card dl-upload-panel" ref={uploaderRef}><div className="dl-card-heading"><div><h2>{uploadMode === "file" ? "Upload company data" : "Save a website source"}</h2><p>{uploadMode === "file" ? "CSV and JSON data can be analyzed. Reports stay attached to the company." : "Keep a useful research link next to the data it explains."}</p></div><button className="dl-icon-button" aria-label="Close upload form" onClick={() => setUploadOpen(false)} disabled={saving}><X size={19} /></button></div><div className="dl-upload-tabs"><button className={uploadMode === "file" ? "active" : ""} onClick={() => { setUploadMode("file"); setUploadError(""); }} disabled={saving}><UploadCloud size={15} />File upload</button><button className={uploadMode === "source" ? "active" : ""} onClick={() => { setUploadMode("source"); setUploadError(""); }} disabled={saving}><Link2 size={15} />Website reference</button></div>
        <form onSubmit={submitUpload}><div className="dl-form-grid"><label>Stock ticker<input value={symbol} onChange={event => setSymbol(event.target.value.toUpperCase())} maxLength={25} required placeholder="AAPL" disabled={saving} /></label><label>Company name<input value={companyName} onChange={event => setCompanyName(event.target.value)} maxLength={180} required placeholder="Apple Inc." disabled={saving} /></label><label>Data currency<select value={currency} onChange={event => setCurrency(event.target.value)} disabled={saving}><option value="USD">USD — US dollar</option><option value="INR">INR — Indian rupee</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British pound</option><option value="JPY">JPY — Japanese yen</option><option value="CAD">CAD — Canadian dollar</option><option value="AUD">AUD — Australian dollar</option></select></label><label>Who can see it?{isAdmin ? <select value={visibility} onChange={event => setVisibility(event.target.value as "private" | "shared")} disabled={saving}><option value="private">Private — account owner and admins</option><option value="shared">Shared — signed-in workspace users</option></select> : <span className="dl-readonly-field"><LockKeyhole size={15} />Private — you and administrators</span>}</label></div>
        {uploadMode === "file" ? <><label className={`dl-file-picker ${uploadFile ? "has-file" : ""}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!saving) chooseFile(event.dataTransfer.files[0] || null); }}><input type="file" accept=".csv,.json,.pdf,.xlsx,.docx" onChange={event => chooseFile(event.target.files?.[0] || null)} disabled={saving} /><span className="dl-upload-icon">{uploadFile ? <FileText size={25} /> : <UploadCloud size={27} />}</span><strong>{uploadFile ? uploadFile.name : "Choose a file or drop it here"}</strong><span>{uploadFile ? `${fileSize(uploadFile.size)} · Click to choose another file` : "CSV, JSON, PDF, XLSX, or DOCX · up to 5 MB"}</span></label><p className="dl-form-hint"><FileSpreadsheet size={15} />CSV/JSON: price history or financial rows. PDF/XLSX/DOCX: stored attachments; their contents are not automatically analyzed.</p><div className="dl-template-links"><span>Start with a template:</span><a href="/templates/prices.csv" download><ArrowDownToLine size={13} />Price CSV</a><a href="/templates/financials.csv" download><ArrowDownToLine size={13} />Financial CSV</a><a href="/templates/company-data.json" download><FileJson size={13} />JSON example</a></div></> : <div className="dl-form-grid dl-source-fields"><label>Source title<input value={sourceTitle} onChange={event => setSourceTitle(event.target.value)} maxLength={200} placeholder="Annual report — investor relations" required disabled={saving} /></label><label>Website address<input type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://company.com/investors" required disabled={saving} /></label><p className="dl-form-hint dl-full-width"><Link2 size={15} />This saves a reference link. It does not scrape the website or automatically import its data.</p></div>}
        <div className="dl-version-field"><label>Connect to an earlier file <span>(optional)</span><select value={parentId} onChange={event => setParentId(event.target.value)} disabled={saving || !parentOptions.length}><option value="">Start a new file connection</option>{parentOptions.map(item => <option key={item.id} value={item.id}>{item.title} · {kindLabel(item.kind)} · {dateLabel(item.createdAt)}</option>)}</select></label><p>{parentError ? <><CircleAlert size={14} />Previous files are unavailable: {parentError} You can retry by closing and reopening this form.</> : <><History size={14} />Choose an earlier file for the same company, currency, data type, and visibility. The server checks that the connection is valid.</>}</p></div>
        {uploadError && <div className="dl-message dl-message-error" role="alert"><CircleAlert size={16} />{uploadError}</div>}<div className="dl-form-footer"><span><LockKeyhole size={13} />Files stay connected to your account and company.</span><button type="submit" className="dl-button dl-button-primary" disabled={saving || !session.storageReady}>{saving ? <Loader2 size={16} className="dl-spin" /> : uploadMode === "file" ? <UploadCloud size={16} /> : <Link2 size={16} />}{saving ? "Saving…" : uploadMode === "file" ? "Upload and connect" : "Save website reference"}</button></div></form></section>}

      <section className="dl-card dl-library"><div className="dl-card-heading"><div><h2>Connected company files</h2><p>Every item keeps its company, source, visibility, and previous-file connection.</p></div><button className="dl-button dl-button-secondary dl-button-small" onClick={() => { setError(""); void reloadItems(appliedCompany, showArchived); }} disabled={listLoading || !session.storageReady}><RefreshCw size={14} className={listLoading ? "dl-spin" : ""} />Refresh</button></div><div className="dl-library-toolbar"><form className="dl-filter-company" onSubmit={event => { event.preventDefault(); setAppliedCompany(companyFilter.trim().toUpperCase()); setSelectedId(null); const url = new URL(window.location.href); companyFilter.trim() ? url.searchParams.set("symbol", companyFilter.trim().toUpperCase()) : url.searchParams.delete("symbol"); url.searchParams.delete("file"); window.history.replaceState(null, "", url); }}><Search size={16} /><input aria-label="Filter files by stock ticker" value={companyFilter} onChange={event => setCompanyFilter(event.target.value.toUpperCase())} placeholder="Filter by ticker, e.g. AAPL" maxLength={25} /><button type="submit">Apply</button>{appliedCompany && <button type="button" className="dl-filter-clear" aria-label="Show all companies" onClick={() => { setCompanyFilter(""); setAppliedCompany(""); }}><X size={14} /></button>}</form><div className="dl-archive-switch" aria-label="File status"><button className={!showArchived ? "active" : ""} onClick={() => { setShowArchived(false); setSelectedId(null); }}>Active</button><button className={showArchived ? "active" : ""} onClick={() => { setShowArchived(true); setSelectedId(null); }}><Archive size={13} />Archived</button></div></div><div className="dl-kind-tabs" aria-label="File type filters">{([{ value: "all", label: "All files" }, { value: "prices", label: "Price history" }, { value: "financials", label: "Financials" }, { value: "attachment", label: "Reports & attachments" }, { value: "source", label: "Website sources" }] as { value: KindFilter; label: string }[]).map(tab => <button className={filter === tab.value ? "active" : ""} key={tab.value} onClick={() => setFilter(tab.value)} aria-pressed={filter === tab.value}>{tab.label}</button>)}</div>
      {listLoading ? <div className="dl-state dl-state-small"><Loader2 size={22} className="dl-spin" /><p>Loading your company files…</p></div> : visibleItems.length ? <div className="dl-file-list">{visibleItems.map(item => <button key={item.id} className={`dl-file-row ${selectedId === item.id ? "selected" : ""}`} onClick={() => openItem(item.id)}><span className={`dl-kind-icon dl-kind-${item.kind}`}><KindIcon kind={item.kind} /></span><span className="dl-file-main"><strong>{item.title}</strong><span>{item.companyName} · {item.symbol} · {kindLabel(item.kind)}{item.rowCount > 0 ? ` · ${item.rowCount.toLocaleString()} rows` : ""}</span><span className="dl-file-small">{item.ownerName} · {dateLabel(item.createdAt)}</span></span><span className="dl-file-labels">{item.latest && !item.archivedAt && <span className="dl-badge dl-badge-green">Latest version</span>}{item.parentId && <span className="dl-badge"><History size={11} />Linked</span>}<span className="dl-badge">{item.visibility === "shared" ? <Users size={11} /> : <LockKeyhole size={11} />}{item.visibility}</span>{item.archivedAt && <span className="dl-badge">Archived</span>}</span><ChevronRight className="dl-row-chevron" size={17} /></button>)}</div> : <div className="dl-state dl-state-small"><FolderOpen size={31} /><h3>{showArchived ? "No archived files here." : appliedCompany ? `No ${filter === "all" ? "files" : kindLabel(filter as LibraryItem["kind"]).toLowerCase()} for ${appliedCompany} yet.` : "A clear picture starts with your first file."}</h3><p>{showArchived ? "Files you archive can be restored from this list." : "Upload historical stock data, attach a company report, or save a research source."}</p>{!showArchived && <button className="dl-button dl-button-secondary" onClick={() => openUpload("file")} disabled={!session.storageReady}><Plus size={15} />Add your first file</button>}</div>}</section>

      {detailLoading && <div className="dl-card dl-state dl-state-small"><Loader2 size={23} className="dl-spin" /><p>Opening file details…</p></div>}
      {detail && <section className="dl-card dl-detail" ref={detailRef}><div className="dl-card-heading"><div><p className="dl-eyebrow">{detail.item.symbol} · {kindLabel(detail.item.kind)}</p><h2>{detail.item.title}</h2><p>{detail.item.companyName} · {detail.item.currency} · Added {dateLabel(detail.item.createdAt)}</p></div><div className="dl-detail-actions">{detail.item.filename && <a className="dl-button dl-button-secondary dl-button-small" href={`/api/library/${encodeURIComponent(detail.item.id)}/download`}><ArrowDownToLine size={14} />Download original</a>}{canManage && <button className="dl-button dl-button-secondary dl-button-small" onClick={() => void updateItem(detail.item.archivedAt ? "restore" : "archive")} disabled={!!actionBusy}>{actionBusy === "archive" || actionBusy === "restore" ? <Loader2 size={14} className="dl-spin" /> : detail.item.archivedAt ? <RefreshCw size={14} /> : <Archive size={14} />}{detail.item.archivedAt ? "Restore" : "Archive"}</button>}{isAdmin && !detail.item.archivedAt && <button className="dl-button dl-button-secondary dl-button-small" onClick={() => void updateItem(detail.item.visibility === "shared" ? "unshare" : "share")} disabled={!!actionBusy}>{actionBusy === "share" || actionBusy === "unshare" ? <Loader2 size={14} className="dl-spin" /> : <Users size={14} />}{detail.item.visibility === "shared" ? "Make private" : "Share with users"}</button>}<button className="dl-icon-button" aria-label="Close file details" onClick={() => setSelectedId(null)}><X size={18} /></button></div></div>
        <div className="dl-provenance"><span><ShieldCheck size={13} />Uploaded data · accuracy depends on the original source</span><span>{detail.item.rowCount ? `${detail.item.rowCount.toLocaleString()} rows · ` : ""}{detail.item.filename ? fileSize(detail.item.size) : "Saved website reference"} · {detail.item.visibility}</span></div>
        {detail.item.parentId && <div className="dl-linked-version"><History size={16} /><div><strong>Connected to an earlier file</strong><span>{items.find(item => item.id === detail.item.parentId)?.title || "Previous version"}</span></div><button className="dl-button dl-button-ghost dl-button-small" onClick={() => openItem(detail.item.parentId!)}>Open previous<ArrowRight size={14} /></button></div>}
        {items.filter(item => item.parentId === detail.item.id).length > 0 && <div className="dl-next-versions"><span>Next connected files:</span>{items.filter(item => item.parentId === detail.item.id).map(item => <button key={item.id} onClick={() => openItem(item.id)}>{item.title}<ArrowRight size={13} /></button>)}</div>}
        {detail.item.kind === "source" ? <div className="dl-source-detail"><Link2 size={23} /><div><h3>Website research reference</h3><p>This saved link has not been fetched or imported into your financial data.</p>{detail.item.url && validWebsite(detail.item.url) && <a href={validWebsite(detail.item.url)!} target="_blank" rel="noopener noreferrer">{detail.item.url}<ArrowUpRight size={15} /></a>}</div></div> : detail.item.kind === "attachment" ? <div className="dl-source-detail"><FileText size={24} /><div><h3>Supporting company document</h3><p>This report is stored with the company’s files. Its contents have not been extracted or used in calculations. Upload structured CSV or JSON rows to calculate metrics.</p></div></div> : <>
          {detail.analysis?.warnings?.map((warning, index) => <div className="dl-message dl-message-warning" key={index}><CircleAlert size={15} />{warning}</div>)}
          {detail.analysis?.history && detail.analysis.history.length > 1 && <div className="dl-analysis-chart"><div className="dl-section-title"><h3>Uploaded price history</h3><span>{detail.analysis.history[0].date} → {detail.analysis.history[detail.analysis.history.length - 1].date}</span></div><HistoryChart points={detail.analysis.history} currency={detail.item.currency} /></div>}
          <div className="dl-section-title"><h3>What your data tells you</h3><span>{detail.analysis?.period || "Calculated from uploaded rows"}</span></div><div className="dl-analysis-grid">{detail.analysis?.metrics?.map((metric, index) => <article className="dl-analysis-metric" key={`${metric.label}-${index}`}><h4>{metric.label}</h4><strong className={metric.value === null ? "dl-metric-unavailable" : ""}>{metricValue(metric.value, metric.unit, detail.item.currency)}</strong><code>{metric.formula}</code><p>{metric.explanation}</p><a href="/learning">Understand the formula<ArrowUpRight size={12} /></a></article>)}</div>
          {previewRows.length > 0 && <div className="dl-row-preview"><div className="dl-section-title"><h3>Data preview</h3><span>First {previewRows.length} of {detail.item.rowCount.toLocaleString()} rows</span></div><div className="dl-table-scroll"><table><thead><tr>{previewColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{previewRows.map((row, index) => <tr key={index}>{previewColumns.map(column => <td key={column}>{row[column] === null || row[column] === undefined || row[column] === "" ? <span className="dl-cell-missing">Missing</span> : String(row[column])}</td>)}</tr>)}</tbody></table></div><p className="dl-form-hint">Missing values stay missing. A blank cell is never treated as a zero.</p></div>}
        </>}
      </section>}
    </>}
    <p className="dl-bottom-note"><ShieldCheck size={14} />For learning and research. Uploaded data and calculated metrics are not personalized investment advice.</p>
  </div>;
}
