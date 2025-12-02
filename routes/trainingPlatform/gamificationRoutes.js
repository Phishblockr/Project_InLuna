import express from "express";
import authenticateToken from "../../middlewares/authenticateToken.js";
import {
  getCtfStatus,
  getLeaderboard,
  getMissionStatus,
  logGamificationEvent,
} from "../../controllers/trainingPlatform/gamificationController.js";

const router = express.Router();

// Log any gamification event (quiz/ctf/mission/tournament)
router.post("/event", authenticateToken, logGamificationEvent);

// Get leaderboard (optionally by department & time range)
router.get("/leaderboard", authenticateToken, getLeaderboard);

router.get("/ctf/status", authenticateToken, getCtfStatus);

router.get("/mission/status", authenticateToken, getMissionStatus);

export default router;
