// Centralized Razorpay billing API client using fetch.
// All functions expect a valid JWT access token (string) for Authorization header.
// Responses: returns parsed JSON on success or throws Error with message.

const API_BASE = import.meta.env.VITE_API_URL; // should include /api

async function request(path, { method = 'GET', token, body } = {}) {
  if (!token) throw new Error('Missing auth token');
  const headers = { 'Authorization': `Bearer ${token}` };
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new Error('Network error');
  }
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}


export async function createOrder(token) {
  return request('/razorpay/createOrder', { method: 'POST', token });
}

export async function verifyPayment(token, payload) {
  return request('/razorpay/verifyPayment', { method: 'POST', token, body: payload });
}

export const razorpayClient = { createOrder, verifyPayment };
export default razorpayClient;
