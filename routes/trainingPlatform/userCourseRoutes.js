import express from "express";
import { assignCourse, getCoursesForUser, removeCourseAssignment } from "../../controllers/trainingPlatform/userCourseController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();
router.post("/assign", dashboardAdminMiddleware, assignCourse);
router.get("/getAssigned/:id",authenticateToken ,getCoursesForUser);
router.delete("/deleteAssignment",dashboardAdminMiddleware ,removeCourseAssignment);

export default router;