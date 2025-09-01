export function cycleBounds(anchor, asOf = new Date()) {
  // Returns { start, end, days } for the current monthly cycle anchored to `anchor`
  const start = new Date(anchor);
  while (start <= asOf) {
    const next = new Date(start);
    next.setMonth(next.getMonth() + 1);
    if (asOf < next)
      return { start, end: next, days: daysBetween(start, next) };
    start.setMonth(start.getMonth() + 1);
  }
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
