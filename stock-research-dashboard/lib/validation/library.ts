import { LibraryError, MAX_LIBRARY_FILE_BYTES, MAX_LIBRARY_ROWS, type FinancialRow, type LibraryRow, type ParsedLibraryData, type PriceRow } from "@/lib/library/contracts";
import { analyzeRows } from "@/lib/library/analysis";

export { analyzeRows } from "@/lib/library/analysis";
export { safeCsvCell } from "@/lib/library/csv";

const priceFields = ["date", "close", "open", "high", "low", "volume", "adjustedClose"] as const;
const financialFields = ["period", "revenue", "netIncome", "assets", "liabilities", "currentAssets", "currentLiabilities", "inventory", "cash", "receivables", "payables", "cogs", "ebit", "interestExpense", "operatingCashFlow", "capex", "equity", "debt", "sharesOutstanding", "periodDays"] as const;
const aliases: Record<string, string> = {
  date: "date", tradingdate: "date", timestamp: "date", close: "close", closingprice: "close", price: "close", adjustedclose: "adjustedClose", adjclose: "adjustedClose",
  open: "open", high: "high", low: "low", volume: "volume", period: "period", fiscaldateending: "period", fiscalperiod: "period", fiscalyearend: "period", yearend: "period",
  revenue: "revenue", totalrevenue: "revenue", sales: "revenue", netincome: "netIncome", netprofit: "netIncome", profit: "netIncome",
  assets: "assets", totalassets: "assets", liabilities: "liabilities", totalliabilities: "liabilities", currentassets: "currentAssets", currentliabilities: "currentLiabilities",
  inventory: "inventory", cash: "cash", cashandcashequivalents: "cash", receivables: "receivables", accountsreceivable: "receivables", payables: "payables", accountspayable: "payables",
  cogs: "cogs", costofgoodssold: "cogs", costofrevenue: "cogs", ebit: "ebit", operatingprofit: "ebit", operatingincome: "ebit", interestexpense: "interestExpense",
  operatingcashflow: "operatingCashFlow", ocf: "operatingCashFlow", capex: "capex", capitalexpenditure: "capex", capitalexpenditures: "capex", equity: "equity", shareholdersequity: "equity", totalshareholderequity: "equity",
  debt: "debt", totaldebt: "debt", sharesoutstanding: "sharesOutstanding", shares: "sharesOutstanding", perioddays: "periodDays", symbol: "symbol", ticker: "symbol",
};

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false, closedQuote = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted = false; closedQuote = true; }
      else value += c;
      continue;
    }
    if (c === '"') {
      if (value.trim() || closedQuote) throw new LibraryError(`Malformed CSV near row ${rows.length + 1}: a quote appears inside an unquoted field.`);
      value = ""; quoted = true; continue;
    }
    if (closedQuote && c !== "," && c !== "\r" && c !== "\n" && c !== " " && c !== "\t") throw new LibraryError(`Malformed CSV near row ${rows.length + 1}: unexpected text after a closing quote.`);
    if (c === ",") { row.push(value); value = ""; closedQuote = false; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
      if (rows.length > MAX_LIBRARY_ROWS + 1) throw new LibraryError("Use a file with no more than 10,000 data rows.");
      row = []; value = ""; closedQuote = false;
    } else if (!closedQuote) value += c;
  }
  if (quoted) throw new LibraryError("Malformed CSV: a quoted field was not closed.");
  row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

function fieldName(value: string): string {
  const normalized = value.trim().replace(/[\s_.-]/g, "").toLowerCase();
  const name = aliases[normalized];
  if (!name || Object.hasOwn(Object.prototype, normalized)) throw new LibraryError(`Unknown column “${value.slice(0, 60)}”. Use one of the downloadable templates.`);
  return name;
}

export function numericValue(value: unknown, field: string, row: number): number | null {
  if (value === null || value === undefined || (typeof value === "string" && (!value.trim() || /^(?:n\/?a|null|none|—|-)$/i.test(value.trim())))) return null;
  if (typeof value !== "number" && typeof value !== "string") throw new LibraryError(`Row ${row}: ${field} must contain a number or an empty cell.`);
  let raw = typeof value === "string" ? value.trim() : String(value);
  if (/^\(.*\)$/.test(raw)) raw = `-${raw.slice(1, -1)}`;
  if (raw.includes(",")) {
    if (!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(raw)) throw new LibraryError(`Row ${row}: ${field} has invalid thousands separators.`);
    raw = raw.replaceAll(",", "");
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) throw new LibraryError(`Row ${row}: ${field} must be a plain number, without currency signs or spreadsheet formulas.`);
  const number = Number(raw);
  if (!Number.isFinite(number) || Math.abs(number) > 1e18) throw new LibraryError(`Row ${row}: ${field} is outside the supported numeric range.`);
  return number;
}

function isoDate(value: unknown, field: string, row: number): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) throw new LibraryError(`Row ${row}: ${field} must use YYYY-MM-DD, such as 2025-12-31.`);
  const date = value.trim();
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new LibraryError(`Row ${row}: ${field} is not a valid calendar date.`);
  return date;
}

function canonicalRows(rawRows: Record<string, unknown>[], explicitKind?: unknown, expectedSymbol?: string): { kind: "prices" | "financials"; rows: LibraryRow[] } {
  if (!rawRows.length) throw new LibraryError("The file has no data rows.");
  if (rawRows.length > MAX_LIBRARY_ROWS) throw new LibraryError("Use a file with no more than 10,000 data rows.");
  const mapped = rawRows.map((row, i) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new LibraryError(`Row ${i + 2} must be a data object.`);
    const result: Record<string, unknown> = Object.create(null);
    for (const [key, value] of Object.entries(row)) {
      const name = fieldName(key);
      if (Object.hasOwn(result, name)) throw new LibraryError(`Row ${i + 2} contains duplicate aliases for ${name}.`);
      result[name] = value;
    }
    if (result.symbol !== undefined && expectedSymbol && String(result.symbol).trim().toUpperCase() !== expectedSymbol) throw new LibraryError(`Row ${i + 2}: its ticker differs from ${expectedSymbol}. Upload one company per file.`);
    return result;
  });
  const kind = explicitKind ?? (Object.hasOwn(mapped[0], "date") && Object.hasOwn(mapped[0], "close") ? "prices" : Object.hasOwn(mapped[0], "period") && Object.hasOwn(mapped[0], "revenue") ? "financials" : null);
  if (kind !== "prices" && kind !== "financials") throw new LibraryError("Use date and close columns for prices, or period and revenue columns for financial statements.");
  const fields = kind === "prices" ? priceFields : financialFields;
  const dates = new Set<string>();
  const rows = mapped.map((input, index): LibraryRow => {
    const rowNumber = index + 2;
    for (const key of Object.keys(input)) if (key !== "symbol" && !(fields as readonly string[]).includes(key)) throw new LibraryError(`Row ${rowNumber}: ${key} is not a ${kind} column. Keep price history and financial statements in separate files.`);
    const dateField = kind === "prices" ? "date" : "period";
    const date = isoDate(input[dateField], dateField, rowNumber);
    if (dates.has(date)) throw new LibraryError(`Duplicate ${dateField} ${date}. Each date must appear once per file.`);
    dates.add(date);
    const result: Record<string, unknown> = { [dateField]: date };
    for (const field of fields) if (field !== dateField) result[field] = numericValue(input[field], field, rowNumber);
    if (kind === "prices") {
      if (result.close === null || (result.close as number) <= 0) throw new LibraryError(`Row ${rowNumber}: close must be greater than zero.`);
      for (const field of ["open", "high", "low", "adjustedClose"]) if (result[field] !== null && (result[field] as number) <= 0) throw new LibraryError(`Row ${rowNumber}: ${field} must be greater than zero when supplied.`);
      if (result.volume !== null && (!Number.isInteger(result.volume) || (result.volume as number) < 0)) throw new LibraryError(`Row ${rowNumber}: volume must be a nonnegative whole number.`);
      if (result.high !== null && result.low !== null && (result.high as number) < (result.low as number)) throw new LibraryError(`Row ${rowNumber}: high must be at least low.`);
      if (result.high !== null && (result.close as number) > (result.high as number)) throw new LibraryError(`Row ${rowNumber}: close cannot exceed high.`);
      if (result.low !== null && (result.close as number) < (result.low as number)) throw new LibraryError(`Row ${rowNumber}: close cannot be below low.`);
      if (result.open !== null && result.high !== null && (result.open as number) > (result.high as number)) throw new LibraryError(`Row ${rowNumber}: open cannot exceed high.`);
      if (result.open !== null && result.low !== null && (result.open as number) < (result.low as number)) throw new LibraryError(`Row ${rowNumber}: open cannot be below low.`);
      return result as unknown as PriceRow;
    }
    if (result.revenue === null) throw new LibraryError(`Row ${rowNumber}: revenue is required; other unavailable figures can be empty.`);
    if (result.periodDays !== null && (!Number.isInteger(result.periodDays) || (result.periodDays as number) < 1 || (result.periodDays as number) > 366)) throw new LibraryError(`Row ${rowNumber}: periodDays must be a whole number from 1 to 366.`);
    if (result.sharesOutstanding !== null && (result.sharesOutstanding as number) <= 0) throw new LibraryError(`Row ${rowNumber}: sharesOutstanding must be greater than zero.`);
    return result as unknown as FinancialRow;
  });
  rows.sort((a, b) => ("date" in a ? a.date : a.period).localeCompare("date" in b ? b.date : b.period));
  return { kind, rows };
}

export function parseDataFile(filename: string, bytes: Uint8Array, expectedSymbol?: string): ParsedLibraryData {
  if (!bytes.byteLength) throw new LibraryError("Choose a file that contains data.");
  if (bytes.byteLength > MAX_LIBRARY_FILE_BYTES) throw new LibraryError("The maximum file size is 5 MB.", 413);
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new LibraryError("Save the data file as UTF-8 CSV or JSON before uploading."); }
  if (text.includes("\0")) throw new LibraryError("The data file contains unsupported binary content.");
  let parsed: { kind: "prices" | "financials"; rows: LibraryRow[] };
  if (filename.toLowerCase().endsWith(".csv")) {
    const csv = parseCsv(text);
    if (csv.length < 2) throw new LibraryError("A CSV file needs a header row and at least one data row.");
    const headers = csv[0];
    if (headers.length > 25) throw new LibraryError("The file contains too many columns. Use a downloadable template.");
    const canonical = headers.map(fieldName);
    if (new Set(canonical).size !== canonical.length) throw new LibraryError("Column names must be unique, including alternate names for the same field.");
    const objects = csv.slice(1).map((row, i) => { if (row.length !== headers.length) throw new LibraryError(`Row ${i + 2} has ${row.length} cells; the header has ${headers.length}. Check commas and quoted fields.`); return Object.fromEntries(headers.map((header, j) => [header, row[j]])); });
    parsed = canonicalRows(objects, undefined, expectedSymbol);
  } else if (filename.toLowerCase().endsWith(".json")) {
    let input: unknown;
    try { input = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { throw new LibraryError("The JSON file is not valid JSON."); }
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new LibraryError("JSON must contain an object with kind and rows fields.");
    const object = input as Record<string, unknown>;
    if (Object.keys(object).some(key => !["kind", "rows"].includes(key)) || !Array.isArray(object.rows)) throw new LibraryError("JSON must contain only kind and rows fields.");
    parsed = canonicalRows(object.rows as Record<string, unknown>[], object.kind, expectedSymbol);
  } else throw new LibraryError("Use CSV or JSON for data analysis. Other supported documents are stored as attachments only.");
  return { ...parsed, analysis: analyzeRows(parsed.kind, parsed.rows) };
}

export function validateAttachment(filename: string, bytes: Uint8Array): string {
  const extension = filename.toLowerCase().split(".").at(-1);
  if (extension === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if ((extension === "xlsx" || extension === "docx") && bytes[0] === 0x50 && bytes[1] === 0x4b && [[0x03, 0x04], [0x05, 0x06], [0x07, 0x08]].some(([a, b]) => bytes[2] === a && bytes[3] === b)) return extension === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  throw new LibraryError("Upload CSV/JSON data or a recognizable PDF, XLSX, or DOCX attachment. Macro-enabled file extensions and executable formats are not supported.");
}

export function field(value: unknown, name: string, maximum: number, optional = false): string {
  if (typeof value !== "string" || (!optional && !value.trim()) || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) throw new LibraryError(`${name} must be ${optional ? "at most" : "between 1 and"} ${maximum} characters, without control characters.`);
  return value.trim();
}
export function validLibraryId(value: string): string {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new LibraryError("This file identifier is not valid.");
  return value;
}
export function validCompanySymbol(value: unknown): string {
  const symbol = field(value, "Ticker", 25).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-:^]{0,24}$/.test(symbol)) throw new LibraryError("Enter a valid company ticker, such as AAPL or RELIANCE.BSE.");
  return symbol;
}
export function validateSourceUrl(value: unknown): string {
  const raw = field(value, "Website link", 2000);
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw new Error("Unsafe URL");
    return url.href;
  } catch { throw new LibraryError("Use a complete HTTPS website link without embedded sign-in credentials."); }
}

