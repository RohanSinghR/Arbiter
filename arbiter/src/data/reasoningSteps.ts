import type { Node, Edge } from "@xyflow/react";

export interface ReasoningStep {
  id: string;
  label: string;
  type: "ingest" | "analyze" | "check" | "signal" | "mandate";
  chartType?: "sparkline" | "bar";
  detail: {
    title: string;
    summary: string;
    evidence: string[];
    confidence: number;
  };
}

export const getReasoningSteps = (ticker: string): ReasoningStep[] => [
  {
    id: "1",
    label: `Ingest: ${ticker} 10-K Filing 2024`,
    type: "ingest",
    detail: {
      title: "Document Ingestion",
      summary: `Parsed ${ticker} 10-K annual filing for fiscal year 2024. Extracted financial statements, risk factors, and management discussion.`,
      evidence: [
        "Filing date: October 2024",
        "Total pages processed: 147",
        "Key sections: Revenue, Operating Expenses, Cash Flow, Risk Factors",
        "NLP extraction confidence: 97.3%",
      ],
      confidence: 0.97,
    },
  },
  {
    id: "2",
    label: "Analyze: Revenue growth YoY +6.1%",
    type: "analyze",
    chartType: "sparkline",
    detail: {
      title: "Revenue Growth Analysis",
      summary: "Year-over-year revenue growth of 6.1% driven by services segment expansion and strong product cycle.",
      evidence: [
        "FY2024 Revenue: $394.3B (+6.1% YoY)",
        "Services Revenue: $96.2B (+12.3% YoY)",
        "Products Revenue: $298.1B (+4.1% YoY)",
        "Gross Margin expanded 120bps to 46.2%",
        "Operating cash flow: $118.3B",
      ],
      confidence: 0.94,
    },
  },
  {
    id: "3",
    label: "Check: P/E ratio vs sector median",
    type: "check",
    chartType: "bar",
    detail: {
      title: "Valuation Comparison",
      summary: "Current P/E of 28.4x compared against sector median of 32.1x, suggesting relative undervaluation.",
      evidence: [
        `${ticker} Forward P/E: 28.4x`,
        "Tech Sector Median P/E: 32.1x",
        "S&P 500 P/E: 21.7x",
        "PEG Ratio: 1.82 (vs sector 2.14)",
        "EV/EBITDA: 22.1x (vs sector 26.8x)",
      ],
      confidence: 0.91,
    },
  },
  {
    id: "4",
    label: "Signal: Undervalued relative to peers",
    type: "signal",
    detail: {
      title: "Signal Detection",
      summary: "Multi-factor model signals undervaluation relative to large-cap tech peers on both earnings and cash flow basis.",
      evidence: [
        "Percentile rank vs peers: 23rd (cheaper)",
        "DCF fair value estimate: $245 (+14% upside)",
        "Analyst consensus: 78% Buy, 18% Hold, 4% Sell",
        "Institutional ownership trend: +2.1% QoQ",
        "Short interest: 0.7% (low conviction bearish)",
      ],
      confidence: 0.88,
    },
  },
  {
    id: "5",
    label: "Mandate: BUY — High Conviction",
    type: "mandate",
    detail: {
      title: "Investment Mandate",
      summary: "Strong buy recommendation with high conviction based on fundamental undervaluation, robust cash generation, and positive momentum.",
      evidence: [
        "Action: BUY",
        "Conviction: HIGH (88th percentile)",
        "Target allocation: 4.2% of portfolio",
        "Risk-adjusted return (Sharpe): 1.34",
        "Time horizon: 12-18 months",
        "Stop loss: -12% from entry",
      ],
      confidence: 0.92,
    },
  },
];

export const buildGraphElements = (
  steps: ReasoningStep[]
): { nodes: Node[]; edges: Edge[] } => {
  const ySpacing = 140;
  const nodes: Node[] = steps.map((step, i) => ({
    id: step.id,
    type: "reasoning",
    position: { x: 0, y: i * ySpacing },
    data: { step },
  }));

  const edges: Edge[] = steps.slice(0, -1).map((step, i) => ({
    id: `e${step.id}-${steps[i + 1].id}`,
    source: step.id,
    target: steps[i + 1].id,
    type: "animated",
    animated: true,
  }));

  return { nodes, edges };
};
