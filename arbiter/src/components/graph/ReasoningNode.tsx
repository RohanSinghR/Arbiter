import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ReasoningStep } from "@/data/reasoningSteps";
import SparklineChart from "./SparklineChart";
import BarChart from "./BarChart";

const typeIcons: Record<ReasoningStep["type"], string> = {
  ingest: "📄",
  analyze: "📊",
  check: "⚖️",
  signal: "📡",
  mandate: "✅",
};

const ReasoningNode = ({ data }: NodeProps) => {
  const step = data.step as ReasoningStep;
  const isMandate = step.type === "mandate";

  return (
    <div
      className={`
        w-[280px] rounded-lg border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md cursor-pointer
        ${isMandate ? "border-2 border-node-mandate-border node-pulse" : "border-node-border"}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2 !border-0" />

      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{typeIcons[step.type]}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isMandate ? "font-bold text-primary" : "font-medium text-foreground"}`}>
            {step.label}
          </p>

          {step.chartType === "sparkline" && (
            <div className="mt-2">
              <SparklineChart />
            </div>
          )}
          {step.chartType === "bar" && (
            <div className="mt-2">
              <BarChart />
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2 !border-0" />
    </div>
  );
};

export default memo(ReasoningNode);
