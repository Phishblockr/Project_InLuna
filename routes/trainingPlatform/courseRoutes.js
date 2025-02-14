import express from "express";
import superDashboardMiddleware from "../../middlewares/superDashboardMiddleware.js"
import authenticateToken from "../../middlewares/authenticateToken.js";
import { deleteCourse, createCourse, getAllCourses, getCourseById, getCourseCategories, getCourseDetails, uploadCourseVideo, deleteCourseVideo, updateCourse, getSignedUrlController, getUserAssignedCourseDetails } from "../../controllers/trainingPlatform/courseController.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Course demoTemplate route
// router.post("/insertDemo", demoValue)

// Course CRUD routes
router.post("/create", superDashboardMiddleware, createCourse);
router.get("/getAll", authenticateToken, getAllCourses);
router.get("/get/:id", authenticateToken, getCourseById);
router.delete("/delete/:id", superDashboardMiddleware, deleteCourse);
router.put("/update/:id", superDashboardMiddleware, updateCourse);

// Get category for dynamic select
router.get("/getCategories", authenticateToken, getCourseCategories);

// Get course id and name for assigning process
router.get("/options", authenticateToken, getCourseDetails)

// AWS
router.post("/uploadCourseVideo", superDashboardMiddleware, upload.single("file"), uploadCourseVideo)
router.delete("/deleteCourseVideo", superDashboardMiddleware, deleteCourseVideo)
router.get("/getSignedUrl", authenticateToken, getSignedUrlController)




export default router;