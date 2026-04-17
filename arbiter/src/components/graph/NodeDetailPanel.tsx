import { ReasoningNode } from "@/lib/reasoning-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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

interface Props {
  node: ReasoningNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeDetailPanel = ({ node, open, onOpenChange }: Props) => {
  const Icon = node ? (iconFor[node.type] ?? Database) : Database;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {node && (
          <>
            <SheetHeader className="text-left space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] tracking-widest border-primary/30 text-primary"
                >
                  {kindLabel[node.type]}
                </Badge>
              </div>
              <SheetTitle className="font-display text-2xl leading-tight">
                {node.title}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {node.description}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {node.value && (
                <section>
                  <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                    METRIC
                  </h4>
                  <span className="font-mono text-2xl font-semibold text-primary">
                    {node.value}
                  </span>
                </section>
              )}

              <section>
                <h4 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-2">
                  EVIDENCE
                </h4>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {node.evidence}
                  </p>
                </div>
              </section>

              <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="font-mono text-[10px] tracking-[0.18em] text-primary mb-1">
                  TRACE ID
                </div>
                <div className="font-mono text-xs break-all text-foreground/80">
                  arb::{node.id}::{Date.now().toString(36)}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};