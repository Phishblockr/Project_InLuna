import express from "express";
import { addContactUs } from "../controllers/contactUsController.js";

const router = express.Router();

/**
 * @openapi
 * /api/contactUs/add:
 *   post:
 *     summary: Submit a Contact Us message
 *     tags:
 *       - Contact
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
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contact request received
 *       '400':
 *         description: Missing or invalid input
 */
router.post("/add", addContactUs);

export default router;
