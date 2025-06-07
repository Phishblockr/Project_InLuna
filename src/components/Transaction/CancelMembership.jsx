import React from "react";

const CancelMembership = () => {
  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      <div className="z-1 relative w-full bg-white rounded-xl shadow-xl p-6 h-full dark:bg-[#002451] dark:text-white">
        <div className="mb-10">
          <h1 className="text-2xl font-medium dark:text-[#F4F4F4]">
            Cancel Membership
          </h1>
          <div className="flex flex-col p-2">
            <span>
              Oh no! Sorry to see you go! If you find any issue with our service
              you can contact us and we will fix it for you.
            </span>
            <span>
              Problem with our pricing? Contact our sales team we will give you
              best quotations.
            </span>
          </div>
          <div className="flex flex-col p-2 bg-gray-100 gap-1 rounded-lg">
            <span>Still want to continue with cancelation?</span>
            <span>
              Please take backup of your data. Before cancelling membership
            </span>
            <div className="flex flex-row gap-5">
              <button className="p-2 w-[200px] bg-white text-red-500 hover:text-red-800 transition-colors rounded-lg">
                Cancel Membership
              </button>
              <button className="w-[200px] p-2 font-bold text-white bg-blue-600 hover:bg-blue-800 transition-colors rounded-lg">
                Go Back
              </button>
            </div>
          </div>
          <ul className="list-disc list-inside text-gray-600 p-2">
            <li>
              Cancellations take effect at the end of the current billing cycle;
              no further charges will be applied.
            </li>
            <li>
              Upon cancellation, users retain access to the platform until their
              billing term expires, after which data may be deleted in
              accordance with our retention policy.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CancelMembership;
