import express from "express";
import {
  checkAuthDas,
  loginAdmin,
  loginSuperAdm,
  loginUser,
  logoutDas,
  refreshTokenDas,
  refreshTokenExt,
} from "../controllers/authenticationController.js";
import { loginRateLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();
router.route("/loginExt").post(loginRateLimiter, loginUser);
router.route("/refreshTokenExt").post(refreshTokenExt);
router.route("/loginDas").post(loginRateLimiter, loginAdmin);
router.route("/loginSuperAdm").post(loginRateLimiter, loginSuperAdm);
router.route("/refreshTokenDas").post(refreshTokenDas);
router.route("/checkAuthDas").get(checkAuthDas);
router.route("/logoutDas").post(logoutDas);

export default router;
