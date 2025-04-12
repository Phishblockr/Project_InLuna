import express from "express";
import { postRes } from "../../controllers/paymentController/ccavResponseHandler.js";
import { postReq } from "../../controllers/paymentController/ccavRequestHandler.js";
import { handlePaymentResponse } from "../../controllers/paymentController/transactionController.js";

const router = express.Router();
router.route("/initiatePayment").post(postReq);
router.route("/paymentResponse").post(postRes);
export default router;
