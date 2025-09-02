import useSWR from "swr";
import { useCallback, useState } from "react";
import { billingClient } from "../api/billingClient.js";
import { useAuth } from "../utils/AuthProvider.jsx";
import { getOrgIdFromToken } from "../utils/getOrgIdFromToken.jsx";
import debounce from "debounce";

// Hook returning org billing state & actions.
export function useBilling(explicitOrgId) {
  const { getToken } = useAuth();
  const token = getToken();
  const orgId =
    explicitOrgId || getOrgIdFromToken(token) || localStorage.getItem("orgId");

  const fetchOrg = async () => {
    if (!token || !orgId) return null;
    const o = await billingClient.getOrg(token, orgId);
    if (o) {
      // Normalize numeric pricing fields that may arrive as strings
      if (
        o.perMemberPriceInPaise != null &&
        typeof o.perMemberPriceInPaise === "string"
      ) {
        const n = Number(o.perMemberPriceInPaise);
        if (!Number.isNaN(n)) o.perMemberPriceInPaise = Math.round(n); // keep integer paise
      }
      if (
        o.nextPerMemberPriceInPaise != null &&
        typeof o.nextPerMemberPriceInPaise === "string"
      ) {
        const n2 = Number(o.nextPerMemberPriceInPaise);
        if (!Number.isNaN(n2)) o.nextPerMemberPriceInPaise = Math.round(n2);
      }
    }
    return o;
  };
  const fetchPreview = async () => {
    if (!token || !orgId) return null;
    return billingClient.preview(token, orgId);
  };

  const {
    data: org,
    error: orgError,
    mutate: mutateOrg,
    isValidating: loadingOrg,
  } = useSWR(() => (token && orgId ? ["org", orgId] : null), fetchOrg, {
    refreshInterval: 60000,
  });
  // Poll subscription status separately if we have a subscriptionId but status not active yet
  const shouldPollSubStatus =
    !!org?.subscriptionId &&
    org?.billingStatus &&
    org.billingStatus !== "active";
  const {
    data: liveSubStatus,
    mutate: mutateSubStatus,
    isValidating: pollingSubStatus,
  } = useSWR(
    () =>
      token && orgId && shouldPollSubStatus
        ? ["subscriptionStatus", orgId, org?.subscriptionId]
        : null,
    async () => billingClient.subscriptionStatus(token, orgId),
    {
      refreshInterval: 4000, // poll every 4s until active
    }
  );
  const {
    data: preview,
    error: previewError,
    mutate: mutatePreview,
    isValidating: loadingPreview,
  } = useSWR(
    () => (token && orgId ? ["billingPreview", orgId] : null),
    fetchPreview,
    { refreshInterval: 60000 }
  );

  const [closing, setClosing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [lastCloseResult, setLastCloseResult] = useState(null); // invoiceDraft
  const [error, setError] = useState(null);

  const refreshPreview = useCallback(
    debounce(
      () => {
        mutatePreview();
      },
      3000, // enforce 3s min manual refresh interval per latest spec
      { leading: true, trailing: true }
    ),
    [mutatePreview]
  );

  const closeCycle = useCallback(async () => {
    if (!token || !orgId || closing) return;
    setClosing(true);
    setError(null);
    try {
      const res = await billingClient.closeCycle(token, orgId);
      setLastCloseResult(res);
      // refetch
      mutateOrg();
      mutatePreview();
      return res;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setClosing(false);
    }
  }, [token, orgId, closing, mutateOrg, mutatePreview]);

  const syncQuantity = useCallback(
    async (schedule = "now") => {
      if (!token || !orgId || syncing) return;
      // Guard: must have active subscriptionId
      if (!org?.subscriptionId) {
        setError("No subscription attached");
        return;
      }
      setSyncing(true);
      setError(null);
      try {
        const res = await billingClient.syncQuantity(token, {
          orgId,
          schedule,
        });
        mutateOrg();
        return res;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setSyncing(false);
      }
    },
    [token, orgId, syncing, mutateOrg, org?.subscriptionId]
  );

  const subscribe = useCallback(async () => {
    if (!token || !orgId || subscribing) return;
    setSubscribing(true);
    setError(null);
    try {
      const res = await billingClient.subscribe(token, { orgId });
      mutateOrg();
      return res;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSubscribing(false);
    }
  }, [token, orgId, subscribing, mutateOrg]);

  return {
    orgId,
    org,
    liveSubStatus,
    preview,
    loading: loadingOrg || loadingPreview,
    orgError,
    previewError,
    error,
    refreshPreview,
    closeCycle,
    syncQuantity,
    subscribe,
    closing,
    syncing,
    subscribing,
    lastCloseResult,
    pollingSubStatus,
    refreshSubStatus: mutateSubStatus,
  };
}

export default useBilling;
