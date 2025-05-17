import React from "react";
import { scaleBand, scaleLinear, max } from "d3";

const PX_BETWEEN_BARS = 5;

const BarChartMultiVertical = ({ data, colors = ["#B89DFB", "#e7deff", "#DAA6FF"] }) => {
  if (!data || !data.length || !data[0].values) return <div>No data available</div>;

  const numBars = data[0].values.length;

  const xScale = scaleBand()
    .domain(data.map(d => d.key))
    .range([0, 100])
    .padding(0.4);

  const yScale = scaleLinear()
    .domain([0, max(data.flatMap(d => d.values)) || 0])
    .range([100, 0]);

  return (
    <div
      className="relative h-72 w-full grid"
      style={{
        "--marginTop": "0px",
        "--marginRight": "25px",
        "--marginBottom": "55px",
        "--marginLeft": "25px",
      }}
    >
      {/* Y Axis */}
      <div className="relative h-[calc(100%-var(--marginTop)-var(--marginBottom))] w-[var(--marginLeft)] translate-y-[var(--marginTop)] overflow-visible">
        {yScale.ticks(8).map((t, i) => (
          <div
            key={i}
            style={{ top: `${yScale(t)}%` }}
            className="absolute text-xs tabular-nums -translate-y-1/2 text-gray-300 w-full text-right pr-2"
          >
            {t}
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="absolute inset-0 h-[calc(100%-var(--marginTop)-var(--marginBottom))] w-[calc(100%-var(--marginLeft)-var(--marginRight))] translate-x-[var(--marginLeft)] translate-y-[var(--marginTop)] overflow-visible">
        <div className="relative w-full h-full">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {yScale.ticks(8).map((t, i) => (
              <g key={i} transform={`translate(0,${yScale(t)})`} className="text-gray-300/80 dark:text-gray-800/80">
                <line
                  x1={0}
                  x2={100}
                  stroke="currentColor"
                  strokeDasharray="6,5"
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </svg>

          {/* Bars */}
          {data.map((d, i) => (
            <div
              key={i}
              className="absolute top-0"
              style={{
                left: `${xScale(d.key)}%`,
                width: `${xScale.bandwidth()}%`,
                height: "100%",
              }}
            >
              {d.values.map((v, j) => {
                const barHeight = 100 - yScale(v);
                const barWidth = (100 - PX_BETWEEN_BARS * (numBars - 1)) / numBars;
                const barX = j * (barWidth + PX_BETWEEN_BARS);

                return (
                  <div
                    key={j}
                    className="absolute bottom-0 rounded-t"
                    style={{
                      left: `${barX}%`,
                      width: `${barWidth}%`,
                      height: `${barHeight}%`,
                      backgroundColor: colors[j % colors.length],
                      border: `1px solid #a07dff22`,
                    }}
                  />
                );
              })}
            </div>
          ))}

          {/* X Axis Labels */}
          {data.map((entry, i) => {
            const x = xScale(entry.key) + xScale.bandwidth() / 2;
            return (
              <div
                key={i}
                className="absolute overflow-visible text-gray-400"
                style={{
                  left: `${x}%`,
                  top: "100%",
                  transform: "rotate(45deg) translateX(4px) translateY(8px)",
                }}
              >
                <div className="absolute text-xs -translate-y-1/2 whitespace-nowrap">
                  {entry.key.length > 10 ? entry.key.slice(0, 10) + "..." : entry.key}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarChartMultiVertical;
