import express from "express";
import { getOverallStats, getLastMonthSignups, getLastWeekSignups } from "../../controllers/superAdmin/overview.js";

const router = express.Router();

router.get("/getOverallStats", getOverallStats);
router.get("/getLastMonthSignups", getLastMonthSignups);
router.get("/getLastWeekSignups", getLastWeekSignups);


export default router;