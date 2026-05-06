// Lightweight reusable hook to load and execute Google reCAPTCHA v3 (standard or enterprise) on demand.
// README / Usage:
// import useRecaptcha from './useRecaptcha';
// const { ready, execute } = useRecaptcha();
// const token = ready ? await execute('login_action') : null;
// Send token to backend as `recaptchaToken` for verification.
// Environment:
// VITE_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY
// VITE_RECAPTCHA_ENTERPRISE=false   # set to true only if using enterprise key

import { useCallback, useEffect, useRef, useState } from 'react';

const WARN_ONCE = { siteKey: false };

export const useRecaptcha = (
  siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  enterpriseFlag = import.meta.env.VITE_RECAPTCHA_ENTERPRISE === 'true'
) => {
  const devBypass = import.meta.env.VITE_DEV === 'true';
  // Dev bypass: immediately return a stub implementation so calling code stays identical.
  if (devBypass) {
    return {
      ready: true,
      execute: async () => 'dev-bypass',
      siteKey: null,
      isEnterprise: false,
    };
  }
  const [ready, setReady] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(enterpriseFlag);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!siteKey) {
      if (!WARN_ONCE.siteKey) {
        console.warn('reCAPTCHA site key missing: VITE_RECAPTCHA_SITE_KEY');
        WARN_ONCE.siteKey = true;
      }
      return;
    }

    // If grecaptcha already exists (maybe another part loaded it) just bind readiness.
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsEnterprise(Boolean(window.grecaptcha.enterprise));
        setReady(true);
      });
      return;
    }

    if (injectedRef.current) return; // already injected by this hook instance
    const existing = document.getElementById('recaptcha-script');
    if (existing) return; // Another instance in DOM

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    const base = enterpriseFlag
      ? 'https://www.google.com/recaptcha/enterprise.js'
      : 'https://www.google.com/recaptcha/api.js';
    script.src = `${base}?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        try {
          window.grecaptcha.ready(() => {
            setIsEnterprise(Boolean(window.grecaptcha.enterprise));
            setReady(true);
          });
        } catch (e) {
          console.error('grecaptcha.ready failed', e);
        }
      }
    };
    script.onerror = () => console.error('Failed to load Google reCAPTCHA script');
    document.head.appendChild(script);
    injectedRef.current = true;
  }, [siteKey, enterpriseFlag]);

  const execute = useCallback(
    async (action) => {
      if (!siteKey) return null;
      if (!window.grecaptcha || !ready) {
        console.warn('reCAPTCHA not ready yet');
        return null;
      }
      try {
        if (isEnterprise && window.grecaptcha.enterprise?.execute) {
          return await window.grecaptcha.enterprise.execute(siteKey, { action });
        }
        return await window.grecaptcha.execute(siteKey, { action });
      } catch (err) {
        console.error('reCAPTCHA execute failed', err);
        return null;
      }
    },
    [ready, siteKey, isEnterprise]
  );

  return { ready, execute, siteKey, isEnterprise };
};

export default useRecaptcha;
