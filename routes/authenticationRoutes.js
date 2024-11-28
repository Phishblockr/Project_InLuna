import express from "express";
import { loginAdmin, loginUser, logoutDas, refreshTokenDas, refreshTokenExt } from "../controllers/authenticationController.js";

const router = express.Router();
router.route("/loginExt").post(loginUser);
router.route("/refreshTokenExt").post(refreshTokenExt);
router.route("/loginDas").post(loginAdmin);
router.route("/refreshTokenDas").post(refreshTokenDas);
router.route("/logoutDas").post(logoutDas)

export default router;