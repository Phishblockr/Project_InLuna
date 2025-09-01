import { getOrgModel } from "../models/organisationModel.js";
import { cycleBounds } from "../lib/billingMath.js";

export async function applySeatDelta(
  orgId,
  delta,
  changeTime = new Date(),
  session
) {
  const Orgs = await getOrgModel();
  const query = { _id: orgId };
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
