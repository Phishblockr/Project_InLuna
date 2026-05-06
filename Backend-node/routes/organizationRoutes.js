import express from "express";
import {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrgDetails,
  getTransactionSettings,
  initiateOrganizationCreation,
  verifyOrganizationEmail,
} from "../controllers/organizationController.js";
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js";
import superDashboardMiddleware from "../middlewares/superDashboardMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/organization/all:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get all organizations (super-admin)
 *     description: Returns a list of all organizations. Requires super-admin privileges.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         description: Bearer access token with super-admin privileges
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of organizations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/all", superDashboardMiddleware, getAllOrganizations);

/**
 * @openapi
 * /api/organization/create:
 *   post:
 *     tags:
 *       - Organization
 *     summary: Create a new organization
 *     description: Create an organization. This endpoint is used by admins to create organizations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *             required:
 *               - name
 *               - adminEmail
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Bad request
 */
router.post("/create", createOrganization);

/**
 * @openapi
 * /api/organization/initiate:
 *   post:
 *     tags:
 *       - Organization
 *     summary: Initiate organization creation (step 1)
 *     description: Starts the organization creation flow (e.g., sends verification email).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *             required:
 *               - name
 *               - adminEmail
 *     responses:
 *       200:
 *         description: Initiation successful (email sent)
 *       400:
 *         description: Bad request
 */
router.post("/initiate", initiateOrganizationCreation); // step 1

/**
 * @openapi
 * /api/organization/verify:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Verify organization email (step 2)
 *     description: Completes organization creation by verifying email using query params (token).
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token sent to admin email
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify", verifyOrganizationEmail); // step 2

/**
 * @openapi
 * /api/organization/search:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Search organizations (super-admin)
 *     description: Search organizations by name or domain. Requires super-admin privileges.
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get("/search", superDashboardMiddleware, searchOrganizations);

/**
 * @openapi
 * /api/organization/get/{id}:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get organization by ID (super-admin)
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
 *         description: Bearer token
 *     responses:
 *       200:
 *         description: Organization object
 *       404:
 *         description: Not found
 */
router.get("/get/:id", superDashboardMiddleware, getOrganization);

/**
 * @openapi
 * /api/organization/delete/{id}:
 *   delete:
 *     tags:
 *       - Organization
 *     summary: Delete organization (super-admin)
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
 *         description: Bearer token
 *     responses:
 *       200:
 *         description: Organization deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:id", superDashboardMiddleware, deleteOrganization);

/**
 * @openapi
 * /api/organization/update/{id}:
 *   put:
 *     tags:
 *       - Organization
 *     summary: Update organization (super-admin)
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
 *         description: Bearer token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated
 *       400:
 *         description: Bad request
 */
router.put("/update/:id", superDashboardMiddleware, updateOrganization);

/**
 * @openapi
 * /api/organization/orgDetails/{id}:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get detailed organization info (super-admin)
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
 *         description: Bearer token
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Not found
 */
router.get("/orgDetails/:id", superDashboardMiddleware, getOrgDetails);

/**
 * @openapi
 * /api/organization/getTransactionSettings:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Get transaction settings (dashboard admin)
 *     description: Returns transaction-related settings for the requesting organization's dashboard admin.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token
 *     responses:
 *       200:
 *         description: Transaction settings
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/getTransactionSettings",
  dashboardAdminMiddleware,
  getTransactionSettings
);

export default router;
