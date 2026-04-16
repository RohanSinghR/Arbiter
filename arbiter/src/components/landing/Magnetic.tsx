import { useEffect, useRef, useState } from "react";

/**
 * Wraps any element and applies a "magnetic" pull toward the cursor on hover.
 */
interface Props {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const Magnetic = ({ children, strength = 0.35, className }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      setT({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength });
    };
    const onLeave = () => setT({ x: 0, y: 0 });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(${t.x}px, ${t.y}px, 0)`,
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
};
