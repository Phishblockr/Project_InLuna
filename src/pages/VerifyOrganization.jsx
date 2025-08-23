import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const STATES = {
  IDLE: "idle",
  VERIFYING: "verifying",
  SUCCESS: "success",
  ERROR: "error",
};

export default function VerifyOrganization() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = useState(STATES.IDLE);
  const [message, setMessage] = useState("");
  const [orgName, setOrgName] = useState("");

  const apiBase = import.meta.env.VITE_API_URL;

  const verify = useCallback(async () => {
    if (!token || !email) {
      setState(STATES.ERROR);
      setMessage("Missing token or email in the URL.");
      return;
    }
    setState(STATES.VERIFYING);
    setMessage("");
    try {
      const res = await fetch(
        `${apiBase}/org/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      );
      let data = {};
      try {
        data = await res.json();
      } catch {
        /* ignore JSON parse errors */
      }

      if (!res.ok) {
        setState(STATES.ERROR);
        setMessage(data.message || `Verification failed (status ${res.status}).`);
        return;
      }

      setOrgName(data?.organization?.name || "");
      setMessage(
        data.message || "Organization verified successfully. You can now sign in."
      );
      setState(STATES.SUCCESS);
    } catch (err) {
      setState(STATES.ERROR);
      setMessage("Network error while verifying. Please retry.");
    }
  }, [token, email, apiBase]);

  useEffect(() => {
    verify();
  }, [verify]);

  const renderContent = () => {
    switch (state) {
      case STATES.VERIFYING:
        return (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">Verifying your organization…</p>
            <div className="spinner mt-6 mx-auto" aria-label="Loading" />
          </>
        );
      case STATES.SUCCESS:
        return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-600">Success</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
              {orgName && (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Organization: {orgName}</p>
              )}
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-[#0364bd] text-white rounded hover:bg-[#003a70] text-sm"
              >
                Continue to Login
              </button>
            </div>
        );
      case STATES.ERROR:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Verification Failed</h2>
            <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={verify}
                className="px-3 py-2 bg-[#0364bd] text-white rounded text-sm hover:bg-[#003a70]"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Home
              </button>
            </div>
          </div>
        );
      case STATES.IDLE:
      default:
        return (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message || "Preparing verification…"}
          </p>
        );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Organization Verification
        </h1>
        {renderContent()}
        {state !== STATES.SUCCESS && state !== STATES.VERIFYING && state !== STATES.RESEND_LOADING && (
          <div className="mt-8">
            {!token || !email ? (
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => navigate("/")}
              >
                Back Home
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
