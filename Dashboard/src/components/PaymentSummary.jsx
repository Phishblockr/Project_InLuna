import React from 'react';
import { formatInrFromPaise } from '../utils/currency.js';

export default function PaymentSummary({ result }) {
  if (!result) return null;
  const { amountInPaise, usersCount, perMemberPriceInPaise, paymentId, orderId } = result;
  return (
    <div className="mt-8 p-4 border rounded bg-green-50 border-green-300 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700">
      <h3 className="font-semibold mb-2">Last Payment</h3>
      <ul className="space-y-1">
        <li>Amount Paid: ₹{formatInrFromPaise(amountInPaise)}</li>
        <li>Members Billed: {usersCount}</li>
        <li>Per-Member: ₹{formatInrFromPaise(perMemberPriceInPaise)}</li>
        {paymentId && <li>Payment ID: <code>{paymentId}</code></li>}
        {orderId && <li>Order ID: <code>{orderId}</code></li>}
      </ul>
    </div>
  );
}
