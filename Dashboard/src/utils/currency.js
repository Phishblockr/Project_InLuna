// Currency helpers for INR formatting + conversion.

export function formatInrFromPaise(amountInPaise) {
  if (amountInPaise == null || isNaN(amountInPaise)) return "0.00";
  return (amountInPaise / 100).toFixed(2);
}

export function rupeesToPaise(rupees) {
  if (rupees == null || rupees === "") return 0;
  return Math.round(Number(rupees) * 100);
}

export function validateRupeeInput(value) {
  if (value === "") return true;
  return /^\d+(?:\.\d{0,2})?$/.test(value);
}

// Unified currency formatter (paise -> localized currency). Prefer this moving forward.
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
  const intPaise = Math.trunc(raw);
  const rupees = intPaise / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
