import React, { useState } from "react";
import { useAuth } from "../../utils/AuthProvider";

// Helper to format date
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const Transaction = () => {
  const { getToken } = useAuth();
  const token = getToken();
  const [subscription, setSubscription] = useState("Trial");
  const [showTransactions, setShowTransactions] = useState(false);

  // Demo transactions
  const demoTransactions = [
    {
      id: "1",
      orderId: "ORD123456",
      transactionId: "TXN789012",
      created_at: "2025-04-29T16:29:15.459+00:00",
      subscription_end: "2025-07-29T16:29:15.459+00:00",
      paidBy: "demo",
      amount: "₹499",
      plan: "Pro Plan",
      status: "Success",
      paymentMode: "Credit Card",
    },
    {
      id: "2",
      orderId: "ORD654321",
      transactionId: "TXN210987",
      created_at: "2025-03-15T10:10:10.000+00:00",
      subscription_end: "2025-06-15T10:10:10.000+00:00",
      paidBy: "test",
      amount: "₹499",
      plan: "Pro Plan",
      status: "Failed",
      paymentMode: "UPI",
    },
    {
      id: "3",
      orderId: "ORD987654",
      transactionId: "TXN345678",
      created_at: "2025-02-01T08:00:00.000+00:00",
      subscription_end: "2025-05-01T08:00:00.000+00:00",
      paidBy: "demo",
      amount: "₹499",
      plan: "Pro Plan",
      status: "Success",
      paymentMode: "Net Banking",
    },
    {
      id: "4",
      orderId: "ORD123456",
      transactionId: "TXN789012",
      created_at: "2025-04-29T16:29:15.459+00:00",
      subscription_end: "2025-07-29T16:29:15.459+00:00",
      paidBy: "demo",
      amount: "₹499",
      plan: "Pro Plan",
      status: "Success",
      paymentMode: "Credit Card",
    },
  ];

  const goToPaymentPage = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const res = await fetch(`${apiUrl}/ccavenue/encryptPayload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div className="w-full">
      <div className="p-2 bg-gray-100 rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4] flex flex-col gap-y-2">
        <span className="text-xl font-medium">Subscription Details</span>
        <div className="flex flex-col items-center gap-y-2 py-4 bg-gradient-to-br from-[#0767BF] to-[#59A8E5] text-white rounded-lg">
          <h2 className="text-lg font-medium">Active Subscription</h2>
          <p className="text-xl px-4 py-2 bg-white text-black rounded-lg font-semibold">
            {subscription}
          </p>
        </div>

        <button
          className="bg-white p-2 hover:shadow-lg transition-all"
          onClick={() => setShowTransactions(!showTransactions)}
        >
          View Previous Transactions
        </button>

        <button
          className="bg-white p-2 hover:shadow-lg transition-all"
          onClick={() => goToPaymentPage()}
        >
          Make Payment
        </button>
      </div>
      {/* Modal */}
      {showTransactions && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={() => setShowTransactions(false)} // Close when clicking the overlay
        >
          <div
            className="bg-white dark:bg-gray-900 max-w-3xl w-full rounded-lg shadow-lg overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Transaction History</h2>
              <button
                className="text-gray-500 hover:text-red-500"
                onClick={() => setShowTransactions(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {demoTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="mb-4 p-4 border rounded-lg dark:border-gray-700"
                >
                  <p>
                    <strong>ID:</strong> {txn.id}
                  </p>
                  <p>
                    <strong>Order ID:</strong> {txn.orderId}
                  </p>
                  <p>
                    <strong>Transaction ID:</strong> {txn.transactionId}
                  </p>
                  <p>
                    <strong>Subscription Start:</strong>{" "}
                    {formatDate(txn.created_at)}
                  </p>
                  <p>
                    <strong>Subscription End:</strong>{" "}
                    {formatDate(txn.subscription_end)}
                  </p>
                  <p>
                    <strong>Paid By:</strong> {txn.paidBy}
                  </p>
                  <p>
                    <strong>Amount:</strong> {txn.amount}
                  </p>
                  <p>
                    <strong>Plan:</strong> {txn.plan}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded-md text-sm ${
                        txn.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </p>
                  <p>
                    <strong>Payment Mode:</strong> {txn.paymentMode}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;
