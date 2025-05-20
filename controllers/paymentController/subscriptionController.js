import asyncHandler from "../../middlewares/asyncHandler.js";
import { getTenantSubscriptionModel } from "../../models/paymentModels/subscriptionModel.js";

export const fetchSubscriptionDetails = asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;
  const Subscription = await getTenantSubscriptionModel(orgId);
  if (!orgId) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  const subscription = await Subscription.findOne().select(
    "status trialEndsAt nextBillingDate amount cardType last4 paymentMode currency"
  );

  if (!subscription) {
    return res.status(404).json({ message: "No subscription found" });
  }

  return res.status(200).json(subscription);
});
