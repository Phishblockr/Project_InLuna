import express from "express";
import {fetchOrgMetrics} from "../controllers/overviewController.js"

const router = express.Router();

router.route("/org-metrics").get(fetchOrgMetrics);

export default router;