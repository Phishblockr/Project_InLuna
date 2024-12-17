import express from "express";
import { addTemplate, getAllTemplates } from "../controllers/templateController.js";

const router = express.Router();

// Route to create a new template
router.post("/add", addTemplate);

// Route to fetch all templates for an organization
router.get("/all", getAllTemplates);

export default router;
