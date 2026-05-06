import express from "express";
import { savePhishtankData } from "../controllers/phishtankController.js";

const router = express.Router();

/**
 * @openapi
 * /api/phishtank/save:
 *   post:
 *     tags:
 *       - Phishtank
 *     summary: Fetch and save Phishtank data
 *     description: Triggers a fetch from the Phishtank API (or other configured source) and saves the retrieved data to the database. This endpoint does not accept a request body.
 *     responses:
 *       200:
 *         description: Phishtank data fetched and saved successfully
 *       204:
 *         description: No new data to save
 *       502:
 *         description: Error fetching data from upstream Phishtank API
 *       500:
 *         description: Internal server error
 */
router.post("/save", savePhishtankData);

export default router;
