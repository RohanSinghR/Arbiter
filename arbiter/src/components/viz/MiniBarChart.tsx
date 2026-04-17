import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  width?: number;
  height?: number;
  highlightLabel?: string;
}

export const MiniBarChart = ({
  data,
  width = 220,
  height = 80,
  highlightLabel,
}: Props) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const m = { t: 8, r: 4, b: 16, l: 4 };
    const w = width - m.l - m.r;
    const h = height - m.t - m.b;

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, w])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.value) as number) * 1.15])
      .range([h, 0]);

    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    // ── Bars ────────────────────────────────────────────────────────────────

    const bars = g
      .selectAll<SVGRectElement, Bar>("rect.bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) as number)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => h - y(d.value))
      .attr("rx", 2)
      .attr("fill", "#2D9E8F")
      .attr("opacity", (d) => (d.label === highlightLabel ? 1 : 0.35))
      .style("cursor", "pointer")
      .style("transition", "opacity 0.15s");

    // ── Tooltip group ────────────────────────────────────────────────────────

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

    // ── Hover interactions ───────────────────────────────────────────────────

    bars
      .on("mouseover", function (event, d) {
        // Brighten hovered bar
        d3.select(this).attr("opacity", 1);

        const bx = (x(d.label) as number) + x.bandwidth() / 2;
        const by = y(d.value);
        const label = String(d.value);

        tooltipText.text(label);
        const textNode = tooltipText.node();
        const bbox = textNode
          ? textNode.getBBox()
          : { width: 24, height: 10 };
        const pad = { x: 5, y: 3 };
        const rw = bbox.width + pad.x * 2;
        const rh = bbox.height + pad.y * 2;

        // Center tooltip above the bar; clamp to svg bounds
        let tx = bx - rw / 2;
        if (tx < 0) tx = 0;
        if (tx + rw > w) tx = w - rw;
        let ty = by - rh - 4;
        if (ty < 0) ty = by + 4;

        tooltipRect
          .attr("x", tx)
          .attr("y", ty)
          .attr("width", rw)
          .attr("height", rh);
        tooltipText
          .attr("x", tx + pad.x)
          .attr("y", ty + pad.y + bbox.height - 1);
        tooltipG.attr("opacity", 1);
      })
      .on("mouseout", function (_, d) {
        // Restore original opacity
        d3.select(this).attr(
          "opacity",
          d.label === highlightLabel ? 1 : 0.35
        );
        tooltipG.attr("opacity", 0);
      });

    // ── X axis ───────────────────────────────────────────────────────────────

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(4))
      .call((sel) => sel.select(".domain").remove())
      .selectAll("text")
      .attr("font-size", 9)
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "hsl(220 12% 40%)");
  }, [data, width, height, highlightLabel]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className="overflow-visible cursor-pointer"
    />
  );
};