import express from "express";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import {
  updatePerMemberPrice,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from "../../controllers/paymentController/razorpayController.js";

const router = express.Router();

// Update per-member pricing (admin dashboard)
router.post(
  "/updatePerMemberPrice",
  dashboardAdminMiddleware,
  updatePerMemberPrice
);

// Create order for current org based on usersCount * perMemberPrice
router.post(
  "/createOrder",
  dashboardAdminMiddleware,
  createRazorpayOrder
);

// Verify payment after checkout success (frontend calls)
router.post(
  "/verifyPayment",
  authenticateToken,
  verifyRazorpayPayment
);

// Webhook (no auth, signature verified). Need raw body; configure in server.
router.post("/webhook", express.json({ verify: (req, res, buf) => (req.rawBody = buf.toString()) }), razorpayWebhook);

export default router;
