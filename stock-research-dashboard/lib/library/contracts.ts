export type LibraryRole = "admin" | "user";
export type LibraryKind = "prices" | "financials" | "attachment" | "source";
export type LibraryVisibility = "private" | "shared";
export class LibraryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export interface LibraryUser {
  id: string;
  email: string;
  displayName: string;
  role: LibraryRole;
  createdAt?: string;
  rootAdmin?: boolean;
}

export interface LibraryItem {
  id: string;
  symbol: string;
  companyName: string;
  title: string;
  kind: LibraryKind;
  filename: string | null;
  mimeType: string | null;
  size: number;
  rowCount: number;
  currency: string;
  visibility: LibraryVisibility;
  ownerId: string;
  ownerName: string;
  parentId: string | null;
  createdAt: string;
  archivedAt: string | null;
  url: string | null;
  latest: boolean;
}

export interface PriceRow { date: string; close: number; open: number | null; high: number | null; low: number | null; volume: number | null; adjustedClose?: number | null; }
export interface FinancialRow {
  period: string;
  revenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  inventory: number | null;
  cash: number | null;
  receivables: number | null;
  payables: number | null;
  cogs: number | null;
  ebit: number | null;
  interestExpense: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  equity: number | null;
  debt: number | null;
  sharesOutstanding: number | null;
  periodDays?: number | null;
}
export type LibraryRow = PriceRow | FinancialRow;

export interface AnalysisMetric {
  label: string;
  value: number | null;
  unit: "money" | "percent" | "ratio" | "days" | "number";
  formula: string;
  explanation: string;
}
export interface Analysis {
  metrics: AnalysisMetric[];
  history?: { date: string; close: number }[];
  warnings: string[];
  period?: string;
}
export interface ParsedLibraryData { kind: "prices" | "financials"; rows: LibraryRow[]; analysis: Analysis; }
export interface LibraryDetail { item: LibraryItem; rows: LibraryRow[]; analysis: Analysis; }
export interface AuditEvent { id: string; actorId: string; actorEmail: string; action: string; targetId: string | null; detail: string; createdAt: string; }
export interface LibrarySession { user: LibraryUser | null; storageReady: boolean; adminConfigured: boolean; }
export const MAX_LIBRARY_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_LIBRARY_REQUEST_BYTES = MAX_LIBRARY_FILE_BYTES + 64 * 1024;
export const MAX_LIBRARY_ROWS = 10_000;
