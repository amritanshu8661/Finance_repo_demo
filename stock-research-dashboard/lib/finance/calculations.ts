/** Pure educational calculations. Percentage inputs and outputs use human units (10 = 10%). */
export type FinanceUnit = "money" | "percent" | "ratio" | "days" | "months" | "number";
export type FinanceInput = { id: string; label: string; example: string; hint?: string; kind?: "cashflows"; min?: number; max?: number; integer?: boolean };
export type FinanceCalculator = { id: string; title: string; stage: number; formula: string; explanation: string; inputs: FinanceInput[]; unit: FinanceUnit; assumptions: string; source?: string };
export type FinanceCalculation = { value: number; unit: FinanceUnit; note: string };
export class FinanceCalculationError extends Error { constructor(message: string) { super(message); this.name = "FinanceCalculationError"; } }
const input = (id: string, label: string, example: number, options: Partial<FinanceInput> = {}): FinanceInput => ({ id, label, example: String(example), ...options });
const rate = (id: string, label: string, example: number, options: Partial<FinanceInput> = {}) => input(id, `${label} (%)`, example, { min: -99.999, hint: "Enter 10 for 10%, not 0.10.", ...options });
const amount = (id: string, label: string, example: number) => input(id, label, example);
const positive = (id: string, label: string, example: number) => input(id, label, example, { min: 0 });
const flows: FinanceInput = { id: "cashflows", label: "Cash flows, beginning at time 0", example: "-1000, 400, 450, 500", kind: "cashflows", hint: "Comma-separated amounts at equal intervals. Include the initial investment as a negative first value." };
const sourceAccounting = "https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements";
const sourceValuation = "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation";
const sourceTime = "https://support.microsoft.com/en-us/excel/go-with-the-cash-flow-calculate-npv-and-irr-in-excel";
const calc = (id: string, title: string, stage: number, formula: string, explanation: string, inputs: FinanceInput[], unit: FinanceUnit, assumptions: string, source?: string): FinanceCalculator => ({ id, title, stage, formula, explanation, inputs, unit, assumptions, source });
export const FINANCE_CALCULATORS: FinanceCalculator[] = [
  calc("simple-interest", "Simple interest", 1, "Interest = principal × annual rate × years", "Interest calculated only on the starting amount.", [positive("principal", "Principal", 1000), rate("rate", "Annual interest rate", 8), positive("years", "Years", 3)], "money", "Rate is annual. The result is interest only, before taxes and fees."),
  calc("compound-value", "Compound future value", 1, "FV = P × (1 + r / m)^(m × t)", "Growth when accumulated interest also earns interest.", [positive("principal", "Principal", 1000), rate("rate", "Nominal annual rate", 8), input("periods", "Compounding periods per year", 12, { min: 1, max: 366, integer: true }), positive("years", "Years", 5)], "money", "Constant rate and no additional deposits, withdrawals, taxes, or fees. Periodic rate must exceed −100%."),
  calc("holding-return", "Holding-period return", 1, "Return = (ending value − starting value + distributions) / starting value × 100", "Measures total gain or loss over the chosen holding period.", [positive("start", "Starting value", 1000), positive("end", "Ending value", 1100), amount("income", "Cash distributions", 20)], "percent", "Not annualized. Include distributions once and account for costs separately."),
  calc("real-return", "Inflation-adjusted return", 1, "Real return = [(1 + nominal return) / (1 + inflation) − 1] × 100", "Shows the change in purchasing power.", [rate("nominal", "Nominal return", 8, { min: -100 }), rate("inflation", "Inflation", 3)], "percent", "Both rates cover the same period; inflation must exceed −100%."),
  calc("equity", "Accounting equity", 2, "Equity = assets − liabilities", "The residual accounting interest belonging to owners.", [positive("assets", "Total assets", 3000), positive("liabilities", "Total liabilities", 1200)], "money", "Use the same entity, currency, date, and accounting basis.", sourceAccounting),
  calc("straight-depreciation", "Straight-line depreciation", 2, "Annual depreciation = (asset cost − residual value) / useful life", "Spreads a depreciable amount evenly over its useful life.", [positive("cost", "Asset cost", 10000), positive("residual", "Residual value", 1000), positive("life", "Useful life in years", 5)], "money", "Simplified full-year charge. Residual value cannot exceed cost. Actual reporting can require partial years and impairment."),
  calc("gross-profit", "Gross profit", 3, "Gross profit = revenue − COGS", "The amount left after directly attributable cost of sales.", [positive("revenue", "Revenue", 1000), positive("cogs", "Cost of goods sold", 600)], "money", "Use costs and revenue for the same reporting period.", sourceAccounting),
  calc("ebitda", "EBITDA bridge", 3, "EBITDA = EBIT + depreciation + amortization", "Adds depreciation and amortization back to operating earnings.", [amount("ebit", "EBIT", 150), positive("depreciation", "Depreciation", 20), positive("amortization", "Amortization", 10)], "money", "EBITDA is not operating cash flow. Definitions and adjustments vary; reconcile to reported figures."),
  calc("free-cash-flow", "Simple free cash flow", 3, "FCF = operating cash flow − capital expenditure", "A common starting definition of cash after capital spending.", [amount("ocf", "Operating cash flow", 200), positive("capex", "Capital expenditure (positive outflow)", 75)], "money", "CapEx is entered as a positive outflow. This simple measure is not automatically FCFF or FCFE.", sourceValuation),
  calc("gross-margin", "Gross margin", 4, "Gross margin = gross profit / revenue × 100", "The percentage of revenue left after cost of sales.", [amount("profit", "Gross profit", 400), positive("revenue", "Revenue", 1000)], "percent", "Revenue must be positive. Compare consistent business models and accounting periods.", sourceAccounting),
  calc("operating-margin", "Operating margin", 4, "Operating margin = operating profit / revenue × 100", "The share of sales remaining after operating expenses.", [amount("profit", "Operating profit", 150), positive("revenue", "Revenue", 1000)], "percent", "Revenue must be positive. Operating profit is not necessarily the provider's adjusted EBIT."),
  calc("net-margin", "Net margin", 4, "Net margin = net profit / revenue × 100", "The portion of revenue remaining after all recognized expenses.", [amount("profit", "Net profit", 100), positive("revenue", "Revenue", 1000)], "percent", "Revenue must be positive. A negative result indicates a loss, not a guaranteed future outcome.", sourceAccounting),
  calc("current-ratio", "Current ratio", 4, "Current ratio = current assets / current liabilities", "Compares near-term assets with near-term obligations.", [positive("currentAssets", "Current assets", 500), positive("currentLiabilities", "Current liabilities", 250)], "ratio", "Current liabilities must be positive. A ratio alone does not establish liquidity quality.", sourceAccounting),
  calc("quick-ratio", "Quick ratio", 4, "Quick ratio = (cash + marketable securities + receivables) / current liabilities", "Focuses on more liquid current assets.", [positive("cash", "Cash", 100), positive("securities", "Marketable securities", 50), positive("receivables", "Receivables", 150), positive("currentLiabilities", "Current liabilities", 250)], "ratio", "Excludes inventory and prepayments. The collectible value of receivables still matters."),
  calc("debt-equity", "Debt-to-equity", 4, "Debt-to-equity = interest-bearing debt / equity", "Shows borrowing relative to the accounting equity base.", [positive("debt", "Interest-bearing debt", 600), positive("equity", "Equity", 1000)], "ratio", "This version uses interest-bearing debt, not all liabilities. Equity must be positive; negative equity makes the usual ratio unhelpful."),
  calc("interest-coverage", "Interest coverage", 4, "Interest coverage = EBIT / interest expense", "Compares operating earnings with borrowing interest.", [amount("ebit", "EBIT", 150), positive("interest", "Interest expense", 30)], "ratio", "Positive interest expense is required. Negative EBIT produces negative coverage; review debt terms and cash flows."),
  calc("roa", "Return on assets", 4, "ROA = net profit / average total assets × 100", "Profit earned relative to the average asset base.", [amount("profit", "Net profit", 100), positive("averageAssets", "Average total assets", 2000)], "percent", "Average assets usually mean opening plus closing assets divided by two. Align periods and annualization."),
  calc("roe", "Return on equity", 4, "ROE = profit attributable to common holders / average common equity × 100", "Returns earned relative to owners' average book equity.", [amount("profit", "Profit attributable to common holders", 100), positive("averageEquity", "Average common equity", 1000)], "percent", "Average equity must be positive. Leverage and share repurchases can materially change the ratio."),
  calc("roic", "Return on invested capital", 4, "ROIC = EBIT × (1 − tax rate) / average invested capital × 100", "After-tax operating earnings relative to operating capital invested.", [amount("ebit", "EBIT", 150), rate("tax", "Applicable operating tax rate", 25, { min: 0, max: 100 }), positive("capital", "Average invested capital", 1000)], "percent", "Define invested capital consistently. This uses a simplified tax adjustment, not a complete tax model.", sourceValuation),
  calc("asset-turnover", "Asset turnover", 4, "Asset turnover = revenue / average total assets", "Revenue generated for each unit of average assets.", [positive("revenue", "Revenue", 1000), positive("averageAssets", "Average total assets", 2000)], "ratio", "Use matching periods; compare companies with similar asset and accounting profiles."),
  calc("contribution", "Contribution margin", 5, "Contribution = sales − variable costs", "The amount available to cover fixed costs and then profit.", [positive("sales", "Sales", 1000), positive("variable", "Variable costs", 600)], "money", "Choose either total amounts or unit amounts consistently."),
  calc("break-even", "Break-even units", 5, "Break-even units = fixed costs / (unit price − variable cost per unit)", "The whole number of units needed to cover modeled costs.", [positive("fixed", "Fixed costs", 10000), positive("price", "Unit selling price", 50), positive("variable", "Variable cost per unit", 30)], "number", "Rounded up to a whole unit. Requires positive unit contribution and stable costs and prices within the relevant range."),
  calc("cac", "Customer acquisition cost", 5, "CAC = acquisition spending / new customers acquired", "Average spending per newly acquired customer.", [positive("spending", "Acquisition spending", 10000), positive("customers", "New customers acquired", 100)], "money", "Match the acquisition cohort and spending window; include the intended sales and marketing costs."),
  calc("ltv", "Simple subscription LTV", 5, "LTV ≈ monthly ARPU × gross margin / monthly customer churn", "A simplified estimate of lifetime gross profit per customer.", [positive("arpu", "Monthly ARPU", 100), rate("margin", "Gross margin", 70, { min: 0, max: 100 }), rate("churn", "Monthly customer churn", 5, { min: 0, max: 100 })], "money", "Undiscounted steady-state approximation. Assumes constant ARPU, margin, and churn; excludes CAC. Not a complete customer DCF."),
  calc("churn", "Customer churn", 5, "Churn = customers lost / customers at start × 100", "The fraction of the opening customer base lost in a period.", [positive("lost", "Customers lost", 5), positive("start", "Customers at start", 100)], "percent", "This is customer churn, not revenue churn. Lost customers cannot exceed the starting cohort."),
  calc("arpu", "Average revenue per user", 5, "ARPU = period revenue / relevant average users", "Average revenue associated with one user during a period.", [positive("revenue", "Period revenue", 10000), positive("users", "Average users", 100)], "money", "Use a user base and time period consistent with the revenue."),
  calc("working-capital", "Working capital", 6, "Working capital = current assets − current liabilities", "The balance of short-term assets after short-term obligations.", [positive("currentAssets", "Current assets", 500), positive("currentLiabilities", "Current liabilities", 250)], "money", "A balance-sheet snapshot. Operating working capital commonly excludes cash and debt."),
  calc("dso", "Days sales outstanding", 6, "DSO = average receivables / credit sales × days in period", "Estimates how long credit sales take to collect.", [positive("receivables", "Average trade receivables", 100), positive("sales", "Credit sales for the period", 1000), input("days", "Days in period", 365, { min: 1, integer: true })], "days", "Use credit sales when available and average receivables for the matching period."),
  calc("dio", "Days inventory outstanding", 6, "DIO = average inventory / COGS × days in period", "Estimates the time inventory remains on hand.", [positive("inventory", "Average inventory", 100), positive("cogs", "COGS for the period", 600), input("days", "Days in period", 365, { min: 1, integer: true })], "days", "Uses average inventory and positive COGS over the same period."),
  calc("dpo", "Days payable outstanding", 6, "DPO = average trade payables / credit purchases × days in period", "Estimates time taken to pay trade suppliers.", [positive("payables", "Average trade payables", 100), positive("purchases", "Credit purchases for the period", 600), input("days", "Days in period", 365, { min: 1, integer: true })], "days", "Credit purchases are preferred. COGS may be a disclosed proxy, but can differ from purchases."),
  calc("cash-cycle", "Cash conversion cycle", 6, "CCC = DIO + DSO − DPO", "Connects inventory holding, customer collection, and supplier payments.", [positive("dio", "Inventory days (DIO)", 60), positive("dso", "Receivable days (DSO)", 35), positive("dpo", "Payable days (DPO)", 45)], "days", "Components must use compatible periods and definitions. A negative cycle is possible."),
  calc("runway", "Cash runway", 6, "Runway = available cash / monthly net cash burn", "Months the modeled cash can support a constant net burn.", [positive("cash", "Available cash", 120000), positive("burn", "Monthly net cash burn", 10000)], "months", "Net burn must be positive. Cash generation has no finite burn-based runway; this excludes financing changes."),
  calc("cash-budget", "Closing cash budget", 6, "Closing cash = opening cash + receipts − payments", "Links the opening cash balance with expected cash movement.", [amount("opening", "Opening cash", 10000), positive("receipts", "Cash receipts", 5000), positive("payments", "Cash payments", 4500)], "money", "Forecast only. Include financing and investing receipts/payments when relevant."),
  calc("variance", "Budget variance", 7, "Variance = actual − budget", "Shows the absolute difference from a plan.", [amount("actual", "Actual result", 1100), amount("budget", "Budget", 1000)], "money", "A positive variance is not always favorable; the interpretation differs for revenue and expenses."),
  calc("revenue-growth", "Period growth", 7, "Growth = (current − previous) / |previous| × 100", "Measures relative movement from a previous result.", [amount("current", "Current result", 1100), amount("previous", "Previous result", 1000)], "percent", "Uses the absolute previous value as denominator. With a negative baseline, interpret carefully; zero has no defined percentage growth."),
  calc("driver-revenue", "Driver-based revenue", 7, "Revenue = active customers × purchases per customer × price per purchase", "Connects a forecast to customer volume and pricing.", [positive("customers", "Active customers", 100), positive("frequency", "Purchases per customer", 12), positive("price", "Price per purchase", 25)], "money", "All inputs cover the same forecast period and are assumptions, not guaranteed outcomes."),
  calc("present-value", "Present value", 8, "PV = future cash flow / (1 + discount rate)^periods", "Expresses a future amount in today's equivalent value.", [amount("future", "Future cash flow", 1000), rate("rate", "Discount rate per period", 10), positive("periods", "Number of periods", 3)], "money", "The rate and period length must match; rate must exceed −100%.", sourceTime),
  calc("future-value", "Future value", 8, "FV = present amount × (1 + rate)^periods", "Moves a present amount forward at an assumed periodic rate.", [amount("present", "Present amount", 1000), rate("rate", "Rate per period", 10), positive("periods", "Number of periods", 3)], "money", "A constant rate with no additional cash flows, taxes, or fees.", sourceTime),
  calc("npv", "Net present value", 8, "NPV = Σ cash flowₜ / (1 + r)^t, beginning at t = 0", "Discounts every cash flow, including the initial investment.", [flows, rate("rate", "Discount rate per interval", 10)], "money", "Equal time intervals; first cash flow is at time 0. Match the discount rate to the interval.", sourceTime),
  calc("irr", "Conventional cash-flow IRR", 8, "Find r such that Σ CFₜ / (1 + r)^t = 0", "Solves the periodic break-even discount rate for a conventional investment.", [flows], "percent", "Only one initial negative flow followed by nonnegative flows is supported. Other patterns can have multiple IRRs or none; use NPV scenarios instead.", sourceTime),
  calc("payback", "Simple payback period", 8, "Payback ≈ initial outlay / constant periodic net inflow", "Estimates how long a constant stream takes to recover the outlay.", [positive("investment", "Initial outlay", 1000), positive("inflow", "Constant net inflow per period", 250)], "number", "Units are the chosen periods. Undiscounted and ignores flows after payback; irregular cash flows need a schedule."),
  calc("annual-interest", "Annual debt interest", 9, "Interest = debt principal × annual interest rate", "A simple annual borrowing-interest estimate.", [positive("principal", "Debt principal", 1000), rate("rate", "Annual interest rate", 6, { min: 0 })], "money", "No amortization, fees, compounding, or mid-year debt changes included."),
  calc("bond-coupon", "Annual bond coupon", 9, "Annual coupon = face value × annual coupon rate", "The contractual coupon amount over a full year.", [positive("face", "Bond face value", 1000), rate("coupon", "Annual coupon rate", 5, { min: 0 })], "money", "Coupon rate is not yield to maturity. Divide by payments per year for a level periodic coupon."),
  calc("dilution", "Ownership dilution", 9, "Dilution = new shares / (existing shares + new shares) × 100", "Relative reduction in a non-participating holder's ownership percentage.", [positive("existing", "Existing shares", 1000), positive("newShares", "New shares issued", 100)], "percent", "Assumes the holder buys no new shares. This is ownership dilution, not necessarily EPS or value dilution."),
  calc("capm", "CAPM cost of equity", 10, "Cost of equity = risk-free rate + beta × equity risk premium", "Links a required equity return to modeled systematic risk.", [rate("riskFree", "Risk-free rate", 4), amount("beta", "Equity beta", 1.2), rate("premium", "Equity risk premium", 5)], "percent", "A model-based estimate, not a promised return. Match currency, horizon, and leverage assumptions.", sourceValuation),
  calc("wacc", "Weighted average cost of capital", 10, "WACC = equity weight × cost of equity + debt weight × cost of debt × (1 − tax rate)", "Combines modeled equity and after-tax debt financing costs.", [rate("equityWeight", "Equity weight", 70, { min: 0, max: 100 }), rate("debtWeight", "Debt weight", 30, { min: 0, max: 100 }), rate("equityCost", "Cost of equity", 10), rate("debtCost", "Pre-tax cost of debt", 6), rate("tax", "Applicable tax rate", 25, { min: 0, max: 100 })], "percent", "Weights must total 100% and normally use market values. Assumes the stated interest tax deduction is usable.", sourceValuation),
  calc("tax-shield", "Simple interest tax shield", 10, "Tax shield = deductible interest × applicable tax rate", "Illustrates tax savings if a deduction is fully usable.", [positive("interest", "Deductible interest", 100), rate("tax", "Applicable tax rate", 25, { min: 0, max: 100 })], "money", "Actual deductibility depends on law, earnings, limits, and timing; this is an educational simplification."),
  calc("economic-profit", "Economic profit", 10, "Economic profit = NOPAT − invested capital × WACC", "Subtracts a capital charge from after-tax operating earnings.", [amount("nopat", "After-tax operating profit (NOPAT)", 120), positive("capital", "Invested capital", 1000), rate("wacc", "WACC", 8)], "money", "Use compatible periods, definitions, and a suitable capital base.", sourceValuation),
  calc("market-cap", "Market capitalization", 11, "Market cap = share price × shares outstanding", "The market value of the outstanding equity shares.", [positive("price", "Share price", 100), positive("shares", "Shares outstanding", 1000000)], "money", "Share price and share count must refer to the same class, currency, and date."),
  calc("net-debt", "Net debt", 11, "Net debt = defined debt − included cash", "Borrowing after the cash offset used in a valuation.", [positive("debt", "Defined debt", 1000), positive("cash", "Included cash", 300)], "money", "Specify treatment of leases, restricted cash, investments, and other debt-like items."),
  calc("enterprise-value", "Enterprise-value bridge", 11, "EV = equity value + debt + preferred equity + noncontrolling interests − cash", "Bridges common equity value to a defined operating-business value.", [positive("equityValue", "Common equity value", 2000), positive("debt", "Debt", 1000), positive("preferred", "Preferred equity", 0), positive("minority", "Noncontrolling interests", 0), positive("cash", "Cash adjustment", 300)], "money", "Simplified bridge. Align debt, cash, leases, minority interests, and nonoperating assets with the valuation definition.", sourceValuation),
  calc("fcff", "Free cash flow to the firm", 11, "FCFF = EBIT × (1 − tax rate) + D&A − CapEx − change in operating working capital", "Cash modeled as available to debt and equity providers.", [amount("ebit", "EBIT", 150), rate("tax", "Operating tax rate", 25, { min: 0, max: 100 }), positive("da", "Depreciation and amortization", 30), positive("capex", "CapEx (positive outflow)", 50), amount("changeWc", "Increase in operating working capital", 10)], "money", "Working-capital increase consumes cash. Discount FCFF at a matching WACC, not cost of equity.", sourceValuation),
  calc("fcfe", "Free cash flow to equity", 11, "FCFE = net income + D&A − CapEx − change in operating working capital + net borrowing", "Cash modeled as available to common equity holders after debt cash flows.", [amount("income", "Net income", 100), positive("da", "Depreciation and amortization", 30), positive("capex", "CapEx (positive outflow)", 50), amount("changeWc", "Increase in operating working capital", 10), amount("borrowing", "Net borrowing (debt raised less repaid)", 20)], "money", "Discount FCFE at a matching cost of equity, not WACC.", sourceValuation),
  calc("pe", "Price-to-earnings ratio", 11, "P/E = share price / earnings per share", "A price multiple of earnings attributable to each share.", [positive("price", "Share price", 100), positive("eps", "Earnings per share", 5)], "ratio", "Requires positive EPS. Match trailing or forecast earnings consistently; EPS can be affected by one-off items."),
  calc("ev-ebitda", "EV/EBITDA", 11, "EV/EBITDA = enterprise value / EBITDA", "A business-value multiple relative to a defined EBITDA measure.", [amount("ev", "Enterprise value", 2000), positive("ebitda", "EBITDA", 200)], "ratio", "Requires positive EBITDA. Align lease treatment, period, accounting, and EV definition; EBITDA is not cash flow."),
  calc("terminal-value", "Perpetual-growth terminal value", 11, "Terminal value at year n = cash flow in year n+1 / (discount rate − growth rate)", "Values a simplified growing stream after the forecast horizon.", [amount("nextFlow", "Cash flow in the first stable-growth year", 100), rate("rate", "Matching discount rate", 10), rate("growth", "Perpetual growth rate", 3)], "money", "Growth must be below the discount rate. This is value at the terminal date; discount it to today separately. Use FCFF/WACC or FCFE/cost of equity.", "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/termvalapproaches.htm"),
  calc("moic", "Multiple on invested capital", 12, "MOIC = (cash distributions + remaining investment value) / invested capital", "Total value relative to money invested.", [positive("distributions", "Cash distributions", 1200), positive("remaining", "Remaining investment value", 300), positive("invested", "Invested capital", 1000)], "ratio", "Not time-adjusted. Specify gross/net treatment and include fees and all invested amounts consistently."),
  calc("recovery", "Recovery rate", 12, "Recovery rate = recovered claim value / claim amount × 100", "The portion of a specified claim recovered.", [positive("recovered", "Recovered claim value", 40), positive("claim", "Claim amount", 100)], "percent", "Timing, legal priority, fees, and valuation matter. This is a simplified realized amount ratio."),
];

function numeric(value: string | number | undefined, label: string): number {
  if ((typeof value !== "string" && typeof value !== "number") || (typeof value === "string" && !value.trim())) throw new FinanceCalculationError(`Enter ${label.toLowerCase()}.`);
  const result = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isFinite(result)) throw new FinanceCalculationError(`${label} must be a finite number.`);
  return result;
}
function divide(numerator: number, denominator: number, label: string, requirePositive = true): number {
  if (denominator === 0 || (requirePositive && denominator < 0)) throw new FinanceCalculationError(`${label} must be greater than zero for this calculation.`);
  return numerator / denominator;
}
export function calculateFinance(id: string, values: Record<string, string | number>): FinanceCalculation {
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new FinanceCalculationError("Enter a set of numeric inputs.");
  const definition = FINANCE_CALCULATORS.find(item => item.id === id);
  if (!definition) throw new FinanceCalculationError("Choose a supported formula.");
  const numbers: Record<string, number> = {};
  for (const field of definition.inputs) {
    if (field.kind === "cashflows") continue;
    const value = numeric(values[field.id], field.label);
    if (field.min !== undefined && value < field.min) throw new FinanceCalculationError(`${field.label} must be at least ${field.min}.`);
    if (field.max !== undefined && value > field.max) throw new FinanceCalculationError(`${field.label} must be at most ${field.max}.`);
    if (field.integer && !Number.isInteger(value)) throw new FinanceCalculationError(`${field.label} must be a whole number.`);
    numbers[field.id] = value;
  }
  const n = (key: string) => numbers[key], p = (key: string) => n(key) / 100;
  let value: number;
  switch (id) {
    case "simple-interest": value = n("principal") * p("rate") * n("years"); break;
    case "compound-value": value = n("principal") * (1 + p("rate") / n("periods")) ** (n("periods") * n("years")); break;
    case "holding-return": value = divide(n("end") - n("start") + n("income"), n("start"), "Starting value") * 100; break;
    case "real-return": value = ((1 + p("nominal")) / (1 + p("inflation")) - 1) * 100; break;
    case "equity": value = n("assets") - n("liabilities"); break;
    case "straight-depreciation": if (n("residual") > n("cost")) throw new FinanceCalculationError("Residual value cannot exceed asset cost."); value = divide(n("cost") - n("residual"), n("life"), "Useful life"); break;
    case "gross-profit": value = n("revenue") - n("cogs"); break;
    case "ebitda": value = n("ebit") + n("depreciation") + n("amortization"); break;
    case "free-cash-flow": value = n("ocf") - n("capex"); break;
    case "gross-margin": case "operating-margin": case "net-margin": value = divide(n("profit"), n("revenue"), "Revenue") * 100; break;
    case "current-ratio": value = divide(n("currentAssets"), n("currentLiabilities"), "Current liabilities"); break;
    case "quick-ratio": value = divide(n("cash") + n("securities") + n("receivables"), n("currentLiabilities"), "Current liabilities"); break;
    case "debt-equity": value = divide(n("debt"), n("equity"), "Equity"); break;
    case "interest-coverage": value = divide(n("ebit"), n("interest"), "Interest expense"); break;
    case "roa": value = divide(n("profit"), n("averageAssets"), "Average assets") * 100; break;
    case "roe": value = divide(n("profit"), n("averageEquity"), "Average equity") * 100; break;
    case "roic": value = divide(n("ebit") * (1 - p("tax")), n("capital"), "Invested capital") * 100; break;
    case "asset-turnover": value = divide(n("revenue"), n("averageAssets"), "Average assets"); break;
    case "contribution": value = n("sales") - n("variable"); break;
    case "break-even": value = Math.ceil(divide(n("fixed"), n("price") - n("variable"), "Unit contribution")); break;
    case "cac": value = divide(n("spending"), n("customers"), "New customers"); break;
    case "ltv": value = divide(n("arpu") * p("margin"), p("churn"), "Monthly churn"); break;
    case "churn": if (n("lost") > n("start")) throw new FinanceCalculationError("Customers lost cannot exceed the starting customer cohort."); value = divide(n("lost"), n("start"), "Starting customers") * 100; break;
    case "arpu": value = divide(n("revenue"), n("users"), "Average users"); break;
    case "working-capital": value = n("currentAssets") - n("currentLiabilities"); break;
    case "dso": value = divide(n("receivables"), n("sales"), "Credit sales") * n("days"); break;
    case "dio": value = divide(n("inventory"), n("cogs"), "Cost of goods sold") * n("days"); break;
    case "dpo": value = divide(n("payables"), n("purchases"), "Credit purchases") * n("days"); break;
    case "cash-cycle": value = n("dio") + n("dso") - n("dpo"); break;
    case "runway": value = divide(n("cash"), n("burn"), "Monthly net cash burn"); break;
    case "cash-budget": value = n("opening") + n("receipts") - n("payments"); break;
    case "variance": value = n("actual") - n("budget"); break;
    case "revenue-growth": value = divide(n("current") - n("previous"), Math.abs(n("previous")), "Absolute previous value") * 100; break;
    case "driver-revenue": value = n("customers") * n("frequency") * n("price"); break;
    case "present-value": value = n("future") / (1 + p("rate")) ** n("periods"); break;
    case "future-value": value = n("present") * (1 + p("rate")) ** n("periods"); break;
    case "npv": case "irr": {
      const raw = values.cashflows;
      if (typeof raw !== "string" || !raw.trim() || raw.length > 10000) throw new FinanceCalculationError("Enter two to 60 comma-separated cash flows.");
      if (/[,;]\s*[,;]|^[,;]|[,;]\s*$/.test(raw.trim())) throw new FinanceCalculationError("Each cash-flow interval needs a value. Use an explicit 0 for an interval without a cash flow.");
      const tokens = raw.trim().split(/[,;\s]+/);
      if (tokens.length < 2 || tokens.length > 60) throw new FinanceCalculationError("Use two to 60 cash flows at equal intervals.");
      const cashflows = tokens.map((item, index) => numeric(item, `Cash flow ${index}`));
      const npv = (r: number) => cashflows.reduce((sum, flow, t) => sum + flow / (1 + r) ** t, 0);
      if (id === "npv") { value = npv(p("rate")); break; }
      if (cashflows[0] >= 0 || cashflows.slice(1).some(flow => flow < 0) || !cashflows.slice(1).some(flow => flow > 0)) throw new FinanceCalculationError("IRR is supported only for one initial negative investment followed by nonnegative cash flows. Other patterns can have multiple IRRs or none; compare NPV instead.");
      let low = -.999999, high = 1;
      if (npv(low) <= 0) throw new FinanceCalculationError("The IRR is too close to −100% for the supported numerical range. Compare NPV instead.");
      while (npv(high) > 0 && high < 10000) high *= 2;
      if (npv(high) > 0) throw new FinanceCalculationError("An IRR could not be bracketed within the supported rate range. Use NPV scenarios.");
      for (let i = 0; i < 200; i++) { const mid = (low + high) / 2; if (npv(mid) > 0) low = mid; else high = mid; }
      const solvedRate = (low + high) / 2;
      const residual = Math.abs(npv(solvedRate));
      if (!Number.isFinite(residual) || residual > Math.max(...cashflows.map(Math.abs)) * 0.0000001) throw new FinanceCalculationError("An IRR could not be solved accurately for these inputs. Compare NPV instead.");
      value = solvedRate * 100; break;
    }
    case "payback": value = divide(n("investment"), n("inflow"), "Periodic cash inflow"); break;
    case "annual-interest": value = n("principal") * p("rate"); break;
    case "bond-coupon": value = n("face") * p("coupon"); break;
    case "dilution": value = divide(n("newShares"), n("existing") + n("newShares"), "Total shares after issuance") * 100; break;
    case "capm": value = n("riskFree") + n("beta") * n("premium"); break;
    case "wacc": if (Math.abs(n("equityWeight") + n("debtWeight") - 100) > 0.000001) throw new FinanceCalculationError("Debt and equity weights must add up to 100%."); value = p("equityWeight") * n("equityCost") + p("debtWeight") * n("debtCost") * (1 - p("tax")); break;
    case "tax-shield": value = n("interest") * p("tax"); break;
    case "economic-profit": value = n("nopat") - n("capital") * p("wacc"); break;
    case "market-cap": value = n("price") * n("shares"); break;
    case "net-debt": value = n("debt") - n("cash"); break;
    case "enterprise-value": value = n("equityValue") + n("debt") + n("preferred") + n("minority") - n("cash"); break;
    case "fcff": value = n("ebit") * (1 - p("tax")) + n("da") - n("capex") - n("changeWc"); break;
    case "fcfe": value = n("income") + n("da") - n("capex") - n("changeWc") + n("borrowing"); break;
    case "pe": value = divide(n("price"), n("eps"), "Earnings per share"); break;
    case "ev-ebitda": value = divide(n("ev"), n("ebitda"), "EBITDA"); break;
    case "terminal-value": if (n("growth") >= n("rate")) throw new FinanceCalculationError("Perpetual growth must be lower than the discount rate."); value = n("nextFlow") / (p("rate") - p("growth")); break;
    case "moic": value = divide(n("distributions") + n("remaining"), n("invested"), "Invested capital"); break;
    case "recovery": value = divide(n("recovered"), n("claim"), "Claim amount") * 100; break;
    default: throw new FinanceCalculationError("That formula is not available.");
  }
  if (!Number.isFinite(value)) throw new FinanceCalculationError("These inputs produce an out-of-range result. Use smaller values or check the assumptions.");
  return { value, unit: definition.unit, note: definition.assumptions };
}
