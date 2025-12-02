import express from "express";
import {
  addUrlInd,
  fetchUrlMetricsInd,
  getUrlInd,
  getUrlsInd,
} from "../../controllers/individual/indUrlController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";

const router = express.Router();

/**
 * @openapi
 * /api/indUrl/add:
 *   post:
 *     summary: Add a new URL for the individual user
 *     tags:
 *       - Individual User URLs
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *               customAlias:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       '201':
 *         description: URL created
 *       '400':
 *         description: Invalid request
 */
router.post("/add", authenticateToken, addUrlInd);

/**
 * @openapi
 * /api/indUrl/metrics:
 *   get:
 *     summary: Fetch URL metrics for the authenticated individual user
 *     tags:
 *       - Individual User URLs
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *       - in: query
 *         name: shortId
 *         schema:
 *           type: string
 *         description: Short URL identifier to fetch metrics for (optional)
 *     responses:
 *       '200':
 *         description: Metrics returned
 *       '401':
 *         description: Unauthorized
 */
router.get("/metrics", authenticateToken, fetchUrlMetricsInd);

/**
 * @openapi
 * /api/indUrl/fetchAll:
 *   get:
 *     summary: Fetch all URLs created by the authenticated individual user
 *     tags:
 *       - Individual User URLs
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (optional)
 *     responses:
 *       '200':
 *         description: Array of URLs
 *       '401':
 *         description: Unauthorized
 */
router.get("/fetchAll", authenticateToken, getUrlsInd);

/**
 * @openapi
 * /api/indUrl/fetch:
 *   get:
 *     summary: Fetch details for a single URL
 *     tags:
 *       - Individual User URLs
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *       - in: query
 *         name: shortId
 *         required: true
 *         schema:
 *           type: string
 *         description: Short URL identifier
 *     responses:
 *       '200':
 *         description: URL details returned
 *       '400':
 *         description: Missing shortId
 *       '401':
 *         description: Unauthorized
 */
router.get("/fetch", authenticateToken, getUrlInd);

export default router;
