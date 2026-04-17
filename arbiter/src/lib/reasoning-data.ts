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

export const buildSteps = async (ticker: string): Promise<ReasoningStep[]> => {
  const T = ticker.toUpperCase();

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: T }),
  });

  if (!res.ok) throw new Error("Failed to fetch reasoning steps");

  const { steps } = await res.json();

  // Map API response to ReasoningStep shape
  return steps.map((s: {
    id: string;
    type: StepKind;
    title: string;
    description: string;
    evidence: string;
    value?: string;
  }, i: number): ReasoningStep => ({
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
  }));
};
