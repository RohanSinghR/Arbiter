import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkline } from "../viz/Sparkline";
import { MiniBarChart } from "../viz/MiniBarChart";
import { ReasoningStep } from "@/lib/reasoning-data";
import { Database, LineChart, Scale, Zap, Target } from "lucide-react";

const iconFor: Record<string, React.ComponentType<{ className?: string }>> = {
  ingest: Database,
  analyze: LineChart,
  check: Scale,
  signal: Zap,
  mandate: Target,
};

interface Data extends Record<string, unknown> {
  step: ReasoningStep;
  highlightTicker?: string;
}

export const ReasoningNode = ({ data, selected }: NodeProps) => {
  const { step, highlightTicker } = data as Data;
  const Icon = iconFor[step.type];
  const isMandate = step.type === "mandate";

  return (
    <div
      className={[
        "group bg-card rounded-xl shadow-node transition-all duration-300 cursor-pointer",
        "min-w-[260px] max-w-[300px]",
        isMandate
          ? "border-2 border-primary shadow-glow"
          : "border border-border hover:border-primary/40",
        selected ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : "",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={[
              "h-7 w-7 rounded-md flex items-center justify-center",
              isMandate ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {step.id}
          </span>
        </div>

        <h3
          className={[
            "font-display font-semibold leading-tight mb-1",
            isMandate ? "text-base text-primary" : "text-sm text-foreground",
          ].join(" ")}
        >
          {step.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>

        {step.value && (
          <div className="mt-2">
            <span className="font-mono text-xs font-semibold text-primary">{step.value}</span>
          </div>
        )}

        {step.sparkline && (
          <div className="mt-3 -mx-1">
            <Sparkline data={step.sparkline} width={240} height={44} />
            <div className="flex justify-between font-mono text-[9px] text-muted-foreground mt-1 px-1">
              <span>Q1·22</span>
              <span className="text-primary">+6.1% YoY</span>
              <span>Q4·24</span>
            </div>
          </div>
        )}

        {step.bars && (
          <div className="mt-3">
            <MiniBarChart
              data={step.bars}
              width={240}
              height={84}
              highlightLabel={highlightTicker}
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
};