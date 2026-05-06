// INR currency helper utilities.
// Provides safe conversion and validation utilities for rupee/paise handling on the client side.
// All functions are pure and side‑effect free.

/**
 * Format an amount expressed in paise (integer) into a fixed 2-decimal rupees string.
 * Falls back to '0.00' for null/undefined/NaN.
 * @param {number|null|undefined} amountInPaise
 * @returns {string} Rupee amount with 2 decimals (no currency symbol)
 */
export function formatInrFromPaise(amountInPaise) {
  if (amountInPaise == null || isNaN(amountInPaise)) return '0.00';
  return (amountInPaise / 100).toFixed(2);
}

/**
 * Convert a rupee value (number or numeric string) to paise (integer, rounded).
 * Empty string / null => 0.
 * @param {number|string|null|undefined} rupees
 * @returns {number} Integer paise
 */
export function rupeesToPaise(rupees) {
  if (rupees == null || rupees === '') return 0;
  const n = Number(rupees);
  if (isNaN(n)) return 0; // Defensive fallback
  return Math.round(n * 100);
}

/**
 * Validate incremental rupee input (allowing up to two decimal places, numeric only).
 * Empty string is treated as valid to allow clearing an input field.
 * @param {string} value
 * @returns {boolean}
 */
export function validateRupeeInput(value) {
  if (value === '') return true;
  return /^\d+(?:\.\d{0,2})?$/.test(value);
}

// Optional grouped export for convenience.
export default {
  formatInrFromPaise,
  rupeesToPaise,
  validateRupeeInput,
};
