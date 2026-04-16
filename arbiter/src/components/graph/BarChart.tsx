import { useEffect, useRef } from "react";
import * as d3 from "d3";

const data = [
  { label: "AAPL", value: 28.4 },
  { label: "Sector", value: 32.1 },
  { label: "S&P", value: 21.7 },
];

const BarChart = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 160, h = 44, m = { top: 2, right: 4, bottom: 12, left: 4 };
    const x = d3.scaleBand().domain(data.map(d => d.label)).range([m.left, w - m.right]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)! * 1.15]).range([h - m.bottom, m.top]);

    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.label)!)
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => h - m.bottom - y(d.value))
      .attr("rx", 2)
      .attr("fill", (_, i) => i === 0 ? "#2D9E8F" : "hsl(220 15% 82%)");

    svg.selectAll("text")
      .data(data)
      .join("text")
      .attr("x", d => x(d.label)! + x.bandwidth() / 2)
      .attr("y", h - 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "hsl(220 10% 46%)")
      .text(d => d.label);
  }, []);

  return <svg ref={svgRef} width={160} height={44} />;
};

export default BarChart;
