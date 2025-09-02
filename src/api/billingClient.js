// Billing API client for organization admin billing & seats dashboard.

const API_BASE = import.meta.env.VITE_API_URL; // e.g. http://localhost:5000/api

async function request(path, { method = "GET", token, body } = {}) {
  if (!token) throw new Error("Missing auth token");
  const headers = { Authorization: `Bearer ${token}` };
  console.log(token);
  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Network error");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok)
    throw new Error(
      data.error || data.message || `Request failed (${res.status})`
    );
  return data;
}

export const billingClient = {
  // Fetch & normalize from billing summary only (no superadmin org route needed).
  getOrg: async (token, orgId) => {
    if (!orgId) throw new Error("orgId required");
    const summary = await request(
      `/billing/summary?orgId=${encodeURIComponent(orgId)}`,
      { token }
    );

    // Defensive normalization for downstream UI expectations.
    const perMemberPriceInPaise =
      summary.perMemberPriceInPaise != null
        ? Number(summary.perMemberPriceInPaise)
        : null;

    const usersCount =
      summary.usersCount ??
      summary.userCount ??
      summary.membersCount ??
      summary.currentSeats ??
      0;
    const currentSeats =
      summary.currentSeats ?? summary.seatMeter?.currentSeats ?? usersCount;

    const seatMeter = {
      currentSeats,
      seatMillis: summary.seatMeter?.seatMillis ?? summary.seatMillis,
      cycleStartAt: summary.seatMeter?.cycleStartAt ?? summary.cycleStart,
      cycleEndAt: summary.seatMeter?.cycleEndAt ?? summary.cycleEnd,
    };

    return {
      ...summary,
      orgId: summary.orgId ?? orgId,
      orgName: summary.orgName || summary.name || summary.organizationName,
      perMemberPriceInPaise,
      usersCount,
      currentSeats,
      seatMeter,
    };
  },

  preview: (token, orgId) =>
    request(`/billing/preview`, { method: "POST", token, body: { orgId } }),

  subscribe: (token, { orgId }) =>
    request(`/rzp/subscribe`, { method: "POST", token, body: { orgId } }),

  syncQuantity: (token, { orgId, schedule = "now" }) =>
    request(`/rzp/sync-quantity`, {
      method: "PATCH",
      token,
      body: { orgId, schedule },
    }),

  closeCycle: (token, orgId) =>
    request(`/rzp/bill/close`, { method: "POST", token, body: { orgId } }),

  updatePrice: (token, { orgId, rupees, effective }) => {
    const paise = Math.round(parseFloat(rupees) * 100);
    return request(`/billing/price`, {
      method: "PATCH",
      token,
      body: { orgId, perMemberPriceInPaise: paise, effective },
    });
  },

  // Live subscription status (poll until status === 'active').
  subscriptionStatus: (token, orgId) =>
    request(`/rzp/subscription-status?orgId=${encodeURIComponent(orgId)}`, {
      token,
    }),
};

export default billingClient;
