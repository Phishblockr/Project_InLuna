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
 *               orgId:
 *                 type: string
 *               username:
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

/**
 * @openapi
 * /api/auth/loginDas:
 *   post:
 *     summary: Admin dashboard login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgId:
 *                type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Successful login, returns token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       "401":
 *         description: Invalid credentials
 */
router.route("/loginDas").post(loginRateLimiter, loginAdmin);
/**
 * @openapi
 * /api/auth/refreshTokenExt:
 *   post:
 *     summary: Refresh external user's access token using refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Returns a new access token and refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       '400':
 *         description: Refresh token is required
 *       '403':
 *         description: Invalid refresh token
 */
router.route("/refreshTokenExt").post(refreshTokenExt);

/**
 * @openapi
 * /api/auth/loginSuperAdm:
 *   post:
 *     summary: Super Admin login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
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
router.route("/loginSuperAdm").post(loginRateLimiter, loginSuperAdm);
/**
 * @openapi
 * /api/auth/refreshTokenDas:
 *   post:
 *     summary: Refresh dashboard access token using encrypted refresh cookie
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Encrypted refresh token stored in cookie
 *     responses:
 *       '200':
 *         description: Returns a new access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '400':
 *         description: Refresh token is required or invalid format
 *       '401':
 *         description: Refresh token expired
 *       '403':
 *         description: Invalid refresh token
 *       '404':
 *         description: User not found for provided token
 */
router.route("/refreshTokenDas").post(refreshTokenDas);
/**
 * @openapi
 * /api/auth/checkAuthDas:
 *   get:
 *     summary: Verify dashboard refresh token and return new access token
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Encrypted refresh token cookie
 *     responses:
 *       '200':
 *         description: Returns a new access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '401':
 *         description: No refresh token provided or token expired
 *       '403':
 *         description: Invalid refresh token
 */
router.route("/checkAuthDas").get(checkAuthDas);
/**
 * @openapi
 * /api/auth/logoutDas:
 *   post:
 *     summary: Logout admin/dashboard user
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Encrypted refresh token stored in cookie
 *     responses:
 *       '200':
 *         description: User logged out successfully
 *       '400':
 *         description: Refresh token is required or invalid
 */
router.route("/logoutDas").post(logoutDas);

export default router;
