import express from "express";
import { addUrlInd, fetchUrlMetricsInd, getUrlInd, getUrlsInd } from "../../controllers/individual/indUrlController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, addUrlInd);
router.get("/metrics", authenticateToken, fetchUrlMetricsInd);
router.get("/fetchAll", authenticateToken, getUrlsInd);
router.get("/fetch", authenticateToken, getUrlInd);

export default router;
