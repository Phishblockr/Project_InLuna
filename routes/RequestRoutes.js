import express from 'express';
import { addRequestExt, approveRequest, deleteRequest, fetchReqs } from '../controllers/whitelistReqController.js';

const router = express.Router();

router.route("/addRequestExt").post(addRequestExt);
router.route("/fetchReqs").get(fetchReqs);
router.route("/approveReq/:id").put(approveRequest);
router.route("/delReq/:id").delete(deleteRequest);


export default router;
