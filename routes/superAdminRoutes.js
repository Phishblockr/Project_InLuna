import express from "express";
import { createSuperAdmin, fetchProfileSuperAdmin, loginSuperAdm } from "../controllers/superAdminController.js";
import superDashboardMiddleware from "../middlewares/superDashboardMiddleware.js";

const router = express.Router();

// router.post("/login", loginSuperAdm);
router.post("/create", createSuperAdmin);
router.get("/profile", superDashboardMiddleware ,fetchProfileSuperAdmin)

export default router;
