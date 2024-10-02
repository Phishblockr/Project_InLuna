import express from 'express';
import { addUrlExt, fetchUrlStatsExt, unshortenUrl, getUrls, addUrl, updateUrl, deleteUrl, addUrlFromCsv } from '../controllers/urlController.js';
import { convertTypes } from '../middlewares/convertTypes.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route("/addUrlExt").post(addUrlExt);
router.route("/urlStatsExt").get(fetchUrlStatsExt);
router.route("/unshortenUrl").get(unshortenUrl);
router.route("/getUrls").get(getUrls);
router.route("/addUrl").post(convertTypes(['isPhishing', 'isVerified']), addUrl);
router.route("/updateUrl/:id").put(convertTypes(['isPhishing', 'isVerified']), updateUrl);
router.route("/deleteUrl/:id").delete(deleteUrl);
router.post("/addUrlFromCsv", upload.single("file"), addUrlFromCsv)

export default router;
