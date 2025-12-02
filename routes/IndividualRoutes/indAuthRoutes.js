import express from "express";
import {
  IndRefreshToken,
  loginIndUser,
  loginWithGoogle,
  logoutIndUser,
} from "../../controllers/individual/indAuthController.js";

const router = express.Router();

/**
 * @openapi
 * /api/indAuth/login:
 *   post:
 *     summary: Individual user login
 *     tags:
 *       - Individual User Auth
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
 *       '200':
 *         description: Returns access token and refresh token
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
 *         description: username and password required
 */
router.post("/login", loginIndUser);

/**
 * @openapi
 * /api/indAuth/refreshToken:
 *   post:
 *     summary: Refresh individual user's access token
 *     tags:
 *       - Individual User Auth
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
 *         description: Returns new access token and refresh token
 *       '400':
 *         description: Refresh token is required
 *       '403':
 *         description: Invalid refresh token
 */
router.post("/refreshToken", IndRefreshToken);

/**
 * @openapi
 * /api/indAuth/logout:
 *   post:
 *     summary: Logout individual user (invalidate refresh token)
 *     tags:
 *       - Individual User Auth
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
 *         description: User logged out successfully
 *       '400':
 *         description: Refresh token is required
 */
router.post("/logout", logoutIndUser);

/**
 * @openapi
 * /api/indAuth/g-auth:
 *   post:
 *     summary: Login/Register with Google ID token
 *     tags:
 *       - Individual User Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Returns access token and refresh token
 *       '400':
 *         description: ID token is required or invalid
 */
// Google OAuth
router.post("/g-auth", loginWithGoogle);

export default router;
