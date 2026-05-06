import express from "express";
import { getAllOrgTransactions } from "../../controllers/paymentController/transactionController.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();

router.get(
  "/getAllOrgTransactions",
  dashboardAdminMiddleware,
  getAllOrgTransactions
);

export default router;
