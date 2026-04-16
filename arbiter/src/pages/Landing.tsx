import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  GitBranch,
  Shield,
  FileSearch,
  Brain,
  Target,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Eye,
    title: "Auditable Reasoning",
    description: "Every decision has a trace. Every trace has evidence.",
  },
  {
    icon: GitBranch,
    title: "Live Graph Visualization",
    description:
      "Watch the AI's logic unfold as an interactive node graph in real time.",
  },
  {
    icon: Shield,
    title: "Investment-Grade Rigor",
    description:
      "Built for fiduciaries who need to know not just what, but why.",
  },
];

const steps = [
  { icon: FileSearch, label: "Ingest", detail: "SEC filings, earnings calls, market data" },
  { icon: Brain, label: "Reason", detail: "Multi-step causal analysis with evidence" },
  { icon: Target, label: "Mandate", detail: "Conviction-scored investment thesis" },
];

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

/** Intersection-observer hook for scroll-triggered animations */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/** Track normalized scroll progress 0→1 */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/* ------------------------------------------------------------------ */
/*  Floating particles (pure CSS / JS, no Three.js)                    */
/* ------------------------------------------------------------------ */
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 12 + Math.random() * 20,
      delay: Math.random() * -20,
      opacity: 0.15 + Math.random() * 0.25,
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: "#2D9E8F",
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px #2D9E8F`,
            animation: `float-y ${p.speed}s ease-in-out ${p.delay}s infinite alternate`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cursor glow                                                        */
/* ------------------------------------------------------------------ */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-50 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-20 blur-3xl"
      style={{ background: "radial-gradient(circle, #2D9E8F 0%, transparent 70%)", willChange: "transform" }}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Typewriter heading                                                 */
/* ------------------------------------------------------------------ */
function TypewriterHeading({ text, visible, className = "" }: { text: string; visible: boolean; className?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), 32);
    return () => clearTimeout(id);
  }, [visible, count, text]);

  return (
    <span className={className}>
      {visible ? text.slice(0, count) : "\u00A0"}
      {visible && count < text.length && (
        <span className="inline-block w-[3px] h-[1em] bg-[#2D9E8F] ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Landing                                                       */
/* ------------------------------------------------------------------ */
const Landing = () => {
  const navigate = useNavigate();
  const scrollProgress = useScrollProgress();
  const [navSolid, setNavSolid] = useState(false);

  // sticky nav background
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal refs
  const howSection = useReveal<HTMLElement>();
  const featureSection = useReveal<HTMLElement>();
  const ctaSection = useReveal<HTMLElement>();

  // Interpolate bg color based on scroll progress
  const bgStyle = {
    background: `linear-gradient(to bottom,
      #F5F2EB ${Math.max(0, 10 - scrollProgress * 60)}%,
      #1A1A1A ${50 + scrollProgress * 10}%,
      #0A0A0A 100%)`,
    transition: "background 0.05s linear",
  };

  // Dynamic text color: light at top → white when dark bg visible
  const isDark = scrollProgress > 0.15;

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden" style={bgStyle}>
      <CursorGlow />
      <FloatingParticles />

      {/* ---- Nav ---- */}
      <nav
        className={`fixed top-0 inset-x-0 z-40 flex items-center justify-between px-8 py-4 transition-all duration-300 ${
          navSolid
            ? "backdrop-blur-xl bg-[#0A0A0A]/70 border-b border-[#2D9E8F]/10 shadow-lg"
            : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2D9E8F] flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">AT</span>
          </div>
          <span
            className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
              navSolid ? "text-white" : "text-[#1A1A1A]"
            }`}
          >
            Arbiter Trace
          </span>
        </div>
        <button
          onClick={() => navigate("/demo")}
          className="text-sm text-[#2D9E8F] font-medium hover:underline underline-offset-4 transition-colors"
        >
          Demo →
        </button>
      </nav>

      {/* ---- Hero ---- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: "transform", transform: `translateY(${scrollProgress * 80}px)` }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
            type="video/mp4"
          />
        </video>
        {/* Teal tint overlay */}
        <div className="absolute inset-0 bg-[#2D9E8F]/[0.25]" />
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F2EB]/80 via-transparent to-[#1A1A1A]" />

        <div
          className="relative z-10 text-center max-w-3xl mx-auto px-6"
          style={{ transform: `translateY(${scrollProgress * -120}px)`, willChange: "transform" }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-[#0F0F0F]">
            The Reasoning Layer
            <br />
            <span className="text-[#2D9E8F]">for Capital Markets</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#0F0F0F]/70 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Watch an AI build its investment thesis — step by step, fully
            auditable, fully traceable.
          </p>
          <button
            onClick={() => navigate("/demo")}
            className="group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-[#2D9E8F] text-white text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(45,158,143,0.5)] shadow-[0_0_30px_rgba(45,158,143,0.25)] cta-breathe"
          >
            See it think
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60">
          <span className="text-xs text-[#0F0F0F]/60 tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-[#0F0F0F]/30 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[#2D9E8F] animate-bounce" />
          </div>
        </div>
      </section>

      {/* ---- Section 1: How Arbiter Thinks ---- */}
      <section
        ref={howSection.ref}
        className={`relative z-10 max-w-5xl mx-auto px-6 py-32 transition-all duration-700 ${
          howSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white tracking-tight">
          <TypewriterHeading text="How Arbiter Thinks" visible={howSection.visible} />
        </h2>
        <p className="text-center text-white/50 mb-16 max-w-lg mx-auto">
          A three-stage reasoning engine that shows its work at every step.
        </p>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#2D9E8F]/0 via-[#2D9E8F]/50 to-[#2D9E8F]/0 -translate-y-1/2 z-0" />

          {steps.map((step, i) => (
            <div
              key={step.label}
              className="relative z-10 group"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: howSection.visible ? 1 : 0,
                transform: howSection.visible ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(45,158,143,0.15)] hover:border-[#2D9E8F]/30 cursor-default"
                   style={{ perspective: "800px" }}>
                <div className="w-14 h-14 rounded-xl bg-[#2D9E8F]/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-[#2D9E8F]/20 transition-colors">
                  <step.icon size={26} className="text-[#2D9E8F]" />
                </div>
                <div className="text-xs font-mono text-[#2D9E8F] tracking-widest uppercase mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.label}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 2: Feature Cards ---- */}
      <section
        ref={featureSection.ref}
        className={`relative z-10 max-w-5xl mx-auto px-6 py-24 transition-all duration-700 ${
          featureSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-white tracking-tight">
          <TypewriterHeading text="Why Arbiter Trace" visible={featureSection.visible} />
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group"
              style={{
                transitionDelay: `${i * 120}ms`,
                opacity: featureSection.visible ? 1 : 0,
                transform: featureSection.visible ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div
                className="h-full rounded-2xl border border-white/[0.08] p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_50px_rgba(45,158,143,0.12)] hover:border-[#2D9E8F]/40 cursor-default"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(45,158,143,0.04) 100%)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#2D9E8F]/10 flex items-center justify-center mb-6 group-hover:bg-[#2D9E8F]/20 transition-colors">
                  <f.icon size={22} className="text-[#2D9E8F]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 3: Full-width CTA ---- */}
      <section
        ref={ctaSection.ref}
        className={`relative z-10 transition-all duration-700 ${
          ctaSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        <div className="mx-6 my-24 rounded-3xl bg-[#2D9E8F] px-8 py-20 text-center relative overflow-hidden">
          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
            aria-hidden
          />
          <h2 className="relative text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Built to show its work. Built for capital.
          </h2>
          <p className="relative text-white/70 mb-10 max-w-md mx-auto">
            Experience transparent AI reasoning designed for institutional rigor.
          </p>
          <button
            onClick={() => navigate("/demo")}
            className="relative group inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#0A0A0A] text-white text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]"
          >
            Launch Arbiter Trace
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="relative z-10 pb-12 pt-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-px bg-[#2D9E8F]/20 mb-8" />
          <p className="text-center text-xs text-white/30">
            Built as a concept inspired by Alka Arbiter · Alka Intelligence Inc.
            2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
