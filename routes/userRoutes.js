import express from 'express';
import {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  fetchProfile
} from '../controllers/userController.js';

const router = express.Router();

router.route("/fetch-all/:id").get(getAllUsers);
router.route("/create").post(createUser);
router.route("/fetch/:id").get(getUser);
router.route("/update/:id").put(updateUser);
router.route("/delete/:id").delete(deleteUser);
router.route("/profile").get(fetchProfile);   

export default router;
