import express from "express";
import { addUrlInd, fetchUrlMetricsInd, getUrlsInd } from "../../controllers/individual/indUrlController.js";

const router = express.Router();

router.post("/add", addUrlInd);
router.get("/metrics", fetchUrlMetricsInd);
router.get("/fetch", getUrlsInd);

export default router;
