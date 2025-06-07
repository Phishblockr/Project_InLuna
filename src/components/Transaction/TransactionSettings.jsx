import { useEffect, useState } from "react";
import { RiArrowRightSLine, RiMastercardFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/AuthProvider";
import { fetchTransactionDetails } from "../../features/TransactionSettigns/transactionSettingsSlice";
import LoadingOverlay from "../../utils/LoadingOverlay";

import { RiVisaLine } from "react-icons/ri";
import { GrAmex } from "react-icons/gr";
import { FaRegCreditCard } from "react-icons/fa";
import { Link } from "react-router-dom";

const TransactionSettings = () => {
  const [dataLoading, setDataLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const token = getToken();

  const { data, loading, error } = useSelector(
    (state) => state.transactionSettings
  );

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
        </div>
      </div>
    </div>
  );
};

export default TransactionSettings;
