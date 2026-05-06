import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Status machine: idle -> verifying -> success | error ; resendLoading (internal)
const STATUSES = {
  IDLE: "idle",
  VERIFYING: "verifying",
  SUCCESS: "success",
  ERROR: "error",
  RESEND_LOADING: "resendLoading",
};

const DRAFT_KEY = "indUserDraft";
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function loadDraft(emailFromQuery) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { draft: null, valid: false };
    const draft = JSON.parse(raw);
    if (!draft?.email || draft.email !== emailFromQuery) return { draft: null, valid: false };
    if (!draft.timestamp || Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return { draft: null, valid: false };
    }
    return { draft, valid: true };
  } catch {
    return { draft: null, valid: false };
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export default function VerifyIndividual() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState(STATUSES.IDLE);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null); // returned user object
  const [draftInfo, setDraftInfo] = useState(() => loadDraft(email));
  const [pending, setPending] = useState(false);
  const [resendError, setResendError] = useState("");

  const headingRef = useRef(null);
  const apiBase = import.meta.env.VITE_API_URL; // should contain /api prefix
  const isProd = import.meta.env.MODE === "production";

  const focusHeading = () => {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  };

  const verify = useCallback(async () => {
    if (!token || !email) {
      setStatus(STATUSES.ERROR);
      setMessage("Missing token or email in the URL.");
      return;
    }
    if (pending) return; // prevent overlapping
    setPending(true);
    setStatus(STATUSES.VERIFYING);
    setMessage("");
    setResendError("");
    try {
      const res = await fetch(
        `${apiBase}/indRegister/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      );
      let data = {};
      try { data = await res.json(); } catch { /* ignore */ }

      if (res.status === 409) {
        // Already verified
        setUser(data.user || null);
        setMessage(data.message || "Account already active. You can log in now.");
        setStatus(STATUSES.SUCCESS);
        clearDraft();
      } else if (!res.ok) {
        if (res.status === 400) {
          setMessage(data.message || "Invalid or expired link. You can request a new one.");
        } else if (res.status === 500) {
          setMessage(data.message || "Server error during verification. Please retry.");
        } else {
          setMessage(data.message || `Verification failed (status ${res.status}).`);
        }
        setStatus(STATUSES.ERROR);
      } else {
        setUser(data.user || null);
        setMessage(data.message || "Email verified successfully. You can now sign in.");
        setStatus(STATUSES.SUCCESS);
        clearDraft();
      }
    } catch (e) {
      setStatus(STATUSES.ERROR);
      setMessage("Network error while verifying. Please retry.");
    } finally {
      setPending(false);
    }
  }, [token, email, apiBase, pending]);

  useEffect(() => { verify(); }, [verify]);

  useEffect(() => { focusHeading(); }, [status]);

  // Attempt to reload draft if email changes (unlikely here but safe)
  useEffect(() => { setDraftInfo(loadDraft(email)); }, [email]);

  const resend = async () => {
    if (pending) return;
    setResendError("");
    const { draft, valid } = draftInfo;
    if (!valid) {
      setResendError("Original signup data not available.");
      return;
    }
    setPending(true);
    setStatus(STATUSES.RESEND_LOADING);
    setMessage("");
    try {
      const payload = {
        name: draft.name,
        email: draft.email,
        password: draft.password,
        role: draft.role,
        // recaptchaToken: draft.recaptchaToken (if you stored it)
      };
      const res = await fetch(`${apiBase}/indRegister/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {}; try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) {
        setStatus(STATUSES.ERROR);
        setMessage(data.message || `Resend failed (status ${res.status}).`);
      } else {
        setStatus(STATUSES.IDLE);
        setMessage(data.message || "Verification email re-sent. Check your inbox.");
      }
    } catch (e) {
      setStatus(STATUSES.ERROR);
      setMessage("Network error while resending email.");
    } finally {
      setPending(false);
    }
  };

  const disabledButtons = pending || status === STATUSES.VERIFYING || status === STATUSES.RESEND_LOADING;
  const resendDisabled = disabledButtons || !draftInfo.valid;

  const headingText = status === STATUSES.SUCCESS
    ? "Verification Successful"
    : status === STATUSES.ERROR
      ? "Verification Failed"
      : status === STATUSES.RESEND_LOADING
        ? "Resending Email"
        : status === STATUSES.VERIFYING
          ? "Verifying Email"
          : "Prepare Verification";

//   const showResend = status === STATUSES.ERROR || status === STATUSES.IDLE;
  const showResend = false;
  const showRetry = status === STATUSES.ERROR;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-lg shadow p-8 text-center">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white outline-none"
        >
          {headingText}
        </h1>
        <div className="mt-4" aria-live="polite">
          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{message}</p>
        </div>

        {status === STATUSES.VERIFYING || status === STATUSES.RESEND_LOADING ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="spinner" aria-label="Loading" />
            <p className="text-xs text-gray-500">Please wait…</p>
          </div>
        ) : null}

        {status === STATUSES.SUCCESS && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              disabled={disabledButtons}
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-[#0364bd] text-white rounded text-sm hover:bg-[#003a70] disabled:opacity-50"
            >
              Go to Login
            </button>
            <button
              disabled={disabledButtons}
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Home
            </button>
          </div>
        )}

        {(status === STATUSES.ERROR || status === STATUSES.IDLE) && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {showRetry && (
              <button
                disabled={disabledButtons}
                onClick={verify}
                className="px-3 py-2 bg-[#0364bd] text-white rounded text-sm hover:bg-[#003a70] disabled:opacity-50"
              >
                Retry
              </button>
            )}
            {showResend && (
              <button
                disabled={resendDisabled}
                onClick={resend}
                title={!draftInfo.valid ? "Original signup data not available" : undefined}
                className="px-3 py-2 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend Email
              </button>
            )}
            <button
              disabled={disabledButtons}
              onClick={() => navigate("/")}
              className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Home
            </button>
            {status === STATUSES.ERROR && (
              <button
                disabled={disabledButtons}
                onClick={() => navigate("/login")}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Login
              </button>
            )}
          </div>
        )}

        {resendError && (
          <p className="mt-4 text-xs text-red-500" aria-live="polite">{resendError}</p>
        )}

        {!token || !email ? (
          <p className="mt-6 text-xs text-red-500">Token or email missing in link.</p>
        ) : null}

        {!isProd && token && (
          <details className="mt-6 text-left text-xs text-gray-500">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify({ token, email, status, draftPresent: !!draftInfo.valid }, null, 2)}</pre>
          </details>
        )}
      </div>
    </main>
  );
}
