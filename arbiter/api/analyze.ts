import Groq from "groq-sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type NodeKind = "ingest" | "analyze" | "check" | "signal" | "mandate";

interface ChartBar {
    label: string;
    value: number;
}

interface RawNode {
    id: string;
    type: NodeKind;
    title: string;
    description: string;
    evidence: string;
    value?: string;
    sparkline?: number[];
    bars?: ChartBar[];
}

interface RawEdge {
    source: string;
    target: string;
    weight: number; // 0.0 – 1.0, drives visual thickness
    label?: string;
}

function isValidKind(v: unknown): v is NodeKind {
    return ["ingest", "analyze", "check", "signal", "mandate"].includes(v as string);
}

function normalizeNode(n: Partial<RawNode>, i: number, ticker: string): RawNode {
    const fallback: NodeKind[] = ["ingest", "analyze", "check", "signal", "mandate"];
    const node: RawNode = {
        id: typeof n.id === "string" && n.id.trim() ? n.id.trim() : `n${i + 1}`,
        type: isValidKind(n.type) ? n.type : fallback[Math.min(i, fallback.length - 1)],
        title: typeof n.title === "string" && n.title.trim() ? n.title : `Step ${i + 1}`,
        description: typeof n.description === "string" && n.description.trim() ? n.description : "",
        evidence: typeof n.evidence === "string" && n.evidence.trim() ? n.evidence : "No evidence provided.",
        value: typeof n.value === "string" ? n.value : undefined,
    };
    if (Array.isArray(n.sparkline)) {
        node.sparkline = n.sparkline.filter((x): x is number => typeof x === "number" && isFinite(x));
    }
    if (Array.isArray(n.bars)) {
        node.bars = n.bars.filter(
            (b): b is ChartBar => !!b && typeof b.label === "string" && typeof b.value === "number" && isFinite(b.value)
        );
    }
    return node;
}

function normalizeEdge(e: Partial<RawEdge>, i: number): RawEdge | null {
    if (typeof e.source !== "string" || typeof e.target !== "string") return null;
    return {
        source: e.source.trim(),
        target: e.target.trim(),
        weight: typeof e.weight === "number" && isFinite(e.weight) ? Math.max(0, Math.min(1, e.weight)) : 0.5,
        label: typeof e.label === "string" ? e.label : undefined,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { ticker } = req.body ?? {};
    if (!ticker || typeof ticker !== "string") return res.status(400).json({ error: "Ticker required" });

    const safeTicker = ticker.trim().toUpperCase();

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 2400,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
You are a financial reasoning graph engine for ${safeTicker}.

Return ONLY valid JSON with this exact shape:
{
  "nodes": [
    {
      "id": "ingest",
      "type": "ingest",
      "title": "Data Ingestion",
      "description": "one sentence",
      "evidence": "detailed supporting data",
      "value": "optional metric string e.g. +12.4%",
      "sparkline": [optional 6-8 numbers, trend only],
      "bars": [optional array of { "label": string, "value": number }, comparison only]
    }
  ],
  "edges": [
    { "source": "ingest", "target": "revenue_growth", "weight": 0.9, "label": "optional short label" }
  ]
}

GRAPH TOPOLOGY RULES — follow exactly:
1. Start with exactly ONE node of type "ingest" with id "ingest".
2. From "ingest", branch into 3 parallel "analyze" nodes covering distinct fundamentals (e.g. revenue, margins, balance sheet).
3. The 3 analyze nodes converge into exactly ONE "check" node (valuation / risk cross-check).
4. "check" leads to ONE "signal" node (overall signal synthesis).
5. "signal" leads to ONE final "mandate" node (the investment mandate).
6. Total nodes: exactly 7. Total edges: exactly 6 (1 ingest→3 analyze, 3 analyze→check, 1 check→signal, 1 signal→mandate).

Wait — that's 1 + 3 + 3 + 1 + 1 = 9 edges. Correct count: 9 edges.

EDGE WEIGHT: 0.0–1.0. Higher = stronger signal contribution. Assign meaningfully.
DATA RULES:
- "sparkline" only on trend steps (revenue, EPS, margins, momentum)
- "bars" only on comparison steps (P/E, EV/EBITDA, peer multiples)
- All numbers must be finite
- No markdown, no text outside JSON
- Finance-grade concise language
`.trim(),
                },
                {
                    role: "user",
                    content: `Build the reasoning graph for ${safeTicker}.`,
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? '{"nodes":[],"edges":[]}';
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            return res.status(500).json({ error: "Model returned invalid shape", raw });
        }

        const nodes = parsed.nodes.map((n: Partial<RawNode>, i: number) => normalizeNode(n, i, safeTicker));
        const edges = parsed.edges
            .map((e: Partial<RawEdge>, i: number) => normalizeEdge(e, i))
            .filter(Boolean) as RawEdge[];

        // Guarantee last node is mandate
        if (nodes.length > 0) nodes[nodes.length - 1].type = "mandate";

        return res.status(200).json({ nodes, edges });
    } catch (err) {
        console.error("Groq graph error:", err);
        return res.status(500).json({ error: "Failed to generate reasoning graph" });
    }
}