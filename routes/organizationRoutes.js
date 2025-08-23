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
  initiateOrganizationCreation,
  verifyOrganizationEmail,
} from "../controllers/organizationController.js";
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js";
import superDashboardMiddleware from "../middlewares/superDashboardMiddleware.js";

const router = express.Router();

router.get("/all", superDashboardMiddleware, getAllOrganizations);
router.post("/create", createOrganization);
router.post("/initiate", initiateOrganizationCreation); // step 1
router.get("/verify", verifyOrganizationEmail); // step 2
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
