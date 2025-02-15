import express from "express";
import { createSuperAdmin } from "../controllers/superAdminController.js";

const router = express.Router();

router.get("/create", createSuperAdmin);

export default router;
