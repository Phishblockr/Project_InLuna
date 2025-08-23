import mongoose from "mongoose";
import { getGlobalDB } from "../../individualdb.js";

const pendingIndividualSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String },
    tokenHash: { type: String, required: true, unique: true, index: true },
    tokenExpiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

pendingIndividualSchema.index({ tokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const getPendingIndividualModel = async () => {
  const db = await getGlobalDB();
  return (
    db.models.PendingIndividual ||
    db.model("PendingIndividual", pendingIndividualSchema)
  );
};
