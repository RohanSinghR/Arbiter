import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReasoningNode } from "@/components/graph/ReasoningNode";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { buildSteps, ReasoningStep } from "@/lib/reasoning-data";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

const nodeTypes = { reasoning: ReasoningNode };

const NODE_X_GAP = 360;
const NODE_Y = 160;

function DemoCanvas({ ticker, depth }: { ticker: string; depth: number }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<ReasoningStep | null>(null);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);

  const { fitView } = useReactFlow();

  useEffect(() => {
    const fetchSteps = async () => {
      setLoading(true);
      setRunning(false);
      setNodes([]);
      setEdges([]);
      setSelected(null);
      setOpen(false);

      try {
        const result = await buildSteps(ticker, depth);
        setSteps(result);
      } catch (err) {
        console.error(err);
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, [ticker, depth]);

  const run = useCallback(() => {
    if (!steps.length) return;

    setNodes([]);
    setEdges([]);
    setRunning(true);

    steps.forEach((step, i) => {
      setTimeout(() => {
        const newNode: Node = {
          id: step.id,
          type: "reasoning",
          position: { x: 60 + i * NODE_X_GAP, y: NODE_Y },
          data: { step, highlightTicker: ticker.toUpperCase() },
          draggable: true,
        };

        setNodes((nds) => [...nds, newNode]);

        if (i > 0) {
          const prevStep = steps[i - 1];

          const newEdge: Edge = {
            id: `e-${prevStep.id}-${step.id}`,
            source: prevStep.id,
            target: step.id,
            animated: true,
            style: { stroke: "#2D9E8F", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#2D9E8F",
            },
          };

          setEdges((eds) => [...eds, newEdge]);
        }

        setTimeout(() => {
          fitView({ padding: 0.2, duration: 600 });
        }, 50);

        if (i === steps.length - 1) {
          setRunning(false);
        }
      }, i * 700);
    });
  }, [steps, ticker, fitView]);

  useEffect(() => {
    if (steps.length > 0) {
      run();
    }
  }, [steps, run]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    const data = node.data as { step: ReasoningStep };
    setSelected(data.step);
    setOpen(true);
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={24} size={1} color="hsl(var(--border))" />
        <Controls className="!bg-card !border !border-border !shadow-card" />
        <MiniMap
          className="!bg-card !border !border-border"
          nodeColor={() => "#2D9E8F"}
          maskColor="hsl(var(--muted) / 0.6)"
        />
      </ReactFlow>

      {(running || loading) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-card font-mono text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-muted-foreground">
            {loading ? "Fetching" : "Reasoning"}
          </span>
          <span className="text-primary">
            {ticker.toUpperCase()} · {depth} nodes
          </span>
        </div>
      )}

      <NodeDetailPanel step={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}

const Demo = () => {
  const [input, setInput] = useState("AAPL");
  const [ticker, setTicker] = useState("AAPL");

  const [depth, setDepth] = useState(5);
  const [appliedDepth, setAppliedDepth] = useState(5);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTicker = input.trim().toUpperCase();
    const normalizedDepth = Math.max(3, Math.min(8, depth || 5));

    if (trimmedTicker) {
      setTicker(trimmedTicker);
      setAppliedDepth(normalizedDepth);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="flex-none border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-display font-bold">
              A
            </div>

            <div className="hidden sm:block">
              <div className="font-display font-semibold text-sm leading-none">
                Arbiter Trace
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                REASONING GRAPH · DEMO
              </div>
            </div>
          </Link>

          <div className="flex-1" />

          <form onSubmit={handleAnalyze} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="Ticker (e.g. AAPL)"
              maxLength={8}
              className="w-32 sm:w-44 font-mono uppercase tracking-wider"
            />

            <Input
              type="number"
              min={3}
              max={8}
              value={depth}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDepth(Number.isFinite(value) ? value : 5);
              }}
              placeholder="Nodes"
              className="w-20 font-mono"
            />

            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </Button>
          </form>

          <Link
            to="/"
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 relative">
        <ReactFlowProvider>
          <DemoCanvas ticker={ticker} depth={appliedDepth} />
        </ReactFlowProvider>
      </main>

      <footer className="flex-none border-t border-border bg-card px-4 sm:px-6 py-3 text-center">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
          BUILT AS A CONCEPT INSPIRED BY ALKA ARBITER
        </p>
      </footer>
    </div>
  );
};

export default Demo;