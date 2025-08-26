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

const TransactionSettings = () => {
  const [dataLoading, setDataLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const token = getToken();

  const { data, loading, error } = useSelector(
    (state) => state.transactionSettings
  );

  // === Billing (Razorpay) state ===
  const { ready: rzpReady, openCheckout } = useRazorpayCheckout();
  const [perMemberPriceInPaise, setPerMemberPriceInPaise] = useState(null);
  const [perMemberPriceInRupees, setPerMemberPriceInRupees] = useState("");
  const [usersCount, setUsersCount] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [lastPayment, setLastPayment] = useState(null);
  const [prefetched, setPrefetched] = useState(false);

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
        setPerMemberPriceInPaise(order.perMemberPriceInPaise);
        setPerMemberPriceInRupees((order.perMemberPriceInPaise / 100).toFixed(2));
        setPrefetched(true);
      } catch (e) {
        if (!cancelled) setBillingError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const initiatePayment = useCallback(async () => {
    if (!token || creatingOrder || verifying) return;
    setBillingError("");
    setCreatingOrder(true);
    try {
      const order = await createOrder(token);
      setUsersCount(order.usersCount);
      setPerMemberPriceInPaise(order.perMemberPriceInPaise);
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

  const totalPaise = usersCount != null && perMemberPriceInPaise != null
    ? usersCount * perMemberPriceInPaise
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

  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
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
            <div className="p-5 flex flex-col">
              <span className="mb-2">Billing Details</span>
              {data.subscriptionDetails.last4 ? (
                <div className="flex flex-row items-center gap-2 mb-5">
                  {cardLogo}
                  <span className="flex flex-row items-center gap-2">
                    <span>•••• •••• ••••</span>
                    <span className="text-3xl">
                      {data.subscriptionDetails.last4}
                    </span>
                  </span>
                </div>
              ) : (
                <div>
                  <span className="mb-2">
                    Set up payment method before the trial / due date ends to
                    ensure you get seamless service.
                  </span>
                </div>
              )}
              {data.subscriptionDetails.status === "CANCELLED" ? (
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
                    {data.subscriptionDetails.status === "TRIAL"
                      ? "Your trial ends on: "
                      : "Your next billing date is: "}
                    <span className="text-2xl">
                      {data.subscriptionDetails.nextBillingDate}
                    </span>
                  </span>
                  <span>
                    {data.subscriptionDetails.status === "TRIAL" ? (
                      "Your billable amount will be calculated after the trial ends."
                    ) : (
                      <span>
                        Total amount due: {currencySymbol}{" "}
                        <span className="text-2xl">
                          {data.subscriptionDetails.amount}
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
              {data.subscriptionDetails.status !== "CANCELLED" && (
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
                <span className="text-3xl">{data.users.current}</span>
                <span>Current Users</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">{data.users.recentlyAdded}</span>
                <span>Recently Onboarded</span>
              </div>
            </div>
          </div>
          {/* Per-Member Billing Section (integrated) */}
          <div className="bg-gray-100 rounded-xl p-5 flex flex-col dark:bg-[#001c40]">
            <div className="flex flex-row items-center justify-between mb-2">
              <span className="font-medium">Per-Member Billing</span>
              {!rzpReady && <span className="text-[10px] text-gray-500">Loading payment lib…</span>}
            </div>
            {billingError && (
              <div className="mb-3 p-2 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
                {billingError}
              </div>
            )}
            <div className="text-sm flex flex-col gap-1 mb-3">
              <span>Per-Member Price: {perMemberPriceInRupees ? `₹${perMemberPriceInRupees}` : "—"}</span>
              <span>Users Count (for billing): {usersCount != null ? usersCount : "—"}</span>
              <span>Total: {totalPaise != null ? `₹${formatInrFromPaise(totalPaise)}` : "—"}</span>
            </div>
            <PayNowButton
              disabled={!rzpReady || !usersCount || !perMemberPriceInPaise}
              onClick={initiatePayment}
              totalPaise={totalPaise}
              usersCount={usersCount}
              perMemberPriceInPaise={perMemberPriceInPaise}
              loading={creatingOrder || verifying}
            />
            {(creatingOrder || verifying) && <div className="spinner mt-4" aria-label="Loading" />}
            <PaymentSummary result={lastPayment} />
            <p className="mt-4 text-[10px] text-gray-400">Prefetched order: {prefetched ? "yes" : "no"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSettings;
