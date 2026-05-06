import express from "express";
import { postRes } from "../../controllers/paymentController/ccavResponseHandler.js";
import { postReq } from "../../controllers/paymentController/ccavRequestHandler.js";
import { handlePaymentResponse } from "../../controllers/paymentController/transactionController.js";
import { generateSecurePaymentLink } from "../../controllers/paymentController/encryptPayload.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import { decryptPayloadAPI } from "../../controllers/paymentController/decryptPayload.js";

const router = express.Router();
router.post("/initiatePayment", postReq);
router.post("/paymentResponse", postRes);
router.post("/encryptPayload", authenticateToken, generateSecurePaymentLink);
router.get("/decryptPayload", decryptPayloadAPI);

export default router;
