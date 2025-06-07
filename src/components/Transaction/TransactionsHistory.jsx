import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/AuthProvider";
import { useEffect, useState } from "react";
import { fetchTransactionHistory } from "../../features/TransactionHistory/transactionHistorySlice";
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
          {data.length === 0 ? (
            <div className="flex justify-center font-medium dark:text-[#F4F4F4] mt-5">
              <span>No Records Found!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-5 mt-5 text-gray-600">
              {data.map((transaction) => {
                const currencySymbol =
                  currencySymbols[transaction.currency] || transaction.currency;
                return (
                  <div
                    className="flex flex-col w-full p-5 bg-gray-100 rounded-lg gap-2"
                    key={transaction.orderId}
                  >
                    <div className="flex flex-row w-full items-center justify-between text-black">
                      <span className="text-xl">{transaction.paymentDate}</span>
                      <span className="flex flex-row gap-1 items-center font-semibold">
                        <span>{currencySymbol}</span>
                        <span className="text-xl">{transaction.amount}</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span>
                        Membership for {transaction.paymentDate} to{" "}
                        {transaction.nextBillingDate}
                      </span>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <span>
                        <FaRegCreditCard className="text-xl" />
                      </span>
                      <span className="flex flex-row gap-1 items-center">
                        <span>•••• •••• ••••</span>
                        <span className="text-lg">{transaction.last4}</span>
                      </span>
                    </div>
                    <Link to={"#"} className="flex flex-row items-center gap-2">
                      <span>
                        <RiEyeLine />
                      </span>
                      <span>View Invoice</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsHistory;
