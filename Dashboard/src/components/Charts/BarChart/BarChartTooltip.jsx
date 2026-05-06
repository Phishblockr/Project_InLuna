// BarChartTooltip.jsx
"use client";
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";

const TooltipContext = createContext();

export function BarChartTooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState();

  return (
    <TooltipContext.Provider value={{ tooltip, setTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children }) {
  const { setTooltip } = useContext(TooltipContext);
  const triggerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setTooltip(undefined);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [setTooltip]);

  return (
    <div
      ref={triggerRef}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") {
          setTooltip({ x: e.clientX, y: e.clientY });
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") {
          setTooltip(undefined);
        }
      }}
      onTouchStart={(e) => {
        setTooltip({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setTimeout(() => setTooltip(undefined), 2000);
      }}
    >
      {children}
    </div>
  );
}

export function TooltipContent({ children }) {
  const { tooltip } = useContext(TooltipContext);
  const tooltipRef = useRef();

  if (!tooltip || typeof window === "undefined") return null;

  const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
  const willOverflow = tooltip.x + tooltipWidth + 10 > window.innerWidth;

  const style = {
    top: tooltip.y - 20,
    left: willOverflow ? tooltip.x - tooltipWidth - 10 : tooltip.x + 10,
  };

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 rounded-lg px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
      style={style}
    >
      {children}
    </div>,
    document.body
  );
}
