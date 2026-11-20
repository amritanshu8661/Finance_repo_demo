"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleAlert, ClipboardList, Database, FileText, Loader2, LockKeyhole, RefreshCw, ShieldCheck, ShieldUser, Users, X } from "lucide-react";
import type { AuditEvent, LibraryItem, LibrarySession, LibraryUser } from "@/lib/library/contracts";
import "./data-workspace.css";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "The administration request could not be completed.");
  return payload as T;
}
function dateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminWorkspace() {
  const [session, setSession] = useState<LibrarySession | null>(null), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<LibraryUser[]>([]), [events, setEvents] = useState<AuditEvent[]>([]), [items, setItems] = useState<LibraryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users"), [error, setError] = useState(""), [success, setSuccess] = useState(""), [changingUser, setChangingUser] = useState<string | null>(null);
  const refreshSequence = useRef(0);

  const loadAdmin = useCallback(async () => {
    const sequence = ++refreshSequence.current; setRefreshing(true);
    try {
      const results = await Promise.all([
        request<{ users: LibraryUser[] }>("/api/admin/users"),
        request<{ events: AuditEvent[] }>("/api/admin/audit"),
        request<{ items: LibraryItem[] }>("/api/library"),
      ]);
      if (sequence === refreshSequence.current) { setUsers(results[0].users); setEvents(results[1].events); setItems(results[2].items); }
    } catch (reason) { if (sequence === refreshSequence.current) setError(reason instanceof Error ? reason.message : "Administration data could not be loaded."); }
    finally { if (sequence === refreshSequence.current) setRefreshing(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    request<LibrarySession>("/api/me", { signal: controller.signal }).then(payload => {
      if (controller.signal.aborted) return;
      setSession(payload);
      if (payload.user?.role === "admin" && payload.storageReady) void loadAdmin();
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "We couldn’t check your permissions."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); refreshSequence.current++; };
  }, [loadAdmin]);

  async function changeRole(user: LibraryUser, role: "admin" | "user") {
    if (role === user.role) return;
    setChangingUser(user.id); setError(""); setSuccess("");
    try {
      await request("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, role }) });
      await loadAdmin();
      setSuccess(`${user.displayName || user.email} now has the ${role} role.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The role could not be changed."); }
    finally { setChangingUser(null); }
  }

  const adminCount = users.filter(user => user.role === "admin").length;
  return <div className="dl-workspace">
    <div className="dl-page-heading"><div><p className="dl-eyebrow">KEEP THE WORKSPACE CONNECTED</p><h1>Administration</h1><p>Manage roles, shared company files, and the history of important changes.</p></div>{session?.user?.role === "admin" && <button className="dl-button dl-button-secondary" onClick={() => { setError(""); void loadAdmin(); }} disabled={refreshing || !session.storageReady}><RefreshCw size={15} className={refreshing ? "dl-spin" : ""} />Refresh workspace</button>}</div>
    {error && <div className="dl-message dl-message-error" role="alert"><CircleAlert size={17} /><span>{error}</span><button className="dl-icon-button" aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
    {success && <div className="dl-message dl-message-success" role="status"><Check size={17} /><span>{success}</span><button className="dl-icon-button" aria-label="Dismiss message" onClick={() => setSuccess("")}><X size={16} /></button></div>}
    {loading ? <div className="dl-state"><Loader2 size={24} className="dl-spin" /><p>Checking your workspace permissions…</p></div> : !session?.user ? <div className="dl-card dl-state"><LockKeyhole size={31} /><h2>Sign in to continue.</h2><p>Administration is available only to accounts with an admin role.</p><a href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top" className="dl-button dl-button-primary">Sign in with ChatGPT<ArrowRight size={15} /></a></div> : session.user.role !== "admin" ? <div className="dl-card dl-state"><ShieldCheck size={33} /><h2>This section is for administrators.</h2><p>You are signed in as a user. Your files and shared company datasets are available in the data library.</p><a href="/data" className="dl-button dl-button-primary">Open data library<ArrowRight size={15} /></a>{!session.adminConfigured && <p className="dl-muted">No administrator has been configured yet. The site owner can finish this in the server settings.</p>}</div> : <>
      <div className="dl-info-strip"><span><ShieldUser size={17} />Admin account</span><p>Permissions are checked by the server. Private files remain restricted to their owner and admins.</p><span className="dl-role-badge">{session.user.displayName || session.user.email}</span></div>
      {!session.storageReady ? <div className="dl-message dl-message-warning"><Database size={18} /><div><strong>Persistent storage needs to be connected.</strong><p>Configure the database and file-storage bindings, then apply the project migrations. Role management and audit records need the database.</p></div></div> : <>
        <div className="dl-admin-stats"><article className="dl-card"><span><Users size={19} />Workspace members</span><strong>{users.length}</strong><p>Accounts that have signed in</p></article><article className="dl-card"><span><ShieldCheck size={19} />Administrators</span><strong>{adminCount}</strong><p>Roles with data-management access</p></article><article className="dl-card"><span><FileText size={19} />Active company files</span><strong>{items.length}</strong><p>{items.filter(item => item.visibility === "shared").length} shared · {items.filter(item => item.visibility === "private").length} private</p></article></div>
        <div className="dl-card dl-admin-file-link"><span className="dl-kind-icon"><Database size={22} /></span><div><h2>One library. Every company connection.</h2><p>Review uploaded datasets, attached reports, website sources, and previous-file links. Share or archive files from their details.</p></div><a href="/data" className="dl-button dl-button-primary">Manage company files<ArrowRight size={15} /></a></div>
        <section className="dl-card dl-admin-members"><div className="dl-kind-tabs dl-admin-tabs"><button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}><Users size={15} />Users & roles</button><button className={activeTab === "audit" ? "active" : ""} onClick={() => setActiveTab("audit")}><ClipboardList size={15} />Activity log</button></div>
          {refreshing && !users.length ? <div className="dl-state dl-state-small"><Loader2 size={22} className="dl-spin" /><p>Loading administration data…</p></div> : activeTab === "users" ? <><div className="dl-admin-explainer"><h2>A clear role for every account.</h2><p>Users can manage their own private files and read shared files. Admins can manage all company files and assign roles. The configured site-owner admin is protected.</p></div><div className="dl-table-scroll"><table className="dl-users-table"><thead><tr><th>Account</th><th>Joined</th><th>Access role</th><th>Role management</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="dl-user-cell"><span className="dl-user-avatar">{(user.displayName || user.email || "U").slice(0, 2).toUpperCase()}</span><span><strong>{user.displayName || user.email}{user.id === session.user!.id && <small>You</small>}</strong><span>{user.email}</span></span></div></td><td>{dateLabel(user.createdAt)}</td><td><span className={`dl-badge ${user.role === "admin" ? "dl-badge-green" : ""}`}>{user.role === "admin" ? <ShieldCheck size={12} /> : <Users size={12} />}{user.role}</span>{user.rootAdmin && <span className="dl-root-admin">Protected owner</span>}</td><td><label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.displayName || user.email}</label><select id={`role-${user.id}`} value={user.role} onChange={event => void changeRole(user, event.target.value as "admin" | "user")} disabled={!!changingUser || user.rootAdmin || user.id === session.user!.id} aria-describedby={user.rootAdmin || user.id === session.user!.id ? "role-protection-note" : undefined}><option value="user">User</option><option value="admin">Admin</option></select>{changingUser === user.id && <Loader2 className="dl-spin dl-inline-spinner" size={14} />}</td></tr>)}</tbody></table></div><p className="dl-admin-footnote" id="role-protection-note">Site access and app roles are separate. Share the private site with a person first; after they sign in, their account appears here. Assigning an app role does not change the site’s audience.</p></> : <><div className="dl-admin-explainer"><h2>A history you can follow.</h2><p>File uploads, changes to sharing, archiving, restoration, and role changes leave an activity record.</p></div>{events.length ? <div className="dl-audit-list">{events.map(event => <article key={event.id}><span className="dl-audit-icon"><HistoryIcon action={event.action} /></span><div><div className="dl-audit-title"><strong>{event.action.replace(/[._-]/g, " ")}</strong><time dateTime={event.createdAt}>{dateLabel(event.createdAt)}</time></div><p>{event.detail}</p><span>{event.actorEmail}{event.targetId ? ` · Item ${event.targetId.slice(0, 12)}…` : ""}</span></div></article>)}</div> : <div className="dl-state dl-state-small"><ClipboardList size={29} /><h3>No recorded changes yet.</h3><p>Activity appears after files are uploaded or administration settings change.</p></div>}</>}
        </section>
      </>}
    </>}
    <p className="dl-bottom-note"><ShieldCheck size={14} />Keep private company files private. Share only the data your workspace should use.</p>
  </div>;
}

function HistoryIcon({ action }: { action: string }) {
  return /role|user/.test(action) ? <Users size={17} /> : /share/.test(action) ? <ShieldCheck size={17} /> : <FileText size={17} />;
}
