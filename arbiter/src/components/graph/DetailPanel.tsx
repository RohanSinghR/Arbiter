import type { ReasoningStep } from "@/data/reasoningSteps";
import { X } from "lucide-react";

interface DetailPanelProps {
  step: ReasoningStep;
  onClose: () => void;
}

const DetailPanel = ({ step, onClose }: DetailPanelProps) => {
  return (
    <div className="w-[360px] h-full border-l border-border bg-panel-bg p-6 animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{step.detail.title}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {step.detail.summary}
      </p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Confidence
          </span>
          <span className="text-sm font-mono font-medium text-primary">
            {(step.detail.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${step.detail.confidence * 100}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Evidence
        </h3>
        <ul className="space-y-2">
          {step.detail.evidence.map((item, i) => (
            <li
              key={i}
              className="text-sm text-foreground bg-muted/50 rounded-md px-3 py-2 font-mono text-xs leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DetailPanel;
