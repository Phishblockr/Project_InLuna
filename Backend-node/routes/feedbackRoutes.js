import express from "express";
import { addFeedbackExt } from "../controllers/feedbackController.js";

const router = express.Router();
/**
 * @openapi
 * /api/feedback/addFeedbackExt:
 *   post:
 *     summary: Submit feedback from external users
 *     tags:
 *       - Feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Feedback submitted successfully
 *       '400':
 *         description: Missing or invalid input
 */
router.route("/addFeedbackExt").post(addFeedbackExt);
export default router;
