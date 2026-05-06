import express from "express";
import {
  subscribe,
  syncQuantity,
  billClose,
  subscriptionStatus,
  paymentHistory,
} from "../../controllers/paymentController/rzpController.js";

const router = express.Router();

// POST /api/rzp/subscribe { orgId }
/**
 * @openapi
 * /api/rzp/subscribe:
 *   post:
 *     tags:
 *       - Razorpay
 *     summary: Subscribe an organization to a plan
 *     description: Creates a subscription for the given organization. Auto-generates a plan if none exists for the org's per-member price.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                 type: string
 *               planId:
 *                 type: string
 *               perMemberPriceInPaise:
 *                 type: integer
 *             required:
 *               - orgId
 *     responses:
 *       201:
 *         description: Subscription created
 *       400:
 *         description: Bad request
 */
router.post("/subscribe", subscribe);

// PATCH /api/rzp/sync-quantity { orgId, schedule: "now"|"cycle_end" }
/**
 * @openapi
 * /api/rzp/sync-quantity:
 *   patch:
 *     tags:
 *       - Razorpay
 *     summary: Sync subscription quantity
 *     description: Synchronize subscription quantity for the organization. `schedule` can be `now` or `cycle_end`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                 type: string
 *               schedule:
 *                 type: string
 *                 enum: ["now", "cycle_end"]
 *             required:
 *               - orgId
 *     responses:
 *       200:
 *         description: Quantity sync initiated
 *       400:
 *         description: Bad request
 */
router.patch("/sync-quantity", syncQuantity);

// POST /api/rzp/bill/close { orgId }
// Closes internal billing cycle, syncs next cycle base quantity, and adds usage add-on
/**
 * @openapi
 * /api/rzp/bill/close:
 *   post:
 *     tags:
 *       - Razorpay
 *     summary: Close billing cycle
 *     description: Close a billing cycle for the organization and compute invoice draft.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                 type: string
 *               asOf:
 *                 type: string
 *                 format: date-time
 *             required:
 *               - orgId
 *     responses:
 *       200:
 *         description: Billing cycle closed and invoice draft created
 *       400:
 *         description: Bad request
 */
router.post("/bill/close", billClose);

// GET /api/rzp/subscription-status?orgId=1234
// Live fetch of subscription status & minimal plan/customer info for dashboard.
/**
 * @openapi
 * /api/rzp/subscription-status:
 *   get:
 *     tags:
 *       - Razorpay
 *     summary: Fetch subscription status
 *     description: Returns live subscription status and minimal plan/customer info for the given organization.
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization identifier
 *     responses:
 *       200:
 *         description: Subscription status object
 *       400:
 *         description: Bad request
 */
router.get("/subscription-status", subscriptionStatus);

// GET /api/rzp/payment-history?orgId=1234&limit=20
// Returns recent subscription invoices (each represents a billing event/payment) for history display.
/**
 * @openapi
 * /api/rzp/payment-history:
 *   get:
 *     tags:
 *       - Razorpay
 *     summary: Get payment history
 *     description: Returns recent subscription invoices for an organization.
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Array of payment/invoice objects
 *       400:
 *         description: Bad request
 */
router.get("/payment-history", paymentHistory);

export default router;
