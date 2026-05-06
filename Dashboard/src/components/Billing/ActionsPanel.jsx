import React, { useState } from "react";

export function ActionsPanel({
  status,
  onRefresh,
  onSync,
  syncing,
  onCloseCycle,
  closing,
  onOpenSubscribe,
  disableClose,
  disableAll,
  disableSync,
}) {
  const [scheduleCycleEnd, setScheduleCycleEnd] = useState(false);
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0F172A] space-y-3">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
        Actions
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRefresh}
          disabled={disableAll}
          className="px-3 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 disabled:opacity-50"
          aria-disabled={disableAll}
        >
          Refresh Preview
        </button>
        <button
          onClick={() => onSync(scheduleCycleEnd ? "cycle_end" : "now")}
          disabled={disableAll || syncing || disableSync}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          aria-disabled={disableAll || syncing || disableSync}
          title={disableSync ? "Subscription not active" : undefined}
        >
          {syncing ? "Syncing…" : "Sync Quantity"}
        </button>
        <button
          onClick={onCloseCycle}
          disabled={disableAll || closing || disableClose}
          className="px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          aria-disabled={disableAll || closing || disableClose}
        >
          {closing ? "Closing…" : "Close Billing Cycle"}
        </button>
        {!disableAll && onOpenSubscribe && (
          <button
            onClick={onOpenSubscribe}
            className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Subscribe
          </button>
        )}
      </div>
      <label className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={scheduleCycleEnd}
          onChange={(e) => setScheduleCycleEnd(e.target.checked)}
        />{" "}
        Schedule sync at cycle end
      </label>
      {status === "past_due" && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400">
          Account is past due. Resolve payment to close cycle.
        </div>
      )}
    </div>
  );
}
export default ActionsPanel;
