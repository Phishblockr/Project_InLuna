import React from "react";
import { formatPaise, formatDateUTC } from "./formatters.js";

export function CloseCycleModal({ open, onClose, result, org }) {
  if (!open || !result) return null;
  const currency = org?.currency || "INR";
  const d = result.invoiceDraft || result;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Cycle Closed
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Usage added to upcoming invoice as add-on.
        </p>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-gray-500">Cycle:</span>{" "}
            {formatDateUTC(d.cycleStart)} → {formatDateUTC(d.cycleEnd)}
          </p>
          <p>
            <span className="text-gray-500">Seat-Days:</span> {d.seatDays}
          </p>
          <p>
            <span className="text-gray-500">Variable Usage:</span>{" "}
            {formatPaise(d.amountPaise, currency)}
          </p>
          <p>
            <span className="text-gray-500">Next Quantity:</span>{" "}
            {result.nextQuantity}
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded bg-indigo-600 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
export default CloseCycleModal;
