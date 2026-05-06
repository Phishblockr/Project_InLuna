import express from "express";
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js";
import {
  getAllUsers,
  createUser,
  createAdmin,
  getUser,
  updateUser,
  updateUserStatus,
  updateAdminDetails,
  updateAdminPwd,
  verifyAdminPassword,
  deleteUser,
  fetchProfile,
  addUsersFromCsv,
  setupPassword,
  restoreUser,
} from "../controllers/userController.js";
import multer from "multer";
import authenticateToken from "../middlewares/authenticateToken.js";
import { loginRateLimiter } from "../middlewares/rateLimiters.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @openapi
 * /api/user/fetch-all:
 *   get:
 *     tags:
 *       - User
 *     summary: Fetch all users (admin)
 *     description: Returns a paginated list of users. Requires dashboard admin privileges.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.route("/fetch-all").get(dashboardAdminMiddleware, getAllUsers);

/**
 * @openapi
 * /api/user/create:
 *   post:
 *     tags:
 *       - User
 *     summary: Create a new user (admin)
 *     description: Creates a new user under the organization. Requires dashboard admin privileges.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Bad request
 */
router.route("/create").post(dashboardAdminMiddleware, createUser);

/**
 * @openapi
 * /api/user/createAdm:
 *   post:
 *     tags:
 *       - User
 *     summary: Create an admin user
 *     description: Create a platform admin account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Admin created
 */
router.route("/createAdm").post(createAdmin);

/**
 * @openapi
 * /api/user/fetch/{id}:
 *   get:
 *     tags:
 *       - User
 *     summary: Fetch user by id (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *       404:
 *         description: Not found
 */
router.route("/fetch/:id").get(dashboardAdminMiddleware, getUser);

/**
 * @openapi
 * /api/user/update/{id}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.route("/update/:id").put(dashboardAdminMiddleware, updateUser);

/**
 * @openapi
 * /api/user/updateStatus/{id}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user status (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router
  .route("/updateStatus/:id")
  .put(dashboardAdminMiddleware, updateUserStatus);

/**
 * @openapi
 * /api/user/delete/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete user (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.route("/delete/:id").delete(dashboardAdminMiddleware, deleteUser);

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Fetch profile of authenticated user
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile object
 */
router.route("/profile").get(authenticateToken, fetchProfile); //dashboardAdminMiddleware

/**
 * @openapi
 * /api/user/updateAdminDetails:
 *   put:
 *     tags:
 *       - User
 *     summary: Update admin details
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin details updated
 */
router
  .route("/updateAdminDetails")
  .put(dashboardAdminMiddleware, updateAdminDetails);

/**
 * @openapi
 * /api/user/updateAdminPwd:
 *   put:
 *     tags:
 *       - User
 *     summary: Update admin password
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.route("/updateAdminPwd").put(dashboardAdminMiddleware, updateAdminPwd);

/**
 * @openapi
 * /api/user/verifyAdminPassword:
 *   post:
 *     tags:
 *       - User
 *     summary: Verify admin password
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
router
  .route("/verifyAdminPassword")
  .post(dashboardAdminMiddleware, verifyAdminPassword);

/**
 * @openapi
 * /api/user/authenticateAdmin:
 *   put:
 *     tags:
 *       - User
 *     summary: Authenticate admin (update password endpoint reused)
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin authenticated/updated
 */
router
  .route("/authenticateAdmin")
  .put(dashboardAdminMiddleware, updateAdminPwd);

/**
 * @openapi
 * /api/user/addUsersFromCsv:
 *   post:
 *     tags:
 *       - User
 *     summary: Bulk add users from CSV
 *     description: Upload a CSV file (`file` field) to add multiple users. Requires dashboard admin privileges.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Users imported
 */
router.post(
  "/addUsersFromCsv",
  upload.single("file"),
  dashboardAdminMiddleware,
  addUsersFromCsv
);

/**
 * @openapi
 * /api/user/setupPassword/{token}:
 *   post:
 *     tags:
 *       - User
 *     summary: Setup password using token
 *     description: Completes account setup by setting a password using a token.
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set
 */
router.post("/setupPassword/:token", setupPassword);

/**
 * @openapi
 * /api/user/restore/{id}:
 *   put:
 *     tags:
 *       - User
 *     summary: Restore a user (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User restored
 */
router.route("/restore/:id").put(dashboardAdminMiddleware, restoreUser);

export default router;
