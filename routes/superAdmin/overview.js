import express from "express";
import { getOverallStats, getStatsGraph, getMonthlySignups } from "../../controllers/superAdmin/overview.js";

const router = express.Router();

router.get("/getStatsGraph", getStatsGraph);
router.get("/getOverallStats", getOverallStats);
router.get("/getMonthlySignups", getMonthlySignups);

export default router;