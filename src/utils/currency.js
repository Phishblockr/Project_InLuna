// Currency helpers for INR formatting + conversion.

export function formatInrFromPaise(amountInPaise) {
  if (amountInPaise == null || isNaN(amountInPaise)) return '0.00';
  return (amountInPaise / 100).toFixed(2);
}

export function rupeesToPaise(rupees) {
  if (rupees == null || rupees === '') return 0;
  return Math.round(Number(rupees) * 100);
}

export function validateRupeeInput(value) {
  if (value === '') return true;
  return /^\d+(?:\.\d{0,2})?$/.test(value);
}
