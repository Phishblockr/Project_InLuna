import express from "express";
import {
  fetchOrgMetrics,
  fetchUserMetrics,
} from "../controllers/overviewController.js";

const router = express.Router();

/**
 * @openapi
 * /api/overview/org-metrics:
 *   get:
 *     tags:
 *       - Overview
 *     summary: Fetch organization metrics
 *     description: Returns aggregated metrics for the organization.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         description: Bearer access token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metrics object
 *       401:
 *         description: Unauthorized
 */
router.route("/org-metrics").get(fetchOrgMetrics);

/**
 * @openapi
 * /api/overview/user-metrics/{id}/{month}/{year}:
 *   get:
 *     tags:
 *       - Overview
 *     summary: Fetch user metrics for a month
 *     description: Returns metrics for a specific user for the given month and year.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - name: month
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - name: year
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Four-digit year
 *       - name: Authorization
 *         in: header
 *         description: Bearer access token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User metrics object
 *       400:
 *         description: Bad request (invalid params)
 *       401:
 *         description: Unauthorized
 */
router.route("/user-metrics/:id/:month/:year").get(fetchUserMetrics);

export default router;
