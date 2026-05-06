import React, { useState } from "react";

export function SubscribeWizard({ open, onClose, onSubmit, submitting }) {
  const [planId, setPlanId] = useState("");
  const [seatCount, setSeatCount] = useState("");
  if (!open) return null;
  const disabled = !planId || submitting;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#0F172A] w-full max-w-sm rounded-md p-5 border border-gray-200 dark:border-gray-700 shadow-lg relative">
        <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Subscribe
        </h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-gray-500">Plan ID</span>
            <input
              className="mt-1 w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder="plan_..."
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">
              Initial Seat Count (optional)
            </span>
            <input
              type="number"
              className="mt-1 w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              placeholder="e.g. 25"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            disabled={disabled}
            aria-disabled={disabled}
            onClick={() =>
              onSubmit({
                planId,
                seatCount: seatCount ? Number(seatCount) : undefined,
              })
            }
            className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50"
          >
            {submitting ? "Subscribing…" : "Subscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default SubscribeWizard;
