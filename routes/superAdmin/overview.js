import express from "express";
import { getOverallStats, getLastMonthSignups, getLastWeekSignups, getLastFiveWeeksSignups } from "../../controllers/superAdmin/overview.js";

const router = express.Router();

router.get("/getOverallStats", getOverallStats);
router.get("/getLastMonthSignups", getLastMonthSignups);
router.get("/getLastWeekSignups", getLastWeekSignups);

router.get("/lastFiveWeekSignups", getLastFiveWeeksSignups);



export default router;