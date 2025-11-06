import { useCallback, useEffect, useState } from "react";
import { RiArrowRightSLine, RiMastercardFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/AuthProvider";
import { fetchTransactionDetails } from "../../features/TransactionSettigns/transactionSettingsSlice";
import LoadingOverlay from "../../utils/LoadingOverlay";

import { RiVisaLine } from "react-icons/ri";
import { GrAmex } from "react-icons/gr";
import { FaRegCreditCard } from "react-icons/fa";
import { Link } from "react-router-dom";
// Razorpay per-member billing imports
import { createOrder, verifyPayment } from "../../api/razorpayClient";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import PayNowButton from "../PayNowButton";
import PaymentSummary from "../PaymentSummary";
import { formatInrFromPaise } from "../../utils/currency";
// Lightweight access to unified billing data (org, subscription status)
import useBilling from "../../hooks/useBilling";
import { formatPaise } from "../Billing/formatters";
import BillingStatusBadge from "../Billing/BillingStatusBadge.jsx";
import SubscriptionPayment from "../Billing/SubscriptionPayment.jsx";

// Lightweight toast component (scoped to this page)
function Toast({ notice, onClose }) {
  if (!notice) return null;
  const { message, type = "info" } = notice;
  const cls =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-gray-800";
  return (
    <div
      className={`${cls} fixed bottom-4 right-4 text-white px-3 py-2 rounded shadow text-xs flex items-start gap-3 z-50`}
    >
      <span className="leading-snug whitespace-pre-line max-w-xs">
        {message}
      </span>
      <button
        onClick={onClose}
        className="opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

const TransactionSettings = () => {
  const [dataLoading, setDataLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const token = getToken();

  const { data, loading, error } = useSelector(
    (state) => state.transactionSettings
  );

  // New unified billing subscription context (SWR based)
  const {
    org,
    liveSubStatus,
    subscribing,
    subscribe,
    pollingSubStatus,
    preview,
  } = useBilling();
  const [toast, setToast] = useState(null);

  // === Billing (Razorpay) state ===
  const { ready: rzpReady, openCheckout } = useRazorpayCheckout();
  const [seatPricePaiseState, setSeatPricePaiseState] = useState(null);
  const [perMemberPriceInRupees, setPerMemberPriceInRupees] = useState("");
  const [usersCount, setUsersCount] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [lastPayment, setLastPayment] = useState(null);
  const [prefetched, setPrefetched] = useState(false);

  const status = liveSubStatus?.status || org?.billingStatus;
  const noSubscription = !org?.subscriptionId || status === "canceled";
  const disableSync = noSubscription; // can't sync without active subscription

  useEffect(() => {
    setDataLoading(true);
    let loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 500);
    dispatch(fetchTransactionDetails({ token }))
      .unwrap()
      .finally(() => {
        clearTimeout(loadingTimer);
        setShowLoading(false);
        setDataLoading(false);
      });
  }, [dispatch]);

  // Prefetch order to show pricing (server should no-op unpaid orders or treat as preview)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const order = await createOrder(token);
        if (cancelled) return;
        setUsersCount(order.usersCount);
        setSeatPricePaiseState(order.perMemberPriceInPaise);
        setPerMemberPriceInRupees(
          (order.perMemberPriceInPaise / 100).toFixed(2)
        );
        setPrefetched(true);
      } catch (e) {
        if (!cancelled) setBillingError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const initiatePayment = useCallback(async () => {
    if (!token || creatingOrder || verifying) return;
    setBillingError("");
    setCreatingOrder(true);
    try {
      const order = await createOrder(token);
      setUsersCount(order.usersCount);
      setSeatPricePaiseState(order.perMemberPriceInPaise);
      setPerMemberPriceInRupees((order.perMemberPriceInPaise / 100).toFixed(2));
      openCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "InLuna",
        description: "Member Billing",
        handler: async (resp) => {
          setVerifying(true);
          try {
            await verifyPayment(token, {
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
            setBillingError(e.message || "Payment verification failed");
          } finally {
            setVerifying(false);
          }
        },
        theme: { color: "#0364bd" },
      });
    } catch (e) {
      setBillingError(e.message);
    } finally {
      setCreatingOrder(false);
    }
  }, [token, creatingOrder, verifying, openCheckout]);

  const totalPaise =
    usersCount != null && seatPricePaiseState != null
      ? usersCount * seatPricePaiseState
      : null;

  if (!data.organization) {
    return <LoadingOverlay loading={true} />;
  }

  const cardTypeLogos = {
    visa: <RiVisaLine className="text-3xl" />,
    mastercard: <RiMastercardFill className="text-3xl" />,
    amex: <GrAmex className="text-3xl" />,
    default: <FaRegCreditCard className="text-2xl" />,
  };

  const cardType = data.subscriptionDetails?.cardType?.toLowerCase();
  const cardLogo = cardTypeLogos[cardType] || (
    <FaRegCreditCard className="text-2xl" />
  );

  console.log(cardLogo);

  const currencySymbols = {
    INR: "₹",
  };

  const currency = data.subscriptionDetails?.currency || "INR";
  const currencySymbol = currencySymbols[currency] || currency;

  // Derive unified subscription metrics (prefer liveSubStatus when present)
  const sub = liveSubStatus || {};
  const subscriptionId = org?.subscriptionId || sub.subscriptionId;
  const billingStatus = sub.status || org?.billingStatus;
  const perMemberPriceInPaise =
    org?.perMemberPriceInPaise != null
      ? Number(org.perMemberPriceInPaise)
      : sub.perMemberPriceInPaise ?? seatPricePaiseState;
  const currentSeats =
    org?.seatMeter?.currentSeats ||
    org?.currentSeats ||
    sub.quantity ||
    data?.users?.current;
  const baseMonthlyPaise =
    perMemberPriceInPaise != null && currentSeats != null
      ? perMemberPriceInPaise * currentSeats
      : null;
  const periodStart = sub.displayPeriodStartMinusOneMonth;
  const periodEnd = sub.displayPeriodEndInclusiveMinusOneMonth;
  const nextDue = sub.displayPeriodEndInclusiveMinusOneMonth || periodEnd;
  const manageLink = sub.link || sub.shortUrl || sub.short_url;
  // Days remaining (inclusive end boundary treated as end of previous day; simple diff)
  let daysRemaining = null;
  if (periodEnd) {
    const endMs = new Date(periodEnd).getTime();
    const nowMs = Date.now();
    const diff = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(diff)) daysRemaining = diff;
  }

  const handleActivate = async () => {
    try {
      await subscribe();
      setToast({
        message:
          "Subscription activation started. Complete payment if required.",
        type: "success",
      });
    } catch (e) {
      setToast({ message: e.message || "Activation failed", type: "error" });
    }
  };

  return (
    <div className="z-1 flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      <div className="z-1 relative w-full bg-white rounded-xl shadow-xl p-6 h-full dark:bg-[#002451] dark:text-white">
        <div className="mb-10">
          <h1 className="text-2xl font-medium dark:text-[#F4F4F4]">
            Transaction Settings
          </h1>
          <span className="font-normal text-gray-500 dark:text-gray-400">
            Manage and view your transactions
          </span>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-gray-100 rounded-xl dark:bg-[#001c40]">
            <div className="p-5 flex flex-col">
              <span className="mb-2">Account Details</span>
              <span className="text-3xl mb-1">{data.organization.name}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {data.organization.adminEmailIds[0]}
              </span>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl dark:bg-[#001c40]">
            <div className="p-5 flex flex-col gap-3">
              <span className="mb-1">Subscription Details</span>
              {!subscriptionId && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  No active subscription. {subscribing ? "Activating…" : ""}
                </div>
              )}
              {subscriptionId && (
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      ID
                    </p>
                    <p className="font-mono text-xs break-all">
                      {subscriptionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      <BillingStatusBadge status={billingStatus} />
                      {pollingSubStatus && billingStatus !== "active" && (
                        <span className="animate-pulse text-[10px] text-gray-500">
                          refreshing…
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Seats
                    </p>
                    <p>{currentSeats ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Price / Seat
                    </p>
                    <p>
                      {perMemberPriceInPaise != null
                        ? formatPaise(
                            perMemberPriceInPaise,
                            org?.currency || "INR"
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Base Monthly
                    </p>
                    <p>
                      {baseMonthlyPaise != null
                        ? formatPaise(baseMonthlyPaise, org?.currency || "INR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Period
                    </p>
                    <p>
                      {(periodStart &&
                        new Date(periodStart).toLocaleDateString()) ||
                        "?"}{" "}
                      →{" "}
                      {(periodEnd &&
                        new Date(periodEnd).toLocaleDateString()) ||
                        "?"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Time Left
                    </p>
                    <p>
                      {daysRemaining != null
                        ? daysRemaining > 0
                          ? `${daysRemaining} day${
                              daysRemaining === 1 ? "" : "s"
                            } left`
                          : daysRemaining === 0
                          ? "Ends today"
                          : "Ended"
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Next Due
                    </p>
                    <p>
                      {nextDue ? new Date(nextDue).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  {manageLink && (
                    <div className="md:col-span-2 flex flex-wrap gap-4 items-center text-xs">
                      <a
                        href={manageLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-indigo-600 dark:text-indigo-400"
                      >
                        Manage / Pay
                      </a>
                      <a
                        href="/transactionsHistory"
                        className="underline text-indigo-600 dark:text-indigo-400"
                      >
                        Invoice History
                      </a>
                    </div>
                  )}
                </div>
              )}
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
              {!subscriptionId && org?.perMemberPriceInPaise != null && (
                <button
                  onClick={handleActivate}
                  disabled={subscribing}
                  className="mt-3 self-start px-3 py-1.5 rounded bg-emerald-600 text-white text-xs disabled:opacity-50"
                >
                  {subscribing ? "Activating…" : "Activate Subscription"}
                </button>
              )}
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl dark:bg-[#001c40]">
            <div className="p-5 flex flex-col">
              <span className="mb-2">Billing Details</span>
              <div className="flex flex-row items-center gap-2 mb-5">
                {cardLogo}
                <span className="flex flex-row items-center gap-2">
                  <span>•••• •••• ••••</span>
                  <span className="text-3xl">
                    {data?.subscriptionDetails?.last4 ?? "NA"}
                  </span>
                </span>
              </div>
              {data?.subscriptionDetails?.status === "CANCELLED" ? (
                <>
                  <span className="mb-5 text-red-500">
                    Your subscription has been cancelled.
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    You will no longer be charged. To resume your subscription,
                    update your billing details.
                  </span>
                </>
              ) : (
                <>
                  <span className="mb-5">
                    {data?.subscriptionDetails?.status === "TRIAL"
                      ? "Your trial ends on: "
                      : "Your next billing date is: "}
                    <span className="text-2xl">
                      {data?.subscriptionDetails?.nextBillingDate ?? "NA"}
                    </span>
                  </span>
                  <span>
                    {data?.subscriptionDetails?.status === "TRIAL" ? (
                      "Your billable amount will be calculated after the trial ends."
                    ) : (
                      <span>
                        Total amount due: {currencySymbol}{" "}
                        <span className="text-2xl">
                          {data?.subscriptionDetails?.amount ?? "NA"}
                        </span>
                      </span>
                    )}
                  </span>
                </>
              )}
              <div className="border-t border-gray-300 my-5 dark:border-gray-800"></div>
              <Link
                className="p-1 w-full flex flex-row items-center justify-between"
                to={"/transactionsHistory"}
              >
                <span>Payment History</span>{" "}
                <RiArrowRightSLine className="text-2xl" />
              </Link>
              {data?.subscriptionDetails?.status !== "CANCELLED" && (
                <Link
                  className="mt-5 bg-white w-[200px] p-1 flex justify-center dark:bg-[#002451]"
                  to={"/cancelMembership"}
                >
                  Cancel Membership
                </Link>
              )}
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl p-5 flex flex-col dark:bg-[#001c40]">
            <span className="mb-2">Members</span>
            <div className="flex flex-row gap-5 justify-start items-center">
              <div className="flex flex-col items-center">
                <span className="text-3xl">{data?.users?.current ?? "—"}</span>
                <span>Current Users</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">
                  {data?.users?.recentlyAdded ?? "—"}
                </span>
                <span>Recently Onboarded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast notice={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default TransactionSettings;
