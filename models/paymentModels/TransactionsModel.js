import mongoose from "mongoose";
import { getDb } from "../../admindb.js";
import { getGlobalDB } from "../../individualdb.js";
import { getTenantDB } from "../../tenantdb.js";

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  transaction_id: String,
  order_id: String,
  amount: Number,
  currency: String,
  plan_name: String,
  payment_status: String,
  payment_mode: String,
  user_id: { type: String, default: null },
  org_id: { type: String, default: null },
  source: { type: String, enum: ["user", "org"] },
  gateway_response: Object,
  created_at: { type: Date, default: Date.now },
});

export default TransactionSchema;

export const getTenantTransactionModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return (
    tenantDb.models.Transaction ||
    tenantDb.model("Transaction", TransactionSchema)
  );
};

export const getIndividualTransactionModel = async () => {
  const db = await getGlobalDB();
  return db.models.Transaction || db.model("Transaction", TransactionSchema);
};

export const getAdminTransactionModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.Transaction ||
    adminDb.model("Transaction", TransactionSchema)
  );
};
