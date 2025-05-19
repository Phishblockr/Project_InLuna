import { getTenantDB } from "../../tenantdb";

const SubscriptionSchema = new mongoose.Schema({
  user_id: { type: String, default: null },
  org_id: { type: String, default: null },
  source: { type: String, enum: ["user", "org"] },

  plan_name: String,
  status: {
    type: String,
    enum: ["ACTIVE", "TRIAL", "CANCELLED"],
    default: "TRIAL",
  },
  trial_ends_at: Date,

  is_recurring: { type: Boolean, default: false },
  next_billing_date: Date,
  amount: Number,
  payment_mode: String,
  last4: String,
  card_type: String,

  coupon_code: String,
  discount_amount: Number,

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
