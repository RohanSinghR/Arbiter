// Mock reasoning step data for the Arbiter Trace demo

export type StepKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

export interface ReasoningStep {
  id: string;
  kind: StepKind;
  label: string;
  title: string;
  summary: string;
  evidence: { label: string; value: string }[];
  narrative: string;
  // visualization payloads
  sparkline?: number[];
  bars?: { label: string; value: number }[];
}

export const buildSteps = (ticker: string): ReasoningStep[] => {
  const T = ticker.toUpperCase();
  return [
    {
      id: "n1",
      kind: "ingest",
      label: "INGEST",
      title: `${T} 10-K Filing 2024`,
      summary: "Parsed annual report · 312 pages · 1,847 footnotes",
      narrative:
        "Loaded the most recent annual filing. Extracted financial statements, MD&A, risk factors and segment data into a structured representation for downstream reasoning.",
      evidence: [
        { label: "Source", value: "SEC EDGAR · 10-K (FY2024)" },
        { label: "Filed", value: "2024-11-01" },
        { label: "Pages parsed", value: "312" },
        { label: "Tables extracted", value: "84" },
      ],
    },
    {
      id: "n2",
      kind: "analyze",
      label: "ANALYZE",
      title: "Revenue growth YoY +6.1%",
      summary: "8-quarter trailing revenue trend · accelerating",
      narrative:
        "Quarterly revenue trend over the last eight quarters shows a re-acceleration in the most recent two periods, driven primarily by services and a modest hardware refresh cycle.",
      sparkline: [89.5, 81.8, 94.9, 119.6, 90.8, 81.8, 85.8, 124.3],
      evidence: [
        { label: "FY2024 revenue", value: "$391.0B" },
        { label: "YoY growth", value: "+6.1%" },
        { label: "Services", value: "+12.9% YoY" },
        { label: "Products", value: "+3.6% YoY" },
      ],
    },
    {
      id: "n3",
      kind: "check",
      label: "CHECK",
      title: "P/E vs sector median",
      summary: "Trading at a discount to large-cap tech peers",
      narrative:
        `Compared the current P/E multiple of ${T} against a curated peer set of mega-cap technology hardware and platform companies. Result is below the sector median, suggesting relative undervaluation when normalized for growth.`,
      bars: [
        { label: T, value: 28.4 },
        { label: "MSFT", value: 34.1 },
        { label: "GOOGL", value: 25.7 },
        { label: "META", value: 27.3 },
        { label: "Median", value: 31.2 },
      ],
      evidence: [
        { label: `${T} P/E (TTM)`, value: "28.4x" },
        { label: "Sector median", value: "31.2x" },
        { label: "Relative discount", value: "-9.0%" },
        { label: "PEG ratio", value: "1.6" },
      ],
    },
    {
      id: "n4",
      kind: "signal",
      label: "SIGNAL",
      title: "Undervalued vs peers",
      summary: "Composite score 7.8 / 10 · 4 of 5 factors positive",
      narrative:
        "Cross-checking valuation, growth re-acceleration, capital return policy and balance sheet strength produces a composite signal of undervaluation. The single negative factor is near-term China demand uncertainty.",
      evidence: [
        { label: "Valuation", value: "Positive" },
        { label: "Growth", value: "Positive" },
        { label: "Cash returns", value: "Positive" },
        { label: "Balance sheet", value: "Positive" },
        { label: "Geographic risk", value: "Neutral / negative" },
      ],
    },
    {
      id: "n5",
      kind: "mandate",
      label: "MANDATE",
      title: "BUY — High Conviction",
      summary: "12-month price target implies +18% upside",
      narrative:
        `Final mandate for ${T}: BUY with high conviction. Position sizing should respect concentration limits. Re-evaluate on next earnings release or material change in services growth trajectory.`,
      evidence: [
        { label: "Action", value: "BUY" },
        { label: "Conviction", value: "High (4 / 5)" },
        { label: "12M target", value: "+18% upside" },
        { label: "Re-evaluate", value: "Next earnings" },
      ],
    },
  ];
};
