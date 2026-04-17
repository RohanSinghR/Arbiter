export type NodeKind =
  | "data_ingest"
  | "fundamental"
  | "risk"
  | "catalyst"
  | "valuation"
  | "synthesis"
  | "mandate";

export interface ChartBar {
  label: string;
  value: number;
}

export interface ReasoningNode {
  id: string;
  type: NodeKind;
  title: string;
  description: string;
  evidence: string;
  value?: string;
  signal?: "bullish" | "bearish" | "neutral";
  sparkline?: number[];
  bars?: ChartBar[];
}

export interface ReasoningEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface TickerMeta {
  companyName: string;
  exchange?: string;
  quoteType?: string;
  regularMarketPrice?: number;
  currency?: string;
  marketCap?: number;
}

export interface ReasoningGraph {
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  mandate_thesis: string;
  meta?: TickerMeta;
}

// Custom error class so callers can distinguish validation failures
export class TickerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TickerValidationError";
  }
}

export async function buildGraph(
  ticker: string,
  thesis?: string
): Promise<ReasoningGraph> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, thesis }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    // Surface ticker validation errors with a specific class
    if (res.status === 422 && body?.code === "INVALID_TICKER") {
      throw new TickerValidationError(
        body.error ?? `Unknown ticker: ${ticker}`
      );
    }

    throw new Error(
      body?.error ?? `analyze API error: ${res.status}`
    );
  }

  const data = await res.json();

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("Unexpected response shape from /api/analyze");
  }

  return data as ReasoningGraph;
}