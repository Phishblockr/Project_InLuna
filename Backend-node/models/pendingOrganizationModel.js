import mongoose from "mongoose";
import { getDb } from "../admindb.js";

const pendingOrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    adminName: { type: String, required: true, trim: true },
    totalUsers: { type: Number, required: true },
    adminEmail: { type: String, required: true, index: true },
    passwordHash: { type: String, default: "" },
    passwordProvided: { type: Boolean, default: false },
    tokenHash: { type: String, required: true, unique: true, index: true },
    tokenExpiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL index to auto remove expired pending entries
pendingOrganizationSchema.index({ tokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const getPendingOrgModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.PendingOrganization ||
    adminDb.model("PendingOrganization", pendingOrganizationSchema)
  );
};
