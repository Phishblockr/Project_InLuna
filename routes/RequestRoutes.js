import express from "express";
import {
  addRequestExt,
  approveRequest,
  deleteRequest,
  fetchReqs,
} from "../controllers/whitelistReqController.js";

const router = express.Router();

/**
 * @openapi
 * /api/Request/addRequestExt:
 *   post:
 *     tags:
 *       - WhitelistRequests
 *     summary: Submit an external whitelist request
 *     description: Submit a request to whitelist a URL. Requires authentication.
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
 *               reason:
 *                 type: string
 *               requesterEmail:
 *                 type: string
 *             required:
 *               - url
 *     responses:
 *       201:
 *         description: Request created
 *       400:
 *         description: Bad request
 */
router.route("/addRequestExt").post(addRequestExt);

/**
 * @openapi
 * /api/Request/fetchReqs:
 *   get:
 *     tags:
 *       - WhitelistRequests
 *     summary: Fetch whitelist requests
 *     description: Retrieve whitelist requests with optional pagination and filters. Requires authentication.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of whitelist requests
 *       401:
 *         description: Unauthorized
 */
router.route("/fetchReqs").get(fetchReqs);

/**
 * @openapi
 * /api/Request/approveReq/{id}:
 *   put:
 *     tags:
 *       - WhitelistRequests
 *     summary: Approve a whitelist request
 *     description: Approve or update a whitelist request by id. Requires authentication and appropriate role.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request approved/updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.route("/approveReq/:id").put(approveRequest);

/**
 * @openapi
 * /api/Request/delReq/{id}:
 *   delete:
 *     tags:
 *       - WhitelistRequests
 *     summary: Delete a whitelist request
 *     description: Delete a whitelist request by id. Requires authentication and appropriate role.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer access token
 *     responses:
 *       200:
 *         description: Request deleted
 *       401:
 *         description: Unauthorized
 */
router.route("/delReq/:id").delete(deleteRequest);

export default router;
