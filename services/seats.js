import { getOrgModel } from "../models/organisationModel.js";
import { cycleBounds } from "../lib/billingMath.js";

export async function applySeatDelta(
  orgId,
  delta,
  changeTime = new Date(),
  session
) {
  const Orgs = await getOrgModel();
  // Use orgId string, not _id ObjectId
  const query = { orgId };
  const org = session
    ? await Orgs.findOne(query).session(session)
    : await Orgs.findOne(query);
  if (!org) throw new Error("Org not found");

  // Initialize meter if missing
  if (!org.seatMeter?.cycleStartAt) {
    const { start } = cycleBounds(
      org.billingCycleAnchor || org.createdAt,
      changeTime
    );
    org.seatMeter = {
      cycleStartAt: start,
      lastMeasureAt: changeTime,
      currentSeats: Math.max(0, (org.seatMeter?.currentSeats || 0) + delta),
      seatMillis: 0,
    };
    if (session) {
      await org.save({ session });
    } else {
      await org.save();
    }
    return org;
  }

  // Rollover: if stored meter cycleStartAt is from a previous cycle, roll forward.
  // This occurs when no seat changes happened for multiple cycles, so we never closed the previous cycle.
  // We conservatively drop historical unclosed usage (should normally be captured via an explicit close),
  // but we DO seed seatMillis with usage from the current cycle start up to the changeTime so previews are accurate.
  const { start: currentCycleStart } = cycleBounds(
    org.billingCycleAnchor || org.createdAt,
    changeTime
  );
  const storedStart = new Date(org.seatMeter.cycleStartAt);
  if (storedStart.getTime() !== currentCycleStart.getTime()) {
    // Seed seatMillis with occupancy so far this cycle BEFORE applying the delta
    const occupancyMillis =
      (org.seatMeter.currentSeats || 0) * (changeTime - currentCycleStart);
    org.seatMeter.cycleStartAt = currentCycleStart;
    org.seatMeter.lastMeasureAt = changeTime;
    org.seatMeter.seatMillis = Math.max(0, occupancyMillis);
    // keep currentSeats as-is for delta application below
  }

  // Accumulate seat-milliseconds since last measurement
  const elapsed =
    changeTime.getTime() - new Date(org.seatMeter.lastMeasureAt).getTime();
  if (elapsed > 0) {
    org.seatMeter.seatMillis += org.seatMeter.currentSeats * elapsed;
  }

  // Apply change and advance the clock
  org.seatMeter.currentSeats = Math.max(0, org.seatMeter.currentSeats + delta);
  org.seatMeter.lastMeasureAt = changeTime;

  // Keep your own convenience counters too if you like
  org.usersCount = Math.max(0, (org.usersCount || 0) + delta);

  if (session) {
    await org.save({ session });
  } else {
    await org.save();
  }
  return org;
}
