import { useMemo } from "react";
import {
  scaleTime,
  scaleLinear,
  max,
  line as d3_line,
  curveMonotoneX,
} from "d3";
import { Tooltip, TooltipTrigger, TooltipContent } from "../Tooltip";

export function MultiLineChart({ data1, data2 }) {
  const parsedData1 = useMemo(
    () => data1.map((d) => ({ ...d, date: new Date(d.date) })),
    [data1]
  );

  const parsedData2 = useMemo(
    () => data2.map((d) => ({ ...d, date: new Date(d.date) })),
    [data2]
  );

  const allData = [...parsedData1, ...parsedData2];

  const xScale = scaleTime()
    .domain([parsedData1[0].date, parsedData1[parsedData1.length - 1].date])
    .range([0, 100]);

  const yMax = max(allData.map((d) => d.value)) || 0;
  const yScale = scaleLinear().domain([0, yMax]).range([100, 0]);

  const line = d3_line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const d = line(parsedData1);
  const d2 = line(parsedData2);

  if (!d || !d2) return null;

  return (
    <div
      className="relative h-72 w-full"
      style={{
        "--marginTop": "0px",
        "--marginRight": "8px",
        "--marginBottom": "25px",
        "--marginLeft": "25px",
      }}
    >
      {/* Y axis */}
      <div
        className="absolute inset-0 h-[calc(100%-var(--marginTop)-var(--marginBottom))] w-[var(--marginLeft)] translate-y-[var(--marginTop)] overflow-visible"
      >
        {yScale
          .ticks(8)
          .map(yScale.tickFormat(8, "d"))
          .map((value, i) => (
            <div
              key={i}
              style={{ top: `${yScale(+value)}%`, left: "0%" }}
              className="absolute text-xs tabular-nums -translate-y-1/2 text-gray-500 w-full text-right pr-2"
            >
              {value}
            </div>
          ))}
      </div>

      {/* Chart area */}
      <div
        className="absolute inset-0 h-[calc(100%-var(--marginTop)-var(--marginBottom))] w-[calc(100%-var(--marginLeft)-var(--marginRight))] translate-x-[var(--marginLeft)] translate-y-[var(--marginTop)] overflow-visible"
      >
        <svg
          viewBox="0 0 100 100"
          className="overflow-visible w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {yScale
            .ticks(8)
            .map(yScale.tickFormat(8, "d"))
            .map((tick, i) => (
              <g
                key={i}
                transform={`translate(0,${yScale(+tick)})`}
                className="text-zinc-300 dark:text-zinc-700"
              >
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

          {/* Line 1 */}
          <path
            d={d}
            fill="none"
            className="stroke-violet-400"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Line 2 */}
          <path
            d={d2}
            fill="none"
            className="stroke-fuchsia-400"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Circles 1 */}
          {parsedData1.map((d, index) => (
            <path
              key={index}
              d={`M ${xScale(d.date)} ${yScale(d.value)} l 0.0001 0`}
              vectorEffect="non-scaling-stroke"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              stroke="currentColor"
              className="text-violet-300"
            />
          ))}

          {/* Circles 2 */}
          {parsedData2.map((d, index) => (
            <path
              key={index}
              d={`M ${xScale(d.date)} ${yScale(d.value)} l 0.0001 0`}
              vectorEffect="non-scaling-stroke"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              stroke="currentColor"
              className="text-fuchsia-300"
            />
          ))}
        </svg>

        {/* X Axis */}
        <div className="translate-y-2">
          {parsedData1.map((d, i) => {
            const isFirst = i === 0;
            const isLast = i === parsedData1.length - 1;
            const isMax =
              d.value === Math.max(...parsedData1.map((p) => p.value));
            if (!isFirst && !isLast && !isMax) return null;
            return (
              <div key={i} className="overflow-visible text-zinc-500">
                <div
                  style={{
                    left: `${xScale(d.date)}%`,
                    top: "100%",
                    transform: `translateX(${
                      isFirst ? "0%" : isLast ? "-100%" : "-50%"
                    })`,
                  }}
                  className="text-xs absolute"
                >
                  {d.date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MultiLineChart;
