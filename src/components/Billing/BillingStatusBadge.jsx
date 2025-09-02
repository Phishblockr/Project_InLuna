import React from "react";

const COLORS = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  trialing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  past_due:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  canceled: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  inactive: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};

export function BillingStatusBadge({ status }) {
  if (!status) return null;
  const cls =
    COLORS[status] ||
    "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
export default BillingStatusBadge;
