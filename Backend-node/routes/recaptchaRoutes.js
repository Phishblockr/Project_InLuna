import express from "express";
import verify from "../controllers/auth/recaptchaController.js";

const router = express.Router();

// Simple reCAPTCHA Enterprise verification endpoint (REST + API key)
/**
 * @openapi
 * /api/recaptcha/verify:
 *   post:
 *     tags:
 *       - reCAPTCHA
 *     summary: Verify reCAPTCHA Enterprise token
 *     description: Verifies a reCAPTCHA Enterprise token by calling Google's API. Expects JSON body with `token` and optional `action`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reCAPTCHA token from the client
 *               action:
 *                 type: string
 *                 description: Optional expected action name
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Verification successful; returns an object containing `ok`, `score` and `reasons`
 *       400:
 *         description: Bad request (missing token / low score / recaptcha disabled)
 *       500:
 *         description: Internal server error or missing server configuration
 */
router.post("/verify", verify);

export default router;
