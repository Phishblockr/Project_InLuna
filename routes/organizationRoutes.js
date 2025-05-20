import express from "express";
import {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrgDetails,
  getTransactionSettings,
} from "../controllers/organizationController.js";
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js";
import superDashboardMiddleware from "../middlewares/superDashboardMiddleware.js";

const router = express.Router();

router.get("/all", superDashboardMiddleware, getAllOrganizations);
router.post("/create", superDashboardMiddleware, createOrganization);
router.get("/search", superDashboardMiddleware, searchOrganizations);
router.get("/get/:id", superDashboardMiddleware, getOrganization);
router.delete("/delete/:id", superDashboardMiddleware, deleteOrganization);
router.put("/update/:id", superDashboardMiddleware, updateOrganization);

router.get("/orgDetails/:id", superDashboardMiddleware, getOrgDetails);

router.get(
  "/getTransactionSettings",
  dashboardAdminMiddleware,
  getTransactionSettings
);

export default router;
