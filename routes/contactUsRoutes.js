import express from "express";
import { addContactUs } from "../controllers/contactUsController.js";

const router = express.Router();

router.post("/add", addContactUs);

export default router;
