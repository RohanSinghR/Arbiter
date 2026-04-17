import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkline } from "../viz/Sparkline";
import { MiniBarChart } from "../viz/MiniBarChart";
import { ReasoningNode as RNode } from "@/lib/reasoning-data";
import { Database, LineChart, Scale, Zap, Target } from "lucide-react";

const iconFor: Record<string, React.ComponentType<{ className?: string }>> = {
  ingest: Database,
  analyze: LineChart,
  check: Scale,
  signal: Zap,
  mandate: Target,
};

const kindLabel: Record<string, string> = {
  ingest: "INGEST",
  analyze: "ANALYZE",
  check: "CHECK",
  signal: "SIGNAL",
  mandate: "MANDATE",
};

interface Data extends Record<string, unknown> {
  node: RNode;
  highlightTicker?: string;
}

export const ReasoningNodeComponent = ({ data, selected }: NodeProps) => {
  const { node, highlightTicker } = data as Data;
  const Icon = iconFor[node.type] ?? Database;
  const isMandate = node.type === "mandate";
  const isIngest = node.type === "ingest";

  return (
    <div
      className={[
        "bg-card rounded-xl transition-all duration-200 cursor-pointer select-none",
        isMandate
          ? "min-w-[280px] max-w-[320px] border-2 border-primary shadow-[0_0_24px_-4px_hsl(var(--primary)/0.4)]"
          : "min-w-[240px] max-w-[280px] border border-border hover:border-primary/50",
        selected ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : "",
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

      <div className={["p-4", isMandate ? "p-5" : ""].join(" ")}>
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
          {node.value && (
            <span className="ml-auto font-mono text-xs font-semibold text-primary">
              {node.value}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={[
            "font-semibold leading-tight",
            isMandate ? "text-base text-primary mb-1.5" : "text-sm text-foreground mb-1",
          ].join(" ")}
        >
          {node.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-snug">{node.description}</p>

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
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-2 !border-background !w-2.5 !h-2.5"
      />
    </div>
  );
};