// Add at the top of the file
await new Promise((resolve) => setTimeout(resolve, 1500));


// BarChartMultiVerticalTooltip.jsx
import React from "react";
import { scaleBand, scaleLinear, max } from "d3";
import {
  BarChartTooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./BarChartTooltip";

/**
 * @typedef {{
 *   key: string;
 *   values: number[];
 * }} BarData
 *
 * @param {{ data: BarData[], colors?: string[] }} props
 */

const PX_BETWEEN_BARS = 5;

export default function BarChartMultiVerticalTooltip({
  data,
  colors = ["#B89DFB", "#DAA6FF", "#e7deff"],
}) {
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    !Array.isArray(data[0].values)
  ) {
    return (
      <div className="text-center text-gray-400 text-sm">
        No data to display
      </div>
    );
  }
  const numBars = data[0].values.length;

  const xScale = scaleBand()
    .domain(data.map((d) => d.key))
    .range([0, 100])
    .padding(0.4);

  const yScale = scaleLinear()
    .domain([0, max(data.flatMap((d) => d.values)) ?? 0])
    .range([100, 0]);

  return (
    <BarChartTooltipProvider>
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
          {yScale.ticks(8).map((value, i) => (
            <div
              key={i}
              style={{ top: `${yScale(value)}%` }}
              className="absolute text-xs tabular-nums -translate-y-1/2 text-gray-300 w-full text-right pr-2"
            >
              {value}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="absolute inset-0 h-[calc(100%-var(--marginTop)-var(--marginBottom))] w-[calc(100%-var(--marginLeft)-var(--marginRight))] translate-x-[var(--marginLeft)] translate-y-[var(--marginTop)] overflow-visible">
          <div className="relative w-full h-full">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {yScale.ticks(8).map((val, i) => (
                <g key={i} transform={`translate(0,${yScale(val)})`}>
                  <line
                    x1={0}
                    x2={100}
                    stroke="currentColor"
                    strokeDasharray="6,5"
                    strokeWidth={0.5}
                    className="text-gray-300/80 dark:text-gray-800/80"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
            </svg>

            {data.map((d, index) => (
              <BarChartTooltipProvider key={index}>
                <TooltipTrigger>
                  <div
                    className="absolute top-0"
                    style={{
                      left: `${xScale(d.key)}%`,
                      width: `${xScale.bandwidth()}%`,
                      height: "100%",
                    }}
                  >
                    {d.values.map((value, barIndex) => {
                      const barHeight = 100 - yScale(value);
                      const shownBars = d.values.length;
                      const barWidth =
                        (100 - PX_BETWEEN_BARS * (shownBars - 1)) / shownBars;
                      const barXPosition =
                        barIndex * (barWidth + PX_BETWEEN_BARS);
                      const barColor = colors[barIndex % colors.length]; // Use based on index

                      return (
                        <div
                          key={barIndex}
                          className="absolute bottom-0 rounded-t"
                          style={{
                            left: `${barXPosition}%`,
                            width: `${barWidth}%`,
                            height: `${barHeight}%`,
                            backgroundColor: barColor,
                            border: `1px solid ${barColor}55`,
                          }}
                        />
                      );
                    })}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1 mb-1.5">
                    {d.key}
                  </div>
                  <div className="flex flex-col gap-2 ">
                    {d.values.map((value, idx) => (
                      <div
                        key={idx}
                        className="flex gap-1.5 items-center text-sm "
                      >
                        <div
                          className="h-3.5 w-1 rounded-full"
                          style={{
                            backgroundColor: colors[idx % colors.length],
                          }}
                        ></div>

                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </BarChartTooltipProvider>
            ))}

            {/* X Axis Labels */}
            {data.map((entry, i) => {
              const xPosition = xScale(entry.key) + xScale.bandwidth() / 2;
              return (
                <div
                  key={i}
                  className="absolute overflow-visible text-gray-400"
                  style={{
                    left: `${xPosition}%`,
                    top: "100%",
                    transform: "rotate(45deg) translateX(4px) translateY(8px)",
                  }}
                >
                  <div className="absolute text-xs -translate-y-1/2 whitespace-nowrap">
                    {entry.key.length > 10
                      ? entry.key.slice(0, 10) + "..."
                      : entry.key}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BarChartTooltipProvider>
  );
}
