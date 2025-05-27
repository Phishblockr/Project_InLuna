// Custom version to store transactions into mongodb (replace ccavResponseHandler.js with this)
import { format } from "date-fns";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getOrgModel } from "../../models/organisationModel.js";
import { getTenantTransactionModel } from "../../models/paymentModels/TransactionsModel.js";
import { getUserModel } from "../../models/userModel.js";
import { saveToAdminDB, saveToOrgDB } from "../../utils/transactionService.js";
import { decrypt } from "./ccavutil.js";

const workingKey = process.env.CCA_WORKING_KEY;

export const handlePaymentResponse = async (req, res) => {
  try {
    const { encResp } = req.body;
    if (!encResp) return res.status(400).send("Missing encResp");
    const decrypted = decrypt(encResp, workingKey);
    const parsed = Object.fromEntries(new URLSearchParams(decrypted));

    console.log("✅ Decrypted CCAvenue Response:", parsed);

    const {
      order_id,
      tracking_id,
      currency,
      amount,
      payment_mode,
      order_status,
      merchant_param1,
      merchant_param2,
      merchant_param3,
    } = parsed;

    const customData = JSON.parse(merchant_param1 || "{}");
    const { userId, orgId, planName } = customData;

    const transaction = {
      transaction_id: tracking_id,
      order_id,
      amount: parseFloat(amount),
      currency,
      plan_name: merchant_param1,
      payment_status: order_status,
      payment_mode,
      created_at: new Date(),
      user_id: merchant_param2 || null,
      org_id: merchant_param3 || null,
      gateway_response: parsed,
    };

    // Admin Database
    await saveToAdminDB(transaction);

    // Tenant Database
    if (orgId) await saveToOrgDB(orgId, transaction);

    res.redirect(
      `${process.env.PAYMENT_FRONTEND_URL}/success?order_id=${order_id}`
    );
  } catch (error) {
    console.error("❌ Error handling CCAvenue response:", error);
    res.redirect(`${process.env.PAYMENT_FRONTEND_URL}/failure`);
  }
};

export const getAllOrgTransactions = async (req, res) => {
  try {
    const orgId = req.user.orgId;

    const Transaction = await getTenantTransactionModel(orgId);

    if (!Transaction) {
      return res.status(404).json({ error: "Transaction model not found" });
    }

    const transactions = await Transaction.find().sort({ createdAt: -1 });
    const formattedTransactions = transactions.map((tx) => ({
      orderId: tx.order_id,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.payment_status,
      paymentMode: tx.payment_mode,
      cardType: tx.card_name || tx.card_type || null,
      last4: tx.last4,
      paymentDate: format(tx.created_at, "dd MMM yyyy"),
      nextBillingDate: tx.next_billing_date
        ? format(tx.next_billing_date, "dd MMM yyyy")
        : null,
      isRecurring: tx.is_recurring,
    }));

    res.status(200).json(formattedTransactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
