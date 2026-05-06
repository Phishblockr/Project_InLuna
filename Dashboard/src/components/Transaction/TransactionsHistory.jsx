import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/AuthProvider";
import { useEffect, useState } from "react";
import { fetchTransactionHistory } from "../../features/TransactionHistory/transactionHistorySlice";
import useBilling from "../../hooks/useBilling";
import { billingClient } from "../../api/billingClient";
import LoadingOverlay from "../../utils/LoadingOverlay";
import { FaRegCreditCard } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { RiEyeLine } from "react-icons/ri";

const TransactionsHistory = () => {
  const [dataLoading, setDataLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  // TODO: For Pagination and Data Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const token = getToken();

  const { data, loading, error } = useSelector(
    (state) => state.transactionHistory
  );
  const { org, liveSubStatus } = useBilling();
  const orgId = org?.orgId;
  const [invoices, setInvoices] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState("");

  useEffect(() => {
    setDataLoading(true);
    let loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 500);
    dispatch(fetchTransactionHistory({ token }))
      .unwrap()
      .finally(() => {
        clearTimeout(loadingTimer);
        setShowLoading(false);
        setDataLoading(false);
      });
  }, [dispatch]);

  // Fetch payment history invoices when orgId available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !orgId) return;
      setInvLoading(true);
      setInvError("");
      try {
        const res = await billingClient.paymentHistory(token, orgId, 20);
        if (cancelled) return;
        const rows = Array.isArray(res.invoices) ? res.invoices.slice() : [];
        rows.sort(
          (a, b) =>
            new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
        );
        setInvoices(rows);
      } catch (e) {
        if (!cancelled) setInvError(e.message || "Failed to load invoices");
      } finally {
        if (!cancelled) setInvLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, orgId]);

  if (!data) {
    return <LoadingOverlay loading={true} />;
  }

  const currencySymbols = {
    INR: "₹",
  };

  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      <div className="z-1 relative w-full bg-white rounded-xl shadow-xl p-6 h-full dark:bg-[#002451] dark:text-white">
        <div className="mb-10">
          <h1 className="text-2xl font-medium dark:text-[#F4F4F4]">
            Transaction History
          </h1>

          <div className="mt-12">
            {invError && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                {invError}
              </div>
            )}
            {invLoading && (
              <div className="text-xs text-gray-500">Loading invoices…</div>
            )}
            {!invLoading && invoices.length === 0 && !invError && (
              <div className="text-xs text-gray-500">No invoices yet.</div>
            )}
            <div className="flex flex-col gap-4">
              {invoices.map((inv) => {
                const currency = inv.currency || "INR";
                const amount = (inv.amountPaise / 100).toFixed(2);
                const paid = (inv.amountPaidPaise / 100).toFixed(2);
                const due = (inv.amountDuePaise / 100).toFixed(2);
                const issued = inv.issuedAt
                  ? new Date(inv.issuedAt).toLocaleDateString()
                  : "—";
                const periodStart = inv.periodStart
                  ? new Date(inv.periodStart).toLocaleDateString()
                  : "?";
                const periodEnd = inv.periodEnd
                  ? new Date(inv.periodEnd).toLocaleDateString()
                  : "?";
                const status = (inv.status || "").replace("_", " ");
                const statusColor =
                  inv.status === "paid"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : inv.status === "partially_paid" ||
                      inv.status === "pending"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : inv.status === "issued"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col w-full p-5 bg-gray-100 dark:bg-gray-900/40 rounded-lg gap-3"
                  >
                    <div className="flex flex-row w-full items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {issued}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Period: {periodStart} → {periodEnd}
                        </span>
                      </div>
                      <div className="flex flex-row gap-1 items-baseline font-semibold text-gray-900 dark:text-gray-100">
                        <span>{currency}</span>
                        <span className="text-lg">{paid}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded ${statusColor} text-[10px] font-medium capitalize`}
                        >
                          {status || "?"}
                        </span>
                      </div>

                      {inv.receipt && (
                        <div className="flex items-center gap-1 font-mono">
                          <span className="uppercase tracking-wide text-gray-500">
                            Receipt
                          </span>
                          <span>{inv.receipt}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {inv.description || "Invoice"}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {inv.shortUrl && (
                          <a
                            href={inv.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-indigo-600 dark:text-indigo-400"
                          >
                            View Invoice
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsHistory;
