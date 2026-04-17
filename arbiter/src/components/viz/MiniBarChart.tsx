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

export const MiniBarChart = ({ data, width = 220, height = 80, highlightLabel }: Props) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const m = { t: 4, r: 4, b: 16, l: 4 };
    const w = width - m.l - m.r;
    const h = height - m.t - m.b;

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, w])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.value) as number) * 1.1])
      .range([h, 0]);

    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.label) as number)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => h - y(d.value))
      .attr("rx", 2)
      .attr("fill", (d) =>
        d.label === highlightLabel ? "#2D9E8F" : "#2D9E8F"
      )
      .attr("opacity", (d) => (d.label === highlightLabel ? 1 : 0.35));

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(4))
      .call((sel) => sel.select(".domain").remove())
      .selectAll("text")
      .attr("font-size", 9)
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "hsl(220 12% 40%)");
  }, [data, width, height, highlightLabel]);

  return <svg ref={ref} width={width} height={height} />;
};
