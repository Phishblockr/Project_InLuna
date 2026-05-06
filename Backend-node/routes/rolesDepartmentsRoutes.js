import express from "express";
import {
  getRoles,
  getDepartments,
} from "../controllers/rolesDepartmentsController.js";

const router = express.Router();

// GET /api/meta/roles
/**
 * @openapi
 * /api/meta/roles:
 *   get:
 *     tags:
 *       - Meta
 *     summary: Get available roles
 *     description: Returns a list of available roles used in the application (for select lists).
 *     responses:
 *       200:
 *         description: Array of role objects or strings
 *       500:
 *         description: Internal server error
 */
router.get("/roles", getRoles);

// GET /api/meta/departments
/**
 * @openapi
 * /api/meta/departments:
 *   get:
 *     tags:
 *       - Meta
 *     summary: Get available departments
 *     description: Returns a list of departments used in the application (for select lists).
 *     responses:
 *       200:
 *         description: Array of department objects or strings
 *       500:
 *         description: Internal server error
 */
router.get("/departments", getDepartments);

export default router;
