import express from "express";
import { loginAdmin, loginUser } from "../controllers/authenticationController.js";

const router = express.Router();
router.route("/loginExt").post(loginUser);
router.route("/loginDas").post(loginAdmin);

export default router;