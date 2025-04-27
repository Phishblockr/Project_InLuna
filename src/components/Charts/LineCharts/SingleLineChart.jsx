import { useMemo } from "react";
import {
  scaleTime,
  scaleLinear,
  max,
  line as d3_line,
  curveMonotoneX,
} from "d3";

/**
 * @param {{ data: string[] }} props
 */
export default function SingleChart({ data, color, dotColor }) {
  const strokeColor = color || "stroke-fuchsia-400";
  const dotsColor = dotColor || "stroke-fuchsia-400";

  // Parse dates and memoize
  const parsedData = useMemo(() => {
    return data.map((d) => ({ ...d, date: new Date(d.date) }));
  }, [data]);

  if (!parsedData.length) return null;

  const xScale = scaleTime()
    .domain([parsedData[0].date, parsedData[parsedData.length - 1].date])
    .range([0, 100]);

  const yMax = max(parsedData.map((d) => d.value)) ?? 0;
  const yScale = scaleLinear().domain([0, yMax]).range([100, 0]);

  const line = d3_line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const dPath = line(parsedData);
  if (!dPath) return null;

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
        className="absolute inset-0
          h-[calc(100%-var(--marginTop)-var(--marginBottom))]
          w-[var(--marginLeft)]
          translate-y-[var(--marginTop)]
          overflow-visible"
      >
        {yScale
          .ticks(8)
          .map(yScale.tickFormat(8, "d"))
          .map((value, i) => (
            <div
              key={i}
              style={{ top: `${yScale(+value)}%`, left: "0%" }}
              className="absolute text-xs tabular-nums -translate-y-1/2 -translate-x-2 text-gray-500 w-full text-right pr-2"
            >
              {value}
            </div>
          ))}
      </div>

      {/* Chart area */}
      <div
        className="absolute inset-0
          h-[calc(100%-var(--marginTop)-var(--marginBottom))]
          w-[calc(100%-var(--marginLeft)-var(--marginRight))]
          translate-x-[var(--marginLeft)]
          translate-y-[var(--marginTop)]
          overflow-visible"
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

          {/* Line path */}
          <path
            d={dPath}
            fill="none"
            className={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Circles */}
          {parsedData.map((point, index) => (
            <path
              key={index}
              d={`M ${xScale(point.date)} ${yScale(point.value)} l 0.0001 0`}
              vectorEffect="non-scaling-stroke"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              stroke="currentColor"
              className={dotsColor}
            />
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="absolute bottom-0 left-0 w-full translate-y-2">
          {parsedData.map((point, i) => (
            <div
              key={i}
              className="absolute text-xs text-zinc-500 whitespace-nowrap"
              style={{
                left: `${xScale(point.date)}%`,
                transform: "translateX(-50%)",
              }}
            >
              {point.date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
