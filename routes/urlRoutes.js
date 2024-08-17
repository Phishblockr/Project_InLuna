import express from 'express';
import { addUrlExt, fetchUrlStatsExt, unshortenUrl } from '../controllers/urlController.js';

const router = express.Router();

router.route("/addUrlExt").post(addUrlExt);
router.route("/urlStatsExt").get(fetchUrlStatsExt);
router.route("/unshortenUrl").get(unshortenUrl);

export default router;
