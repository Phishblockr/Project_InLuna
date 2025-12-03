import express from "express";
import {
  addMalwareUrl,
  fetchUrl,
  getAllUrlhausData,
  logMalwareVisit,
  saveUrlhausData,
} from "../controllers/urlhausController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// TODO: Add Middleware for other endpoints for security Endpoints provides user details of who is visiting via jwt
/**
 * @openapi
 * /api/urlhaus/getAll:
 *   get:
 *     tags:
 *       - Urlhaus
 *     summary: Get all Urlhaus records
 *     description: Returns aggregated Urlhaus data stored in the system.
 *     responses:
 *       200:
 *         description: Array of Urlhaus records
 *       500:
 *         description: Internal server error
 */
router.route("/getAll").get(getAllUrlhausData);

/**
 * @openapi
 * /api/urlhaus/save:
 *   post:
 *     tags:
 *       - Urlhaus
 *     summary: Save Urlhaus dataset
 *     description: Save Urlhaus feed or imported data into the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *             required:
 *               - data
 *     responses:
 *       201:
 *         description: Data saved
 *       400:
 *         description: Bad request
 */
router.route("/save").post(saveUrlhausData);

/**
 * @openapi
 * /api/urlhaus/logMalwareVisit:
 *   post:
 *     tags:
 *       - Urlhaus
 *     summary: Log a malware visit
 *     description: Records a malware visit. Requires authentication.
 *     parameters:
 *       - name: Authorization
 *         in: header
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
 *               url:
 *                 type: string
 *               visitorIp:
 *                 type: string
 *               referrer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit logged
 *       401:
 *         description: Unauthorized
 */
router.route("/logMalwareVisit").post(authenticateToken, logMalwareVisit);

/**
 * @openapi
 * /api/urlhaus/fetchUrl:
 *   post:
 *     tags:
 *       - Urlhaus
 *     summary: Fetch Urlhaus details for a URL
 *     description: Query Urlhaus dataset for details about a specific URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: URL details returned
 *       404:
 *         description: Not found
 */
router.route("/fetchUrl").post(fetchUrl);

/**
 * @openapi
 * /api/urlhaus/addMalwareUrl:
 *   post:
 *     tags:
 *       - Urlhaus
 *     summary: Add a malware URL manually
 *     description: Adds a single malware URL record to the Urlhaus dataset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               notes:
 *                 type: string
 *             required:
 *               - url
 *     responses:
 *       201:
 *         description: Malware URL added
 *       400:
 *         description: Bad request
 */
router.route("/addMalwareUrl").post(addMalwareUrl);

export default router;
