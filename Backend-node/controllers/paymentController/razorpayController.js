import Razorpay from "razorpay";
import crypto from "crypto";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getOrgModel } from "../../models/organisationModel.js";
import { saveToAdminDB, saveToOrgDB } from "../../utils/transactionService.js";
import { getTenantSubscriptionModel } from "../../models/paymentModels/subscriptionModel.js";

const razorpay = new Razorpay({
  key_id: process.env.RP_KEY_ID,
  key_secret: process.env.RP_KEY_SECRET,
});

// Compute total amount based on current usersCount * perMemberPriceInPaise
const computeOrgAmount = (organization) => {
  if (!organization?.perMemberPriceInPaise) return null;
  const usersCount = organization.usersCount || 0;
  return organization.perMemberPriceInPaise * usersCount; // already in paise
};

export const updatePerMemberPrice = asyncHandler(async (req, res) => {
  const { orgId } = req.user; // dashboardAdminMiddleware populates
  const { priceInRupees } = req.body; // allow decimal or integer
  if (priceInRupees == null) {
    return res.status(400).json({ message: "priceInRupees required" });
  }
  if (priceInRupees < 0) {
    return res.status(400).json({ message: "priceInRupees invalid" });
  }
  const OrgModel = await getOrgModel();
  const updated = await OrgModel.findOneAndUpdate(
    { orgId },
    { $set: { perMemberPriceInPaise: Math.round(Number(priceInRupees) * 100) } },
    { new: true }
  ).select("orgId perMemberPriceInPaise usersCount name");
  if (!updated) return res.status(404).json({ message: "Organization not found" });
  res.json({
    orgId: updated.orgId,
    perMemberPriceInRupees: (updated.perMemberPriceInPaise / 100).toFixed(2),
    usersCount: updated.usersCount,
    currentPotentialAmountInRupees: ((computeOrgAmount(updated) || 0) / 100).toFixed(2),
  });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const OrgModel = await getOrgModel();
  const organization = await OrgModel.findOne({ orgId });
  if (!organization) return res.status(404).json({ message: "Organization not found" });
  const amount = computeOrgAmount(organization);
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "perMemberPrice not set or zero users" });
  }
  const receipt = `org_${orgId}_${Date.now()}`;
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt,
    notes: { orgId, usersCount: organization.usersCount },
  });
  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RP_KEY_ID,
    usersCount: organization.usersCount,
    perMemberPriceInPaise: organization.perMemberPriceInPaise,
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment fields" });
  }
  const expected = crypto
    .createHmac("sha256", process.env.RP_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: "Signature mismatch" });
  }
  // Fetch order to get amount and notes
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const { notes, amount, currency, receipt } = order;
  const orgId = notes?.orgId;
  // Persist transaction
  const tx = {
    transaction_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    amount: amount / 100,
    currency,
    plan_name: "PER_MEMBER_DYNAMIC",
    payment_status: "PAID",
    payment_mode: "RAZORPAY",
    created_at: new Date(),
    org_id: orgId,
    gateway_response: { order, verifySource: "signature" },
  };
  await saveToAdminDB(tx);
  if (orgId) await saveToOrgDB(orgId, tx);

  // Upsert subscription info (simple: mark ACTIVE & set amount)
  if (orgId) {
    const Subscription = await getTenantSubscriptionModel(orgId);
    await Subscription.findOneAndUpdate(
      {},
      {
        $set: {
          status: "ACTIVE",
          amount: amount / 100,
          currency,
          paymentMode: "RAZORPAY",
          nextBillingDate: null, // could compute monthly cycle if needed
          isRecurring: false,
        },
      },
      { upsert: true }
    );
  }
  res.json({ success: true });
});

// Webhook to receive payment.authorized / payment.captured events
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RP_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ message: "Webhook secret not set" });
  const signature = req.headers["x-razorpay-signature"]; // header name
  const bodyString = req.rawBody || JSON.stringify(req.body); // ensure raw body captured via middleware
  const expected = crypto.createHmac("sha256", webhookSecret).update(bodyString).digest("hex");
  if (expected !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }
  const event = req.body;
  if (event?.entity === "event" && event.event === "payment.captured") {
    const payment = event.payload.payment?.entity;
    const orderId = payment?.order_id;
    if (orderId) {
      try {
        const order = await razorpay.orders.fetch(orderId);
        const orgId = order?.notes?.orgId;
        const tx = {
          transaction_id: payment.id,
          order_id: orderId,
            amount: payment.amount / 100,
          currency: payment.currency,
          plan_name: "PER_MEMBER_DYNAMIC",
          payment_status: payment.status?.toUpperCase() || "CAPTURED",
          payment_mode: payment.method?.toUpperCase(),
          created_at: new Date(payment.created_at * 1000),
          org_id: orgId,
          gateway_response: { payment, order, verifySource: "webhook" },
        };
        await saveToAdminDB(tx);
        if (orgId) await saveToOrgDB(orgId, tx);
      } catch (e) {
        console.error("Error persisting webhook tx", e.message);
      }
    }
  }
  res.json({ status: "received" });
});
