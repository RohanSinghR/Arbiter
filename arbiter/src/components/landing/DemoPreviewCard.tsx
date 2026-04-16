import { Database, LineChart, Scale, Zap, Target } from "lucide-react";

/**
 * Static "screenshot" of the demo — small reasoning graph laid out cleanly.
 * Pure SVG + DOM so it's GPU-cheap and scales perfectly.
 */
const STEPS = [
  { id: "n1", label: "INGEST", title: "10-K Filing 2024", icon: Database, x: 40, y: 130 },
  { id: "n2", label: "ANALYZE", title: "Revenue +6.1% YoY", icon: LineChart, x: 235, y: 60 },
  { id: "n3", label: "CHECK", title: "P/E vs sector", icon: Scale, x: 235, y: 210 },
  { id: "n4", label: "SIGNAL", title: "Undervalued", icon: Zap, x: 430, y: 130 },
  { id: "n5", label: "MANDATE", title: "BUY · High", icon: Target, x: 625, y: 130, primary: true },
];

const EDGES: [string, string][] = [
  ["n1", "n2"], ["n1", "n3"], ["n2", "n4"], ["n3", "n4"], ["n4", "n5"],
];

const NODE_W = 168;
const NODE_H = 56;

export const DemoPreviewCard = () => {
  const stepMap = Object.fromEntries(STEPS.map((s) => [s.id, s]));

  return (
    <div className="relative rounded-2xl bg-card border border-border shadow-deep overflow-hidden">
      {/* faux window chrome */}
      <div className="flex items-center justify-between px-4 h-9 bg-secondary/60 border-b border-border">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          ARBITER · /demo · AAPL
        </span>
        <div className="w-10" />
      </div>

      <div className="relative h-[300px] bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:18px_18px]">
        {/* edges */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-preview" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--primary))" />
            </marker>
          </defs>
          {EDGES.map(([a, b], i) => {
            const sa = stepMap[a];
            const sb = stepMap[b];
            const x1 = sa.x + NODE_W;
            const y1 = sa.y + NODE_H / 2;
            const x2 = sb.x;
            const y2 = sb.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            return (
              <g key={`${a}-${b}`}>
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="5 4"
                  markerEnd="url(#arrow-preview)"
                  opacity="0.85"
                >
                  <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                </path>
              </g>
            );
          })}
        </svg>

        {/* nodes */}
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="absolute"
              style={{
                left: `${(s.x / 800) * 100}%`,
                top: `${(s.y / 300) * 100}%`,
                width: `${(NODE_W / 800) * 100}%`,
                animation: `fade-in 0.5s ease-out ${i * 0.12}s both`,
              }}
            >
              <div
                className={[
                  "h-14 rounded-md bg-background border flex items-center gap-2 px-2.5 shadow-card",
                  s.primary ? "border-primary border-2 shadow-glow" : "border-border",
                ].join(" ")}
              >
                <div
                  className={[
                    "h-7 w-7 rounded flex items-center justify-center shrink-0",
                    s.primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[8px] tracking-[0.18em] text-muted-foreground leading-none">
                    {s.label}
                  </div>
                  <div className={`text-[11px] font-display font-semibold leading-tight mt-0.5 truncate ${s.primary ? "text-primary" : "text-foreground"}`}>
                    {s.title}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
