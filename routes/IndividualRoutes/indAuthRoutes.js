import express from "express";
import { IndRefreshToken, loginIndUser, logoutIndUser } from "../../controllers/individual/indAuthController.js";

const router = express.Router();

router.post("/login", loginIndUser);
router.post("/refreshToken", IndRefreshToken);
router.post("/logout", logoutIndUser);

export default router;