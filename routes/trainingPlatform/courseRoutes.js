import express from "express";
import superDashboardMiddleware from "../../middlewares/superDashboardMiddleware.js"
import authenticateToken from "../../middlewares/authenticateToken.js";
import { deleteCourse, demoValue, getAllCourses, getCourseById, getCourseCategories, getCourseDetails, getUserAssignedCourseDetails } from "../../controllers/trainingPlatform/courseController.js";

const router = express.Router();

// Course demoTemplate route
// router.post("/insertDemo", demoValue)

// Course CRUD routes
// router.post("/create", superDashboardMiddleware, createEmailTemplate);
router.get("/getAll", authenticateToken, getAllCourses);
router.get("/get/:id", authenticateToken, getCourseById);
router.delete("/delete/:id", superDashboardMiddleware, deleteCourse);
// router.put("/update/:id", superDashboardMiddleware, editEmailTemplate);

// Get category for dynamic select
router.get("/getCategories", authenticateToken, getCourseCategories);

// Get course id and name for assigning process
router.get("/options", authenticateToken, getCourseDetails)

// Fetch course details for a specific user
router.get("/details/:courseId/:userId",authenticateToken, getUserAssignedCourseDetails)


export default router;