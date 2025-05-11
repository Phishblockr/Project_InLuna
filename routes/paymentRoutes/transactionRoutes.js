import express from "express";
import { getAllIndTransactions, getAllOrgTransactions } from "../../controllers/paymentController/transactionController.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();

router.get("/getAllOrgTransactions", dashboardAdminMiddleware,getAllOrgTransactions);

router.get("/getAllIndTransactions", dashboardAdminMiddleware,getAllIndTransactions);

export default router;