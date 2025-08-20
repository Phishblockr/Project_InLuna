// Lightweight reusable hook to load and execute Google reCAPTCHA v3 on demand.
// Usage Example:
// const { ready, execute } = useRecaptcha();
// const token = await execute('login');
// Include token in the payload you send to your backend for verification.

import { useCallback, useEffect, useState } from "react";

// If you set VITE_RECAPTCHA_ENTERPRISE=true and use an Enterprise site key,
// this hook will automatically load enterprise.js and call grecaptcha.enterprise.execute.
export const useRecaptcha = (
  siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  enterpriseFlag = import.meta.env.VITE_RECAPTCHA_ENTERPRISE === "true"
) => {
  const [ready, setReady] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(enterpriseFlag);

  useEffect(() => {
    if (!siteKey) {
      console.warn("reCAPTCHA site key missing: VITE_RECAPTCHA_SITE_KEY");
      return;
    }

    // If grecaptcha already present, mark readiness appropriately (enterprise detection dynamic)
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsEnterprise(Boolean(window.grecaptcha.enterprise));
        setReady(true);
      });
      return;
    }

    const scriptId = "recaptcha-script";
    if (document.getElementById(scriptId)) return; // Already loading

    const script = document.createElement("script");
    script.id = scriptId;
    const base = enterpriseFlag
      ? "https://www.google.com/recaptcha/enterprise.js"
      : "https://www.google.com/recaptcha/api.js";
    script.src = `${base}?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setIsEnterprise(Boolean(window.grecaptcha.enterprise));
          setReady(true);
        });
      }
    };
    script.onerror = () =>
      console.error("Failed to load Google reCAPTCHA script");
    document.head.appendChild(script);
  }, [siteKey, enterpriseFlag]);

  const execute = useCallback(
    async (action) => {
      if (!siteKey) return null;
      if (!window.grecaptcha || !ready) {
        console.warn("reCAPTCHA not ready yet");
        return null;
      }
      try {
        if (isEnterprise && window.grecaptcha.enterprise?.execute) {
          return await window.grecaptcha.enterprise.execute(siteKey, {
            action,
          });
        }
        return await window.grecaptcha.execute(siteKey, { action });
      } catch (err) {
        console.error("reCAPTCHA execute failed", err);
        return null;
      }
    },
    [ready, siteKey, isEnterprise]
  );

  return { ready, execute, siteKey, isEnterprise };
};

export default useRecaptcha;
