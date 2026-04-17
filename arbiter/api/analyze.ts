import Groq from "groq-sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type NodeKind =
    | "data_ingest"
    | "fundamental"
    | "risk"
    | "catalyst"
    | "valuation"
    | "synthesis"
    | "mandate";

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
    signal?: "bullish" | "bearish" | "neutral";
    sparkline?: number[];
    bars?: ChartBar[];
}

interface RawEdge {
    source: string;
    target: string;
    weight: number;
    label?: string;
}

interface RawGraph {
    nodes: RawNode[];
    edges: RawEdge[];
    mandate_thesis: string;
    confidence: number;
    signal: "BUY" | "SELL" | "HOLD";
}

const VALID_KINDS: NodeKind[] = [
    "data_ingest",
    "fundamental",
    "risk",
    "catalyst",
    "valuation",
    "synthesis",
    "mandate",
];

function isValidKind(v: unknown): v is NodeKind {
    return VALID_KINDS.includes(v as NodeKind);
}

function normalizeNode(n: Partial<RawNode>, i: number): RawNode {
    const node: RawNode = {
        id:
            typeof n.id === "string" && n.id.trim()
                ? n.id.trim().toLowerCase().replace(/\s+/g, "_")
                : `node_${i + 1}`,
        type: isValidKind(n.type) ? n.type : "fundamental",
        title:
            typeof n.title === "string" && n.title.trim()
                ? n.title
                : `Analysis Step ${i + 1}`,
        description:
            typeof n.description === "string" && n.description.trim()
                ? n.description
                : "",
        evidence:
            typeof n.evidence === "string" && n.evidence.trim()
                ? n.evidence
                : "No evidence provided.",
        value: typeof n.value === "string" && n.value.trim() ? n.value : undefined,
        signal:
            n.signal === "bullish" || n.signal === "bearish" || n.signal === "neutral"
                ? n.signal
                : undefined,
    };

    if (Array.isArray(n.sparkline)) {
        const filtered = n.sparkline.filter(
            (x): x is number => typeof x === "number" && isFinite(x)
        );
        if (filtered.length >= 2) node.sparkline = filtered;
    }

    if (Array.isArray(n.bars)) {
        const filtered = n.bars.filter(
            (b): b is ChartBar =>
                !!b &&
                typeof b.label === "string" &&
                typeof b.value === "number" &&
                isFinite(b.value)
        );
        if (filtered.length >= 2) node.bars = filtered;
    }

    return node;
}

function normalizeEdge(e: Partial<RawEdge>): RawEdge | null {
    if (typeof e.source !== "string" || typeof e.target !== "string") return null;
    return {
        source: e.source.trim(),
        target: e.target.trim(),
        weight:
            typeof e.weight === "number" && isFinite(e.weight)
                ? Math.max(0, Math.min(1, e.weight))
                : 0.5,
        label: typeof e.label === "string" && e.label.trim() ? e.label : undefined,
    };
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST")
        return res.status(405).json({ error: "Method not allowed" });

    const { ticker, thesis } = req.body ?? {};

    if (!ticker || typeof ticker !== "string")
        return res.status(400).json({ error: "Ticker required" });

    const safeTicker = ticker.trim().toUpperCase();
    const safeThesis =
        typeof thesis === "string" && thesis.trim()
            ? thesis.trim()
            : `Evaluate the investment case for ${safeTicker}`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.25,
            max_tokens: 3200,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
You are Arbiter, an autonomous fundamental reasoning engine for public equities.
Your task: build a structured, auditable reasoning graph that answers a specific investment thesis about a stock.

The investor's thesis: "${safeThesis}"
The stock: ${safeTicker}

Return ONLY valid JSON in this exact shape — no markdown, no commentary:

{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <number 0.0–1.0>,
  "mandate_thesis": "<1–2 sentence investment mandate summarizing the conclusion>",
  "nodes": [...],
  "edges": [...]
}

NODE TYPES and when to use each:
- "data_ingest"  → ONE node only. Describes what data sources are being analyzed (filings, transcripts, price data, macro).
- "fundamental"  → 2–3 nodes. Core financial metrics: revenue trajectory, margins, FCF, balance sheet quality.
- "risk"         → 1 node. Key risks: competitive, regulatory, macro, execution.
- "catalyst"     → 1 node. Near-term catalysts that could unlock or destroy value.
- "valuation"    → 1 node. Relative and intrinsic valuation: P/E, EV/EBITDA, DCF implied price.
- "synthesis"    → 1 node. Synthesizes all threads into a single signal with directional bias.
- "mandate"      → 1 node. Final investment mandate. Must reference signal and thesis directly.

Total: 8–9 nodes. 

TOPOLOGY:
- data_ingest has NO incoming edges (it is the source)
- fundamental, risk, catalyst nodes branch FROM data_ingest
- valuation branches FROM fundamental nodes (not directly from ingest)
- synthesis receives edges FROM risk, catalyst, valuation
- mandate receives edge FROM synthesis only

EDGE RULES:
- weight: 0.0–1.0 (how much this edge contributes to downstream conclusion)
- label: short phrase like "revenue quality", "margin compression risk", "re-rating catalyst"

NODE FIELDS:
- id: snake_case, unique, descriptive (e.g. "revenue_growth", "margin_expansion")
- title: ≤5 words, punchy
- description: 1 sentence
- evidence: 2–3 sentences of concrete financial reasoning with specific numbers where possible
- value: optional — ONE key metric (e.g. "+18% YoY", "P/E 24x", "FCF Yield 4.2%")
- signal: "bullish" | "bearish" | "neutral" — your read on this individual node
- sparkline: array of 7–8 numbers (include only for fundamental/catalyst nodes showing trends)
- bars: array of { label, value } (include only for valuation node showing peer multiples)

FINANCE-GRADE LANGUAGE. Be specific. Use real-world knowledge about ${safeTicker}.
If ${safeTicker} is not a known public equity, still produce a coherent graph using plausible analysis — do not fail.
`.trim(),
                },
                {
                    role: "user",
                    content: `Run the reasoning engine. Thesis: "${safeThesis}". Ticker: ${safeTicker}.`,
                },
            ],
        });

        const raw =
            completion.choices[0]?.message?.content ??
            '{"nodes":[],"edges":[],"signal":"HOLD","confidence":0.5,"mandate_thesis":""}';

        let parsed: Partial<RawGraph>;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return res.status(500).json({ error: "Model returned invalid JSON", raw });
        }

        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            return res
                .status(500)
                .json({ error: "Model returned invalid graph shape", raw });
        }

        const nodes = parsed.nodes.map((n, i) => normalizeNode(n as Partial<RawNode>, i));
        const edges = (parsed.edges as Partial<RawEdge>[])
            .map(normalizeEdge)
            .filter(Boolean) as RawEdge[];

        // Guarantee last node is mandate type
        if (nodes.length > 0) {
            nodes[nodes.length - 1].type = "mandate";
        }

        const signal: "BUY" | "SELL" | "HOLD" =
            parsed.signal === "BUY" || parsed.signal === "SELL" || parsed.signal === "HOLD"
                ? parsed.signal
                : "HOLD";

        const confidence =
            typeof parsed.confidence === "number" && isFinite(parsed.confidence)
                ? Math.max(0, Math.min(1, parsed.confidence))
                : 0.5;

        const mandate_thesis =
            typeof parsed.mandate_thesis === "string" && parsed.mandate_thesis.trim()
                ? parsed.mandate_thesis
                : `${signal} signal on ${safeTicker} with ${Math.round(confidence * 100)}% confidence.`;

        return res.status(200).json({
            nodes,
            edges,
            signal,
            confidence,
            mandate_thesis,
        });
    } catch (err) {
        console.error("Arbiter graph error:", err);
        return res.status(500).json({ error: "Failed to generate reasoning graph" });
    }
}