import express from "express";
import { getTenant, addTenantUser } from "../controllers/tenantController.js";

const router = express.Router();

// Route to create or get a tenant
router.get("/get", getTenant);

// Route to add a user to a tenant
router.post("/user", addTenantUser);

export default router;
