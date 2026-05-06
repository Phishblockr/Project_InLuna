import { useCallback, useEffect, useRef, useState } from 'react';

// Dynamically load Razorpay checkout script one time and expose openCheckout helper.
export function useRazorpayCheckout() {
  const [ready, setReady] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (window.Razorpay) {
      setReady(true);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => console.error('Failed to load Razorpay script');
    document.body.appendChild(script);
  }, []);

  const openCheckout = useCallback((opts) => {
    if (!ready || !window.Razorpay) {
      throw new Error('Razorpay not ready');
    }
    const rzp = new window.Razorpay(opts);
    rzp.open();
  }, [ready]);

  return { ready, openCheckout };
}

export default useRazorpayCheckout;
