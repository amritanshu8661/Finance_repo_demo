/** Curriculum adapted from the complete finance map supplied by the user. */
export type FinanceTerm = { id: string; name: string; definition: string; group?: string; formula: string | null; variables: string; calculatorId?: string };
export type FinanceStage = { id: number; title: string; goal: string; description: string; terms: FinanceTerm[] };
export const FINANCE_STAGES: FinanceStage[] = [
  {
    "id": 1,
    "title": "Money foundations",
    "goal": "Understand what money does",
    "description": "Interest, inflation, risk, return, and how everyday money choices connect.",
    "terms": [
      {
        "name": "Principal",
        "definition": "The original amount invested or borrowed.",
        "id": "s1-1",
        "formula": "P = FV / (1 + r)^n",
        "variables": "P is present principal; FV is a single future amount; r is the periodic rate; n is the number of matching periods. This rearrangement assumes no other cash flows.",
        "calculatorId": "present-value"
      },
      {
        "name": "Interest",
        "definition": "The cost of borrowing money, or income earned from lending it.",
        "id": "s1-2",
        "formula": "Simple interest = P × r × t",
        "variables": "P is principal; r is the annual rate as a decimal; t is years. Other interest conventions differ.",
        "calculatorId": "simple-interest"
      },
      {
        "name": "Simple interest",
        "definition": "Interest calculated only on the principal.",
        "id": "s1-3",
        "formula": "Interest = P × r × t",
        "variables": "P is principal; r is annual rate; t is years. Does not compound accumulated interest.",
        "calculatorId": "simple-interest"
      },
      {
        "name": "Compound interest",
        "definition": "Interest earned on principal and accumulated interest.",
        "id": "s1-4",
        "formula": "FV = P × (1 + r/m)^(m × t)",
        "variables": "P is principal; r is nominal annual rate; m is compounding periods per year; t is years. Interest earned equals FV minus P.",
        "calculatorId": "compound-value"
      },
      {
        "name": "Inflation",
        "definition": "A general rise in prices that reduces purchasing power.",
        "id": "s1-5",
        "formula": "Inflation = (current price index / previous price index − 1) × 100",
        "variables": "Use a consistent price index and the same comparison interval. Your personal spending basket may differ."
      },
      {
        "name": "Return",
        "definition": "The gain or loss on an investment.",
        "id": "s1-6",
        "formula": "Holding return = (ending value − starting value + distributions) / starting value × 100",
        "variables": "Distributions include dividends or other cash received during the holding period. This is not annualized.",
        "calculatorId": "holding-return"
      },
      {
        "name": "Risk",
        "definition": "Uncertainty about outcomes, including potential losses.",
        "id": "s1-7",
        "formula": "One measure: sample volatility = √[Σ(rᵢ − mean return)² / (N − 1)]",
        "variables": "rᵢ are returns at equal intervals; N exceeds one. Volatility does not capture every kind of risk."
      },
      {
        "name": "Liquidity",
        "definition": "How easily something can become cash without a large loss.",
        "id": "s1-8",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Opportunity cost",
        "definition": "The benefit you give up by choosing one option over another.",
        "id": "s1-9",
        "formula": "Opportunity cost = benefit of the next-best feasible alternative forgone",
        "variables": "Specify the same horizon and relevant benefits; this is a decision comparison, not a universal market price."
      },
      {
        "name": "Diversification",
        "definition": "Spreading exposure across investments or activities.",
        "id": "s1-10",
        "formula": "Portfolio return = Σ(weightᵢ × returnᵢ)",
        "variables": "Weights total 100%. Risk also depends on covariance between holdings; adding holdings does not guarantee lower losses."
      }
    ]
  },
  {
    "id": 2,
    "title": "Accounting language",
    "goal": "Understand what a business owns and owes",
    "description": "Read the vocabulary behind every company report.",
    "terms": [
      {
        "name": "Asset",
        "definition": "A resource controlled by the business, such as cash, equipment, or inventory.",
        "id": "s2-1",
        "formula": "Assets = liabilities + equity",
        "variables": "The accounting identity for the same entity, reporting date, and accounting basis.",
        "calculatorId": "equity"
      },
      {
        "name": "Liability",
        "definition": "An obligation owed to someone else.",
        "id": "s2-2",
        "formula": "Liabilities = assets − equity",
        "variables": "An accounting identity, not a measure of how soon debt must be paid.",
        "calculatorId": "equity"
      },
      {
        "name": "Equity",
        "definition": "The owners’ residual interest: assets − liabilities.",
        "id": "s2-3",
        "formula": "Equity = assets − liabilities",
        "variables": "This is accounting equity. It may be negative and differs from market capitalization.",
        "calculatorId": "equity"
      },
      {
        "name": "Revenue",
        "definition": "Income earned from selling goods or services.",
        "id": "s2-4",
        "formula": "Revenue = units sold × average recognized price",
        "variables": "A simple single-product model. Returns, discounts, timing, and revenue-recognition rules can change the reported result.",
        "calculatorId": "driver-revenue"
      },
      {
        "name": "Expense",
        "definition": "A cost recognized in earning revenue or operating the business.",
        "id": "s2-5",
        "formula": "Period profit = recognized income − recognized expenses",
        "variables": "Recognition timing depends on the accounting basis; cash payments are not automatically expenses."
      },
      {
        "name": "Accrual accounting",
        "definition": "Recording income when earned and expenses when incurred, regardless of payment timing.",
        "id": "s2-6",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Cash accounting",
        "definition": "Recording income and expenses when cash changes hands.",
        "id": "s2-7",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Double-entry bookkeeping",
        "definition": "Recording every transaction through equal debits and credits.",
        "id": "s2-8",
        "formula": "Total debits = total credits",
        "variables": "Equality is required for each balanced journal entry. Debit and credit effects depend on the account type."
      },
      {
        "name": "Debit / credit",
        "definition": "The two sides of accounting entries; their effect depends on the account type.",
        "id": "s2-9",
        "formula": "Total debits = total credits",
        "variables": "Assets and expenses generally rise with debits; liabilities, equity, and revenue generally rise with credits. Contra accounts differ."
      },
      {
        "name": "Depreciation / amortization",
        "definition": "Allocating the cost of tangible / intangible assets over their useful lives.",
        "id": "s2-10",
        "formula": "Straight-line annual charge = (cost − residual value) / useful life",
        "variables": "A common method. Use the actual method, useful life, and reporting policy; impairment and partial periods may matter.",
        "calculatorId": "straight-depreciation"
      },
      {
        "name": "Capital expenditure — CapEx",
        "definition": "Spending recognized as an asset, then generally expensed over time.",
        "id": "s2-11",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Operating expenditure — OpEx",
        "definition": "Spending generally recognized as an expense in the current period.",
        "id": "s2-12",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      }
    ]
  },
  {
    "id": 3,
    "title": "Financial statements",
    "goal": "Connect the three core reports",
    "description": "Follow profit, balance-sheet positions, and cash movement together.",
    "terms": [
      {
        "name": "Income statement / profit and loss — P&L",
        "definition": "Revenue, expenses, and profit over a period.",
        "id": "s3-1",
        "formula": "Net income = revenue − recognized expenses + other income",
        "variables": "Use all relevant operating, financing, and tax items for the reporting period. Profit differs from cash flow."
      },
      {
        "name": "Balance sheet",
        "definition": "Assets, liabilities, and equity at a particular date.",
        "id": "s3-2",
        "formula": "Assets = liabilities + equity",
        "variables": "A snapshot at one reporting date; all components must use the same entity and accounting basis.",
        "calculatorId": "equity"
      },
      {
        "name": "Cash flow statement",
        "definition": "Cash movements from operating, investing, and financing activities.",
        "id": "s3-3",
        "formula": "Closing cash = opening cash + OCF + investing CF + financing CF + exchange/other adjustments",
        "variables": "OCF is operating cash flow. Include the reporting entity's full reconciliation and cash definition."
      },
      {
        "name": "Cost of goods sold — COGS",
        "definition": "Costs directly associated with goods sold; service businesses may use “cost of revenue.”",
        "id": "s3-4",
        "formula": "COGS = beginning inventory + purchases/production costs − ending inventory",
        "variables": "A simplified inventory-flow relationship; actual costing, overhead allocation, and write-downs vary."
      },
      {
        "name": "Gross profit",
        "definition": "Revenue minus COGS.",
        "id": "s3-5",
        "formula": "Gross profit = revenue − COGS",
        "variables": "COGS is cost of goods sold, or the relevant cost of revenue for the business.",
        "calculatorId": "gross-profit"
      },
      {
        "name": "EBIT",
        "definition": "Earnings before interest and tax.",
        "id": "s3-6",
        "formula": "EBIT = net income + income tax expense + net interest expense",
        "variables": "A common earnings bridge. EBIT and reported operating profit need not be identical; reconcile nonoperating items."
      },
      {
        "name": "EBITDA",
        "definition": "Earnings before interest, tax, depreciation, and amortization. It is not cash flow.",
        "id": "s3-7",
        "formula": "EBITDA = EBIT + depreciation + amortization",
        "variables": "Definitions vary. EBITDA excludes important cash uses and is not operating cash flow.",
        "calculatorId": "ebitda"
      },
      {
        "name": "Net income / net profit",
        "definition": "Profit after all recognized expenses, including interest and tax.",
        "id": "s3-8",
        "formula": "Net income = total recognized income − total recognized expenses",
        "variables": "Includes applicable interest and tax, for a defined entity and reporting period."
      },
      {
        "name": "Retained earnings",
        "definition": "Accumulated profits retained in the business after distributions and relevant adjustments.",
        "id": "s3-9",
        "formula": "Closing retained earnings = opening retained earnings + net income − dividends ± adjustments",
        "variables": "Prior-period and other accounting adjustments can affect this bridge."
      },
      {
        "name": "Operating cash flow — OCF",
        "definition": "Cash generated or consumed by operating activities.",
        "id": "s3-10",
        "formula": "Indirect OCF ≈ net income + noncash charges − operating working-capital increase ± other operating adjustments",
        "variables": "A simplified bridge. Follow the full cash-flow statement for tax, interest, and classification conventions."
      },
      {
        "name": "Free cash flow — FCF",
        "definition": "Cash remaining after relevant investment needs; always check the definition being used.",
        "id": "s3-11",
        "formula": "Common simple FCF = operating cash flow − CapEx",
        "variables": "CapEx is entered as a positive cash outflow. FCF definitions vary; do not automatically treat this measure as FCFF or FCFE.",
        "calculatorId": "free-cash-flow"
      }
    ]
  },
  {
    "id": 4,
    "title": "Business performance",
    "goal": "Understand financial health",
    "description": "Use margins, efficiency measures, and ratios with context.",
    "terms": [
      {
        "name": "Gross margin",
        "definition": "Gross profit ÷ revenue.",
        "id": "s4-1",
        "formula": "Gross margin = gross profit / revenue × 100",
        "variables": "Use positive revenue and matching periods; compare similar accounting and business models.",
        "calculatorId": "gross-margin"
      },
      {
        "name": "Operating margin",
        "definition": "Operating profit ÷ revenue.",
        "id": "s4-2",
        "formula": "Operating margin = operating profit / revenue × 100",
        "variables": "Use positive revenue and a consistently defined operating-profit measure.",
        "calculatorId": "operating-margin"
      },
      {
        "name": "Net margin",
        "definition": "Net profit ÷ revenue.",
        "id": "s4-3",
        "formula": "Net margin = net profit / revenue × 100",
        "variables": "Use positive revenue. A negative margin means a loss for that period.",
        "calculatorId": "net-margin"
      },
      {
        "name": "Current ratio",
        "definition": "Current assets ÷ current liabilities.",
        "id": "s4-4",
        "formula": "Current ratio = current assets / current liabilities",
        "variables": "Current liabilities must be positive. Asset quality and timing still matter.",
        "calculatorId": "current-ratio"
      },
      {
        "name": "Quick ratio",
        "definition": "Liquid current assets ÷ current liabilities; commonly excludes inventory and prepayments.",
        "id": "s4-5",
        "formula": "Quick ratio = (cash + marketable securities + receivables) / current liabilities",
        "variables": "This common definition excludes inventory and prepayments. Check receivable collectibility.",
        "calculatorId": "quick-ratio"
      },
      {
        "name": "Leverage",
        "definition": "Using debt or other fixed financial commitments.",
        "id": "s4-6",
        "formula": "One measure: financial leverage = average total assets / average equity",
        "variables": "There are several leverage measures. Negative or very small equity makes ordinary interpretation difficult."
      },
      {
        "name": "Debt-to-equity",
        "definition": "Debt ÷ equity; definitions of debt can vary.",
        "id": "s4-7",
        "formula": "Debt-to-equity = interest-bearing debt / equity",
        "variables": "This version uses debt, not all liabilities. Define leases and other debt-like items; equity should be positive.",
        "calculatorId": "debt-equity"
      },
      {
        "name": "Interest coverage",
        "definition": "Commonly EBIT ÷ interest expense.",
        "id": "s4-8",
        "formula": "Interest coverage = EBIT / interest expense",
        "variables": "Use positive interest expense. EBITDA-based or cash-based coverage measures use different definitions.",
        "calculatorId": "interest-coverage"
      },
      {
        "name": "Return on assets — ROA",
        "definition": "Profit relative to assets.",
        "id": "s4-9",
        "formula": "ROA = net profit / average total assets × 100",
        "variables": "Average assets usually equal (opening + closing assets) / 2. Match profit period and annualization.",
        "calculatorId": "roa"
      },
      {
        "name": "Return on equity — ROE",
        "definition": "Profit relative to shareholders’ equity.",
        "id": "s4-10",
        "formula": "ROE = profit attributable to common holders / average common equity × 100",
        "variables": "Use positive average equity and consistent common-holder earnings. Leverage changes the interpretation.",
        "calculatorId": "roe"
      },
      {
        "name": "Return on invested capital — ROIC",
        "definition": "After-tax operating profit relative to invested capital.",
        "id": "s4-11",
        "formula": "ROIC = NOPAT / average invested capital × 100",
        "variables": "NOPAT is after-tax operating profit, often modeled as EBIT × (1 − tax rate). Define operating invested capital consistently.",
        "calculatorId": "roic"
      },
      {
        "name": "Asset turnover",
        "definition": "Revenue relative to assets.",
        "id": "s4-12",
        "formula": "Asset turnover = revenue / average total assets",
        "variables": "Average assets usually use opening and closing balances for the revenue period.",
        "calculatorId": "asset-turnover"
      }
    ]
  },
  {
    "id": 5,
    "title": "Business economics",
    "goal": "Understand how money is made",
    "description": "Connect costs, prices, customers, and break-even sales.",
    "terms": [
      {
        "name": "Business model",
        "definition": "How a company creates, delivers, and captures value.",
        "id": "s5-1",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Fixed costs",
        "definition": "Costs that remain broadly unchanged within a relevant activity range.",
        "id": "s5-2",
        "formula": "Total cost = fixed cost + variable cost per unit × units",
        "variables": "A simplified relevant-range model. Fixed costs can change in steps outside that range."
      },
      {
        "name": "Variable costs",
        "definition": "Costs that change with output or sales.",
        "id": "s5-3",
        "formula": "Total variable cost = variable cost per unit × units",
        "variables": "A simplified linear model; unit costs may change with volume."
      },
      {
        "name": "Contribution margin",
        "definition": "Revenue minus variable costs.",
        "id": "s5-4",
        "formula": "Contribution = revenue − variable costs",
        "variables": "Unit contribution is unit price minus unit variable cost. Contribution margin ratio equals contribution / revenue.",
        "calculatorId": "contribution"
      },
      {
        "name": "Break-even point",
        "definition": "The sales level at which total revenue equals total costs.",
        "id": "s5-5",
        "formula": "Break-even units = fixed costs / (unit price − unit variable cost)",
        "variables": "Positive unit contribution is required. Round up whole units; the model assumes stable prices and costs.",
        "calculatorId": "break-even"
      },
      {
        "name": "Unit economics",
        "definition": "Revenue, costs, and profit associated with one customer, product, or transaction.",
        "id": "s5-6",
        "formula": "Unit contribution = unit revenue − relevant unit variable costs",
        "variables": "Define a unit or customer cohort and the costs included. Customer profitability may also require CAC and support costs."
      },
      {
        "name": "Customer acquisition cost — CAC",
        "definition": "Cost of acquiring a customer.",
        "id": "s5-7",
        "formula": "CAC = acquisition spending / new customers acquired",
        "variables": "Match spending, new customers, and the acquisition window; include the intended sales and marketing costs.",
        "calculatorId": "cac"
      },
      {
        "name": "Customer lifetime value — LTV",
        "definition": "Estimated economic value from a customer relationship; the calculation must specify its profit and discounting assumptions.",
        "id": "s5-8",
        "formula": "Simple subscription LTV ≈ monthly ARPU × gross margin / monthly customer churn",
        "variables": "Undiscounted steady-state approximation with constant inputs. Excludes CAC and is not a full lifetime-value DCF.",
        "calculatorId": "ltv"
      },
      {
        "name": "Churn",
        "definition": "The rate at which customers or recurring revenue are lost.",
        "id": "s5-9",
        "formula": "Customer churn = customers lost / starting customers × 100",
        "variables": "Use a defined cohort and period. Revenue churn is a different measure.",
        "calculatorId": "churn"
      },
      {
        "name": "Average revenue per user — ARPU",
        "definition": "Revenue divided by the relevant user base.",
        "id": "s5-10",
        "formula": "ARPU = period revenue / relevant average users",
        "variables": "Use a consistent period and the appropriate user base.",
        "calculatorId": "arpu"
      },
      {
        "name": "Operating leverage",
        "definition": "How fixed operating costs amplify changes in operating profit.",
        "id": "s5-11",
        "formula": "Degree of operating leverage = contribution / EBIT",
        "variables": "A point-in-time linear-cost model; EBIT must be nonzero. Near break-even it can be unstable."
      },
      {
        "name": "Economies of scale",
        "definition": "Reductions in average cost as activity grows.",
        "id": "s5-12",
        "formula": "Average cost per unit = total cost / units",
        "variables": "Falling average cost as volume grows can indicate scale economies; capacity and quality constraints still apply."
      }
    ]
  },
  {
    "id": 6,
    "title": "Working capital",
    "goal": "Keep the business funded day to day",
    "description": "Follow cash through inventory, customers, and suppliers.",
    "terms": [
      {
        "name": "Working capital",
        "definition": "Current assets minus current liabilities.",
        "id": "s6-1",
        "formula": "Working capital = current assets − current liabilities",
        "variables": "This is a balance-sheet snapshot; it includes cash and current debt unless otherwise stated.",
        "calculatorId": "working-capital"
      },
      {
        "name": "Operating working capital",
        "definition": "Operating current assets minus operating current liabilities, typically excluding cash and debt.",
        "id": "s6-2",
        "formula": "Operating WC = operating current assets − operating current liabilities",
        "variables": "Typically excludes cash and debt. Define each operating component and keep the valuation convention consistent."
      },
      {
        "name": "Accounts receivable — AR",
        "definition": "Money customers owe the business.",
        "id": "s6-3",
        "formula": "Closing AR = opening AR + credit sales − collections − write-offs ± adjustments",
        "variables": "A simplified receivables roll-forward; taxes, FX, and other adjustments may matter."
      },
      {
        "name": "Accounts payable — AP",
        "definition": "Money the business owes suppliers.",
        "id": "s6-4",
        "formula": "Closing AP = opening AP + credit purchases − supplier payments ± adjustments",
        "variables": "A simplified trade-payables bridge for the same entity and period."
      },
      {
        "name": "Inventory",
        "definition": "Goods or materials held for production or sale.",
        "id": "s6-5",
        "formula": "Closing inventory = opening inventory + additions − cost of inventory sold − write-downs ± adjustments",
        "variables": "Use the reporting entity's inventory accounting and costing policy."
      },
      {
        "name": "Days sales outstanding — DSO",
        "definition": "Average time taken to collect customer payments.",
        "id": "s6-6",
        "formula": "DSO = average trade receivables / credit sales × days in period",
        "variables": "Credit sales are preferred. Match average receivables and the sales period.",
        "calculatorId": "dso"
      },
      {
        "name": "Days inventory outstanding — DIO",
        "definition": "Average time inventory is held.",
        "id": "s6-7",
        "formula": "DIO = average inventory / COGS × days in period",
        "variables": "Use positive COGS and average inventory for the same period.",
        "calculatorId": "dio"
      },
      {
        "name": "Days payable outstanding — DPO",
        "definition": "Average time taken to pay suppliers.",
        "id": "s6-8",
        "formula": "DPO = average trade payables / credit purchases × days in period",
        "variables": "Credit purchases are preferred; COGS is sometimes used as a disclosed proxy but differs from purchases.",
        "calculatorId": "dpo"
      },
      {
        "name": "Cash conversion cycle — CCC",
        "definition": "DIO + DSO − DPO.",
        "id": "s6-9",
        "formula": "CCC = DIO + DSO − DPO",
        "variables": "DIO is inventory days, DSO receivable days, and DPO payable days, using compatible periods.",
        "calculatorId": "cash-cycle"
      },
      {
        "name": "Burn rate",
        "definition": "The rate a business consumes cash; distinguish gross from net burn.",
        "id": "s6-10",
        "formula": "Net burn = cash operating payments − cash operating receipts per period",
        "variables": "Gross burn considers payments only. State which cash flows and financing items are included."
      },
      {
        "name": "Runway",
        "definition": "How long available cash can support operations at an assumed burn rate.",
        "id": "s6-11",
        "formula": "Runway in months = available cash / monthly net burn",
        "variables": "Net burn must be positive and assumed constant. Cash generation has no finite burn-based runway.",
        "calculatorId": "runway"
      },
      {
        "name": "Cash budget",
        "definition": "A forecast of cash receipts, payments, and balances.",
        "id": "s6-12",
        "formula": "Closing cash = opening cash + expected receipts − expected payments",
        "variables": "Include all relevant operating, investing, and financing cash flows. A forecast is not a guarantee.",
        "calculatorId": "cash-budget"
      }
    ]
  },
  {
    "id": 7,
    "title": "Planning and modeling",
    "goal": "Build a view of possible outcomes",
    "description": "Connect budgets, business drivers, forecasts, and scenarios.",
    "terms": [
      {
        "name": "Budget",
        "definition": "An approved financial plan.",
        "id": "s7-1",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Forecast",
        "definition": "An updated estimate of likely outcomes.",
        "id": "s7-2",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Financial planning and analysis — FP&A",
        "definition": "Planning, forecasting, and explaining business performance.",
        "id": "s7-3",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Variance analysis",
        "definition": "Comparing actual results with a budget, forecast, or previous period.",
        "id": "s7-4",
        "formula": "Variance = actual − plan; percentage variance = (actual − plan) / abs(plan) × 100",
        "variables": "A zero plan has no defined percentage variance. A positive variance is not always favorable.",
        "calculatorId": "variance"
      },
      {
        "name": "Financial model",
        "definition": "A structured representation of a business’s financial relationships.",
        "id": "s7-5",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Three-statement model",
        "definition": "A model linking the income statement, balance sheet, and cash flow statement.",
        "id": "s7-6",
        "formula": "Closing cash links to balance sheet; net income links to retained earnings",
        "variables": "A connected accounting model needs full schedules; there is no single complete formula."
      },
      {
        "name": "Driver-based forecasting",
        "definition": "Forecasting through factors such as customers, price, volume, or headcount.",
        "id": "s7-7",
        "formula": "Revenue = customers × purchase frequency × average price",
        "variables": "Match the forecast period. Drivers are assumptions and can interact.",
        "calculatorId": "driver-revenue"
      },
      {
        "name": "Sensitivity analysis",
        "definition": "Testing how an outcome changes when an assumption changes.",
        "id": "s7-8",
        "formula": "Sensitivity ≈ change in output / change in one input",
        "variables": "Hold other inputs fixed and state the tested range; nonlinear responses may differ."
      },
      {
        "name": "Scenario analysis",
        "definition": "Testing coherent combinations of assumptions.",
        "id": "s7-9",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Stress testing",
        "definition": "Examining performance under severe adverse conditions.",
        "id": "s7-10",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Rolling forecast",
        "definition": "A forecast continually extended as time passes.",
        "id": "s7-11",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      }
    ]
  },
  {
    "id": 8,
    "title": "Investment decisions",
    "goal": "Compare money across time",
    "description": "Explore cash-flow timing, discounting, NPV, and IRR.",
    "terms": [
      {
        "name": "Time value of money",
        "definition": "Money today can be invested, making timing economically important.",
        "id": "s8-1",
        "formula": "FV = PV × (1 + r)^n",
        "variables": "r is the periodic rate and n is matching periods. Timing and risk affect the required rate.",
        "calculatorId": "future-value"
      },
      {
        "name": "Present value — PV",
        "definition": "Today’s equivalent value of a future cash flow.",
        "id": "s8-2",
        "formula": "PV = future cash flow / (1 + r)^n",
        "variables": "r is the matching discount rate; n is periods until payment. Requires r greater than −100%.",
        "calculatorId": "present-value"
      },
      {
        "name": "Future value — FV",
        "definition": "What an amount grows to over time.",
        "id": "s8-3",
        "formula": "FV = present amount × (1 + r)^n",
        "variables": "r is the periodic rate, not necessarily an annual rate. Assumes no intermediate flows.",
        "calculatorId": "future-value"
      },
      {
        "name": "Discount rate",
        "definition": "The rate used to translate future cash flows into present value.",
        "id": "s8-4",
        "formula": "Discount factor for time t = 1 / (1 + r)^t",
        "variables": "Match risk, currency, inflation basis, and cash-flow type; r must exceed −100% for this convention."
      },
      {
        "name": "Net present value — NPV",
        "definition": "Present value of all project cash flows, including the initial investment.",
        "id": "s8-5",
        "formula": "NPV = Σ CFₜ / (1 + r)^t, including time 0",
        "variables": "CFₜ is cash flow at time t. The initial investment is included once at time 0; periods and discount rate must match.",
        "calculatorId": "npv"
      },
      {
        "name": "Internal rate of return — IRR",
        "definition": "A discount rate at which NPV equals zero; some cash flow patterns produce multiple IRRs or none.",
        "id": "s8-6",
        "formula": "Find r such that NPV(r) = 0",
        "variables": "Nonconventional cash flows may have multiple IRRs or none. The calculator supports a single negative initial investment followed by nonnegative flows.",
        "calculatorId": "irr"
      },
      {
        "name": "Hurdle rate",
        "definition": "The minimum required return for an investment.",
        "id": "s8-7",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Payback period",
        "definition": "Time needed to recover the initial investment.",
        "id": "s8-8",
        "formula": "Simple payback = initial outlay / constant periodic net inflow",
        "variables": "A constant-flow approximation. It ignores discounting and cash flows after payback.",
        "calculatorId": "payback"
      },
      {
        "name": "Capital budgeting",
        "definition": "Evaluating and selecting long-term investments.",
        "id": "s8-9",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Sunk cost",
        "definition": "A past cost that cannot be recovered.",
        "id": "s8-10",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Incremental cash flow",
        "definition": "Cash flow that changes because a decision is taken.",
        "id": "s8-11",
        "formula": "Incremental CF = CF with the decision − CF without the decision",
        "variables": "Include opportunity costs and relevant tax effects; exclude sunk costs."
      },
      {
        "name": "Terminal value",
        "definition": "Estimated value beyond an explicit forecast period.",
        "id": "s8-12",
        "formula": "Stable-growth TV at time n = CFₙ₊₁ / (r − g)",
        "variables": "g must be below r. Discount terminal value to time 0 separately; match FCFF/WACC or FCFE/cost of equity.",
        "calculatorId": "terminal-value"
      }
    ]
  },
  {
    "id": 9,
    "title": "Funding and markets",
    "goal": "Understand where money comes from",
    "description": "Learn debt, equity, securities, and how markets connect them.",
    "terms": [
      {
        "name": "Debt",
        "definition": "Borrowed funding with contractual obligations.",
        "id": "s9-1",
        "formula": "Simple annual interest = principal × annual rate",
        "variables": "Debt may include amortization, fees, covenants, and floating rates beyond this simple estimate.",
        "calculatorId": "annual-interest"
      },
      {
        "name": "Equity financing",
        "definition": "Raising money by issuing ownership interests.",
        "id": "s9-2",
        "formula": "Cash raised before costs = new shares × issue price",
        "variables": "Specify share rights, issuance costs, and the post-issue ownership base."
      },
      {
        "name": "Share / stock",
        "definition": "A unit of ownership in a company.",
        "id": "s9-3",
        "formula": "Ownership fraction = shares held / relevant shares outstanding",
        "variables": "Different classes, options, and convertible securities can alter economic and voting rights."
      },
      {
        "name": "Bond",
        "definition": "A tradable debt instrument.",
        "id": "s9-4",
        "formula": "Bond price = Σ couponₜ / (1 + y)^t + principal / (1 + y)^n",
        "variables": "y is yield per coupon interval; n is remaining intervals. Use the correct clean/dirty-price convention."
      },
      {
        "name": "Coupon",
        "definition": "Contractual interest paid on a bond.",
        "id": "s9-5",
        "formula": "Annual coupon = face value × annual coupon rate",
        "variables": "For level coupons, divide the annual amount by payments per year. Coupon is not yield.",
        "calculatorId": "bond-coupon"
      },
      {
        "name": "Yield to maturity — YTM",
        "definition": "The discount rate equating a bond’s price with its promised cash flows.",
        "id": "s9-6",
        "formula": "Find y where bond price = PV(promised coupons and principal at y)",
        "variables": "Requires price, payment schedule, maturity, and conventions. Promised cash flows can differ from realized flows."
      },
      {
        "name": "Maturity",
        "definition": "When a debt obligation becomes due.",
        "id": "s9-7",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Collateral",
        "definition": "Assets pledged to secure borrowing.",
        "id": "s9-8",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Covenant",
        "definition": "A contractual condition imposed on a borrower.",
        "id": "s9-9",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Secured / unsecured debt",
        "definition": "Debt with / without specified collateral.",
        "id": "s9-10",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Primary / secondary market",
        "definition": "Where securities are first issued / subsequently traded.",
        "id": "s9-11",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Initial public offering — IPO",
        "definition": "A company’s first public offering of shares.",
        "id": "s9-12",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Dilution",
        "definition": "Reduction in an existing shareholder’s ownership percentage or other per-share interest after new issuance.",
        "id": "s9-13",
        "formula": "Ownership dilution = new shares / (existing + new shares) × 100",
        "variables": "Assumes the existing holder does not buy more shares. Ownership, EPS, and value dilution are distinct.",
        "calculatorId": "dilution"
      },
      {
        "name": "Preferred shares / convertible securities",
        "definition": "Securities with preferential rights / securities that can convert into another security.",
        "id": "s9-14",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      }
    ]
  },
  {
    "id": 10,
    "title": "Corporate finance",
    "goal": "Connect funding and business decisions",
    "description": "Explore required returns, financing choices, and capital allocation.",
    "terms": [
      {
        "name": "Capital structure",
        "definition": "The mix of debt and equity financing.",
        "id": "s10-1",
        "formula": "Debt weight = debt market value / (debt + equity market values)",
        "variables": "This two-source model excludes preferred and other financing; expand weights if those are material."
      },
      {
        "name": "Cost of debt",
        "definition": "The return lenders require.",
        "id": "s10-2",
        "formula": "After-tax debt cost = pre-tax required debt return × (1 − tax rate)",
        "variables": "Interest deductibility and usable tax shields are assumptions. Coupon rate need not equal current cost of debt."
      },
      {
        "name": "Cost of equity",
        "definition": "The return shareholders require.",
        "id": "s10-3",
        "formula": "CAPM estimate = risk-free rate + beta × equity risk premium",
        "variables": "One model for required return, not a forecast or guarantee of realized equity returns.",
        "calculatorId": "capm"
      },
      {
        "name": "Weighted average cost of capital — WACC",
        "definition": "The weighted cost of debt and equity, with an applicable debt tax adjustment.",
        "id": "s10-4",
        "formula": "WACC = wE × kE + wD × kD × (1 − tax rate)",
        "variables": "wE and wD total 100%; kE and kD are equity and debt costs. Usually use market-value weights.",
        "calculatorId": "wacc"
      },
      {
        "name": "Capital asset pricing model — CAPM",
        "definition": "A model linking required equity return to systematic market risk.",
        "id": "s10-5",
        "formula": "Required equity return = Rf + β × ERP",
        "variables": "Rf is risk-free rate, β is equity beta, and ERP is equity risk premium. Match currency and horizon.",
        "calculatorId": "capm"
      },
      {
        "name": "Risk-free rate",
        "definition": "A reference return intended to exclude default risk for the relevant currency and horizon.",
        "id": "s10-6",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Beta",
        "definition": "Sensitivity of returns to market movements.",
        "id": "s10-7",
        "formula": "β = covariance(asset returns, market returns) / variance(market returns)",
        "variables": "Use matched return intervals and a defensible market proxy. Estimation error and leverage matter."
      },
      {
        "name": "Equity risk premium",
        "definition": "Additional expected return from equities over the risk-free rate.",
        "id": "s10-8",
        "formula": "ERP = expected market return − risk-free rate",
        "variables": "Expected premium differs from a historical realized premium and is uncertain."
      },
      {
        "name": "Tax shield",
        "definition": "Tax savings from deductible expenses, subject to applicable rules.",
        "id": "s10-9",
        "formula": "Tax savings = deductible amount × applicable tax rate",
        "variables": "Subject to deduction limits, taxable earnings, jurisdiction, and timing.",
        "calculatorId": "tax-shield"
      },
      {
        "name": "Capital allocation",
        "definition": "Choosing among reinvestment, acquisitions, debt repayment, dividends, and buybacks.",
        "id": "s10-10",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Dividend",
        "definition": "A distribution to shareholders.",
        "id": "s10-11",
        "formula": "Cash dividend = dividend per share × eligible shares",
        "variables": "Specify the record date, share class, tax treatment, and whether distributions are sustainable."
      },
      {
        "name": "Share buyback",
        "definition": "A company repurchasing its own shares.",
        "id": "s10-12",
        "formula": "Shares repurchased ≈ repurchase spending / average repurchase price",
        "variables": "A simplified estimate. Actual weighted share count also reflects timing, issuance, and stock compensation."
      },
      {
        "name": "Economic profit",
        "definition": "Operating profit after charging for the capital employed.",
        "id": "s10-13",
        "formula": "Economic profit = NOPAT − invested capital × WACC",
        "variables": "NOPAT is after-tax operating profit. Use compatible periods and capital definitions.",
        "calculatorId": "economic-profit"
      }
    ]
  },
  {
    "id": 11,
    "title": "Business valuation",
    "goal": "Estimate value with explicit assumptions",
    "description": "Connect cash flows, discount rates, multiples, and enterprise value.",
    "terms": [
      {
        "name": "Enterprise value — EV",
        "definition": "Value of the operating business attributable to its capital providers.",
        "id": "s11-1",
        "formula": "EV = common equity value + debt + preferred equity + NCI − included cash",
        "variables": "NCI means noncontrolling interests. A simplified bridge; define leases and other nonoperating items.",
        "calculatorId": "enterprise-value"
      },
      {
        "name": "Equity value",
        "definition": "Value attributable to shareholders.",
        "id": "s11-2",
        "formula": "Common equity value = EV − debt − preferred equity − NCI + included cash",
        "variables": "Reverse the same defined EV bridge. Apply other nonoperating and debt-like adjustments consistently."
      },
      {
        "name": "Market capitalization",
        "definition": "Share price × shares outstanding.",
        "id": "s11-3",
        "formula": "Market capitalization = share price × shares outstanding",
        "variables": "Match share class, currency, and date; market cap differs from accounting equity.",
        "calculatorId": "market-cap"
      },
      {
        "name": "Net debt",
        "definition": "Debt minus cash, with the exact treatment defined for the valuation.",
        "id": "s11-4",
        "formula": "Net debt = defined debt − included cash",
        "variables": "Treatment of leases, restricted cash, and investments depends on the valuation definition.",
        "calculatorId": "net-debt"
      },
      {
        "name": "Discounted cash flow — DCF",
        "definition": "Valuation based on discounted future cash flows.",
        "id": "s11-5",
        "formula": "Value = Σ forecast CFₜ/(1 + r)^t + terminal valueₙ/(1 + r)^n",
        "variables": "Match FCFF with WACC and FCFE with cost of equity. Use consistent nominal/real and currency assumptions."
      },
      {
        "name": "Free cash flow to the firm — FCFF",
        "definition": "Cash available to debt and equity providers.",
        "id": "s11-6",
        "formula": "FCFF = EBIT × (1 − tax rate) + D&A − CapEx − increase in operating WC",
        "variables": "D&A is depreciation and amortization. CapEx and WC increases are cash uses; discount FCFF at matching WACC.",
        "calculatorId": "fcff"
      },
      {
        "name": "Free cash flow to equity — FCFE",
        "definition": "Cash available to equity holders after debt-related cash flows.",
        "id": "s11-7",
        "formula": "FCFE = net income + D&A − CapEx − increase in operating WC + net borrowing",
        "variables": "Net borrowing is debt raised less repaid. Discount FCFE at a matching cost of equity.",
        "calculatorId": "fcfe"
      },
      {
        "name": "Comparable company analysis",
        "definition": "Valuing a company using similar publicly traded businesses.",
        "id": "s11-8",
        "formula": "Implied value = selected comparable multiple × consistently defined company metric",
        "variables": "Peer selection, dates, accounting, capital structure, and forward/trailing metrics need judgment."
      },
      {
        "name": "Precedent transactions",
        "definition": "Valuing a company using prices paid in comparable acquisitions.",
        "id": "s11-9",
        "formula": "Implied acquisition value = selected transaction multiple × consistently defined metric",
        "variables": "Control premiums, synergies, market conditions, and transaction terms can limit comparability."
      },
      {
        "name": "Valuation multiple",
        "definition": "A value measure divided by a financial measure.",
        "id": "s11-10",
        "formula": "Multiple = relevant value measure / matching financial measure",
        "variables": "Match enterprise values to pre-financing metrics and equity values to equity-holder metrics."
      },
      {
        "name": "Price-to-earnings — P/E",
        "definition": "Equity price relative to earnings attributable to shareholders.",
        "id": "s11-11",
        "formula": "P/E = share price / earnings per share",
        "variables": "Use positive EPS and clearly identify trailing or forward earnings.",
        "calculatorId": "pe"
      },
      {
        "name": "EV/EBITDA",
        "definition": "Enterprise value relative to EBITDA.",
        "id": "s11-12",
        "formula": "EV/EBITDA = enterprise value / EBITDA",
        "variables": "Align definitions, timing, lease treatment, and EBITDA adjustments. EBITDA is not cash flow.",
        "calculatorId": "ev-ebitda"
      },
      {
        "name": "Perpetual growth",
        "definition": "Assuming cash flows grow at a constant rate indefinitely.",
        "id": "s11-13",
        "formula": "Terminal value = next-period stable cash flow / (r − g)",
        "variables": "Perpetual growth g must be below matching discount rate r and economically sustainable.",
        "calculatorId": "terminal-value"
      },
      {
        "name": "Sum-of-the-parts — SOTP",
        "definition": "Valuing business segments separately and combining their values with appropriate adjustments.",
        "id": "s11-14",
        "formula": "SOTP equity value = sum of segment operating values + nonoperating assets − debt-like claims",
        "variables": "Avoid double-counting shared costs, cash, debt, minority interests, or cross-holdings."
      }
    ]
  },
  {
    "id": 12,
    "title": "Advanced finance",
    "goal": "Explore specialist areas",
    "description": "Build vocabulary for transactions, treasury, risk, and governance.",
    "terms": [
      {
        "name": "Due diligence",
        "definition": "investigating a target.",
        "group": "Mergers and acquisitions — M&A",
        "id": "s12-1",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Synergies",
        "definition": "benefits from combining businesses.",
        "group": "Mergers and acquisitions — M&A",
        "id": "s12-2",
        "formula": "Net synergy value = PV(combined incremental cash flows) − integration costs",
        "variables": "Use incremental after-tax flows and realistic timing; do not count the same benefit twice."
      },
      {
        "name": "Control premium",
        "definition": "extra paid for control.",
        "group": "Mergers and acquisitions — M&A",
        "id": "s12-3",
        "formula": "Control premium = (offer price / unaffected reference share price − 1) × 100",
        "variables": "State the reference date and market conditions. Premium is not automatically value created."
      },
      {
        "name": "Goodwill",
        "definition": "acquisition accounting residual after allocating the purchase price.",
        "group": "Mergers and acquisitions — M&A",
        "id": "s12-4",
        "formula": "Goodwill = consideration + NCI + prior interest − fair value of identifiable net assets",
        "variables": "Acquisition-accounting simplification; applicable accounting standards determine exact treatment."
      },
      {
        "name": "Accretion/dilution",
        "definition": "increase/decrease in a chosen per-share measure, often EPS.",
        "group": "Mergers and acquisitions — M&A",
        "id": "s12-5",
        "formula": "EPS change = (pro forma EPS / standalone EPS − 1) × 100",
        "variables": "Requires a meaningful positive comparison base. EPS accretion alone does not establish value creation."
      },
      {
        "name": "PE",
        "definition": "investment in privately held equity.",
        "group": "Private equity and venture capital",
        "id": "s12-6",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "VC",
        "definition": "investment in young, high-growth businesses.",
        "group": "Private equity and venture capital",
        "id": "s12-7",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "LBO",
        "definition": "acquisition using substantial debt.",
        "group": "Private equity and venture capital",
        "id": "s12-8",
        "formula": "Equity invested = acquisition uses − debt financing − other funding",
        "variables": "A complete LBO requires an operating forecast, financing schedule, repayments, and an exit valuation."
      },
      {
        "name": "MOIC",
        "definition": "investment proceeds and remaining value relative to invested capital.",
        "group": "Private equity and venture capital",
        "id": "s12-9",
        "formula": "MOIC = (distributions + remaining value) / invested capital",
        "variables": "Specify gross/net treatment and the full investment base. MOIC does not account for elapsed time.",
        "calculatorId": "moic"
      },
      {
        "name": "Exit",
        "definition": "realizing an investment through a sale, listing, or other route.",
        "group": "Private equity and venture capital",
        "id": "s12-10",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Cash management",
        "definition": "managing liquidity.",
        "group": "Treasury",
        "id": "s12-11",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Refinancing",
        "definition": "replacing existing borrowing.",
        "group": "Treasury",
        "id": "s12-12",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Asset-liability management",
        "definition": "managing differences in asset and liability timing and risk.",
        "group": "Treasury",
        "id": "s12-13",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Foreign exchange — FX",
        "definition": "currencies and their exchange rates.",
        "group": "Treasury",
        "id": "s12-14",
        "formula": "Converted amount = base-currency amount × quote-currency units per base unit",
        "variables": "Check quote direction. Fees, spreads, settlement timing, and hedging change realized outcomes."
      },
      {
        "name": "Credit risk",
        "definition": "counterparty fails to pay.",
        "group": "Financial risk",
        "id": "s12-15",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Market risk",
        "definition": "losses from market movements.",
        "group": "Financial risk",
        "id": "s12-16",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Liquidity risk",
        "definition": "difficulty meeting obligations or selling assets.",
        "group": "Financial risk",
        "id": "s12-17",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Counterparty risk",
        "definition": "the other party fails to perform.",
        "group": "Financial risk",
        "id": "s12-18",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Hedging",
        "definition": "reducing a specific exposure.",
        "group": "Derivatives and hedging",
        "id": "s12-19",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Forward",
        "definition": "customized future transaction.",
        "group": "Derivatives and hedging",
        "id": "s12-20",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Future",
        "definition": "standardized exchange-traded contract.",
        "group": "Derivatives and hedging",
        "id": "s12-21",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Option",
        "definition": "a right to transact on specified terms.",
        "group": "Derivatives and hedging",
        "id": "s12-22",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Swap",
        "definition": "an agreement to exchange specified cash flows.",
        "group": "Derivatives and hedging",
        "id": "s12-23",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Default",
        "definition": "failure to meet contractual obligations.",
        "group": "Distress and restructuring",
        "id": "s12-24",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Insolvency",
        "definition": "inability to meet obligations or a balance-sheet condition, depending on the legal context.",
        "group": "Distress and restructuring",
        "id": "s12-25",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Restructuring",
        "definition": "changing financial or operating arrangements.",
        "group": "Distress and restructuring",
        "id": "s12-26",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Recovery rate",
        "definition": "proportion of a claim recovered.",
        "group": "Distress and restructuring",
        "id": "s12-27",
        "formula": "Recovery rate = recovered claim value / claim amount × 100",
        "variables": "Specify valuation date, claim seniority, costs, and recovery timing.",
        "calculatorId": "recovery"
      },
      {
        "name": "Agency problem",
        "definition": "conflicts between decision-makers and those they represent.",
        "group": "Governance and reporting",
        "id": "s12-28",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Fiduciary duty",
        "definition": "duties owed in a position of trust.",
        "group": "Governance and reporting",
        "id": "s12-29",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Internal controls",
        "definition": "processes supporting reliable reporting and operations.",
        "group": "Governance and reporting",
        "id": "s12-30",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Audit",
        "definition": "independent examination.",
        "group": "Governance and reporting",
        "id": "s12-31",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      },
      {
        "name": "Earnings quality",
        "definition": "how faithfully reported earnings reflect sustainable performance.",
        "group": "Governance and reporting",
        "id": "s12-32",
        "formula": null,
        "variables": "This is a concept, process, contract feature, or field of practice. Its analysis depends on a defined situation rather than one universal numerical formula."
      }
    ]
  }
];

export const FINANCE_SOURCES = [
  {title: "SEC · Financial statements", url: "https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements", detail: "Financial-statement relationships and ratio definitions."},
  {title: "CFA Institute · Free cash flow valuation", url: "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation", detail: "FCFF, FCFE, financing costs, and matching discount rates."},
  {title: "NYU Stern · Terminal value", url: "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/termvalapproaches.htm", detail: "Stable-growth assumptions and terminal-value methods."},
  {title: "Microsoft · NPV and IRR", url: "https://support.microsoft.com/en-us/excel/go-with-the-cash-flow-calculate-npv-and-irr-in-excel", detail: "Periodic cash-flow timing and the relationship between NPV and IRR."}
];
