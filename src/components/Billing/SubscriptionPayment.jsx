import React, { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../utils/AuthProvider.jsx";
import { billingClient } from "../../api/billingClient.js";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";

// Launch Razorpay Checkout for subscription with UPI disabled
export default function SubscriptionPayment({ orgId, userEmail, userContact }) {
  const { getToken } = useAuth();
  const token = getToken();
  const { ready, openCheckout } = useRazorpayCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const keyId = useMemo(() => import.meta.env.VITE_RZP_KEY_ID, []);

  const handleActivate = useCallback(async () => {
    if (!token || !orgId || loading) return;
    setLoading(true);
    setError("");
    try {
      // Create or reactivate subscription server-side
      await billingClient.subscribe(token, { orgId });
      // Fetch latest status to get subscriptionId
      const status = await billingClient.subscriptionStatus(token, orgId);
      const subscriptionId = status.subscriptionId || status.subscription?.id;
      if (!subscriptionId) throw new Error("Missing subscription id");
      if (!keyId) throw new Error("Missing Razorpay Key ID (VITE_RZP_KEY_ID)");
      if (!ready) throw new Error("Razorpay not ready");

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "InLuna",
        description: "Seat-based Subscription",
        prefill: {
          email: userEmail,
          contact: userContact,
        },
        method: {
          netbanking: true,
          card: true,
          upi: false, // disable UPI
          wallet: false,
        },
        theme: { color: "#0364bd" },
      };
      openCheckout(options);
    } catch (e) {
      setError(e.message || "Failed to activate");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    orgId,
    loading,
    keyId,
    ready,
    openCheckout,
    userEmail,
    userContact,
  ]);

  return (
    <div className="flex items-center justify-center text-xs">
      {error && (
        <div className="mb-2 text-red-600 dark:text-red-400">{error}</div>
      )}
      <button
        onClick={handleActivate}
        disabled={loading || !ready}
        className="w-full px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50"
      >
        {loading ? "Processing…" : "Add Payment Method"}
      </button>
      {!ready && (
        <div className="mt-2 text-[11px] text-gray-500">
          Loading payment widget…
        </div>
      )}
    </div>
  );
}
