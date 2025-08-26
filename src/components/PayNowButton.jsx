import React from 'react';
import { formatInrFromPaise } from '../utils/currency.js';

export default function PayNowButton({ disabled, onClick, totalPaise, usersCount, perMemberPriceInPaise, loading }) {
  return (
    <div className="space-y-2 mt-4">
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {usersCount != null && perMemberPriceInPaise != null && (
          <p>
            Total: ₹{formatInrFromPaise(totalPaise)} ({usersCount} × ₹{formatInrFromPaise(perMemberPriceInPaise)})
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </div>
  );
}
