import Groq from "groq-sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: "Ticker is required" });

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a financial reasoning engine. Return ONLY a raw JSON array, no markdown, no backticks, no explanation.

Each element must follow this exact shape:
{
  "id": "step-1",
  "title": "short title",
  "description": "one sentence explanation",
  "type": "ingest" | "analyze" | "check" | "signal" | "mandate",
  "evidence": "detailed evidence or data behind this step",
  "value": "optional metric like +6.1% or P/E 24.3"
}

Return exactly 5 steps ending with a mandate of BUY, SELL, or HOLD.`
                },
                {
                    role: "user",
                    content: `Analyze ${ticker}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const raw = completion.choices[0].message.content ?? "[]";
        const steps = JSON.parse(raw);
        return res.status(200).json({ steps });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to generate reasoning steps" });
    }
}