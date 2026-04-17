import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  buildGraph,
  TickerValidationError,
  ReasoningNode,
  ReasoningEdge,
  ReasoningGraph,
  TickerMeta,
} from "@/lib/reasoning-data";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Terminal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Building2,
  DollarSign,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const nodeTypes = { reasoning: ReasoningNodeComponent };
const NODE_WIDTH = 272;
const NODE_HEIGHT = 180;

// ─── Dagre layout ─────────────────────────────────────────────────────────────

function layoutGraph(
  rnodes: ReasoningNode[],
  redges: ReasoningEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 72,
    ranksep: 96,
    marginx: 48,
    marginy: 48,
  });

  rnodes.forEach((n) =>
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );
  redges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const nodes: Node[] = rnodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "reasoning",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { node: n, highlightTicker: undefined },
      draggable: true,
    };
  });

  const edges: Edge[] = redges.map((e) => ({
    id: `e-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    animated: e.target.includes("mandate") || e.target.includes("synthesis"),
    label: e.label,
    labelStyle: {
      fontSize: 9,
      fontFamily: "monospace",
      fill: "hsl(var(--muted-foreground))",
    },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.9 },
    style: {
      stroke: `hsl(var(--primary) / ${0.25 + e.weight * 0.75})`,
      strokeWidth: 1 + e.weight * 2.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "hsl(var(--primary))",
      width: 14,
      height: 14,
    },
  }));

  return { nodes, edges };
}

// ─── Trace log ────────────────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  kind: "info" | "success" | "warn" | "step" | "divider";
  text: string;
  ts: string;
  elapsed?: number; // ms since analysis started
}

function makeLog(
  kind: LogEntry["kind"],
  text: string,
  startTime?: number
): LogEntry {
  return {
    id: Date.now() + Math.random(),
    kind,
    ts: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    text,
    elapsed: startTime !== undefined ? Date.now() - startTime : undefined,
  };
}

const kindLabelMap: Record<string, string> = {
  data_ingest: "DATA INGEST",
  fundamental: "FUNDAMENTAL",
  risk: "RISK",
  catalyst: "CATALYST",
  valuation: "VALUATION",
  synthesis: "SYNTHESIS",
  mandate: "MANDATE",
};

// ─── Signal display ───────────────────────────────────────────────────────────

const signalConfig = {
  BUY: {
    label: "BUY",
    Icon: TrendingUp,
    classes: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
  },
  SELL: {
    label: "SELL",
    Icon: TrendingDown,
    classes: "bg-rose-500/15 border-rose-500/40 text-rose-400",
    dot: "bg-rose-400",
    bar: "bg-rose-400",
  },
  HOLD: {
    label: "HOLD",
    Icon: Minus,
    classes: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
};

// ─── Pre-flight ───────────────────────────────────────────────────────────────

interface PreFlightProps {
  onRun: (ticker: string, thesis: string) => void;
}

function PreFlight({ onRun }: PreFlightProps) {
  const [ticker, setTicker] = useState("AAPL");
  const [thesis, setThesis] = useState("");
  const [tickerError, setTickerError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) {
      setTickerError("Enter a ticker symbol.");
      return;
    }
    // Basic format guard: 1–8 uppercase letters/numbers, no spaces
    if (!/^[A-Z0-9.^-]{1,8}$/.test(t)) {
      setTickerError("Invalid format. Use exchange symbols like AAPL, MSFT.");
      return;
    }
    setTickerError(null);
    onRun(t, thesis.trim());
  };

  const EXAMPLES = [
    {
      ticker: "NVDA",
      thesis: "Is NVDA fairly valued after the AI capex boom?",
    },
    {
      ticker: "MSFT",
      thesis: "Does MSFT's cloud moat justify a premium multiple?",
    },
    {
      ticker: "META",
      thesis: "Can META sustain margin expansion through 2026?",
    },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12">
      {/* Heading */}
      <div className="mb-10 text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-primary">
            ARBITER ENGINE READY
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 leading-tight">
          State your investment thesis.
          <br />
          <span className="text-muted-foreground font-normal">
            Arbiter will reason through it.
          </span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Enter a ticker and an optional thesis question. Arbiter ingests
          fundamentals, assesses risk, evaluates catalysts, and produces an
          auditable investment mandate.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-2">
        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <Input
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.toUpperCase());
                setTickerError(null);
              }}
              placeholder="Ticker"
              maxLength={8}
              className={[
                "w-28 font-mono uppercase tracking-widest text-center",
                tickerError ? "border-destructive focus-visible:ring-destructive" : "",
              ].join(" ")}
            />
          </div>
          <Input
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="Investment thesis (optional)"
            className="flex-1 font-sans text-sm"
            maxLength={200}
          />
        </div>

        {/* Ticker validation error inline */}
        {tickerError && (
          <div className="flex items-center gap-2 text-destructive text-xs font-mono px-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {tickerError}
          </div>
        )}

        <Button type="submit" className="w-full gap-2 h-11 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Run Reasoning Engine
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </form>

      {/* Examples */}
      <div className="mt-8 w-full max-w-lg">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-3 text-center">
          EXAMPLE THESES
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.ticker}
              type="button"
              onClick={() => {
                setTicker(ex.ticker);
                setThesis(ex.thesis);
                setTickerError(null);
              }}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="font-mono text-xs font-semibold text-primary mt-0.5 w-10 flex-shrink-0">
                {ex.ticker}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                {ex.thesis}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary mt-0.5 ml-auto flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Interstitial loading screen ──────────────────────────────────────────────
// Shown between PreFlight submit and DemoCanvas mount. Prevents the jarring
// "snap to empty ReactFlow canvas" experience.

const INTERSTITIAL_STEPS = [
  { icon: Activity, label: "Validating ticker on exchange…" },
  { icon: Building2, label: "Resolving company fundamentals…" },
  { icon: DollarSign, label: "Ingesting market datasets…" },
  { icon: Sparkles, label: "Initializing reasoning engine…" },
];

interface InterstitialProps {
  ticker: string;
  thesis: string;
  error: string | null;
  onRetry: () => void;
}

function Interstitial({ ticker, thesis, error, onRetry }: InterstitialProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, INTERSTITIAL_STEPS.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            VALIDATION FAILED
          </div>
          <h2 className="text-lg font-semibold text-foreground">{error}</h2>
          <p className="text-sm text-muted-foreground">
            Arbiter only analyzes publicly listed equities. Please check the
            ticker symbol and try again.
          </p>
        </div>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Try another ticker
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-4">
      {/* Pulse ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-ping" />
        <div className="absolute h-16 w-16 rounded-full bg-primary/15 animate-pulse" />
        <div className="relative h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          A
        </div>
      </div>

      {/* Ticker + thesis */}
      <div className="text-center">
        <div className="font-mono text-2xl font-bold text-primary tracking-widest">
          {ticker}
        </div>
        {thesis && (
          <p className="mt-1 text-sm text-muted-foreground max-w-xs leading-relaxed">
            "{thesis}"
          </p>
        )}
      </div>

      {/* Step list */}
      <div className="w-full max-w-xs space-y-2.5">
        {INTERSTITIAL_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div
              key={i}
              className={[
                "flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-500",
                done
                  ? "border-primary/20 bg-primary/5"
                  : active
                    ? "border-border bg-card"
                    : "border-transparent opacity-30",
              ].join(" ")}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
              ) : (
                <Icon className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span
                className={[
                  "font-mono text-[11px] tracking-wide",
                  done || active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
              {done && (
                <span className="ml-auto font-mono text-[9px] text-primary">
                  OK
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground animate-pulse">
        BUILDING REASONING GRAPH…
      </p>
    </div>
  );
}

// ─── Trace log sidebar ────────────────────────────────────────────────────────

interface TraceLogProps {
  entries: LogEntry[];
  signal?: "BUY" | "SELL" | "HOLD";
  confidence?: number;
  mandateThesis?: string;
  ticker: string;
  meta?: TickerMeta;
  isLoading: boolean;
  totalMs?: number;
}

function TraceLog({
  entries,
  signal,
  confidence,
  mandateThesis,
  ticker,
  meta,
  isLoading,
  totalMs,
}: TraceLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const logColor: Record<LogEntry["kind"], string> = {
    info: "text-muted-foreground",
    success: "text-emerald-400",
    warn: "text-amber-400",
    step: "text-primary",
    divider: "text-muted-foreground/30",
  };

  const logPrefix: Record<LogEntry["kind"], string> = {
    info: "·",
    success: "✓",
    warn: "⚠",
    step: "→",
    divider: "─",
  };

  const sc = signal ? signalConfig[signal] : null;

  return (
    <div className="h-full flex flex-col bg-card border-r border-border w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <Terminal className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          TRACE
        </span>
        <span className="ml-auto font-mono text-[10px] text-primary font-medium">
          {ticker}
        </span>
        {isLoading && (
          <Loader2 className="h-2.5 w-2.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Company meta banner — shown once ticker is validated */}
      {meta && (
        <div className="px-4 py-2.5 border-b border-border/50 bg-primary/5 flex-shrink-0">
          <div className="font-semibold text-xs text-foreground truncate">
            {meta.companyName}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {meta.regularMarketPrice && (
              <span className="font-mono text-[10px] text-primary">
                {meta.currency ?? "USD"} {meta.regularMarketPrice.toFixed(2)}
              </span>
            )}
            {meta.marketCap && (
              <span className="font-mono text-[10px] text-muted-foreground">
                ${(meta.marketCap / 1e9).toFixed(1)}B cap
              </span>
            )}
            {meta.exchange && (
              <span className="font-mono text-[10px] text-muted-foreground/60">
                {meta.exchange}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[10px] leading-relaxed">
        {entries.map((entry) =>
          entry.kind === "divider" ? (
            <div
              key={entry.id}
              className="flex items-center gap-2 py-1 opacity-30"
            >
              <div className="flex-1 border-t border-border" />
              <span className="text-[8px] tracking-widest text-muted-foreground">
                {entry.text}
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          ) : (
            <div key={entry.id} className="flex gap-2">
              <span className="text-muted-foreground/40 flex-shrink-0 tabular-nums w-14">
                {entry.ts}
              </span>
              <span
                className={["flex-shrink-0 w-3", logColor[entry.kind]].join(
                  " "
                )}
              >
                {logPrefix[entry.kind]}
              </span>
              <span className={[logColor[entry.kind], "flex-1"].join(" ")}>
                {entry.text}
              </span>
              {entry.elapsed !== undefined && (
                <span className="text-muted-foreground/30 flex-shrink-0 tabular-nums">
                  +{entry.elapsed}ms
                </span>
              )}
            </div>
          )
        )}

        {/* Live typing indicator while loading */}
        {isLoading && (
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground/40 w-14" />
            <span className="text-muted-foreground">·</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-1 h-1 rounded-full bg-primary/50 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Timing footer */}
      {totalMs !== undefined && !isLoading && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-border/50 flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground/40" />
          <span className="font-mono text-[9px] text-muted-foreground/60">
            Completed in {(totalMs / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      {/* Mandate conclusion */}
      {signal && sc && (
        <div className="flex-shrink-0 border-t border-border p-4 space-y-3">
          <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
            MANDATE
          </div>

          {/* Signal pill */}
          <div
            className={[
              "flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-xs font-semibold",
              sc.classes,
            ].join(" ")}
          >
            <sc.Icon className="h-3.5 w-3.5" />
            {sc.label}
            {confidence !== undefined && (
              <span className="ml-auto text-[10px] font-normal opacity-70">
                {Math.round(confidence * 100)}% conf.
              </span>
            )}
          </div>

          {/* Confidence bar */}
          {confidence !== undefined && (
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-border overflow-hidden">
                <div
                  className={["h-full rounded-full transition-all duration-1000", sc.bar].join(" ")}
                  style={{ width: `${Math.round(confidence * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Thesis */}
          {mandateThesis && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {mandateThesis}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DemoCanvas ───────────────────────────────────────────────────────────────

interface DemoCanvasProps {
  ticker: string;
  thesis: string;
  onReset: () => void;
  /** Called with the validated TickerMeta so parent can surface it */
  onMeta?: (meta: TickerMeta) => void;
}

function DemoCanvas({ ticker, thesis, onReset, onMeta }: DemoCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<ReasoningNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [graphMeta, setGraphMeta] = useState<Pick<
    ReasoningGraph,
    "signal" | "confidence" | "mandate_thesis"
  > | null>(null);
  const [tickerMeta, setTickerMeta] = useState<TickerMeta | undefined>();
  const [startTime] = useState(() => Date.now());
  const [totalMs, setTotalMs] = useState<number | undefined>();

  const { fitView } = useReactFlow();

  const addLog = useCallback(
    (kind: LogEntry["kind"], text: string) => {
      setLogEntries((prev) => [
        ...prev,
        makeLog(kind, text, kind !== "divider" ? startTime : undefined),
      ]);
    },
    [startTime]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNodes([]);
    setEdges([]);
    setLogEntries([]);
    setGraphMeta(null);
    setTickerMeta(undefined);
    setPanelOpen(false);
    setTotalMs(undefined);

    addLog("divider", "BOOT");
    addLog("info", `Engine init for ${ticker}`);
    if (thesis) {
      addLog(
        "info",
        `Thesis: "${thesis.slice(0, 55)}${thesis.length > 55 ? "…" : ""}"`
      );
    }

    try {
      addLog("divider", "FETCH");
      addLog("info", "Calling reasoning API…");

      const graph = await buildGraph(ticker, thesis);

      console.log("nodes:", graph.nodes.map(n => n.id));
      console.log("edges:", graph.edges.map(e => `${e.source} → ${e.target}`));

      // Surface company meta into sidebar
      if (graph.meta) {
        setTickerMeta(graph.meta);
        onMeta?.(graph.meta);
        addLog(
          "success",
          `Resolved: ${graph.meta.companyName}${graph.meta.regularMarketPrice
            ? ` @ ${graph.meta.currency ?? "USD"} ${graph.meta.regularMarketPrice}`
            : ""
          }`
        );
      }

      addLog(
        "success",
        `Graph: ${graph.nodes.length} nodes · ${graph.edges.length} edges`
      );

      setGraphMeta({
        signal: graph.signal,
        confidence: graph.confidence,
        mandate_thesis: graph.mandate_thesis,
      });

      const { nodes: lNodes, edges: lEdges } = layoutGraph(
        graph.nodes,
        graph.edges
      );

      addLog("divider", "GRAPH");

      lNodes.forEach((node, i) => {
        const rNode = graph.nodes[i];
        setTimeout(() => {
          setNodes((prev) => [
            ...prev,
            { ...node, data: { ...node.data, highlightTicker: ticker } },
          ]);
          addLog(
            "step",
            `[${kindLabelMap[rNode.type] ?? rNode.type}] ${rNode.title}`
          );

          if (i === lNodes.length - 1) {
            setTimeout(() => {
              fitView({ padding: 0.15, duration: 700 });
              addLog("divider", "MANDATE");
              addLog("success", "Reasoning trace complete");
              addLog(
                graph.signal === "BUY"
                  ? "success"
                  : graph.signal === "SELL"
                    ? "warn"
                    : "info",
                `Signal: ${graph.signal} · ${Math.round(
                  graph.confidence * 100
                )}% confidence`
              );
              setTotalMs(Date.now() - startTime);
              setLoading(false);
            }, 80);
          }
        }, 300 + i * 200);
      });

      setTimeout(() => setEdges(lEdges), 300 + lNodes.length * 200 + 100);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "Reasoning engine error. Check API configuration.";
      setError(msg);
      addLog("warn", msg);
      setLoading(false);
    }
  }, [ticker, thesis, fitView, addLog, onMeta, startTime]);

  useEffect(() => {
    load();
  }, [load]);

  const onNodeClick: NodeMouseHandler = (_, rfNode) => {
    const rnode = (rfNode.data as { node: ReasoningNode }).node;
    setSelectedNode(rnode);
    setPanelOpen(true);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <TraceLog
        entries={logEntries}
        signal={graphMeta?.signal}
        confidence={graphMeta?.confidence}
        mandateThesis={graphMeta?.mandate_thesis}
        ticker={ticker}
        meta={tickerMeta}
        isLoading={loading}
        totalMs={totalMs}
      />

      <div className="flex-1 relative">
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
                <span className="text-muted-foreground">
                  Building reasoning graph
                </span>
                <span className="text-primary font-medium">{ticker}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 font-mono text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}
          </Panel>

          <Panel position="top-right">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/40 font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-all"
            >
              <Sparkles className="h-3 w-3" />
              NEW ANALYSIS
            </button>
          </Panel>
        </ReactFlow>

        <NodeDetailPanel
          node={selectedNode}
          open={panelOpen}
          onOpenChange={setPanelOpen}
        />
      </div>
    </div>
  );
}

// ─── App state machine ────────────────────────────────────────────────────────

type AppState =
  | { screen: "preflight" }
  | { screen: "loading"; ticker: string; thesis: string; error: string | null }
  | { screen: "graph"; ticker: string; thesis: string };

const Demo = () => {
  const [state, setState] = useState<AppState>({ screen: "preflight" });

  // When the user submits, go to "loading" interstitial first.
  // DemoCanvas calls onMeta once the API responds, which is our cue that
  // validation passed and the graph is being assembled — so we flip to "graph".
  const handleRun = (ticker: string, thesis: string) => {
    setState({ screen: "loading", ticker, thesis, error: null });

    // Kick off the actual API call in the background so we can show the
    // interstitial immediately. We use a flag so we don't double-fetch.
    // The real fetch happens inside DemoCanvas; here we just wait for it to
    // surface via onMeta or an error passed up through onLoadError.
  };

  // Called by DemoCanvas when the API comes back — valid ticker, graph building
  const handleMeta = () => {
    if (state.screen === "loading") {
      setState((s) =>
        s.screen === "loading"
          ? { screen: "graph", ticker: s.ticker, thesis: s.thesis }
          : s
      );
    }
  };

  const handleReset = () => setState({ screen: "preflight" });

  // Surface a TickerValidationError from DemoCanvas back to the interstitial
  const handleLoadError = (msg: string) => {
    if (state.screen === "loading") {
      setState((s) =>
        s.screen === "loading" ? { ...s, error: msg } : s
      );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-sm leading-none">
                Arbiter Trace
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                AUDITABLE REASONING PIPELINE
              </div>
            </div>
          </Link>

          <div className="flex-1" />

          {state.screen === "graph" && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground hidden sm:block">
                {state.ticker}
              </span>
              {state.thesis && (
                <span className="hidden md:block font-mono text-[10px] text-muted-foreground/60 max-w-[280px] truncate">
                  "{state.thesis}"
                </span>
              )}
            </div>
          )}

          <Link
            to="/"
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 relative overflow-hidden">
        {state.screen === "preflight" && <PreFlight onRun={handleRun} />}

        {state.screen === "loading" && (
          <>
            <Interstitial
              ticker={state.ticker}
              thesis={state.thesis}
              error={state.error}
              onRetry={handleReset}
            />
            {/* Mount DemoCanvas invisibly so it starts fetching immediately.
                Once it surfaces meta (valid ticker), we switch to "graph". */}
            <div className="absolute inset-0 pointer-events-none opacity-0 overflow-hidden">
              <ReactFlowProvider>
                <DemoCanvas
                  ticker={state.ticker}
                  thesis={state.thesis}
                  onReset={handleReset}
                  onMeta={handleMeta}
                />
              </ReactFlowProvider>
            </div>
          </>
        )}

        {state.screen === "graph" && (
          <ReactFlowProvider>
            <DemoCanvas
              ticker={state.ticker}
              thesis={state.thesis}
              onReset={handleReset}
              onMeta={() => { }} // already on graph screen
            />
          </ReactFlowProvider>
        )}
      </main>

      {/* Footer */}
      <footer className="flex-none border-t border-border bg-card px-6 py-3 text-center">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
          CONCEPT PROTOTYPE — INSPIRED BY ALKA ARBITER · AI-GENERATED ANALYSIS
          · NOT FINANCIAL ADVICE
        </p>
      </footer>
    </div>
  );
};

export default Demo;