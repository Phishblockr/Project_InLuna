import express from "express";
import { addFeedbackExt } from "../controllers/feedbackController.js";

const router = express.Router();
router.route("/addFeedbackExt").post(addFeedbackExt);
export default router;