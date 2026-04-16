import { useState, useCallback } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReasoningGraph from "@/components/graph/ReasoningGraph";

const Demo = () => {
  const navigate = useNavigate();
  const [ticker, setTicker] = useState("");
  const [activeTicker, setActiveTicker] = useState("");
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const handleAnalyze = useCallback(() => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setActiveTicker(t);
    setRunning(true);
    setRunKey((k) => k + 1);
  }, [ticker]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">AT</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Arbiter Trace
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Enter ticker (e.g. AAPL)"
              className="h-9 w-56 rounded-md border border-input bg-background pl-9 pr-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleAnalyze}
            className="h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Analyze
          </button>
        </div>
      </header>

      {activeTicker ? (
        <ReasoningGraph key={runKey} ticker={activeTicker} running={running} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Enter a ticker to begin</p>
            <p className="text-sm text-muted-foreground">
              Type a stock symbol above and click Analyze to trace the reasoning graph
            </p>
          </div>
        </div>
      )}

      <footer className="px-6 py-3 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Built as a concept inspired by Alka Arbiter
        </p>
      </footer>
    </div>
  );
};

export default Demo;
