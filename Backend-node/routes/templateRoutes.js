import express from "express";
import {
  addTemplate,
  getAllTemplates,
} from "../controllers/templateController.js";

const router = express.Router();

// Route to create a new template
/**
 * @openapi
 * /api/template/add:
 *   post:
 *     tags:
 *       - Template
 *     summary: Create a new template
 *     description: Add a new email/template for the organization.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               orgId:
 *                 type: string
 *             required:
 *               - name
 *               - body
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Bad request
 */
router.post("/add", addTemplate);

// Route to fetch all templates for an organization
/**
 * @openapi
 * /api/template/all:
 *   get:
 *     tags:
 *       - Template
 *     summary: Get all templates for an organization
 *     description: Returns all templates for the authenticated or specified organization.
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional organization id to filter templates
 *     responses:
 *       200:
 *         description: Array of templates
 *       400:
 *         description: Bad request
 */
router.get("/all", getAllTemplates);

export default router;
