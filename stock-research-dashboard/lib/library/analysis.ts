import type { Analysis, AnalysisMetric, FinancialRow, LibraryRow, PriceRow } from "./contracts";

function metric(label: string, value: number | null, unit: AnalysisMetric["unit"], formula: string, explanation: string): AnalysisMetric { return { label, value: value !== null && Number.isFinite(value) ? value : null, unit, formula, explanation }; }
const divide = (a: number | null, b: number | null, factor = 1) => a !== null && b !== null && b > 0 ? a / b * factor : null;
const subtract = (a: number | null, b: number | null) => a !== null && b !== null ? a - b : null;
const average = (a: number | null | undefined, b: number | null | undefined) => typeof a === "number" && typeof b === "number" ? (a + b) / 2 : null;

export function analyzeRows(kind: "prices" | "financials", rows: LibraryRow[]): Analysis {
  if (!rows.length) return { metrics: [], warnings: ["No data rows are available."] };
  if (kind === "prices") {
    const prices = rows as PriceRow[], first = prices[0], last = prices.at(-1)!, prior = prices.at(-2);
    let peak = first.close, drawdown = 0;
    for (const row of prices) { peak = Math.max(peak, row.close); drawdown = Math.min(drawdown, (row.close / peak - 1) * 100); }
    return { period: `${first.date} – ${last.date}`, history: prices.map(({ date, close }) => ({ date, close })), warnings: ["These calculations use the uploaded closing prices. They exclude dividends, fees, taxes, and corporate-action adjustments unless already reflected in your data.", "Stock prices alone cannot determine revenue, profit, assets, liabilities, or financial ratios."], metrics: [
      metric("Latest close", last.close, "money", "Closing price in the last row", `Latest observation: ${last.date}. This is uploaded data, not a live quote.`),
      metric("Price return", (last.close / first.close - 1) * 100, "percent", "(Last close ÷ first close − 1) × 100", "Price-only return over the uploaded date range, not a forecast."),
      metric("Change vs previous observation", prior ? (last.close / prior.close - 1) * 100 : null, "percent", "(Last close ÷ previous close − 1) × 100", "The previous observation may not be the previous trading day."),
      metric("Maximum observed drawdown", drawdown, "percent", "Minimum of (close ÷ prior running peak − 1) × 100", "Largest peak-to-trough fall observed in this uploaded closing-price series."),
      metric("Highest close", Math.max(...prices.map(row => row.close)), "money", "Maximum uploaded close", "Not the intraday high."),
      metric("Lowest close", Math.min(...prices.map(row => row.close)), "money", "Minimum uploaded close", "Not the intraday low."),
    ] };
  }
  const financials = rows as FinancialRow[], last = financials.at(-1)!, previous = financials.at(-2);
  const equity = last.equity ?? subtract(last.assets, last.liabilities);
  const previousEquity = previous ? previous.equity ?? subtract(previous.assets, previous.liabilities) : null;
  const averageAssets = average(last.assets, previous?.assets), averageEquity = average(equity, previousEquity);
  const grossProfit = subtract(last.revenue, last.cogs), workingCapital = subtract(last.currentAssets, last.currentLiabilities);
  const netMargin = divide(last.netIncome, last.revenue, 100), grossMargin = divide(grossProfit, last.revenue, 100);
  const periodDays = last.periodDays ?? 365;
  const dso = divide(average(last.receivables, previous?.receivables), last.revenue, periodDays);
  const dio = divide(average(last.inventory, previous?.inventory), last.cogs, periodDays);
  const dpo = divide(average(last.payables, previous?.payables), last.cogs, periodDays);
  const warnings = ["Figures use the latest uploaded reporting period. Missing inputs and zero or negative ratio denominators produce an unavailable result, never an invented zero.", "ROA, ROE, and working-capital days require a previous row for average balances. Revenue and profit should cover the same reporting period as the balance-sheet inputs."];
  if (last.periodDays == null) warnings.push("Working-capital day calculations assume a 365-day reporting period. Add periodDays for a shorter period.");
  if (last.capex !== null && last.capex < 0) warnings.push("Free cash flow is unavailable because CapEx is negative. Enter cash spending as a positive number to use OCF minus CapEx.");
  return { period: last.period, warnings, metrics: [
    metric("Revenue", last.revenue, "money", "Uploaded revenue", "Sales earned during the latest reporting period."),
    metric("Net profit", last.netIncome, "money", "Uploaded net income", "Profit after recognized expenses, interest, and tax."),
    metric("Gross margin", grossMargin, "percent", "(Revenue − COGS) ÷ revenue × 100", "Requires revenue greater than zero and matching cost-of-sales data."),
    metric("Net margin", netMargin, "percent", "Net income ÷ revenue × 100", "How much profit remains from each unit of revenue."),
    metric("Current ratio", divide(last.currentAssets, last.currentLiabilities), "ratio", "Current assets ÷ current liabilities", "A liquidity measure; interpretation varies by industry."),
    metric("Quick ratio (inventory excluded)", divide(subtract(last.currentAssets, last.inventory), last.currentLiabilities), "ratio", "(Current assets − inventory) ÷ current liabilities", "This simplified version does not exclude prepayments because the upload schema has no prepayments field."),
    metric("Working capital", workingCapital, "money", "Current assets − current liabilities", "Short-term resources minus short-term obligations."),
    metric("Debt to equity", divide(last.debt, equity), "ratio", "Debt ÷ equity", "Uses explicit equity, or assets minus liabilities when equity is absent. Negative equity makes this ratio unavailable."),
    metric("Return on assets", divide(last.netIncome, averageAssets, 100), "percent", "Net income ÷ average total assets × 100", "Average assets = (latest assets + previous assets) ÷ 2."),
    metric("Return on equity", divide(last.netIncome, averageEquity, 100), "percent", "Net income ÷ average equity × 100", "Average equity uses the latest and previous rows. Period returns are not annualized."),
    metric("Interest coverage", divide(last.ebit, last.interestExpense), "ratio", "EBIT ÷ interest expense", "Requires positive interest expense, expressed as a cost."),
    metric("Free cash flow (OCF less CapEx)", last.capex !== null && last.capex >= 0 ? subtract(last.operatingCashFlow, last.capex) : null, "money", "Operating cash flow − positive CapEx spending", "A defined cash-flow proxy; it is not automatically FCFF or FCFE."),
    metric("Revenue growth vs previous row", previous?.revenue !== null && previous?.revenue !== undefined && previous.revenue > 0 && last.revenue !== null ? (last.revenue / previous.revenue - 1) * 100 : null, "percent", "(Latest revenue ÷ previous revenue − 1) × 100", "Compare equivalent periods. This is not necessarily year-on-year growth."),
    metric("Days sales outstanding", dso, "days", "Average receivables ÷ revenue × period days", "Uses total revenue as a proxy for credit sales; this can differ from a credit-sales-only calculation."),
    metric("Days inventory outstanding", dio, "days", "Average inventory ÷ COGS × period days", "Requires a previous inventory balance and positive COGS."),
    metric("Days payable outstanding", dpo, "days", "Average payables ÷ COGS × period days", "Uses COGS as a proxy for purchases."),
    metric("Cash conversion cycle", dso !== null && dio !== null && dpo !== null ? dio + dso - dpo : null, "days", "DIO + DSO − DPO", "Estimated days cash is tied up in the operating cycle."),
  ] };
}

