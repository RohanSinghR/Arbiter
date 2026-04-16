import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Activity, Scale } from "lucide-react";
import { HeroGraph3D } from "@/components/landing/HeroGraph3D";
import { InteractiveDotField } from "@/components/landing/InteractiveDotField";
import { Magnetic } from "@/components/landing/Magnetic";
import { Reveal } from "@/components/landing/Reveal";
import { useParallaxMouse, useScrollY } from "@/hooks/use-parallax";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: ShieldCheck,
    title: "Auditable Reasoning",
    body: "Every decision has a trace. Every trace has evidence.",
  },
  {
    icon: Activity,
    title: "Live Graph Visualization",
    body: "Watch the AI's logic unfold as an interactive node graph in real time.",
  },
  {
    icon: Scale,
    title: "Investment-Grade Rigor",
    body: "Built for fiduciaries who need to know not just what, but why.",
  },
];

const FLOATING_TICKERS = [
  { sym: "AAPL", val: "+1.24%", x: "8%", y: "22%", depth: 30 },
  { sym: "NVDA", val: "+3.81%", x: "84%", y: "18%", depth: 50 },
  { sym: "MSFT", val: "−0.42%", x: "12%", y: "72%", depth: 40 },
  { sym: "GOOGL", val: "+0.96%", x: "82%", y: "76%", depth: 25 },
  { sym: "TSLA", val: "+2.05%", x: "50%", y: "12%", depth: 60 },
  { sym: "META", val: "+0.31%", x: "92%", y: "48%", depth: 35 },
];

const CursorSpotlight = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] hidden md:block"
      style={{
        background:
          "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), hsl(173 56% 45% / 0.10), transparent 60%)",
      }}
    />
  );
};

const Landing = () => {
  const mouse = useParallaxMouse();
  const scrollY = useScrollY();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      <CursorSpotlight />

      {/* NAV */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-display font-bold">
              A
            </div>
            <div>
              <div className="font-display font-semibold tracking-tight">Arbiter Trace</div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mt-0.5">
                ALKA INTELLIGENCE
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link>
          </nav>
          <Magnetic strength={0.3}>
            <Link
              to="/demo"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-border hover:border-primary px-4 py-2 rounded-md transition-colors bg-card/60 backdrop-blur-sm"
            >
              Launch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Magnetic>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Layer 0 — interactive dot field */}
        <div className="absolute inset-0">
          <InteractiveDotField />
        </div>

        {/* Layer 1 — soft ambient blobs (parallax with mouse) */}
        <div
          aria-hidden
          className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full opacity-60 blur-3xl"
          style={{
            background: "radial-gradient(circle, hsl(173 56% 75% / 0.55), transparent 70%)",
            transform: `translate3d(${mouse.x * -30}px, ${mouse.y * -30 + scrollY * 0.15}px, 0)`,
            transition: "transform 0.1s linear",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full opacity-50 blur-3xl"
          style={{
            background: "radial-gradient(circle, hsl(40 60% 80% / 0.6), transparent 70%)",
            transform: `translate3d(${mouse.x * 40}px, ${mouse.y * 40 + scrollY * 0.1}px, 0)`,
            transition: "transform 0.1s linear",
          }}
        />

        {/* Layer 2 — floating ticker chips, parallax with mouse */}
        {FLOATING_TICKERS.map((t) => (
          <div
            key={t.sym}
            aria-hidden
            className="absolute z-[2] hidden md:block"
            style={{
              left: t.x,
              top: t.y,
              transform: `translate3d(${mouse.x * t.depth}px, ${mouse.y * t.depth + scrollY * (t.depth / 200)}px, 0) translate(-50%, -50%)`,
              transition: "transform 0.15s linear",
            }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-sm border border-border shadow-card font-mono text-[11px]">
              <span className="font-semibold text-foreground">{t.sym}</span>
              <span className={t.val.startsWith("−") ? "text-destructive" : "text-primary"}>
                {t.val}
              </span>
            </div>
          </div>
        ))}

        {/* Layer 3 — 3D graph (parallaxed up slightly on scroll) */}
        <div
          className="absolute inset-0 z-[3]"
          style={{
            transform: `translate3d(0, ${scrollY * -0.2}px, 0)`,
            opacity: Math.max(0, 1 - scrollY / 700),
          }}
        >
          <HeroGraph3D />
        </div>

        {/* Layer 4 — copy */}
        <div className="container mx-auto relative z-[4] pt-32 pb-20 text-center pointer-events-none">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/70 backdrop-blur-sm mb-8 pointer-events-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                CONCEPT · ARBITER v0.1 · {now.toLocaleTimeString([], { hour12: false })}
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="font-display font-semibold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.02] tracking-tight max-w-5xl mx-auto"
              style={{
                transform: `translate3d(${mouse.x * -8}px, ${mouse.y * -6}px, 0)`,
                transition: "transform 0.2s ease-out",
              }}
            >
              The Reasoning Layer
              <br />
              <span className="bg-gradient-teal bg-clip-text text-transparent">
                for Capital Markets
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p
              className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              style={{
                transform: `translate3d(${mouse.x * -4}px, ${mouse.y * -3}px, 0)`,
                transition: "transform 0.25s ease-out",
              }}
            >
              Watch an AI build its investment thesis — step by step,
              fully auditable, fully traceable.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
              <Magnetic strength={0.4}>
                <Link
                  to="/demo"
                  className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-glow text-primary-foreground font-display font-semibold text-base sm:text-lg px-7 py-4 rounded-md shadow-glow transition-all"
                >
                  See it think
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-4 py-3"
              >
                Why it matters ↓
              </a>
            </div>
          </Reveal>

          <Reveal delay={460}>
            <div className="mt-20 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
              <span>· INGEST</span>
              <span>· ANALYZE</span>
              <span>· CHECK</span>
              <span>· SIGNAL</span>
              <span className="text-primary">· MANDATE</span>
            </div>
          </Reveal>
        </div>

        {/* fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none z-[5]" />
      </section>

      {/* MARQUEE STRIP */}
      <section className="relative border-y border-border bg-card/40 overflow-hidden py-4">
        <div className="flex gap-12 animate-[marquee_40s_linear_infinite] whitespace-nowrap font-mono text-xs text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0">
              {[
                "AAPL +1.24%", "NVDA +3.81%", "MSFT −0.42%", "GOOGL +0.96%",
                "TSLA +2.05%", "META +0.31%", "AMZN +0.78%", "JPM −0.18%",
                "BRK.B +0.54%", "V +1.12%", "UNH +0.22%", "XOM −1.08%",
              ].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-28 md:py-36">
        <div className="container mx-auto">
          <Reveal>
            <div className="max-w-2xl mb-16">
              <div className="font-mono text-[10px] tracking-[0.2em] text-primary mb-4">
                WHY ARBITER
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                Reasoning you can defend
                <span className="text-muted-foreground"> — to a CIO, a regulator, or yourself.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border shadow-card">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="group bg-card p-8 md:p-10 h-full transition-all hover:bg-secondary relative overflow-hidden">
                  {/* corner accent that grows on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/0 group-hover:bg-primary/10 rounded-bl-[80px] transition-all duration-500" />
                  <div className="relative h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="relative font-display text-xl font-semibold mb-3">{f.title}</h3>
                  <p className="relative text-muted-foreground leading-relaxed">{f.body}</p>
                  <div className="relative mt-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60">
                    0{i + 1} / 03
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="relative py-28 md:py-36 border-t border-border bg-secondary/30">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-primary mb-4">
                THE FLOW
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-6">
                From filing to mandate
                <br />
                <span className="text-primary">in five visible steps.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                Arbiter ingests primary sources, runs structured analysis, checks the result against the peer set, produces a signal, and commits to a mandate. Every intermediate node is inspectable.
              </p>
              <Magnetic strength={0.3}>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Open the live graph <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>

          <ol className="space-y-3">
            {[
              ["INGEST", "10-K filing parsed"],
              ["ANALYZE", "Revenue trend · YoY +6.1%"],
              ["CHECK", "P/E vs sector median"],
              ["SIGNAL", "Undervalued vs peers"],
              ["MANDATE", "BUY · High Conviction"],
            ].map(([k, v], i) => (
              <Reveal key={k} delay={i * 90}>
                <li className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-card transition-all hover:-translate-y-0.5">
                  <div className="font-mono text-xs text-muted-foreground/60 w-6">0{i + 1}</div>
                  <div className="font-mono text-[10px] tracking-[0.18em] text-primary w-20">{k}</div>
                  <div className="text-foreground">{v}</div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 md:py-36 border-t border-border overflow-hidden">
        {/* drifting gradient orb */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, hsl(173 56% 70% / 0.5), transparent 70%)",
            transform: `translate3d(calc(-50% + ${mouse.x * 60}px), calc(-50% + ${mouse.y * 60}px), 0)`,
            transition: "transform 0.2s linear",
          }}
        />
        <div className="container mx-auto text-center max-w-3xl relative">
          <Reveal>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-6">
              Don't take the AI's word for it.
              <br />
              <span className="text-primary">Watch it reason.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <Magnetic strength={0.4}>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-glow text-primary-foreground font-display font-semibold text-lg px-8 py-4 rounded-md shadow-glow transition-all mt-6"
              >
                See it think <ArrowRight className="h-5 w-5" />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        <div className="container mx-auto py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xs">
              A
            </div>
            <span className="font-display font-medium text-sm">Arbiter Trace</span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground text-center">
            BUILT AS A CONCEPT INSPIRED BY ALKA ARBITER · ALKA INTELLIGENCE INC. 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
