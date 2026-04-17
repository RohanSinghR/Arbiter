export type StepKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

export interface ChartBar {
  label: string;
  value: number;
}

export interface ReasoningStep {
  id: string;
  type: StepKind;
  title: string;
  description: string;
  evidence: string;
  value?: string;
  sparkline?: number[];
  bars?: ChartBar[];
}

export async function buildSteps(ticker: string, depth: number): Promise<ReasoningStep[]> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, depth }),
  });

  if (!res.ok) {
    throw new Error(`analyze API error: ${res.status}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.steps)) {
    throw new Error("Unexpected response shape from /api/analyze");
  }

  return data.steps as ReasoningStep[];
}