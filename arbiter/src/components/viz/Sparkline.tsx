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

    const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;
    const grad = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0").attr("x2", "0").attr("y1", "0").attr("y2", "1");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#2D9E8F").attr("stop-opacity", 0.4);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#2D9E8F").attr("stop-opacity", 0);

    g.append("path").datum(data).attr("fill", `url(#${gradId})`).attr("d", area);
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2D9E8F")
      .attr("stroke-width", 1.75)
      .attr("d", line);

    // last-point dot
    g.append("circle")
      .attr("cx", x(data.length - 1))
      .attr("cy", y(data[data.length - 1]))
      .attr("r", 2.75)
      .attr("fill", "#2D9E8F");
  }, [data, width, height]);

  return <svg ref={ref} width={width} height={height} className="overflow-visible" />;
};
