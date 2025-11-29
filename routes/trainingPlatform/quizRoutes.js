import express from "express";
import {
    createQuiz,
    getQuiz,
    listQuizzesForSelect,
    checkAnswers,
    deleteQuiz,
    addQuestion,
    deleteQuestion,
    getQuizAdm,
    importQuizfromJsonText,
    importQuizfromFile,
    fetchAllQuizes,
    updateQuiz,
    getRandomQuizForDepartment,
} from "../../controllers/trainingPlatform/quizController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import dashboardAdminMiddleware from "../../middlewares/dashboardAdminMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create quiz (admin)
router.post("/create", dashboardAdminMiddleware, createQuiz);

// Public list for select inputs (all users)
router.get("/fetch", listQuizzesForSelect);

router.get("/fetchAll", fetchAllQuizes);

// Get quiz (authenticated users) - sanitized (no correct answers)
router.get("/:id", authenticateToken, getQuiz);

router.get("/getQuizAdm/:id", authenticateToken, getQuizAdm);

// Submit/Check answers
router.post("/check/:quizId", authenticateToken, checkAnswers);

// Delete quiz (admin)
router.delete("/:id", dashboardAdminMiddleware, deleteQuiz);

// Add a single question (admin)
router.post("/:id/question", dashboardAdminMiddleware, addQuestion);

// Delete a single question (admin)
router.delete(
    "/:id/question/:questionId",
    dashboardAdminMiddleware,
    deleteQuestion,
);

router.post("/import/json", dashboardAdminMiddleware, importQuizfromJsonText);

router.post(
    "/import/file",
    dashboardAdminMiddleware,
    upload.single("file"),
    importQuizfromFile,
);

router.put("/:id", dashboardAdminMiddleware, updateQuiz);

router.get("/play/random/:deptName", getRandomQuizForDepartment);

export default router;
