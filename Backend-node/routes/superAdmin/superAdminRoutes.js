import express from "express";
import superDashboardMiddleware from "../../middlewares/superDashboardMiddleware.js";
import { createSuperAdmin, fetchProfileSuperAdmin } from "../../controllers/superAdmin/superAdminController.js";

const router = express.Router();

// router.post("/login", loginSuperAdm);
router.post("/create", createSuperAdmin);
router.get("/profile", superDashboardMiddleware ,fetchProfileSuperAdmin)

export default router;
