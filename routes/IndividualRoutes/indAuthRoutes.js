import express from "express";
import { IndRefreshToken, loginIndUser, loginWithGoogle, logoutIndUser } from "../../controllers/individual/indAuthController.js";

const router = express.Router();

router.post("/login", loginIndUser);
router.post("/refreshToken", IndRefreshToken);
router.post("/logout", logoutIndUser);

// Google OAuth
router.post("/g-auth", loginWithGoogle);

export default router;