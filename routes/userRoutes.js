import express from 'express';
import {
  getAllUsers,
  createUser,
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

router.route("/fetch-all").get(getAllUsers);
router.route("/create").post(createUser);
router.route("/fetch/:id").get(getUser);
router.route("/update/:id").put(updateUser);
router.route("/delete/:id").delete(deleteUser);
router.route("/profile").get(fetchProfile);
router.route("/updateAdminDetails").put(updateAdminDetails)
router.route("/updateAdminPwd").put(updateAdminPwd)
router.post("/addUsersFromCsv", upload.single("file"), addUsersFromCsv);

export default router;
