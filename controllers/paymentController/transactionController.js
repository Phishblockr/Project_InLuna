// Custom version to store transactions into mongodb (replace ccavResponseHandler.js with this)
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
      source: userId ? "user" : "org",
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

    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTransactionSettings = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  if (!orgId) {
    return res.status(400).json({ message: "orgId is required." });
  }

  const OrgModel = await getOrgModel();
  const organization = await OrgModel.findOne({ orgId });
  if (!organization) {
    return res.status(404).json({ message: "Organization not forund." });
  }
  const User = await getUserModel(orgId);
  const Transaction = await getTenantTransactionModel(orgId);

  // Recently added users and users
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const currentUsers = await User.countDocuments();
  const recentlyAddedUsers = await User.countDocuments({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const latestTransaction = await Transaction.findOne({ org_id: orgId })
    .sort({ created_at: -1 })
    .lean();

  res.status(200).json({
    organization: {
      name: organization.name,
      adminEmailIds: organization.adminEmailIds,
      orgId: organization.orgId,
    },
    transactionSettings: latestTransaction
      ? {
          amount: latestTransaction.amount,
          currency: latestTransaction.currency,
          paymentStatus: latestTransaction.payment_status,
          card: latestTransaction.card_details,
          nextBillingDate: latestTransaction.next_billing_date,
          isRecurring: latestTransaction.is_recurring,
          mandateStatus: latestTransaction.si_status,
        }
      : null,
    users: {
      current: currentUsers,
      recentlyAdded: recentlyAddedUsers,
    },
  });
});
