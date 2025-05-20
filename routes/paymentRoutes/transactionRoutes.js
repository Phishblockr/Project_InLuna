import express from "express";
import {
  getAllOrgTransactions,
  getTransactionSettings,
} from "../../controllers/paymentController/transactionController.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();

router.get(
  "/getAllOrgTransactions",
  dashboardAdminMiddleware,
  getAllOrgTransactions
);

router.get(
  "/getTransactionSettings",
  dashboardAdminMiddleware,
  getTransactionSettings
);

export default router;
