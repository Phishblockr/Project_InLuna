import express from "express";
import {saveHeartBeat, fetchHeartBeat} from "../controllers/heartBeatController.js";

const router = express.Router();

router.route("/saveHeartBeat").post(saveHeartBeat);
router.route("/fetchHeartBeat").get(fetchHeartBeat);

export default router;