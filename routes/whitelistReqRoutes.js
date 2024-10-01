import express from 'express';
import { addWhitelistReqExt, approveWhitelistRequest, deleteRequest, fetchReqs } from '../controllers/whitelistReqController.js';

const router = express.Router();

router.route("/addWhitelistReqExt").post(addWhitelistReqExt);
router.route("/fetchReqs").get(fetchReqs);
router.route("/approveReq/:id").put(approveWhitelistRequest);
router.route("/delReq/:id").delete(deleteRequest);


export default router;
