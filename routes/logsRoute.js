import express from "express";
import { exportLogsToCsv, getAllLogs } from "../controllers/logsController.js";

const router = express.Router();

/**
 * @openapi
 * /api/logs/getAllLogs:
 *   get:
 *     summary: Retrieve application logs with optional filters and pagination
 *     tags:
 *       - Logs
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter (inclusive)
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Log level filter (e.g., info, error)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       '200':
 *         description: Paginated list of log entries
 */
router.get("/getAllLogs", getAllLogs);

/**
 * @openapi
 * /api/logs/exportLogsToCsv:
 *   get:
 *     summary: Export logs to CSV matching optional filters
 *     tags:
 *       - Logs
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter (inclusive)
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Log level filter (e.g., info, error)
 *     responses:
 *       '200':
 *         description: CSV file stream containing logs
 */
router.get("/exportLogsToCsv", exportLogsToCsv);

export default router;
