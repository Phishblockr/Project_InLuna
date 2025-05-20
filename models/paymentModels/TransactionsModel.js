import mongoose from "mongoose";
import { getDb } from "../../admindb.js";
import { getTenantDB } from "../../tenantdb.js";

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  transaction_id: String, // CCAvenue tracking_id
  order_id: String, // CCAvenue order_id
  amount: Number,
  currency: {
    type: String,
    default: "INR",
  },
  plan_name: String,

  payment_status: String,
  payment_mode: String, // Card / UPI / NetBanking
  card_details: {
    card_type: {
      type: String, // e.g., VISA, MasterCard
      default: null,
    },
    cardholder_name: {
      type: String,
      default: null,
    },
    last4: {
      type: String, // Only store last 4 digits (e.g., "1234")
      match: [/^\d{4}$/, "Must be last 4 digits of card"],
      default: null,
    },
    issuer: {
      type: String, // e.g., HDFC, SBI, etc.
      default: null,
    },
    network: {
      type: String, // Optional: e.g., Rupay, Amex
      default: null,
    },
  },

  // Auto-Renewal (SI) specific fields:
  is_recurring: {
    type: Boolean,
    default: false,
  },
  si_type: {
    type: String,
    enum: ["FIXED", "ONDEMAND"],
    default: null,
  },
  si_mer_ref_no: {
    type: String,
    default: null,
  }, // Mandate ID
  si_status: {
    type: String,
    enum: ["ACTIVE", "FAILED", "CANCELLED", "EXPIRED"],
    default: null,
  },
  si_start_date: {
    type: Date,
    default: null,
  },
  si_end_date: {
    type: Date,
    default: null,
  },
  si_frequency: {
    type: String,
    enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
    default: null,
  },
  si_billing_cycle: {
    type: Number,
    default: null,
  },
  next_billing_date: {
    type: Date,
    default: null,
  }, // Computed locally

  // User / Org mapping
  user_id: {
    type: String,
    default: null,
  },
  org_id: {
    type: String,
    default: null,
  },
  // Full decrypted gateway response for reference/debugging
  gateway_response: {
    type: Object,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default TransactionSchema;

export const getTenantTransactionModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return (
    tenantDb.models.Transaction ||
    tenantDb.model("Transaction", TransactionSchema)
  );
};

export const getAdminTransactionModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.Transaction ||
    adminDb.model("Transaction", TransactionSchema)
  );
};
