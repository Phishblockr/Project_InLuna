import express from "express";
import {
  handleForgotDetailsInd,
  resetPasswordInd,
} from "../../controllers/individual/indForgotDetailsController.js";

const router = express.Router();

/**
 * @openapi
 * /api/forgotInd/forgotDetails:
 *   post:
 *     summary: Request username reminder and/or password reset link for individual user
 *     tags:
 *       - Individual User Auth
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
 *         description: Invalid request or missing options
 *       '404':
 *         description: User not found
 */
router.post("/forgotDetails", handleForgotDetailsInd);

/**
 * @openapi
 * /api/forgotInd/resetPassword/{token}:
 *   post:
 *     summary: Reset individual user password using token from email
 *     tags:
 *       - Individual User Auth
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
 *         description: Invalid or expired token, or password validation failed
 */
router.post("/resetPassword/:token", resetPasswordInd);

export default router;
