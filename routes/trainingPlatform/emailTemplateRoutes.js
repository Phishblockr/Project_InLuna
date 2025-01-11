import express from "express";
import { createEmailTemplate, deleteEmailTemplate, getAllEmailTemplates, getEmailTemplateById } from "../../controllers/trainingPlatform/emailTemplateController.js";

const router = express.Router();
router.post("/create", createEmailTemplate);
router.get("/getAll", getAllEmailTemplates);
router.get("/get/:id", getEmailTemplateById);
router.delete("/delete/:id", deleteEmailTemplate);

export default router;
