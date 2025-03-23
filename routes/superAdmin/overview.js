import express from "express";
import { getOverallStats, getSignupStats } from "../../controllers/superAdmin/overview.js";

const router = express.Router();

router.get("/getSignupStats", getSignupStats);
router.get("/getOverallStats", getOverallStats);

export default router;