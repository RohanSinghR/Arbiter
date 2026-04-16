import { useEffect, useRef } from "react";

/**
 * Interactive grid of dots that gently push away from the cursor and ripple.
 * Sits as a fixed background layer; pointer-events disabled so it never blocks UI.
 */
export const InteractiveDotField = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const SPACING = 36;
    const RADIUS = 1.4;
    const INFLUENCE = 140;

    type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
    let dots: Dot[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = c * SPACING;
          const oy = r * SPACING;
          dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
      mouse.current.active = true;
    };
    const onLeave = () => {
      mouse.current.active = false;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        const dx = d.x - mouse.current.x;
        const dy = d.y - mouse.current.y;
        const dist = Math.hypot(dx, dy);

        if (mouse.current.active && dist < INFLUENCE) {
          const force = (1 - dist / INFLUENCE) * 1.6;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          d.vx += nx * force;
          d.vy += ny * force;
        }

        // Spring back to origin
        d.vx += (d.ox - d.x) * 0.04;
        d.vy += (d.oy - d.y) * 0.04;
        d.vx *= 0.82;
        d.vy *= 0.82;
        d.x += d.vx;
        d.y += d.vy;

        const displaced = Math.hypot(d.x - d.ox, d.y - d.oy);
        const intensity = Math.min(1, displaced / 22);
        const r = RADIUS + intensity * 1.6;
        // Teal when active, soft taupe at rest
        const alpha = 0.22 + intensity * 0.55;
        ctx.fillStyle = intensity > 0.05
          ? `rgba(45, 158, 143, ${alpha})`
          : `rgba(120, 110, 95, 0.22)`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    tick();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
};
