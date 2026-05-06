import express from "express";
import rzpWebhook from "../../controllers/paymentController/rzpWebhookController.js";

const router = express.Router();

// IMPORTANT: raw body middleware for signature verification only on this route
/**
 * @openapi
 * /api/rzp/webhook:
 *   post:
 *     tags:
 *       - Razorpay
 *     summary: Razorpay webhook receiver
 *     description: Receives Razorpay webhook events. This endpoint requires the raw request body for signature verification and the header `x-razorpay-signature` to validate the payload. It is mounted before JSON body parsing.
 *     parameters:
 *       - name: x-razorpay-signature
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Signature header used to verify webhook authenticity
 *     requestBody:
 *       description: Raw webhook payload sent by Razorpay (application/json or other content types). The server expects the raw body for HMAC verification.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *         application/octet-stream:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: ok
 *       400:
 *         description: Bad signature or malformed payload
 *       500:
 *         description: Internal server error
 */
router.post("/webhook", express.raw({ type: "*/*" }), rzpWebhook);

export default router;
