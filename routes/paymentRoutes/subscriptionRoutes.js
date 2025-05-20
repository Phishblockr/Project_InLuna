import express from "express";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware";
import { fetchSubscriptionDetails } from "../../controllers/paymentController/subscriptionController";

const router = express.Router();

router.get(
  "/fetchSubscriptionDetails",
  dashboardAdminMiddleware,
  fetchSubscriptionDetails
);
