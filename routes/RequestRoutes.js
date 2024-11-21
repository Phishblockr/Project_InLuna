import express from 'express';
import { addRequestExt, approveWhitelistRequest, deleteRequest, fetchReqs } from '../controllers/whitelistReqController.js';

const router = express.Router();

router.route("/addRequestExt").post(addRequestExt);
router.route("/fetchReqs").get(fetchReqs);
router.route("/approveReq/:id").put(approveWhitelistRequest);
router.route("/delReq/:id").delete(deleteRequest);


export default router;
