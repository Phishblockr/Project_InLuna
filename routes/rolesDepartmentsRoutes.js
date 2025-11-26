import express from "express";
import {
  getRoles,
  getDepartments,
} from "../controllers/rolesDepartmentsController.js";

const router = express.Router();

// GET /api/meta/roles
router.get("/roles", getRoles);

// GET /api/meta/departments
router.get("/departments", getDepartments);

export default router;
