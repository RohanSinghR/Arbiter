import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Props {
  data: number[];
  width?: number;
  height?: number;
}

export const Sparkline = ({ data, width = 200, height = 48 }: Props) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const m = { t: 4, r: 4, b: 4, l: 4 };
    const w = width - m.l - m.r;
    const h = height - m.t - m.b;

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, w]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data) as number, d3.max(data) as number])
      .range([h, 0]);

    const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;
    const defs = svg.append("defs");
    const grad = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0").attr("x2", "0")
      .attr("y1", "0").attr("y2", "1");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#2D9E8F").attr("stop-opacity", 0.4);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#2D9E8F").attr("stop-opacity", 0);

    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    const area = d3
      .area<number>()
      .x((_, i) => x(i))
      .y0(h)
      .y1((d) => y(d))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(data).attr("fill", `url(#${gradId})`).attr("d", area);
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2D9E8F")
      .attr("stroke-width", 1.75)
      .attr("d", line);

    // Last-point permanent dot
    g.append("circle")
      .attr("cx", x(data.length - 1))
      .attr("cy", y(data[data.length - 1]))
      .attr("r", 2.75)
      .attr("fill", "#2D9E8F");

    // ── Interactive overlay ──────────────────────────────────────────────────

    // Vertical crosshair line (hidden until hover)
    const crosshair = g
      .append("line")
      .attr("y1", 0)
      .attr("y2", h)
      .attr("stroke", "#2D9E8F")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,2")
      .attr("opacity", 0)
      .style("pointer-events", "none");

    // Hover dot
    const hoverDot = g
      .append("circle")
      .attr("r", 3.5)
      .attr("fill", "#2D9E8F")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0)
      .style("pointer-events", "none");

    // Tooltip group (label + background rect)
    const tooltipG = g
      .append("g")
      .attr("opacity", 0)
      .style("pointer-events", "none");

    const tooltipRect = tooltipG
      .append("rect")
      .attr("rx", 3)
      .attr("fill", "hsl(220 15% 12%)")
      .attr("stroke", "#2D9E8F")
      .attr("stroke-width", 0.75);

    const tooltipText = tooltipG
      .append("text")
      .attr("font-size", 9)
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#2D9E8F");

    // Bisector to find nearest data point to mouse
    const bisect = d3.bisector((_: number, i: number) => i).left;

    // Invisible rect captures mouse events across full area
    g.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent")
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event);
        const xVal = x.invert(mx);
        const idx = Math.max(
          0,
          Math.min(data.length - 1, Math.round(xVal))
        );
        const cx = x(idx);
        const cy = y(data[idx]);
        const label = data[idx].toFixed(1);

        crosshair.attr("x1", cx).attr("x2", cx).attr("opacity", 0.6);
        hoverDot.attr("cx", cx).attr("cy", cy).attr("opacity", 1);

        tooltipText.text(label);
        // Measure text to size the rect
        const textNode = tooltipText.node();
        const bbox = textNode ? textNode.getBBox() : { width: 28, height: 10 };
        const pad = { x: 5, y: 3 };
        const rw = bbox.width + pad.x * 2;
        const rh = bbox.height + pad.y * 2;

        // Keep tooltip within bounds
        let tx = cx + 6;
        if (tx + rw > w) tx = cx - rw - 6;
        let ty = cy - rh - 4;
        if (ty < 0) ty = cy + 6;

        tooltipRect.attr("x", tx).attr("y", ty).attr("width", rw).attr("height", rh);
        tooltipText.attr("x", tx + pad.x).attr("y", ty + pad.y + bbox.height - 1);
        tooltipG.attr("opacity", 1);
      })
      .on("mouseleave", function () {
        crosshair.attr("opacity", 0);
        hoverDot.attr("opacity", 0);
        tooltipG.attr("opacity", 0);
      });
  }, [data, width, height]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className="overflow-visible cursor-crosshair"
    />
  );
};