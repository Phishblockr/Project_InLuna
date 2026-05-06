import express from "express";
import {
  saveHeartBeat,
  fetchHeartBeat,
} from "../controllers/heartBeatController.js";

const router = express.Router();

/**
 * @openapi
 * /api/heartBeat/saveHeartBeat:
 *   post:
 *     summary: Save a heartbeat entry for a user
 *     tags:
 *       - HeartBeat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Heartbeat saved successfully
 *       '400':
 *         description: Missing or invalid input
 */
router.route("/saveHeartBeat").post(saveHeartBeat);

/**
 * @openapi
 * /api/heartBeat/fetchHeartBeat/{userId}:
 *   get:
 *     summary: Fetch heartbeat entries for a specific user
 *     tags:
 *       - HeartBeat
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier to fetch heartbeat data for
 *     responses:
 *       '200':
 *         description: Array of heartbeat entries
 *       '404':
 *         description: No heartbeat data found for the user
 */
router.route("/fetchHeartBeat/:userId").get(fetchHeartBeat);

export default router;
