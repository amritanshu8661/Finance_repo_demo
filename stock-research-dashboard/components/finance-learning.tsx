"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, ChevronDown, ChevronRight, CircleHelp, FileSpreadsheet, GraduationCap, Search, ShieldCheck, Sparkles } from "lucide-react";
import { FINANCE_SOURCES, FINANCE_STAGES, type FinanceTerm } from "@/lib/finance/curriculum";
import { calculateFinance, FINANCE_CALCULATORS, type FinanceCalculation, type FinanceCalculator } from "@/lib/finance/calculations";
import "./finance-learning.css";

type LearningTab = "map" | "formulas";
const termCount = FINANCE_STAGES.reduce((sum, stage) => sum + stage.terms.length, 0);
const defaults = (definition: FinanceCalculator) => Object.fromEntries(definition.inputs.map(field => [field.id, field.example]));

function formatResult(result: FinanceCalculation) {
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: result.unit === "percent" || result.unit === "ratio" ? 4 : 2, notation: Math.abs(result.value) >= 1e15 ? "scientific" : "standard" }).format(result.value);
  const suffix = { money: " amount units", percent: "%", ratio: "×", days: " days", months: " months", number: "" }[result.unit];
  return `${formatted}${suffix}`;
}

export default function FinanceLearning() {
  const [tab, setTab] = useState<LearningTab>("map");
  const [stageId, setStageId] = useState<number | "all">(1);
  const [query, setQuery] = useState("");
  const [formulaQuery, setFormulaQuery] = useState("");
  const [formulaStage, setFormulaStage] = useState(0);
  const [calculatorId, setCalculatorId] = useState("compound-value");
  const [values, setValues] = useState<Record<string, string>>(defaults(FINANCE_CALCULATORS.find(item => item.id === "compound-value")!));
  const [result, setResult] = useState<FinanceCalculation | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const calculator = FINANCE_CALCULATORS.find(item => item.id === calculatorId)!;
  const visibleStages = useMemo(() => {
    const search = query.trim().toLowerCase();
    return FINANCE_STAGES.filter(stage => stageId === "all" || stage.id === stageId).map(stage => ({ ...stage, terms: stage.terms.filter(term => !search || `${stage.title} ${term.name} ${term.definition} ${term.formula || ""} ${term.group || ""}`.toLowerCase().includes(search)) })).filter(stage => stage.terms.length);
  }, [stageId, query]);
  const filteredCalculators = useMemo(() => FINANCE_CALCULATORS.filter(item => (!formulaStage || item.stage === formulaStage) && `${item.title} ${item.formula} ${item.explanation}`.toLowerCase().includes(formulaQuery.trim().toLowerCase())), [formulaQuery, formulaStage]);

  function chooseCalculator(id: string) {
    const selected = FINANCE_CALCULATORS.find(item => item.id === id);
    if (!selected) return;
    setCalculatorId(id); setValues(defaults(selected)); setResult(null); setError("");
  }
  function openCalculator(id: string) {
    chooseCalculator(id); setTab("formulas"); setFormulaQuery(""); setFormulaStage(0);
    document.getElementById("finance-academy-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function toggleTerm(id: string) {
    setExpanded(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function renderTerm(term: FinanceTerm, stageNumber: number) {
    const isExpanded = expanded.has(term.id);
    return <article className={`academy-term ${term.formula ? "has-formula" : ""}`} key={term.id}>
      <div className="academy-term-heading"><div>{term.group && <p className="academy-term-group">{term.group}</p>}<h3>{term.name}</h3></div><span className="academy-term-number">{String(stageNumber).padStart(2, "0")}</span></div>
      <p className="academy-term-definition">{term.definition}</p>
      {term.formula ? <div className="academy-formula-block"><span><Calculator size={12} />CONVENTIONAL FORMULA</span><p>{term.formula}</p></div> : <div className="academy-concept-label"><BookOpen size={13} />Concept · no single numerical formula</div>}
      <button className="academy-term-expand" aria-expanded={isExpanded} aria-controls={`detail-${term.id}`} onClick={() => toggleTerm(term.id)}>{isExpanded ? "Hide assumptions" : term.formula ? "Variables & assumptions" : "How to think about it"}<ChevronDown size={14} className={isExpanded ? "is-open" : ""} /></button>
      {isExpanded && <p className="academy-term-variables" id={`detail-${term.id}`}>{term.variables}</p>}
      {term.calculatorId && <button className="academy-try-formula" onClick={() => openCalculator(term.calculatorId!)}>Try this formula<ArrowUpRight size={13} /></button>}
    </article>;
  }

  return <div className="finance-academy" id="finance-academy-top">
    <header className="academy-page-heading"><div><p className="academy-eyebrow"><GraduationCap size={14} />THE FINANCE LEARNING MAP</p><h1>Understand the numbers.<br /><span>Build your own perspective.</span></h1><p>Move from money basics to business valuation. Explore every term in your learning map, then try the formulas with your own assumptions.</p></div><div className="academy-hero-mark" aria-hidden="true"><span className="academy-mark-orbit" /><BookOpen size={38} /><span className="academy-mark-spark"><Sparkles size={17} /></span></div></header>
    <div className="academy-stats"><div><strong>12</strong><span>connected stages</span></div><div><strong>{termCount}</strong><span>finance concepts</span></div><div><strong>{FINANCE_CALCULATORS.length}</strong><span>interactive calculators</span></div><div className="academy-purpose"><ShieldCheck size={18} /><span>For learning and research.<br />Assumptions always matter.</span></div></div>
    <div className="academy-main-tabs" aria-label="Academy section"><button className={tab === "map" ? "is-active" : ""} aria-pressed={tab === "map"} onClick={() => setTab("map")}><BookOpen size={16} />Learning map<span>01 → 12</span></button><button className={tab === "formulas" ? "is-active" : ""} aria-pressed={tab === "formulas"} onClick={() => setTab("formulas")}><Calculator size={16} />Formula lab<span>{FINANCE_CALCULATORS.length}</span></button><a href="/data"><FileSpreadsheet size={15} />Use your company files<ArrowUpRight size={14} /></a></div>

    {tab === "map" ? <>
      <div className="academy-map-toolbar"><label className="academy-search"><Search size={17} /><input aria-label="Search all finance terms" placeholder="Search a concept, formula, or topic..." value={query} onChange={event => { setQuery(event.target.value); if (event.target.value) setStageId("all"); }} /></label><p>{visibleStages.reduce((sum, stage) => sum + stage.terms.length, 0)} concepts shown</p></div>
      <div className="academy-map-layout"><aside className="academy-journey"><div className="academy-journey-heading"><span>YOUR LEARNING PATH</span><ArrowRight size={13} /></div><button className={`academy-stage-all ${stageId === "all" ? "is-selected" : ""}`} onClick={() => setStageId("all")}>Explore all concepts<span>{termCount}</span></button><ol>{FINANCE_STAGES.map(stage => <li key={stage.id}><button className={stageId === stage.id ? "is-selected" : ""} onClick={() => { setStageId(stage.id); setQuery(""); }} aria-pressed={stageId === stage.id}><span className="academy-stage-index">{String(stage.id).padStart(2, "0")}</span><span><strong>{stage.title}</strong><small>{stage.terms.length} concepts</small></span><ChevronRight size={13} /></button></li>)}</ol><div className="academy-journey-note"><LightbulbIcon /><strong>Start with a practice business.</strong><p>A café, shop, or small service company is a good way to connect the terms to real questions.</p></div></aside>
      <div className="academy-stage-content">{visibleStages.length ? visibleStages.map(stage => <section className="academy-stage-section" key={stage.id}><div className="academy-stage-header"><span>{String(stage.id).padStart(2, "0")}</span><div><p>{stage.goal}</p><h2>{stage.title}</h2><small>{stage.description}</small></div></div>{stage.id === 3 && <div className="academy-insight"><CircleHelp size={16} /><span><strong>Profit and cash are different.</strong> A sale on credit can increase profit before the customer pays.</span></div>}{stage.id === 11 && <div className="academy-insight"><CircleHelp size={16} /><span><strong>Match cash flows and discount rates.</strong> Use WACC for FCFF and cost of equity for FCFE, with consistent assumptions.</span></div>}<div className="academy-term-grid">{stage.terms.map(term => renderTerm(term, stage.id))}</div>{stage.id < 12 && stageId !== "all" && <button className="academy-next-stage" onClick={() => { setStageId(stage.id + 1); setQuery(""); document.getElementById("finance-academy-top")?.scrollIntoView({ behavior: "smooth" }); }}><span>Continue your learning path<strong>{FINANCE_STAGES[stage.id].title}</strong></span><ArrowRight size={19} /></button>}</section>) : <div className="academy-empty"><Search size={28} /><h2>No concepts matched that search.</h2><p>Try “cash”, “revenue”, “risk”, or a formula name.</p><button onClick={() => { setQuery(""); setStageId("all"); }}>Show all concepts<ArrowRight size={15} /></button></div>}</div></div>
    </> : <div className="academy-lab-layout"><aside className="academy-calculator-library"><div className="academy-library-heading"><h2>Choose a formula</h2><span>{filteredCalculators.length}</span></div><label className="academy-search"><Search size={15} /><input aria-label="Search calculators" placeholder="Find a calculator..." value={formulaQuery} onChange={event => setFormulaQuery(event.target.value)} /></label><label className="academy-select-label">Learning stage<select value={formulaStage} onChange={event => setFormulaStage(Number(event.target.value))}><option value={0}>All 12 stages</option>{FINANCE_STAGES.map(stage => <option value={stage.id} key={stage.id}>{stage.id}. {stage.title}</option>)}</select></label><div className="academy-calculator-list">{filteredCalculators.length ? filteredCalculators.map(item => <button key={item.id} className={calculatorId === item.id ? "is-selected" : ""} aria-pressed={calculatorId === item.id} onClick={() => chooseCalculator(item.id)}><span><Calculator size={14} /></span><div><strong>{item.title}</strong><small>Stage {String(item.stage).padStart(2, "0")} · {FINANCE_STAGES[item.stage - 1].title}</small></div><ChevronRight size={13} /></button>) : <p className="academy-library-empty">No formulas match. Try another search or stage.</p>}</div></aside>
      <section className="academy-calculator-workspace"><div className="academy-calculator-heading"><span className="academy-calculator-symbol"><Calculator size={24} /></span><div><p>FORMULA LAB · STAGE {String(calculator.stage).padStart(2, "0")}</p><h2>{calculator.title}</h2></div></div><p className="academy-calculator-description">{calculator.explanation}</p><div className="academy-equation"><span>THE FORMULA</span><p>{calculator.formula}</p></div><div className="academy-input-note"><CircleHelp size={15} /><p>Example values are prefilled. Replace them with your assumptions. Use one currency and amount scale throughout. Enter <strong>10 for 10%</strong>.</p></div><form onSubmit={event => { event.preventDefault(); try { setResult(calculateFinance(calculatorId, values)); setError(""); } catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : "Check your inputs and try again."); } }}><div className="academy-input-grid">{calculator.inputs.map(field => <div className={`academy-input-field ${field.kind === "cashflows" ? "is-wide" : ""}`} key={`${calculatorId}-${field.id}`}><label htmlFor={`calc-${field.id}`}>{field.label}</label>{field.kind === "cashflows" ? <textarea id={`calc-${field.id}`} value={values[field.id] || ""} maxLength={10000} rows={3} onChange={event => { setValues(current => ({ ...current, [field.id]: event.target.value })); setResult(null); setError(""); }} required /> : <input id={`calc-${field.id}`} type="number" step={field.integer ? "1" : "any"} min={field.min} max={field.max} value={values[field.id] ?? ""} onChange={event => { setValues(current => ({ ...current, [field.id]: event.target.value })); setResult(null); setError(""); }} required />}{field.hint && <small>{field.hint}</small>}</div>)}</div>{error && <div className="academy-calculation-error" role="alert"><CircleHelp size={16} /><span>{error}</span></div>}<div className="academy-calculator-actions"><button type="submit"><Calculator size={16} />Calculate<ArrowRight size={16} /></button><button type="button" onClick={() => { setValues(defaults(calculator)); setResult(null); setError(""); }}>Reset example</button></div></form>
      {result && <div className="academy-calculation-result" role="status"><span><Check size={14} />CALCULATED RESULT</span><strong>{formatResult(result)}</strong><p>Based on the inputs above. This result is a model output, not a forecast or recommendation.</p></div>}<div className="academy-assumptions"><h3><ShieldCheck size={16} />Read the assumptions</h3><p>{calculator.assumptions}</p>{calculator.source && <a href={calculator.source} target="_blank" rel="noopener noreferrer">Learn about the convention<ArrowUpRight size={14} /></a>}</div><div className="academy-data-next"><FileSpreadsheet size={20} /><p><strong>Ready to work with company data?</strong><span>Upload historical files in the Data library. Available financial fields can be connected to analysis.</span></p><a href="/data" aria-label="Open Data library"><ArrowRight size={18} /></a></div></section></div>}

    <section className="academy-practice"><span><GraduationCap size={25} /></span><div><h2>Turn the vocabulary into practice.</h2><p>Choose one business. Explain how it earns profit, why cash changes, what growth costs, and how funding and valuation assumptions connect. A learning map supports practice; it does not certify professional proficiency.</p></div></section>
    <footer className="academy-sources"><div><h2>Conventions & further reading</h2><p>Your supplied learning map is the curriculum. These references help explain selected accounting and valuation conventions.</p></div><div>{FINANCE_SOURCES.map(source => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.url} title={source.detail}>{source.title}<ArrowUpRight size={12} /></a>)}</div><p className="academy-disclaimer"><ShieldCheck size={14} />For education and research. Formulas require consistent definitions, periods, currencies, and assumptions. No guaranteed outcomes or personalized investment advice.</p></footer>
  </div>;
}

function LightbulbIcon() { return <span className="academy-small-book"><BookOpen size={17} /></span>; }
