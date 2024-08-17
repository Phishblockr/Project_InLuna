import express from 'express';
import { addWhitelistReqExt } from '../controllers/whitelistReqController.js';

const router = express.Router();

router.route("/addWhitelistReqExt").post(addWhitelistReqExt);

export default router;
