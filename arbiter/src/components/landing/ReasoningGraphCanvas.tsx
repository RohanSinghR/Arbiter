import { useEffect, useRef } from "react";

/**
 * High-performance 2D canvas reasoning graph.
 * - Force-directed-ish drift with spring constraints
 * - Cursor repulsion + glow
 * - Pulsing teal nodes, animated edges
 * - Dramatically lighter than Three.js, no shaders, no DOM thrash.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  phase: number;
  pulse: number;
}

interface Edge {
  a: number;
  b: number;
  flow: number; // 0..1 packet position along edge
  speed: number;
}

interface Props {
  density?: number; // nodes per 100k px
  className?: string;
  /** background base — null = transparent */
  background?: string | null;
  /** if true, nodes are larger and edges thicker (hero use) */
  hero?: boolean;
}

export const ReasoningGraphCanvas = ({
  density = 0.00018,
  className,
  background = null,
  hero = true,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let t0 = performance.now();
    let frame = 0;

    const TEAL = "45, 158, 143"; // #2D9E8F
    const TEAL_LIGHT = "120, 210, 195";
    const INK = "30, 36, 42";

    const buildGraph = () => {
      const area = W * H;
      const target = Math.max(18, Math.min(64, Math.round(area * density)));
      nodes = [];
      for (let i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: hero ? 2.2 + Math.random() * 2.4 : 1.8 + Math.random() * 1.6,
          hue: Math.random(),
          phase: Math.random() * Math.PI * 2,
          pulse: 0.6 + Math.random() * 0.8,
        });
      }
      // Build edges to nearest k neighbours
      edges = [];
      const seen = new Set<string>();
      const K = 2;
      for (let i = 0; i < nodes.length; i++) {
        const dists: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          dists.push({ j, d: dx * dx + dy * dy });
        }
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < K; k++) {
          const j = dists[k].j;
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({
              a: i,
              b: j,
              flow: Math.random(),
              speed: 0.0015 + Math.random() * 0.003,
            });
          }
        }
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGraph();
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - r.left;
      mouse.current.y = e.clientY - r.top;
      mouse.current.active = true;
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      frame++;

      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.clearRect(0, 0, W, H);
      }

      // Soft cursor halo (only when active)
      if (mouse.current.active) {
        const grad = ctx.createRadialGradient(
          mouse.current.x, mouse.current.y, 0,
          mouse.current.x, mouse.current.y, 220
        );
        grad.addColorStop(0, `rgba(${TEAL}, 0.12)`);
        grad.addColorStop(1, `rgba(${TEAL}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // ---- Update nodes ----
      for (const n of nodes) {
        // gentle drift
        n.x += n.vx;
        n.y += n.vy;

        // Wrap softly with edge bounce
        if (n.x < 20) { n.x = 20; n.vx *= -1; }
        if (n.x > W - 20) { n.x = W - 20; n.vx *= -1; }
        if (n.y < 20) { n.y = 20; n.vy *= -1; }
        if (n.y > H - 20) { n.y = H - 20; n.vy *= -1; }

        // Cursor repulsion
        if (mouse.current.active) {
          const dx = n.x - mouse.current.x;
          const dy = n.y - mouse.current.y;
          const d2 = dx * dx + dy * dy;
          const R = 160;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 0.9;
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }

        // friction
        n.vx *= 0.96;
        n.vy *= 0.96;
        // tiny brownian
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;
      }

      // ---- Draw edges + flowing packet ----
      ctx.lineWidth = hero ? 1 : 0.75;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Fade distant connections — keeps it organic
        const maxD = hero ? 260 : 200;
        if (d > maxD) continue;
        const alpha = (1 - d / maxD) * 0.5;

        ctx.strokeStyle = `rgba(${TEAL}, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Flowing packet
        e.flow += e.speed;
        if (e.flow > 1) e.flow -= 1;
        const px = a.x + (b.x - a.x) * e.flow;
        const py = a.y + (b.y - a.y) * e.flow;
        ctx.fillStyle = `rgba(${TEAL_LIGHT}, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- Draw nodes ----
      for (const n of nodes) {
        const pulse = 1 + Math.sin(t * n.pulse + n.phase) * 0.35;
        const r = n.r * pulse;

        // glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
        g.addColorStop(0, `rgba(${TEAL}, 0.55)`);
        g.addColorStop(1, `rgba(${TEAL}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(${INK}, 0.95)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // teal ring
        ctx.strokeStyle = `rgba(${TEAL}, 0.9)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, hero, background]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "absolute inset-0 w-full h-full"}
      aria-hidden
    />
  );
};
