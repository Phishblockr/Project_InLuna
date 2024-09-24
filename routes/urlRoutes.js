import express from 'express';
import { addUrlExt, fetchUrlStatsExt, unshortenUrl, getUrls, addUrl, updateUrl, deleteUrl } from '../controllers/urlController.js';

const router = express.Router();

router.route("/addUrlExt").post(addUrlExt);
router.route("/urlStatsExt").get(fetchUrlStatsExt);
router.route("/unshortenUrl").get(unshortenUrl);
router.route("/getUrls").get(getUrls);
router.route("/addUrl").post(addUrl);
router.route("/updateUrl/:id").put(updateUrl);
router.route("/deleteUrl/:id").delete(deleteUrl);

export default router;
