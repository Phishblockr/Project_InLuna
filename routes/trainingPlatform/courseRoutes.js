import express from "express";
import superDashboardMiddleware from "../../middlewares/superDashboardMiddleware.js"
import authenticateToken from "../../middlewares/authenticateToken.js";
import { deleteCourse, demoValue, getAllCourses, getCourseById, getCourseCategories } from "../../controllers/trainingPlatform/courseController.js";

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


export default router;