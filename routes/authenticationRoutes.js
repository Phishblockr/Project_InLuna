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
/**
 * @openapi
 * /api/auth/loginExt:
 *   post:
 *     summary: InLuna Browser Extension user login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Successful login, returns token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.route("/loginExt").post(loginRateLimiter, loginUser);
router.route("/refreshTokenExt").post(refreshTokenExt);
router.route("/loginDas").post(loginRateLimiter, loginAdmin);
router.route("/loginSuperAdm").post(loginRateLimiter, loginSuperAdm);
router.route("/refreshTokenDas").post(refreshTokenDas);
router.route("/checkAuthDas").get(checkAuthDas);
router.route("/logoutDas").post(logoutDas);

export default router;
