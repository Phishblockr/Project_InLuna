import Razorpay from "razorpay";

let _client = null;

export function getRazorpay() {
  if (_client) return _client;
  const keyId = process.env.RP_KEY_ID;
  const keySecret = process.env.RP_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay keys missing (RP_KEY_ID / RP_KEY_SECRET). Set env vars before using Razorpay APIs."
    );
  }
  _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _client;
}

// Optional: tiny helper to normalize Razorpay errors
export function rzpWrap(promise) {
  return promise.catch((e) => {
    const err = new Error(
      e?.error?.description || e.message || "Razorpay error"
    );
    err.code = e?.statusCode || 500;
    err.meta = e?.error;
    throw err;
  });
}
