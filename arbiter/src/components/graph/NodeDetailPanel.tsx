import { ReasoningNode } from "@/lib/reasoning-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "../viz/Sparkline";
import { MiniBarChart } from "../viz/MiniBarChart";
import {
  Database,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart2,
  GitMerge,
  Target,
  ShieldAlert,
  Lightbulb,
  Scale,
  Search,
} from "lucide-react";

const iconFor: Record<string, React.ComponentType<{ className?: string }>> = {
  data_ingest: Database,
  fundamental: TrendingUp,
  risk: AlertTriangle,
  catalyst: Zap,
  valuation: BarChart2,
  synthesis: GitMerge,
  mandate: Target,
};

const kindLabel: Record<string, string> = {
  data_ingest: "DATA INGEST",
  fundamental: "FUNDAMENTAL",
  risk: "RISK",
  catalyst: "CATALYST",
  valuation: "VALUATION",
  synthesis: "SYNTHESIS",
  mandate: "MANDATE",
};

// Short description of what each node type represents
const kindDescription: Record<string, string> = {
  data_ingest:
    "Raw inputs ingested by the reasoning engine before analysis begins.",
  fundamental:
    "Core financial health metrics driving the long-term investment case.",
  risk: "Downside risks that could impair the thesis or destroy value.",
  catalyst:
    "Near-term events or structural shifts that could unlock or accelerate value.",
  valuation:
    "Relative and intrinsic valuation frameworks benchmarked against peers.",
  synthesis:
    "Cross-thread synthesis aggregating all upstream signals into a directional bias.",
  mandate:
    "Final investment mandate produced by the reasoning engine for this equity.",
};

// How the signal from this node type should be interpreted
const signalInterpretation: Record<
  string,
  Record<"bullish" | "bearish" | "neutral", string>
> = {
  fundamental: {
    bullish: "Financials support upside — strong quality indicators.",
    bearish: "Financials raise concerns — deterioration detected.",
    neutral: "Mixed signals; financials neither confirm nor deny thesis.",
  },
  risk: {
    bullish: "Risk profile is manageable relative to expected returns.",
    bearish: "Risk is elevated and could impair the investment case.",
    neutral: "Risk level is in line with sector norms.",
  },
  catalyst: {
    bullish: "Catalyst is likely to drive re-rating or earnings acceleration.",
    bearish: "Catalyst could be a negative event that pressures the stock.",
    neutral: "Catalyst timing or magnitude is uncertain.",
  },
  valuation: {
    bullish: "Stock appears undervalued relative to intrinsic or peer multiples.",
    bearish: "Stock appears overvalued; upside is limited at current prices.",
    neutral: "Valuation is in line with sector; no significant mis-pricing detected.",
  },
  synthesis: {
    bullish: "Weight of evidence favors a positive investment outcome.",
    bearish: "Weight of evidence flags meaningful risk to capital.",
    neutral: "Evidence is balanced; high uncertainty warrants monitoring.",
  },
  mandate: {
    bullish: "Engine issues a BUY mandate with conviction.",
    bearish: "Engine issues a SELL mandate based on accumulated evidence.",
    neutral: "Engine issues a HOLD mandate; revisit on next catalyst.",
  },
};

const signalBadgeClass: Record<string, string> = {
  bullish: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  bearish: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  neutral: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

const signalBarClass: Record<string, string> = {
  bullish: "bg-emerald-400",
  bearish: "bg-rose-400",
  neutral: "bg-amber-400",
};

// Confidence is encoded as signal strength — how strongly does this node lean?
// We approximate from the node type and signal direction.
function nodeConfidenceLabel(type: string, signal?: string): string {
  if (!signal) return "No directional signal";
  const strength =
    type === "mandate" || type === "synthesis" ? "HIGH" : "MODERATE";
  return `${strength} conviction ${signal.toUpperCase()} signal`;
}

// Which icon to use for the evidence block depending on node type
const evidenceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  data_ingest: Search,
  fundamental: TrendingUp,
  risk: ShieldAlert,
  catalyst: Lightbulb,
  valuation: Scale,
  synthesis: GitMerge,
  mandate: Target,
};

interface Props {
  node: ReasoningNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeDetailPanel = ({ node, open, onOpenChange }: Props) => {
  const Icon = node ? (iconFor[node.type] ?? Database) : Database;
  const EvidenceIcon = node ? (evidenceIcons[node.type] ?? Search) : Search;

  const signalInterp =
    node?.signal && node?.type
      ? signalInterpretation[node.type]?.[node.signal]
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        {node && (
          <>
            <SheetHeader className="text-left space-y-3">
              {/* Type + signal badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] tracking-widest border-primary/30 text-primary"
                >
                  {kindLabel[node.type]}
                </Badge>
                {node.signal && (
                  <Badge
                    variant="outline"
                    className={[
                      "font-mono text-[10px] tracking-widest",
                      signalBadgeClass[node.signal],
                    ].join(" ")}
                  >
                    {node.signal.toUpperCase()}
                  </Badge>
                )}
              </div>

              <SheetTitle className="font-display text-2xl leading-tight">
                {node.title}
              </SheetTitle>
              <SheetDescription className="text-sm leading-relaxed">
                {node.description}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              {/* Node type context */}
              <section className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {kindDescription[node.type]}
                </p>
              </section>

              {/* Key metric */}
              {node.value && (
                <section>
                  <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                    KEY METRIC
                  </h4>
                  <span className="font-mono text-2xl font-semibold text-primary">
                    {node.value}
                  </span>
                </section>
              )}

              {/* Signal conviction block */}
              {node.signal && (
                <section>
                  <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                    SIGNAL CONVICTION
                  </h4>
                  <div
                    className={[
                      "rounded-lg border p-3 space-y-2",
                      signalBadgeClass[node.signal],
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">
                        {nodeConfidenceLabel(node.type, node.signal)}
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="h-1.5 rounded-full bg-current/20 overflow-hidden">
                      <div
                        className={[
                          "h-full rounded-full",
                          signalBarClass[node.signal],
                        ].join(" ")}
                        style={{
                          width:
                            node.type === "mandate" ||
                              node.type === "synthesis"
                              ? "85%"
                              : "60%",
                        }}
                      />
                    </div>
                    {signalInterp && (
                      <p className="text-[10px] leading-relaxed opacity-80">
                        {signalInterp}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Evidence */}
              <section>
                <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2 flex items-center gap-2">
                  <EvidenceIcon className="h-3 w-3" />
                  REASONING & EVIDENCE
                </h4>
                <div className="rounded-lg border border-border bg-card p-4">
                  {/* Split evidence into sentences for visual chunking */}
                  {node.evidence
                    .split(/(?<=[.!?])\s+/)
                    .filter(Boolean)
                    .map((sentence, i) => (
                      <p
                        key={i}
                        className={[
                          "text-sm leading-relaxed text-foreground/90",
                          i > 0 ? "mt-2 pt-2 border-t border-border/50" : "",
                        ].join(" ")}
                      >
                        {sentence}
                      </p>
                    ))}
                </div>
              </section>

              {/* Sparkline — inline preview */}
              {node.sparkline && node.sparkline.length >= 2 && (
                <section>
                  <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                    TREND
                  </h4>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <Sparkline data={node.sparkline} width={400} height={60} />
                  </div>
                </section>
              )}

              {/* Bar chart — peer comparison */}
              {node.bars && node.bars.length >= 2 && (
                <section>
                  <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                    PEER COMPARISON
                  </h4>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <MiniBarChart data={node.bars} width={400} height={100} />
                  </div>
                </section>
              )}

              {/* Trace ID footer */}
              <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="font-mono text-[10px] tracking-[0.18em] text-primary mb-1">
                  TRACE ID
                </div>
                <div className="font-mono text-xs break-all text-foreground/60">
                  arb::{node.id}::{Date.now().toString(36)}
                </div>
                <div className="font-mono text-[9px] text-muted-foreground/40 mt-1">
                  Node type: {node.type} · Signal: {node.signal ?? "—"} ·
                  Charts:{" "}
                  {[node.sparkline ? "sparkline" : null, node.bars ? "bars" : null]
                    .filter(Boolean)
                    .join(", ") || "none"}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};