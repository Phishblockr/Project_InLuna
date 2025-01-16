import express from "express";
import { createEmailTemplate, deleteEmailTemplate, editEmailTemplate, getAllEmailTemplates, getEmailTemplateById, getTemplatesGroups } from "../../controllers/trainingPlatform/emailTemplateController.js";
import superDashboardMiddleware from "../../middlewares/superDashboardMiddleware.js"
import authenticateToken from "../../middlewares/authenticateToken.js";

const router = express.Router();

// Email template CRUD Operations
router.post("/create", superDashboardMiddleware, createEmailTemplate);
router.get("/getAll", authenticateToken, getAllEmailTemplates);
router.get("/get/:id", authenticateToken, getEmailTemplateById);
router.delete("/delete/:id", superDashboardMiddleware, deleteEmailTemplate);
router.put("/update/:id", superDashboardMiddleware, editEmailTemplate);

// Get groups for dynamic select
router.get("/getGroups", authenticateToken, getTemplatesGroups);

export default router;
