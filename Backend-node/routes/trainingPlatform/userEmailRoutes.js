import express from "express";
import { assignEmail, getEmailsForUser, getUserAssignedEmailDetails, removeEmailAssignment } from "../../controllers/trainingPlatform/userEmailControllers.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();

router.post("/assign", dashboardAdminMiddleware,assignEmail);

router.get("/getAssigned/:userId",authenticateToken,getEmailsForUser);

router.delete("/deleteAssignment", dashboardAdminMiddleware,removeEmailAssignment);

router.get("/details/:emailTemplateId/:userId",authenticateToken,getUserAssignedEmailDetails)

export default router;