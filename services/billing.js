// services/billing.js
import {
  amountForSeatMillis,
  cycleBounds,
  perDayPaise,
} from "../lib/billingMath.js";
import { getOrgModel } from "../models/organisationModel.js";

// Helper: fetch org by either Mongo _id or orgId string
async function fetchOrg(Orgs, idOrOrgId) {
  if (!idOrOrgId) return null;
  // Heuristic: if 24-hex treat as _id, else match orgId
  if (/^[a-fA-F0-9]{24}$/.test(idOrOrgId)) {
    const o = await Orgs.findById(idOrOrgId);
    if (o) return o;
  }
  return Orgs.findOne({ orgId: idOrOrgId });
}

// Preview current-cycle (up to asOf) without mutating persisted seatMeter
export async function previewCycle(orgId, asOf = new Date()) {
  const Orgs = await getOrgModel();
  const org = await fetchOrg(Orgs, orgId);
  if (!org) throw new Error("Org not found");
  if (!org.perMemberPriceInPaise) throw new Error("No per-member price set");

  const { start, end, days } = cycleBounds(
    org.billingCycleAnchor || org.createdAt,
    asOf
  );

  let seatMillisEffective = 0;
  let currentSeats = org.usersCount || 0;
  if (!org.seatMeter?.cycleStartAt) {
    // Assume constant seat count for preview if meter not initialized yet
    seatMillisEffective = currentSeats * (asOf.getTime() - start.getTime());
  } else {
    // Use stored meter and add pending interval
    const m = org.seatMeter;
    seatMillisEffective = m.seatMillis;
    const last = new Date(m.lastMeasureAt || m.cycleStartAt || start);
    if (asOf.getTime() > last.getTime()) {
      seatMillisEffective +=
        (m.currentSeats || 0) * (asOf.getTime() - last.getTime());
    }
    currentSeats = m.currentSeats || currentSeats;
  }

  const perDay = perDayPaise(
    org.perMemberPriceInPaise,
    days,
    org.rounding || "round"
  );
  const amountPaise = amountForSeatMillis(
    org.perMemberPriceInPaise,
    seatMillisEffective,
    days,
    org.rounding || "round"
  );
  const seatDays = seatMillisEffective / (1000 * 60 * 60 * 24);

  return {
    cycleStart: start,
    cycleEnd: end,
    asOf,
    perDayPaise: perDay,
    amountPaise,
    seatDays,
    currentSeats,
  };
}

export async function closeCycleAndCompute(orgId, asOf = new Date()) {
  const Orgs = await getOrgModel();
  const org = await fetchOrg(Orgs, orgId);
  if (!org) throw new Error("Org not found");
  if (!org.perMemberPriceInPaise) throw new Error("No per-member price set");

  const { start, end, days } = cycleBounds(
    org.billingCycleAnchor || org.createdAt,
    asOf
  );

  // If this org’s meter belongs to a previous cycle (rare), roll it forward.
  if (!org.seatMeter || +new Date(org.seatMeter.cycleStartAt) !== +start) {
    // Optional: rebuild a fresh meter for this cycle from events
    org.seatMeter = {
      cycleStartAt: start,
      lastMeasureAt: start,
      currentSeats: org.usersCount || 0,
      seatMillis: 0,
    };
  }

  // Final accumulate to cycle end
  const last = new Date(org.seatMeter.lastMeasureAt);
  const endMs = end.getTime();
  if (last.getTime() < endMs) {
    org.seatMeter.seatMillis +=
      org.seatMeter.currentSeats * (endMs - last.getTime());
    org.seatMeter.lastMeasureAt = end;
  }

  const seatMillisThisCycle = org.seatMeter.seatMillis;

  // Include current segment before closing (for multi-rate cycles)
  if (org.seatSegments?.length && seatMillisThisCycle > 0) {
    // Last segment already stored when rate changed; remaining seatMillis belong to current active rate
  }

  // If there are prior segments (price changes mid-cycle), compute total prorated amount across segments.
  let amountPaise = 0;
  let seatDays = 0;
  if (org.seatSegments && org.seatSegments.length) {
    // Clone to avoid mutation
    const segments = [...org.seatSegments];
    // Final segment (current price) is the residual seatMillis not yet segmented
    const residualMillis =
      seatMillisThisCycle - segments.reduce((a, s) => a + s.seatMillis, 0);
    if (residualMillis > 0) {
      segments.push({
        seatMillis: residualMillis,
        price: org.perMemberPriceInPaise,
      });
    }
    for (const seg of segments) {
      amountPaise += amountForSeatMillis(
        seg.price,
        seg.seatMillis,
        days,
        org.rounding || "round"
      );
      seatDays += seg.seatMillis / (1000 * 60 * 60 * 24);
    }
  } else {
    amountPaise = amountForSeatMillis(
      org.perMemberPriceInPaise,
      seatMillisThisCycle,
      days,
      org.rounding || "round"
    );
    seatDays = seatMillisThisCycle / (1000 * 60 * 60 * 24);
  }

  // Prepare meter for next cycle
  const nextStart = end;
  org.seatMeter = {
    cycleStartAt: nextStart,
    lastMeasureAt: nextStart,
    currentSeats: org.seatMeter.currentSeats,
    seatMillis: 0,
  };
  // Reset segments and apply staged price
  if (org.nextPerMemberPriceInPaise) {
    org.perMemberPriceInPaise = org.nextPerMemberPriceInPaise;
    org.nextPerMemberPriceInPaise = null;
  }
  org.seatSegments = [];

  await org.save();

  return {
    cycleStart: start,
    cycleEnd: end,
    cycleDays: days,
    perDayPaise: perDayPaise(
      org.perMemberPriceInPaise,
      days,
      org.rounding || "round"
    ),
    amountPaise,
    seatDays,
    seatMillis: seatMillisThisCycle,
    segments: org.seatSegments || [],
  };
}

// Update price either immediately or stage for next cycle.
export async function updatePerMemberPrice(
  orgId,
  newPricePaise,
  effective = "now",
  changeTime = new Date()
) {
  const Orgs = await getOrgModel();
  const org = await fetchOrg(Orgs, orgId);
  if (!org) throw new Error("Org not found");
  if (typeof newPricePaise !== "number" || newPricePaise <= 0)
    throw new Error("Invalid price");

  if (effective === "next_cycle") {
    org.nextPerMemberPriceInPaise = newPricePaise;
    await org.save();
    return {
      staged: true,
      appliesAt: "next_cycle",
      newPricePaise: newPricePaise,
    };
  }

  // effective now: segment existing accumulated seatMillis under old price
  if (!org.seatSegments) org.seatSegments = [];
  if (org.seatMeter?.seatMillis > 0) {
    // Avoid double recording if last segment already uses current price
    org.seatSegments.push({
      seatMillis: org.seatMeter.seatMillis,
      price: org.perMemberPriceInPaise,
    });
    // Reset meter accumulation timestamp to now without losing seat count (start new price segment)
    org.seatMeter.lastMeasureAt = changeTime;
    org.seatMeter.seatMillis = 0;
  }
  org.perMemberPriceInPaise = newPricePaise;
  await org.save();
  return { staged: false, appliesAt: "now", newPricePaise: newPricePaise };
}

export function clampToCycle(start, end, date) {
  if (date < start) return new Date(start);
  if (date > end) return new Date(end);
  return date;
}
