import express from 'express';
import { addMalwareUrl, fetchUrl, getAllUrlhausData, logMalwareVisit, saveUrlhausData } from "../controllers/urlhausController.js"
import authenticateToken from '../middlewares/authenticateToken.js';

const router = express.Router();

// TODO: Add Middleware for other endpoints for security Endpoints provides user details of who is visiting via jwt
router.route("/getAll").get(getAllUrlhausData);

router.route("/save").post(saveUrlhausData);

router.route("/logMalwareVisit").post(authenticateToken, logMalwareVisit);

router.route("/fetchUrl").post(fetchUrl);

router.route("/addMalwareUrl").post(addMalwareUrl);

export default router;