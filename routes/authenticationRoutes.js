import express from "express";
import { loginAdmin, loginUser, logoutDas, refreshTokenDas } from "../controllers/authenticationController.js";

const router = express.Router();
router.route("/loginExt").post(loginUser);
router.route("/loginDas").post(loginAdmin);
router.route("/refreshTokenDas").post(refreshTokenDas);
router.route("/logoutDas").post(logoutDas)

export default router;