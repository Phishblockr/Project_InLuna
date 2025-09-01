import mongoose from "mongoose";
import { getDb } from "../admindb.js";

const { Schema } = mongoose;

const seatChangeSchema = new Schema(
  {
    orgId: { type: String, index: true, required: true }, // using orgId string for consistency
    memberId: { type: Schema.Types.ObjectId, index: true, required: true },
    delta: { type: Number, required: true }, // +1 or -1
    at: { type: Date, required: true }, // UTC timestamp of change
  },
  { timestamps: true }
);

seatChangeSchema.index(
  { orgId: 1, memberId: 1, delta: 1, at: 1 },
  { unique: true }
);

export const getSeatChangeModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.SeatChange || adminDb.model("SeatChange", seatChangeSchema)
  );
};

// Idempotent wrapper: only apply seat delta if unique seat change record can be created.
export async function applySeatDeltaOnce({
  orgId,
  memberId,
  delta,
  at,
  applySeatDeltaFn,
  session,
}) {
  const SeatChange = await getSeatChangeModel();
  // Truncate milliseconds for deterministic idempotency (second precision)
  at = new Date(Math.floor(new Date(at).getTime() / 1000) * 1000);
  try {
    // Use array form of create to pass session
    if (session) {
      await SeatChange.create([{ orgId, memberId, delta, at }], { session });
    } else {
      await SeatChange.create({ orgId, memberId, delta, at });
    }
  } catch (e) {
    if (e.code === 11000) return false; // already applied
    throw e;
  }
  await applySeatDeltaFn(session);
  return true;
}

export default seatChangeSchema;
