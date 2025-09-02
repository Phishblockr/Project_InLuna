import React from "react";
import { formatPaise } from "./formatters.js";

export default function SubscriptionStatusPanel({ org, live, polling }) {
  if (!org?.subscriptionId) return null;
  const status = live?.status || org?.billingStatus;
  const quantity = live?.quantity ?? org?.currentSeats;
  const start =
    live?.currentStartAt ||
    live?.periodStart ||
    live?.start_at ||
    live?.startAt;
  const end =
    live?.currentEndAt || live?.periodEnd || live?.end_at || live?.endAt;
  const link = live?.shortUrl || live?.short_url || live?.link;
  const currency = org?.currency || "INR";
  return (
    <div className="p-4 border rounded bg-white dark:bg-[#0F172A] text-xs space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
          Subscription
        </h3>
        <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
          {status}
          {polling && status !== "active" ? "…" : ""}
        </span>
      </div>
      <ul className="space-y-1">
        <li>
          ID: <span className="font-mono">{org.subscriptionId}</span>
        </li>
        <li>Seats (qty): {quantity ?? "—"}</li>
        <li>
          Price/seat:{" "}
          {org.perMemberPriceInPaise != null
            ? formatPaise(org.perMemberPriceInPaise, currency)
            : "—"}
        </li>
        <li>
          Period: {start ? new Date(start).toLocaleDateString() : "?"} →{" "}
          {end ? new Date(end).toLocaleDateString() : "?"}
        </li>
        {link && (
          <li>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline"
            >
              Manage / Pay
            </a>
          </li>
        )}
      </ul>
      {status !== "active" && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400">
          Waiting for payment completion… panel auto-refreshes.
        </div>
      )}
    </div>
  );
}
