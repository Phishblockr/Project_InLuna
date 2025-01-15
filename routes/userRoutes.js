import express from 'express';
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js"
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
  setupPassword
} from '../controllers/userController.js';
import multer from 'multer';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route("/fetch-all").get(dashboardAdminMiddleware, getAllUsers);
router.route("/create").post(dashboardAdminMiddleware, createUser);
router.route("/createAdm").post(createAdmin);
router.route("/fetch/:id").get(dashboardAdminMiddleware, getUser);
router.route("/update/:id").put(dashboardAdminMiddleware, updateUser);
router.route("/updateStatus/:id").put(dashboardAdminMiddleware, updateUserStatus);
router.route("/delete/:id").delete(dashboardAdminMiddleware, deleteUser);
router.route("/profile").get(authenticateToken, fetchProfile); //dashboardAdminMiddleware 
router.route("/updateAdminDetails").put(dashboardAdminMiddleware, updateAdminDetails);
router.route("/updateAdminPwd").put(dashboardAdminMiddleware, updateAdminPwd)
router.route("/verifyAdminPassword").post(dashboardAdminMiddleware, verifyAdminPassword);
router.route("/authenticateAdmin").put(dashboardAdminMiddleware, updateAdminPwd);
router.post("/addUsersFromCsv", upload.single("file"),dashboardAdminMiddleware, addUsersFromCsv);
router.post("/setupPassword/:token",setupPassword)

export default router;
