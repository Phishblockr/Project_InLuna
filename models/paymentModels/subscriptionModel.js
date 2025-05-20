import mongoose from "mongoose";
import { getTenantDB } from "../../tenantdb.js";

const SubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: null,
    ref: "User",
  },
  org_id: {
    type: String,
    default: null,
  },

  currency: {
    type: String,
    default: "INR",
  },

  status: {
    type: String,
    enum: ["ACTIVE", "TRIAL", "CANCELLED"],
    default: "TRIAL",
  },
  trialEndsAt: Date,

  isRecurring: {
    type: Boolean,
    default: false,
  },
  nextBillingDate: Date,
  amount: Number,
  paymentMode: String,
  last4: String,
  cardType: String,

  couponCode: String,
  discountAmount: Number,

  created_at: { type: Date, default: Date.now },
});

export default SubscriptionSchema;

export const getTenantSubscriptionModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return (
    tenantDb.models.Subscription ||
    tenantDb.model("Subscription", SubscriptionSchema)
  );
};
