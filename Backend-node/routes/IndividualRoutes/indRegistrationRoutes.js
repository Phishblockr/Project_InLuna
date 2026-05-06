import express from "express";
import {
  initiateIndividualRegistration,
  verifyIndividualEmail,
} from "../../controllers/individual/registration.js";

const router = express.Router();

/**
 * @openapi
 * /api/indRegister/initiate:
 *   post:
 *     summary: Initiate individual user registration (send verification email)
 *     tags:
 *       - Individual User Registration
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
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               recaptchaToken:
 *                 type: string
 *     responses:
 *       '202':
 *         description: Verification email sent
 *       '400':
 *         description: Missing or invalid input
 */
router.post("/initiate", initiateIndividualRegistration);

/**
 * @openapi
 * /api/indRegister/verify:
 *   get:
 *     summary: Verify individual registration token and create account
 *     tags:
 *       - Individual User Registration
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token sent by email
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email used for registration
 *     responses:
 *       '201':
 *         description: Account verified and created
 *       '400':
 *         description: Invalid or expired token or missing params
 *       '409':
 *         description: User already exists
 */
router.get("/verify", verifyIndividualEmail);

export default router;
