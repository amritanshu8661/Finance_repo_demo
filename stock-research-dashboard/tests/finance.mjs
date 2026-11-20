/** Run with node tests/finance.mjs. These tests never call external services. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
const load = async entry => {
  const bundle = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
};
const { FINANCE_CALCULATORS, calculateFinance, FinanceCalculationError } = await load("lib/finance/calculations.ts");
const { FINANCE_STAGES, FINANCE_SOURCES } = await load("lib/finance/curriculum.ts");
let checks = 0;
function check(label, run) { run(); checks++; console.log(`PASS ${label}`); }
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);
const result = (id, values) => calculateFinance(id, values).value;
const rejects = (id, values, pattern) => assert.throws(() => calculateFinance(id, values), error => error instanceof FinanceCalculationError && (!pattern || pattern.test(error.message)));

check("all twelve supplied learning stages and 165 concepts are present", () => {
  assert.deepEqual(FINANCE_STAGES.map(s => s.id), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(FINANCE_STAGES.map(s => s.terms.length), [10, 12, 11, 12, 12, 12, 11, 12, 14, 13, 14, 32]);
  const all = FINANCE_STAGES.flatMap(s => s.terms);
  assert.equal(new Set(all.map(t => t.id)).size, 165);
  assert.ok(all.every(t => t.name && t.definition && t.variables));
  assert.ok(all.some(t => t.name === "Fiduciary duty"));
  assert.ok(all.some(t => t.name === "Yield to maturity — YTM"));
  assert.ok(all.some(t => t.name === "Cash conversion cycle — CCC"));
  assert.ok(all.filter(t => t.formula).length >= 110);
  assert.ok(all.filter(t => !t.formula).every(t => /concept|process/.test(t.variables)));
});
check("curriculum calculator links resolve and sources use HTTPS", () => {
  const ids = new Set(FINANCE_CALCULATORS.map(c => c.id));
  for (const term of FINANCE_STAGES.flatMap(s => s.terms)) if (term.calculatorId) assert.ok(ids.has(term.calculatorId), `${term.name} has an unresolved calculator`);
  assert.ok(FINANCE_SOURCES.length >= 4 && FINANCE_SOURCES.every(s => new URL(s.url).protocol === "https:"));
});
check("every calculator has a valid complete example with finite output", () => {
  assert.ok(FINANCE_CALCULATORS.length >= 50);
  assert.equal(new Set(FINANCE_CALCULATORS.map(c => c.id)).size, FINANCE_CALCULATORS.length);
  for (const calculator of FINANCE_CALCULATORS) {
    const example = Object.fromEntries(calculator.inputs.map(f => [f.id, f.example]));
    const output = calculateFinance(calculator.id, example);
    assert.ok(Number.isFinite(output.value), `${calculator.id} example is invalid`);
    assert.equal(output.unit, calculator.unit);
    assert.ok(output.note.length > 20);
  }
});
check("interest and compounding use human percentage units", () => {
  close(result("simple-interest", { principal: 1000, rate: 10, years: 2 }), 200);
  close(result("compound-value", { principal: 1000, rate: 12, periods: 12, years: 1 }), 1000 * 1.01 ** 12);
  rejects("compound-value", { principal: 1000, rate: 10, periods: 1.5, years: 1 }, /whole/);
});
check("returns include distributions and the exact inflation adjustment", () => {
  close(result("holding-return", { start: 1000, end: 1100, income: 20 }), 12);
  close(result("real-return", { nominal: 8, inflation: 3 }), (1.08 / 1.03 - 1) * 100);
  close(result("holding-return", { start: 1000, end: 0, income: 0 }), -100);
  close(result("real-return", { nominal: -100, inflation: 3 }), -100);
});
check("balance-sheet and cash-flow bridges preserve negative outcomes", () => {
  close(result("equity", { assets: 100, liabilities: 150 }), -50);
  close(result("free-cash-flow", { ocf: 50, capex: 100 }), -50);
  close(result("working-capital", { currentAssets: 100, currentLiabilities: 150 }), -50);
  close(result("cash-budget", { opening: 100, receipts: 20, payments: 150 }), -30);
});
check("gross profit EBITDA and straight-line depreciation follow stated definitions", () => {
  close(result("gross-profit", { revenue: 1000, cogs: 600 }), 400);
  close(result("ebitda", { ebit: 100, depreciation: 20, amortization: 10 }), 130);
  close(result("straight-depreciation", { cost: 10000, residual: 1000, life: 5 }), 1800);
  rejects("straight-depreciation", { cost: 1000, residual: 2000, life: 5 }, /Residual/);
});
check("profit margins and returns keep percent outputs distinct from ratios", () => {
  close(result("net-margin", { profit: -10, revenue: 100 }), -10);
  close(result("roa", { profit: 100, averageAssets: 2000 }), 5);
  close(result("roe", { profit: 100, averageEquity: 1000 }), 10);
  close(result("asset-turnover", { revenue: 1000, averageAssets: 2000 }), .5);
  close(result("current-ratio", { currentAssets: 500, currentLiabilities: 250 }), 2);
});
check("zero or negative ratio denominators are rejected", () => {
  rejects("net-margin", { profit: 10, revenue: 0 }, /greater than zero/);
  rejects("current-ratio", { currentAssets: 100, currentLiabilities: 0 }, /greater than zero/);
  rejects("debt-equity", { debt: 100, equity: -50 });
  rejects("roe", { profit: 100, averageEquity: 0 });
  rejects("pe", { price: 100, eps: 0 });
});
check("unit economics rejects nonpositive contribution and impossible customer counts", () => {
  close(result("break-even", { fixed: 101, price: 10, variable: 6 }), 26);
  rejects("break-even", { fixed: 100, price: 10, variable: 10 });
  rejects("break-even", { fixed: 100, price: 9, variable: 10 });
  rejects("churn", { lost: 101, start: 100 }, /cannot exceed/);
  close(result("ltv", { arpu: 100, margin: 70, churn: 5 }), 1400);
  rejects("ltv", { arpu: 100, margin: 70, churn: 0 });
});
check("working capital days use matching stated denominators", () => {
  close(result("dso", { receivables: 100, sales: 1000, days: 365 }), 36.5);
  close(result("dio", { inventory: 100, cogs: 500, days: 365 }), 73);
  close(result("dpo", { payables: 100, purchases: 500, days: 365 }), 73);
  close(result("cash-cycle", { dio: 30, dso: 10, dpo: 60 }), -20);
  rejects("dso", { receivables: 100, sales: 1000, days: 0 });
});
check("runway needs positive net burn rather than cash generation", () => {
  close(result("runway", { cash: 120000, burn: 10000 }), 12);
  rejects("runway", { cash: 120000, burn: 0 });
  rejects("runway", { cash: 120000, burn: -1000 });
});
check("variance and growth have explicit signs and zero-baseline guards", () => {
  close(result("variance", { actual: 900, budget: 1000 }), -100);
  close(result("revenue-growth", { current: -50, previous: -100 }), 50);
  rejects("revenue-growth", { current: 100, previous: 0 });
});
check("present and future value match cash-flow timing", () => {
  close(result("present-value", { future: 1331, rate: 10, periods: 3 }), 1000);
  close(result("future-value", { present: 1000, rate: 10, periods: 3 }), 1331);
  rejects("present-value", { future: 1000, rate: -100, periods: 3 });
});
check("NPV includes the time-zero investment exactly once", () => {
  close(result("npv", { cashflows: "-1000, 1100", rate: 10 }), 0);
  close(result("npv", { cashflows: "-1000, 0, 1210", rate: 10 }), 0);
  close(result("npv", { cashflows: "-1000,400,450,500", rate: 10 }), -1000 + 400 / 1.1 + 450 / 1.1 ** 2 + 500 / 1.1 ** 3);
});
check("cash-flow input rejects implicit missing periods and nonfinite values", () => {
  for (const cashflows of ["-1000,,1100", "-1000,1100,", ",-1000,1100", "-1000; ;1100", "-1000,NaN", "-1000,Infinity", "100"]) rejects("npv", { cashflows, rate: 10 });
  assert.doesNotThrow(() => calculateFinance("npv", { cashflows: "-1000 1100", rate: 10 }));
});
check("conventional IRR solves positive and negative rates", () => {
  close(result("irr", { cashflows: "-1000,1100" }), 10, 1e-7);
  close(result("irr", { cashflows: "-1000,900" }), -10, 1e-7);
  close(result("irr", { cashflows: "-1000,0,1210" }), 10, 1e-7);
});
check("IRR never pretends a nonconventional pattern has one unique answer", () => {
  rejects("irr", { cashflows: "-100,230,-132" }, /multiple IRRs/);
  rejects("irr", { cashflows: "100,100" });
  rejects("irr", { cashflows: "-100,-100" });
  rejects("irr", { cashflows: "-1e30,1" }, /too close/);
});
check("debt coupons and dilution keep ownership separate from EPS effects", () => {
  close(result("annual-interest", { principal: 1000, rate: 6 }), 60);
  close(result("bond-coupon", { face: 1000, coupon: 5 }), 50);
  close(result("dilution", { existing: 1000, newShares: 100 }), 100 / 1100 * 100);
});
check("CAPM and WACC calculate with tax and weight constraints", () => {
  close(result("capm", { riskFree: 4, beta: 1.2, premium: 5 }), 10);
  close(result("wacc", { equityWeight: 70, debtWeight: 30, equityCost: 10, debtCost: 6, tax: 25 }), 8.35);
  rejects("wacc", { equityWeight: 70, debtWeight: 40, equityCost: 10, debtCost: 6, tax: 25 }, /100%/);
  rejects("wacc", { equityWeight: 70, debtWeight: 30, equityCost: 10, debtCost: 6, tax: 101 });
});
check("enterprise-value and free-cash-flow bridges use consistent signs", () => {
  close(result("enterprise-value", { equityValue: 2000, debt: 1000, preferred: 50, minority: 20, cash: 300 }), 2770);
  close(result("fcff", { ebit: 150, tax: 25, da: 30, capex: 50, changeWc: 10 }), 82.5);
  close(result("fcfe", { income: 100, da: 30, capex: 50, changeWc: 10, borrowing: 20 }), 90);
});
check("terminal value enforces growth below the discount rate", () => {
  close(result("terminal-value", { nextFlow: 100, rate: 10, growth: 3 }), 100 / .07);
  rejects("terminal-value", { nextFlow: 100, rate: 10, growth: 10 }, /lower/);
  rejects("terminal-value", { nextFlow: 100, rate: 5, growth: 6 }, /lower/);
});
check("MOIC counts both distributions and residual value", () => {
  close(result("moic", { distributions: 1200, remaining: 300, invested: 1000 }), 1.5);
  close(result("recovery", { recovered: 40, claim: 100 }), 40);
});
check("missing nonfinite and out-of-range inputs fail safely", () => {
  rejects("equity", { assets: "", liabilities: 10 });
  rejects("equity", { assets: "Infinity", liabilities: 10 });
  rejects("equity", { assets: Number.NaN, liabilities: 10 });
  rejects("equity", { assets: true, liabilities: 10 });
  rejects("equity", null);
  rejects("unknown", {});
  rejects("future-value", { present: 1e308, rate: 100, periods: 1000 }, /out-of-range/);
});
console.log(`\n${checks} finance checks passed across ${FINANCE_CALCULATORS.length} calculators and 165 concepts.`);
