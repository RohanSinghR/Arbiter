export type StepKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

export interface ReasoningStep {
  id: string;
  kind: StepKind;
  label: string;
  title: string;
  summary: string;
  evidence: { label: string; value: string }[];
  narrative: string;
  sparkline?: number[];
  bars?: { label: string; value: number }[];
}

interface ApiStep {
  id: string;
  title: string;
  description: string;
  type: StepKind;
  evidence: string;
  value?: string;
  sparkline?: number[];
  bars?: { label: string; value: number }[];
}

export const buildSteps = async (ticker: string, depth: number): Promise<ReasoningStep[]> => {
  const T = ticker.toUpperCase();

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: T, depth }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch reasoning steps");
  }

  const { steps } = (await res.json()) as { steps: ApiStep[] };

  return steps.map((s, i): ReasoningStep => ({
    id: s.id ?? `n${i + 1}`,
    kind: s.type,
    label: s.type.toUpperCase(),
    title: s.title,
    summary: s.description,
    narrative: s.evidence,
    evidence: [
      { label: "Detail", value: s.evidence },
      ...(s.value ? [{ label: "Metric", value: s.value }] : []),
    ],
    sparkline: Array.isArray(s.sparkline) ? s.sparkline : undefined,
    bars: Array.isArray(s.bars) ? s.bars : undefined,
  }));
};