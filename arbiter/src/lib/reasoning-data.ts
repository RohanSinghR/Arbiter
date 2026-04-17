export type NodeKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

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
  sparkline?: number[];
  bars?: ChartBar[];
}

export interface ReasoningEdge {
  source: string;
  target: string;
  weight: number; // 0.0 – 1.0
  label?: string;
}

export interface ReasoningGraph {
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
}

export async function buildGraph(ticker: string): Promise<ReasoningGraph> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });

  if (!res.ok) throw new Error(`analyze API error: ${res.status}`);

  const data = await res.json();

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("Unexpected response shape from /api/analyze");
  }

  return data as ReasoningGraph;
}