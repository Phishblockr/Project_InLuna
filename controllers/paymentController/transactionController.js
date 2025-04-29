// Custom version to store transactions into mongodb (replace ccavResponseHandler.js with this)
import { getTenantTransactionModel } from "../../models/paymentModels/TransactionsModel.js";
import {
  saveToAdminDB,
  saveToOrgDB,
  saveToUserDB,
} from "../../utils/transactionService.js";
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
      org_id: merchant_param3	 || null,
      source: userId ? "user" : "org",
      gateway_response: parsed,
    };

    // Admin Database
    await saveToAdminDB(transaction);

    // Individividual Database
    if (userId) await saveToUserDB(userId, transaction);

    // Tenant Database
    if (orgId) await saveToOrgDB(orgId, transaction);

    res.redirect(
      `${process.env.PAYMENT_FRONTEND_URL}/success?order_id=${order_id}`,
    );
  } catch (error) {
    console.error("❌ Error handling CCAvenue response:", error);
    res.redirect(`${process.env.PAYMENT_FRONTEND_URL}/failure`);
  }
};

export const getAllOrgTransactions = async(req,res)=>{
  try {

    const orgId = req.user.orgId;

    const Transaction = await getTenantTransactionModel(orgId);

    if (!Transaction) {
      return res.status(404).json({ error: "Transaction model not found" });
    }

    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
