import { cycleBounds } from "./billingMath.js";

// Clamp a timestamp into the current billing cycle window for an org.
export function clampToCurrentCycle(org, date, asOf = new Date()) {
  const { start, end } = cycleBounds(
    org.billingCycleAnchor || org.createdAt,
    asOf
  );
  if (date < start) return new Date(start);
  if (date > end) return new Date(end);
  return date;
}

export default clampToCurrentCycle;
