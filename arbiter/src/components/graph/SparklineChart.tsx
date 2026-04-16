import { useEffect, useRef } from "react";
import * as d3 from "d3";

const data = [62, 68, 71, 74, 78, 82, 85, 81, 87, 91, 94, 100];

const SparklineChart = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 160, h = 36, m = { top: 4, right: 4, bottom: 4, left: 4 };
    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([m.left, w - m.right]);
    const yScale = d3.scaleLinear().domain([d3.min(data)! * 0.95, d3.max(data)! * 1.05]).range([h - m.bottom, m.top]);

    const area = d3.area<number>()
      .x((_, i) => xScale(i))
      .y0(h - m.bottom)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("d", area)
      .attr("fill", "hsl(170 55% 40% / 0.1)");

    svg.append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#2D9E8F")
      .attr("stroke-width", 1.5);

    svg.append("circle")
      .attr("cx", xScale(data.length - 1))
      .attr("cy", yScale(data[data.length - 1]))
      .attr("r", 2.5)
      .attr("fill", "#2D9E8F");
  }, []);

  return <svg ref={svgRef} width={160} height={36} />;
};

export default SparklineChart;
