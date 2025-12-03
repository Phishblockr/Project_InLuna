import express from "express";
import { getTenant, addTenantUser } from "../controllers/tenantController.js";

const router = express.Router();

// Route to create or get a tenant
/**
 * @openapi
 * /api/tenant/get:
 *   get:
 *     tags:
 *       - Tenant
 *     summary: Get tenant information
 *     description: Retrieve tenant information. If `orgId` is provided as a query parameter, returns that tenant; otherwise returns tenant for the authenticated user (if applicable).
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional organization id to fetch
 *       - name: Authorization
 *         in: header
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional bearer token
 *     responses:
 *       200:
 *         description: Tenant object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Tenant not found
 */
router.get("/get", getTenant);

// Route to add a user to a tenant
/**
 * @openapi
 * /api/tenant/user:
 *   post:
 *     tags:
 *       - Tenant
 *     summary: Add a user to a tenant
 *     description: Adds a new user to the specified tenant. Requires the organization id and user details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *             required:
 *               - orgId
 *               - email
 *     responses:
 *       201:
 *         description: User added to tenant
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/user", addTenantUser);

export default router;
