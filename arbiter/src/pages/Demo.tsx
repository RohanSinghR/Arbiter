import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type NodeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  Panel,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReasoningNodeComponent } from "@/components/graph/ReasoningNode";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { buildGraph, ReasoningNode, ReasoningEdge } from "@/lib/reasoning-data";
import { ArrowLeft, Loader2, Sparkles, RefreshCw } from "lucide-react";

const nodeTypes = { reasoning: ReasoningNodeComponent };

// Node dimensions fed to dagre so it can compute non-overlapping layout
const NODE_WIDTH = 272;
const NODE_HEIGHT = 160; // conservative estimate; dagre just needs spacing

function layoutGraph(
  rnodes: ReasoningNode[],
  redges: ReasoningEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 });

  rnodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  redges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const nodes: Node[] = rnodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "reasoning",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { node: n },
      draggable: true,
    };
  });

  const edges: Edge[] = redges.map((e) => ({
    id: `e-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    animated: e.target === "mandate" || e.target === "signal",
    label: e.label,
    labelStyle: { fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.85 },
    style: {
      stroke: `hsl(var(--primary) / ${0.3 + e.weight * 0.7})`,
      strokeWidth: 1 + e.weight * 2.5, // thin=low weight, thick=high weight
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "hsl(var(--primary))",
      width: 16,
      height: 16,
    },
  }));

  return { nodes, edges };
}

function DemoCanvas({ ticker }: { ticker: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<ReasoningNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fitView } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNodes([]);
    setEdges([]);
    setPanelOpen(false);

    try {
      const graph = await buildGraph(ticker);
      const { nodes: lNodes, edges: lEdges } = layoutGraph(graph.nodes, graph.edges);

      // Animate nodes in sequentially by dagre rank (top to bottom)
      lNodes.forEach((node, i) => {
        setTimeout(() => {
          setNodes((prev) => [...prev, node]);
          if (i === lNodes.length - 1) {
            setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 50);
          }
        }, i * 120);
      });

      // Edges appear after all nodes
      setTimeout(() => setEdges(lEdges), lNodes.length * 120 + 100);
    } catch (err) {
      console.error(err);
      setError("Failed to build reasoning graph. Check your API key.");
    } finally {
      setLoading(false);
    }
  }, [ticker, fitView]);

  useEffect(() => {
    load();
  }, [load]);

  const onNodeClick: NodeMouseHandler = (_, rfNode) => {
    const rnode = (rfNode.data as { node: ReasoningNode }).node;
    setSelectedNode(rnode);
    setPanelOpen(true);
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        nodesDraggable={true}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={20} size={1} color="hsl(var(--border))" />
        <Controls className="!bg-card !border !border-border" />
        <MiniMap
          className="!bg-card !border !border-border"
          nodeColor={() => "hsl(var(--primary))"}
          maskColor="hsl(var(--muted) / 0.5)"
        />

        <Panel position="top-center">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm font-mono text-xs">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-muted-foreground">Building reasoning graph</span>
              <span className="text-primary font-medium">{ticker}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
        </Panel>
      </ReactFlow>

      <NodeDetailPanel node={selectedNode} open={panelOpen} onOpenChange={setPanelOpen} />
    </>
  );
}

const Demo = () => {
  const [input, setInput] = useState("AAPL");
  const [ticker, setTicker] = useState("AAPL");

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim().toUpperCase();
    if (t) setTicker(t);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="flex-none border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-sm leading-none">Arbiter Trace</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                AUDITABLE REASONING PIPELINE
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
              className="w-32 sm:w-40 font-mono uppercase tracking-wider"
            />
            <Button type="submit" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
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
          <DemoCanvas ticker={ticker} />
        </ReactFlowProvider>
      </main>

      <footer className="flex-none border-t border-border bg-card px-6 py-3 text-center">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
          BUILT AS A CONCEPT INSPIRED BY ALKA ARBITER
        </p>
      </footer>
    </div>
  );
};

export default Demo;