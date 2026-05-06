import express from "express";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";
import {
  summary,
  preview,
  close,
  updatePrice,
} from "../../controllers/paymentController/billingController.js";

const router = express.Router();

/**
 * @openapi
 * /api/billing/summary:
 *   get:
 *     summary: Lightweight billing summary for a tenant organization
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization identifier
 *     responses:
 *       '200':
 *         description: Billing summary object
 *       '400':
 *         description: Bad request (missing orgId or other error)
 *       '404':
 *         description: Organization not found
 */
router.get("/summary", dashboardAdminMiddleware, summary);

/**
 * @openapi
 * /api/billing/preview:
 *   post:
 *     summary: Preview billing cycle computation for an organization
 *     tags:
 *       - Billing
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
 *     responses:
 *       '200':
 *         description: Preview result object
 *       '400':
 *         description: Bad request or error
 */
router.post("/preview", dashboardAdminMiddleware, preview);

/**
 * @openapi
 * /api/billing/close:
 *   post:
 *     summary: Close a billing cycle and compute final invoice draft
 *     tags:
 *       - Billing
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
 *     responses:
 *       '200':
 *         description: Invoice draft for the closed cycle
 *       '400':
 *         description: Bad request or error
 */
router.post("/close", dashboardAdminMiddleware, close);

/**
 * @openapi
 * /api/billing/price:
 *   patch:
 *     summary: Update per-member price for an organization
 *     tags:
 *       - Billing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                 type: string
 *               perMemberPriceInPaise:
 *                 type: integer
 *               effective:
 *                 type: string
 *                 description: When the price becomes effective (default: now)
 *     responses:
 *       '200':
 *         description: Updated pricing result
 *       '400':
 *         description: Bad request or invalid price
 */
router.patch("/price", dashboardAdminMiddleware, updatePrice);

export default router;
