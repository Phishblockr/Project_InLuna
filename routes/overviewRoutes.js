import express from "express";
import {fetchOrgMetrics, fetchUserMetrics} from "../controllers/overviewController.js"

const router = express.Router();

router.route("/org-metrics").get(fetchOrgMetrics);
router.route("/user-metrics/:id").get(fetchUserMetrics);

export default router;