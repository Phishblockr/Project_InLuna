import React, { useState } from "react";
import useBilling from "../hooks/useBilling.js";
import BillingStatusBadge from "../components/Billing/BillingStatusBadge.jsx";
import UsageSummaryCard from "../components/Billing/UsageSummaryCard.jsx";
import ActionsPanel from "../components/Billing/ActionsPanel.jsx";
import CloseCycleModal from "../components/Billing/CloseCycleModal.jsx";
import SubscriptionActivationPanel from "../components/Billing/SubscriptionActivationPanel.jsx";
import SubscriptionStatusPanel from "../components/Billing/SubscriptionStatusPanel.jsx";
import { formatPaise } from "../components/Billing/formatters.js";
import SubscriptionPayment from "../components/Billing/SubscriptionPayment.jsx";

export default function OrgBilling() {
  const {
    org,
    preview,
    loading,
    error,
    refreshPreview,
    closeCycle,
    syncQuantity,
    subscribe,
    closing,
    syncing,
    subscribing,
    lastCloseResult,
    liveSubStatus,
    pollingSubStatus,
  } = useBilling();
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Prefer live subscription status (polling) over static org billingStatus
  const status = liveSubStatus?.status || org?.billingStatus;
  const noSubscription = !org?.subscriptionId || status === "canceled";
  const disableSync = noSubscription; // can't sync without active subscription

  const handleClose = async () => {
    try {
      await closeCycle();
      setShowCloseModal(true);
    } catch {
      /* handled */
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billing & Seats
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor usage and manage operational billing actions.
          </p>
        </div>
        {status && <BillingStatusBadge status={status} />}
      </header>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-xs text-gray-500">Loading billing data…</div>
      )}

      {noSubscription && (
        <SubscriptionActivationPanel
          org={org}
          onActivate={subscribe}
          activating={subscribing}
        />
      )}
      {/* If backend indicates it canActivate, surface Razorpay checkout with UPI disabled */}
      {org?.orgId &&
        (org?.canActivate ||
          (org?.billingStatus !== "active" &&
            liveSubStatus?.status !== "active" &&
            org?.perMemberPriceInPaise)) && (
          <SubscriptionPayment
            orgId={org.orgId}
            userEmail={undefined}
            userContact={undefined}
          />
        )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <UsageSummaryCard
            org={org}
            preview={preview}
            liveSub={liveSubStatus}
          />
        </div>
        <div className="space-y-6">
          <SubscriptionStatusPanel
            org={org}
            live={liveSubStatus}
            polling={pollingSubStatus}
          />
          <ActionsPanel
            status={status}
            onRefresh={refreshPreview}
            onSync={syncQuantity}
            syncing={syncing}
            onCloseCycle={handleClose}
            closing={closing}
            onOpenSubscribe={undefined}
            disableClose={status === "past_due" || noSubscription}
            disableAll={loading}
            disableSync={disableSync}
          />
          {org?.perMemberPriceInPaise == null && (
            <div className="p-3 text-[11px] bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded text-amber-700 dark:text-amber-300">
              Per-member pricing not configured. Contact support / superadmin.
            </div>
          )}
        </div>
      </div>

      <CloseCycleModal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        result={lastCloseResult}
        org={org}
      />
    </main>
  );
}
