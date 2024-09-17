import express from 'express';
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js"
import {
  getAllUsers,
  createUser,
  createAdmin,
  getUser,
  updateUser,
  updateAdminDetails,
  updateAdminPwd,
  deleteUser,
  fetchProfile,
  addUsersFromCsv
} from '../controllers/userController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route("/fetch-all").get(dashboardAdminMiddleware, getAllUsers);
router.route("/create").post(dashboardAdminMiddleware, createUser);
router.route("/createAdm").post(createAdmin);
router.route("/fetch/:id").get(dashboardAdminMiddleware, getUser);
router.route("/update/:id").put(dashboardAdminMiddleware, updateUser);
router.route("/delete/:id").delete(dashboardAdminMiddleware, deleteUser);
router.route("/profile").get(dashboardAdminMiddleware, fetchProfile);
router.route("/updateAdminDetails").put(dashboardAdminMiddleware, updateAdminDetails)
router.route("/updateAdminPwd").put(dashboardAdminMiddleware, updateAdminPwd)
router.post("/addUsersFromCsv", upload.single("file"),dashboardAdminMiddleware, addUsersFromCsv);

export default router;
