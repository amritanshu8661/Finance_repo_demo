"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, BookOpen, Database, LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import "./workspace-shell.css";

type Session = {
  user: { id: string; displayName: string; email: string; role: "admin" | "user" } | null;
  storageReady: boolean;
  adminConfigured: boolean;
};

export default function WorkspaceShell({ active, children }: { active: "learning" | "data" | "admin"; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Session unavailable");
      return await response.json() as Session;
    }).then(setSession).catch(() => { if (!controller.signal.aborted) setSessionError(true); });
    return () => controller.abort();
  }, []);
  return <div className="ws-shell">
    <header className="ws-header">
      <a className="ws-brand" href="/" aria-label="Stockwise dashboard"><span><BarChart3 size={24} /></span>stockwise<small>LEARN · RESEARCH · UNDERSTAND</small></a>
      <nav className="ws-nav" aria-label="Research workspace navigation">
        <a href="/"><LayoutDashboard size={16} />Dashboard</a>
        <a href="/learning" aria-current={active === "learning" ? "page" : undefined}><BookOpen size={16} />Finance academy</a>
        <a href="/data" aria-current={active === "data" ? "page" : undefined}><Database size={16} />Data library</a>
        {(session?.user?.role === "admin" || active === "admin") && <a href="/admin" aria-current={active === "admin" ? "page" : undefined}><ShieldCheck size={16} />Administration</a>}
      </nav>
      <div className="ws-account">{session?.user ? <><span className="ws-role"><UserRound size={13} />{session.user.role === "admin" ? "Admin" : "User"}</span><span className="ws-account-name" title={session.user.email}>{session.user.displayName}</span><a className="ws-signout" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a></> : sessionError ? <span className="ws-role">Session unavailable</span> : session ? <a className="ws-signin" href={`/signin-with-chatgpt?return_to=${encodeURIComponent(active === "learning" ? "/learning" : active === "admin" ? "/admin" : "/data")}`} target="_top">Sign in<ArrowUpRight size={14} /></a> : <span className="ws-role">Checking session…</span>}</div>
    </header>
    <main className="ws-main"><a className="ws-back" href="/"><ArrowLeft size={14} />Back to company research</a>{children}</main>
    <footer className="ws-footer"><ShieldCheck size={14} />For learning and research. Calculations depend on the inputs and assumptions; they are not personalized investment advice.</footer>
  </div>;
}
