import { useEffect, useState } from "react";

/**
 * Tilts a child element on scroll based on its position in the viewport.
 * Use for floating preview cards / "image" parallax.
 */
interface Props {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export const ScrollTilt = ({ children, className, intensity = 1 }: Props) => {
  const [progress, setProgress] = useState(0);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const vh = window.innerHeight;
      // -1 (above) → 0 (centered) → 1 (below)
      const p = (center - vh / 2) / (vh / 2);
      setProgress(Math.max(-1, Math.min(1, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [el]);

  const rotX = progress * 8 * intensity;
  const ty = progress * -40 * intensity;
  const scale = 1 - Math.abs(progress) * 0.04 * intensity;

  return (
    <div
      ref={setEl}
      className={className}
      style={{
        transform: `perspective(1400px) rotateX(${rotX}deg) translate3d(0, ${ty}px, 0) scale(${scale})`,
        transition: "transform 0.05s linear",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
