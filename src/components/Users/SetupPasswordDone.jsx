import { useState, useEffect } from "react";

const SetupPasswordDone = () => {
  const [browser, setBrowser] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Firefox")) {
      setBrowser("firefox");
    } else if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      setBrowser("chrome");
    } else {
      setBrowser("other");
    }
  }, []);
  return (
    <div className="w-full h-[100svh] flex flex-col items-center justify-center text-center bg-white dark:bg-[#0B1930]">
      <div className="flex items-center justify-center text-6xl font-bold text-black dark:text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="47.5 47.5 105 105"
        >
          <circle
            cx="100"
            cy="100"
            r="50"
            fill="white"
            stroke="red"
            stroke-width="5"
          ></circle>
          <circle cx="100" cy="100" r="25" fill="black"></circle>
        </svg>

        <span className="text-[150px] dark:text-white">K</span>
      </div>

      <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-200">
        Your password has been set!
      </h2>
      <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
        Now you can close this page and get our exclusive extension for total
        protection.
      </p>

      <div className="mt-6">
        {browser === "chrome" && (
          <a
            href="https://chromewebstore.google.com/detail/inluna-enterprise/ilipomonpoifiljejfngempgpibngkmc"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0364BD] hover:shadow-xl text-white font-semibold py-3 px-4 rounded"
          >
            Click here to download extension for Chrome
          </a>
        )}
        {browser === "firefox" && (
          <a
            href="https://addons.mozilla.org/en-GB/firefox/addon/inluna-enterprise"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0364BD] hover:shadow-xl text-white font-semibold py-3 px-4 rounded"
          >
            Click here to download extension for Firefox
          </a>
        )}
        {browser === null ? (
          <p className="text-gray-500">Detecting browser...</p>
        ) : browser === "other" ? (
          <div className="text-gray-500 text-sm mt-2">
            Our extension is available for Chrome and Firefox only.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SetupPasswordDone;
