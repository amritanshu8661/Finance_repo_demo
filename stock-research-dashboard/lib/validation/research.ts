import { ResearchError } from "@/lib/research/errors";

type ProviderRecord = Record<string, unknown>;

export function validateSymbol(value: unknown): string {
  if (typeof value !== "string") throw new ResearchError("Enter a stock ticker, such as AAPL.", 400);
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-:^]{0,24}$/.test(symbol)) throw new ResearchError("Use a valid stock ticker, such as AAPL or RELIANCE.BSE.", 400);
  return symbol;
}

export function record(value: unknown): ProviderRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as ProviderRecord : {}; }
export function records(value: unknown): ProviderRecord[] { return Array.isArray(value) ? value.map(record) : []; }
export function text(value: unknown): string { return typeof value === "string" ? value : ""; }
export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = Number(typeof value === "string" ? value.replace(/%$/, "") : value);
  return Number.isFinite(n) ? n : null;
}

