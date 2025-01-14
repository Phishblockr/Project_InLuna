import express from "express";
import { createEmailTemplate, deleteEmailTemplate, editEmailTemplate, getAllEmailTemplates, getEmailTemplateById, getTemplatesGroups } from "../../controllers/trainingPlatform/emailTemplateController.js";

const router = express.Router();

// Email template CRUD Operations
router.post("/create", createEmailTemplate);
router.get("/getAll", getAllEmailTemplates);
router.get("/get/:id", getEmailTemplateById);
router.delete("/delete/:id", deleteEmailTemplate);
router.put("/update/:id", editEmailTemplate);

// Get groups for dynamic select
router.get("/getGroups", getTemplatesGroups);

export default router;
