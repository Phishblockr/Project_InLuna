import mongoose from "mongoose";
import { getTenantDB } from "../../tenantdb.js";

const { Schema } = mongoose;

const GamificationEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    department: { type: String, index: true },
    category: {
      type: String,
      enum: ["quiz", "ctf", "mission", "tournament"],
      required: true,
      index: true,
    },
    refId: { type: String },
    label: { type: String },
    score: { type: Number, required: true },
    maxScore: { type: Number },
    completed: { type: Boolean, default: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
GamificationEventSchema.index(
  { userId: 1, category: 1, refId: 1 },
  { unique: false }
);

export const getGamificationEventModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return (
    tenantDb.models.GamificationEventSchema ||
    tenantDb.model("GamificationEvent", GamificationEventSchema)
  );
};
