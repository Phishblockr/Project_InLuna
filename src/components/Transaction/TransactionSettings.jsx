import { useEffect, useState } from "react";
import { RiArrowRightSLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/AuthProvider";
import { fetchTransactionDetails } from "../../features/TransactionSettigns/transactionSettingsSlice";
import LoadingOverlay from "../../utils/LoadingOverlay";

import visaLogo from "../../assets/transactionPage/visa.svg";
import mastercardLogo from "../../assets/transactionPage/mastercard.svg";
import rupay from "../../assets/transactionPage/rupay.svg";

const TransactionSettings = () => {
  const [dataLoading, setDataLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const token = getToken();
  console.log(token);

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
  console.log(data);

  if (!data.organization) {
    return <LoadingOverlay loading={true} />;
  }

  const cardTypeLogos = {
    visa: visaLogo,
    mastercard: mastercardLogo,
    rupay: rupay,
  };

  const cardTypeStyles = {
    visa: "h-3",
    mastercard: "h-6",
    rupay: "h-3",
  };

  const cardType = data.subscriptionDetails?.cardType?.toLowerCase();
  const cardLogo = cardTypeLogos[cardType] || "card";
  const cardStyle = cardTypeStyles[cardType] || { width: "40px" };

  const currencySymbols = {
    INR: "₹",
  };

  const currency = data.subscriptionDetails?.currency || "INR";
  const currencySymbol = currencySymbols[currency] || currency;

  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      {showLoading && <LoadingOverlay loading={dataLoading} />}
      <div className="z-1 relative w-full bg-white rounded-xl shadow-xl p-6 h-full dark:bg-[#002451]">
        <div className="mb-10">
          <h1 className="text-2xl font-medium dark:text-[#F4F4F4]">
            Transaction Settings
          </h1>
          <span className="font-normal text-gray-500 ">
            Manage and view your transactions
          </span>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-gray-100 rounded-xl">
            <div className="p-5 flex flex-col">
              <span className="mb-2">Account Details</span>
              <span className="text-3xl mb-1">{data.organization.name}</span>
              <span className="text-gray-500">
                {data.organization.adminEmailIds[0]}
              </span>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl">
            <div className="p-5 flex flex-col">
              <span className="mb-2">Billing Details</span>
              <div className="flex flex-row items-center gap-2 mb-5">
                <img className={cardStyle} src={cardLogo} alt={cardType} />
                <span className="text-3xl">
                  .... .... .... {data.subscriptionDetails.last4}
                </span>
              </div>
              <span className="mb-5">
                Your next billing date is{" "}
                <span className="text-2xl">
                  {data.subscriptionDetails.nextBillingDate}
                </span>
              </span>
              <span>
                Total amount due: {currencySymbol}{" "}
                <span className="text-2xl">
                  {data.subscriptionDetails.amount}
                </span>
              </span>
              <div className="border-t border-gray-300 my-5"></div>
              <a
                className="p-1 w-full flex flex-row items-center justify-between mb-5"
                href="#"
              >
                <span>Payment History</span>{" "}
                <RiArrowRightSLine className="text-2xl" />
              </a>
              <a
                className="bg-white w-[200px] p-1 flex justify-center"
                href="#"
              >
                Cancel Membership
              </a>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl p-5 flex flex-col">
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
