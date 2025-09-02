import mongoose from "mongoose";
import { getDb } from "../admindb.js";

const { Schema } = mongoose;

const billingEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    raw: { type: Schema.Types.Mixed, required: true },
    type: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const getBillingEventModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.BillingEvent ||
    adminDb.model("BillingEvent", billingEventSchema)
  );
};

export default billingEventSchema;
