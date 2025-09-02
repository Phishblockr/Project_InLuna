export function cycleBounds(anchor, asOf = new Date()) {
  // Returns { start, end, days } for the cycle that contains `asOf`,
  // or the first cycle starting at anchor if anchor is in the future.
  const anchorDate = new Date(anchor);
  if (isNaN(anchorDate)) throw new Error("Invalid anchor date");

  // If anchor is in the future relative to asOf, treat that future month as the cycle.
  if (anchorDate > asOf) {
    const futureEnd = new Date(anchorDate);
    futureEnd.setMonth(futureEnd.getMonth() + 1);
    return {
      start: anchorDate,
      end: futureEnd,
      days: daysBetween(anchorDate, futureEnd),
    };
  }

  // Iterate month by month from anchor until we bracket asOf.
  const iter = new Date(anchorDate);
  while (iter <= asOf) {
    const next = new Date(iter);
    next.setMonth(next.getMonth() + 1);
    if (asOf < next) {
      return {
        start: new Date(iter),
        end: next,
        days: daysBetween(iter, next),
      };
    }
    iter.setMonth(iter.getMonth() + 1);
  }

  // Fallback (should not happen) – return first cycle.
  const fallbackEnd = new Date(anchorDate);
  fallbackEnd.setMonth(fallbackEnd.getMonth() + 1);
  return {
    start: anchorDate,
    end: fallbackEnd,
    days: daysBetween(anchorDate, fallbackEnd),
  };
}

export function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function perDayPaise(
  perMemberPriceInPaise,
  cycleDays,
  rounding = "round"
) {
  const val = perMemberPriceInPaise / cycleDays;
  if (rounding === "floor") return Math.floor(val);
  if (rounding === "ceil") return Math.ceil(val);
  return Math.round(val);
}

export function amountForSeatMillis(
  perMemberPriceInPaise,
  seatMillis,
  cycleDays,
  rounding = "round"
) {
  const seatDays = seatMillis / (1000 * 60 * 60 * 24);
  const perDay = perDayPaise(perMemberPriceInPaise, cycleDays, rounding);
  return Math.round(seatDays * perDay); // integer paise
}
