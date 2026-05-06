import React from "react";
import { formatPaise } from "./formatters.js";

export default function SubscriptionActivationPanel({
  org,
  onActivate,
  activating,
}) {
  const price = org?.perMemberPriceInPaise;
  const seats = org?.seatMeter?.currentSeats ?? org?.usersCount;
  const currency = org?.currency || "INR";
  // Normalize price (could arrive as string on first load / legacy doc)
  const intPrice = price != null ? Number(price) : null;
  const validPrice = Number.isFinite(intPrice) ? intPrice : null;
  const base = validPrice != null && seats != null ? validPrice * seats : null;
  const disabled = validPrice == null || activating;
  return (
    <div className="p-5 border rounded-lg border-dashed border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-sm space-y-3">
      <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
        Activate Subscription
      </h3>
      <ul className="text-xs space-y-1 text-emerald-800 dark:text-emerald-200">
        <li>
          Price per seat:{" "}
          {validPrice != null ? formatPaise(validPrice, currency) : "—"}
        </li>
        <li>Current seats: {seats != null ? seats : "—"}</li>
        <li>
          Projected base monthly:{" "}
          {base != null ? formatPaise(base, currency) : "—"}
        </li>
      </ul>
      {validPrice == null && (
        <div className="text-[11px] text-amber-700 dark:text-amber-400">
          Per-seat pricing not configured. Contact superadmin.
        </div>
      )}
      <button
        onClick={onActivate}
        disabled={disabled}
        aria-disabled={disabled}
        className="px-4 py-2 rounded bg-emerald-600 text-white text-xs font-medium disabled:opacity-50"
      >
        {activating ? "Activating…" : "Activate Subscription"}
      </button>
    </div>
  );
}
