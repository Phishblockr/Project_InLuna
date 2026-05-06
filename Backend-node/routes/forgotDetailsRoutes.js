import express from "express";
import {
  handleForgotDetails,
  resetPassword,
} from "../controllers/forgotDetails.js";

const router = express.Router();

/**
 * @openapi
 * /api/forgot/forgotDetails:
 *   post:
 *     summary: Request username reminder and/or password reset for organization users
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               isPasswordReset:
 *                 type: boolean
 *               isUsernameReminder:
 *                 type: boolean
 *               reqMadeFrom:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Email sent with requested details
 *       '400':
 *         description: Invalid request
 *       '404':
 *         description: User not found
 */
router.post("/forgotDetails", handleForgotDetails);

/**
 * @openapi
 * /api/forgot/resetPassword/{token}:
 *   post:
 *     summary: Reset organization user password using token from email
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token sent via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password reset successful
 *       '400':
 *         description: Invalid or expired token or password validation failed
 */
router.post("/resetPassword/:token", resetPassword);

export default router;
