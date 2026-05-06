import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const TooltipContext = createContext();

export function useTooltipContext(componentName) {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error(`${componentName} must be used within <Tooltip>`);
  }
  return context;
}

export function Tooltip({ children }) {
  const [tooltip, setTooltip] = useState();

  return (
    <TooltipContext.Provider value={{ tooltip, setTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  { children },
  forwardedRef
) {
  const context = useTooltipContext("TooltipTrigger");
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        context.setTooltip(undefined);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [context]);

  return (
    <g
      ref={(node) => {
        triggerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") {
          context.setTooltip({ x: e.clientX, y: e.clientY });
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") {
          context.setTooltip(undefined);
        }
      }}
      onTouchStart={(e) => {
        context.setTooltip({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setTimeout(() => {
          context.setTooltip(undefined);
        }, 2000);
      }}
    >
      {children}
    </g>
  );
});

export const TooltipContent = React.forwardRef(function TooltipContent({ children }, ref) {
  const context = useTooltipContext("TooltipContent");
  const tooltipRef = useRef(null);

  const getTooltipPosition = () => {
    if (!tooltipRef.current || !context.tooltip) return {};
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const viewportWidth = window.innerWidth;
    const willOverflowRight = context.tooltip.x + tooltipWidth + 10 > viewportWidth;
    return {
      top: context.tooltip.y - 20,
      left: willOverflowRight
        ? context.tooltip.x - tooltipWidth - 10
        : context.tooltip.x + 10,
    };
  };

  if (!context.tooltip) return null;
  const isMobile = window.innerWidth < 768;

  return createPortal(
    isMobile ? (
      <div
        className="fixed h-fit z-60 w-fit rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3"
        style={{
          top: context.tooltip.y,
          left: context.tooltip.x + 20,
        }}
      >
        {children}
      </div>
    ) : (
      <div
        ref={tooltipRef}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-sm fixed z-50"
        style={getTooltipPosition()}
      >
        {children}
      </div>
    ),
    document.body
  );
});
