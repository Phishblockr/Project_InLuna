import React from "react";
import { formatPaise, formatDateUTC } from "./formatters.js";

export function UsageSummaryCard({ org, preview, liveSub }) {
  if (!org) return null;
  const currency = org.currency || "INR";
  const currentSeats = org.seatMeter?.currentSeats ?? org.usersCount;
  const basePricePaise =
    org.perMemberPriceInPaise && currentSeats
      ? org.perMemberPriceInPaise * currentSeats
      : null;
  const usagePaise = preview?.amountPaise ?? null;
  const projectedTotal = (basePricePaise ?? 0) + (usagePaise ?? 0);

  // Prefer live subscription status current period if available
  const cycleStartRaw = liveSub?.displayPeriodStartMinusOneMonth;
  const cycleEndRaw = liveSub?.displayPeriodEndInclusiveMinusOneMonth;

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0F172A] text-sm space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          Current Cycle
        </h3>
        <p className="text-xs text-gray-500">
          {formatDateUTC(cycleStartRaw)} → {formatDateUTC(cycleEndRaw)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Seats
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {currentSeats ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Seat-Days
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {preview?.seatDays != null ? preview.seatDays.toFixed(2) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Variable usage (seat-time)
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {formatPaise(usagePaise, currency)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Base seat charge
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {formatPaise(basePricePaise, currency)}
          </p>
        </div>
        <div className="col-span-2 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Total projected (before taxes)
          </p>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {formatPaise(projectedTotal, currency)}
          </p>
        </div>
      </div>
      {org.perMemberPriceInPaise == null && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Pricing not configured. Contact support.
        </div>
      )}
    </div>
  );
}
export default UsageSummaryCard;
