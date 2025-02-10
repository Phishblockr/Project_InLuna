import express from "express";
import { assignCourse, getCoursesForUser, removeCourseAssignment, getUserAssignedCourseDetails, updateVideoProgress, getUserCourseProgress } from "../../controllers/trainingPlatform/userCourseController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";

const router = express.Router();
router.post("/assign", dashboardAdminMiddleware, assignCourse);
router.get("/getAssigned/:userId",authenticateToken ,getCoursesForUser);
router.delete("/deleteAssignment",dashboardAdminMiddleware ,removeCourseAssignment);

// Fetch course details for a specific user
router.get("/details/:courseId/:userId",authenticateToken, getUserAssignedCourseDetails)

// Update video progress
router.post("/progress",authenticateToken,updateVideoProgress);

// get user Course progress
router.get("/progress/:userId/:videoId", authenticateToken, getUserCourseProgress);


export default router;