/**
 * BillingPage.jsx
 * Simple Razorpay per-member billing flow UI.
 * Usage: Navigate to /billing while authenticated. Adjust per-member price, then Pay.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthProvider.jsx';
import { createOrder, verifyPayment } from '../api/razorpayClient.js';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout.js';
import PayNowButton from '../components/PayNowButton.jsx';
import PaymentSummary from '../components/PaymentSummary.jsx';
import { formatInrFromPaise } from '../utils/currency.js';

export default function BillingPage() {
  const { getToken } = useAuth();
  const token = getToken();
  const { ready, openCheckout } = useRazorpayCheckout();

  const [perMemberPriceInRupees, setPerMemberPriceInRupees] = useState('');
  const [usersCount, setUsersCount] = useState(null);
  const [perMemberPriceInPaise, setPerMemberPriceInPaise] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Admin price update removed; page is read-only client-side.
  const [error, setError] = useState('');
  const [lastPayment, setLastPayment] = useState(null); // {amountInPaise, usersCount, perMemberPriceInPaise, paymentId, orderId}
  const [prefetched, setPrefetched] = useState(false);

  // Prefetch order data on mount to show current server values (creates an order; backend should discard unpaid or accept idempotent behavior)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const data = await createOrder(token);
        if (cancelled) return;
        setUsersCount(data.usersCount);
        setPerMemberPriceInPaise(data.perMemberPriceInPaise);
        setPerMemberPriceInRupees((data.perMemberPriceInPaise / 100).toFixed(2));
        setPrefetched(true);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // handleUpdatePrice removed with form.

  const initiatePayment = useCallback(async () => {
    if (!token || creatingOrder || verifying) return;
    setError('');
    setCreatingOrder(true);
    try {
      const order = await createOrder(token);
      setUsersCount(order.usersCount);
      setPerMemberPriceInPaise(order.perMemberPriceInPaise);
      setPerMemberPriceInRupees((order.perMemberPriceInPaise/100).toFixed(2));

      openCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount, // in paise
        currency: order.currency,
        name: 'InLuna',
        description: 'Member Billing',
        handler: async (resp) => {
          // Verification
          setVerifying(true); setError('');
          try {
            const v = await verifyPayment(token, {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setLastPayment({
              amountInPaise: order.amount,
              usersCount: order.usersCount,
              perMemberPriceInPaise: order.perMemberPriceInPaise,
              paymentId: resp.razorpay_payment_id,
              orderId: resp.razorpay_order_id,
            });
          } catch (e) {
            setError(e.message || 'Payment verification failed');
          } finally {
            setVerifying(false);
          }
        },
        prefill: {},
        theme: { color: '#0364bd' },
        modal: { ondismiss: () => { /* Optionally set state */ } }
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingOrder(false);
    }
  }, [token, creatingOrder, verifying, openCheckout]);

  const totalPaise = usersCount != null && perMemberPriceInPaise != null
    ? usersCount * perMemberPriceInPaise
    : null;

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Per-Member Billing</h1>
        {!ready && (
          <p className="text-xs text-gray-500 mb-4">Loading payment library…</p>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="text-sm space-y-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Current Pricing</h2>
            <p className="text-gray-600 dark:text-gray-300">Per-Member Price: {perMemberPriceInRupees ? '₹' + perMemberPriceInRupees : '—'}</p>
            <p className="text-[11px] text-gray-500">(Editable pricing now managed in Admin Dashboard)</p>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-gray-600 dark:text-gray-300">Users Count: {usersCount != null ? usersCount : '—'}</p>
            <p className="text-gray-600 dark:text-gray-300">Per-Member Price: {perMemberPriceInRupees ? '₹' + perMemberPriceInRupees : '—'}</p>
            <p className="text-gray-600 dark:text-gray-300">Computed Total: {totalPaise != null ? '₹' + formatInrFromPaise(totalPaise) : '—'}</p>
            <PayNowButton
              disabled={!ready || !usersCount || !perMemberPriceInPaise}
              onClick={initiatePayment}
              totalPaise={totalPaise}
              usersCount={usersCount}
              perMemberPriceInPaise={perMemberPriceInPaise}
              loading={creatingOrder || verifying}
            />
            {(creatingOrder || verifying) && <div className="spinner mt-4" aria-label="Loading" />}
          </div>
        </section>
        <PaymentSummary result={lastPayment} />
        <p className="mt-10 text-[10px] text-gray-400">Prefetched: {prefetched ? 'yes' : 'no'}</p>
      </div>
    </main>
  );
}
