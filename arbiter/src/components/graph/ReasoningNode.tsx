import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkline } from "../viz/Sparkline";
import { MiniBarChart } from "../viz/MiniBarChart";
import { ReasoningNode as RNode } from "@/lib/reasoning-data";
import {
  Database,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart2,
  GitMerge,
  Target,
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

const signalColors: Record<string, string> = {
  bullish: "text-emerald-400",
  bearish: "text-rose-400",
  neutral: "text-amber-400",
};

const signalDot: Record<string, string> = {
  bullish: "bg-emerald-400",
  bearish: "bg-rose-400",
  neutral: "bg-amber-400",
};

interface Data extends Record<string, unknown> {
  node: RNode;
  highlightTicker?: string;
}

export const ReasoningNodeComponent = ({ data, selected }: NodeProps) => {
  const { node, highlightTicker } = data as Data;
  const Icon = iconFor[node.type] ?? Database;
  const isMandate = node.type === "mandate";
  const isIngest = node.type === "data_ingest";

  return (
    <div
      className={[
        "bg-card rounded-xl transition-all duration-200 cursor-pointer select-none",
        isMandate
          ? "min-w-[300px] max-w-[340px] border-2 border-primary shadow-[0_0_32px_-4px_hsl(var(--primary)/0.5)]"
          : "min-w-[240px] max-w-[280px] border border-border hover:border-primary/50",
        selected
          ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "",
      ].join(" ")}
    >
      {/* Target handle — top */}
      {!isIngest && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-primary !border-2 !border-background !w-2.5 !h-2.5"
        />
      )}

      <div className={isMandate ? "p-5" : "p-4"}>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className={[
              "rounded-md flex items-center justify-center flex-shrink-0",
              isMandate
                ? "h-8 w-8 bg-primary text-primary-foreground"
                : "h-6 w-6 bg-primary/10 text-primary",
            ].join(" ")}
          >
            <Icon className={isMandate ? "h-4 w-4" : "h-3 w-3"} />
          </div>

          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
            {kindLabel[node.type]}
          </span>

          {/* Signal dot */}
          {node.signal && !isMandate && (
            <span
              className={[
                "ml-auto flex items-center gap-1 font-mono text-[9px] tracking-wider",
                signalColors[node.signal],
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block w-1.5 h-1.5 rounded-full",
                  signalDot[node.signal],
                ].join(" ")}
              />
              {node.signal.toUpperCase()}
            </span>
          )}

          {/* Value metric — show on right if no signal dot */}
          {node.value && !node.signal && (
            <span className="ml-auto font-mono text-xs font-semibold text-primary">
              {node.value}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={[
            "font-semibold leading-tight",
            isMandate
              ? "text-base text-primary mb-1.5"
              : "text-sm text-foreground mb-1",
          ].join(" ")}
        >
          {node.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-snug">
          {node.description}
        </p>

        {/* Value shown below description when signal dot is also present */}
        {node.value && node.signal && !isMandate && (
          <div className="mt-1.5">
            <span className="font-mono text-xs font-semibold text-primary">
              {node.value}
            </span>
          </div>
        )}

        {/* Sparkline */}
        {node.sparkline && node.sparkline.length >= 2 && (
          <div className="mt-3 -mx-1">
            <Sparkline data={node.sparkline} width={232} height={40} />
          </div>
        )}

        {/* Bar chart */}
        {node.bars && node.bars.length >= 2 && (
          <div className="mt-3">
            <MiniBarChart
              data={node.bars}
              width={232}
              height={72}
              highlightLabel={highlightTicker}
            />
          </div>
        )}
      </div>

      {/* Source handle — bottom */}
      {/* Mandate node has no outgoing edges */}
      {!isMandate && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-primary !border-2 !border-background !w-2.5 !h-2.5"
        />
      )}
    </div>
  );
};