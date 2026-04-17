import Groq from "groq-sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type StepKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

interface ChartBar {
    label: string;
    value: number;
}

interface RawStep {
    id: string;
    title: string;
    description: string;
    type: StepKind;
    evidence: string;
    value?: string;
    sparkline?: number[];
    bars?: ChartBar[];
}

function isValidStepKind(value: unknown): value is StepKind {
    return (
        value === "ingest" ||
        value === "analyze" ||
        value === "check" ||
        value === "signal" ||
        value === "mandate"
    );
}

function clampDepth(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 5;
    return Math.max(3, Math.min(8, Math.floor(n)));
}

function normalizeStep(step: Partial<RawStep>, index: number, ticker: string): RawStep {
    const fallbackTypes: StepKind[] = ["ingest", "analyze", "check", "signal", "mandate"];
    const type: StepKind =
        isValidStepKind(step.type) ? step.type : fallbackTypes[Math.min(index, fallbackTypes.length - 1)];

    const normalized: RawStep = {
        id: typeof step.id === "string" && step.id.trim() ? step.id : `n${index + 1}`,
        title:
            typeof step.title === "string" && step.title.trim()
                ? step.title
                : `${ticker.toUpperCase()} reasoning step ${index + 1}`,
        description:
            typeof step.description === "string" && step.description.trim()
                ? step.description
                : "No description provided.",
        type,
        evidence:
            typeof step.evidence === "string" && step.evidence.trim()
                ? step.evidence
                : "No supporting evidence provided.",
        value: typeof step.value === "string" ? step.value : undefined,
    };

    if (Array.isArray(step.sparkline)) {
        normalized.sparkline = step.sparkline.filter(
            (n): n is number => typeof n === "number" && Number.isFinite(n)
        );
    }

    if (Array.isArray(step.bars)) {
        normalized.bars = step.bars
            .filter(
                (bar): bar is ChartBar =>
                    !!bar &&
                    typeof bar.label === "string" &&
                    typeof bar.value === "number" &&
                    Number.isFinite(bar.value)
            )
            .map((bar) => ({
                label: bar.label,
                value: bar.value,
            }));
    }

    return normalized;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { ticker, depth } = req.body ?? {};

    if (!ticker || typeof ticker !== "string") {
        return res.status(400).json({ error: "Ticker is required" });
    }

    const safeTicker = ticker.trim().toUpperCase();
    const safeDepth = clampDepth(depth);

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 1800,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
You are a financial reasoning engine.

Return ONLY a valid JSON object with this exact top-level shape:
{
  "steps": [
    {
      "id": "n1",
      "title": "short title",
      "description": "one sentence explanation",
      "type": "ingest" | "analyze" | "check" | "signal" | "mandate",
      "evidence": "detailed evidence or data behind this step",
      "value": "optional metric like +6.1% or P/E 24.3",
      "sparkline": [optional array of 6 to 10 numbers for trend visualization],
      "bars": [optional array of objects like { "label": "AAPL", "value": 28.4 }]
    }
  ]
}

Rules:
1. Return exactly ${safeDepth} steps.
2. The final step MUST be type "mandate".
3. Use "sparkline" only for trend-oriented steps like revenue, EPS, margins, momentum, or growth.
4. Use "bars" only for comparison steps like P/E, EV/EBITDA, peers, sector, or factor scores.
5. Do not include markdown, comments, or text outside JSON.
6. Make the reasoning specific to the ticker provided.
7. Make sure all numbers in sparkline and bars are valid numeric values.
8. Use concise, finance-style language.
          `.trim(),
                },
                {
                    role: "user",
                    content: `Analyze ${safeTicker} and produce ${safeDepth} reasoning steps with chart-ready data where relevant.`,
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? '{"steps":[]}';
        const parsed = JSON.parse(raw);

        if (!parsed || !Array.isArray(parsed.steps)) {
            return res.status(500).json({ error: "Model returned invalid shape", raw });
        }

        const steps = parsed.steps
            .slice(0, safeDepth)
            .map((step: Partial<RawStep>, index: number) => normalizeStep(step, index, safeTicker));

        if (steps.length > 0) {
            steps[steps.length - 1].type = "mandate";
        }

        return res.status(200).json({ steps });
    } catch (error) {
        console.error("Groq analyze error:", error);
        return res.status(500).json({
            error: "Failed to generate reasoning steps",
        });
    }
}