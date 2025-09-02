export function formatPaise(
  paise,
  currency = "INR",
  { dashForNull = true } = {}
) {
  if (paise == null || paise === "") {
    if (dashForNull) return "—";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(0);
  }
  const raw = Number(paise);
  if (!Number.isFinite(raw)) return "—";
  // Ensure integer paise then convert; truncate fractional paise if any legacy string like '10000.00'
  const intPaise = Math.trunc(raw);
  const rupees = intPaise / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
export function formatDateUTC(str) {
  if (!str) return "—";
  try {
    return new Date(str).toISOString().slice(0, 10);
  } catch {
    return str;
  }
}
