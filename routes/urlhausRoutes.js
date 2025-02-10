import express from 'express';
import { addMalwareUrl, fetchUrl, getAllUrlhausData, logMalwareVisit, saveUrlhausData } from "../controllers/urlhausController.js"

const router = express.Router();

router.route("/getAll").get(getAllUrlhausData);

router.route("/save").post(saveUrlhausData);

router.route("/logMalwareVisit").post(logMalwareVisit);

router.route("/fetchUrl").post(fetchUrl);

router.route("/addMalwareUrl").post(addMalwareUrl);

export default router;