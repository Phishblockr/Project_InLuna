import mongoose from "mongoose";
import { getDb } from "../admindb.js";

const { Schema } = mongoose;

const organizationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  adminEmailIds: [
    {
      type: String,
      match: [/.+@.+\..+/, "Please fill a valid email address"],
      require: true,
    },
  ],
  adminIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  adminName: {
    type: String,
    required: true,
    trim: true,
    default: "",
  },
  totalUsers: {
    type: Number,
    required: true,
    default: 0,
  },
  usersCount: {
    type: Number,
    default: 0,
  },
  orgId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subscription: {
    type: String,
    default: "freemium",
  },
  // Billing / pricing fields
  perMemberPriceInPaise: { type: Number, default: null }, // e.g. 10000 = INR 100.00
  subscriptionId: { type: String }, // External subscription ref (e.g., Razorpay)
  planId: { type: String },
  razorpayCustomerId: { type: String },
  billingStatus: {
    type: String,
    enum: ["active", "past_due", "canceled", "trialing", "inactive"],
    default: "inactive",
  },
  currency: { type: String, default: "INR" },
  billingCycleAnchor: {
    type: Date,
    default: function () {
      return this.createdAt;
    },
  },
  billingCycleInterval: { type: String, enum: ["month"], default: "month" },
  seatMeter: {
    cycleStartAt: { type: Date, default: null },
    lastMeasureAt: { type: Date, default: null },
    currentSeats: { type: Number, default: 0 },
    seatMillis: { type: Number, default: 0 },
  },
  prorationMode: {
    type: String,
    enum: ["per_day", "none"],
    default: "per_day",
  },
  rounding: {
    type: String,
    enum: ["round", "floor", "ceil"],
    default: "round",
  },
  nextPerMemberPriceInPaise: { type: Number, default: null }, // staged price for next cycle
  seatSegments: [
    {
      seatMillis: { type: Number, required: true }, // accumulated before a price change
      price: { type: Number, required: true }, // perMemberPriceInPaise at that time
    },
  ],
});

organizationSchema.index({ subscriptionId: 1 });
organizationSchema.index({ orgId: 1 });

export default organizationSchema;

export const getOrgModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.Organization ||
    adminDb.model("Organization", organizationSchema)
  );
};
