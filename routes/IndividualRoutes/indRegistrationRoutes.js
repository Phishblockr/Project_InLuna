import express from "express";
import { initiateIndividualRegistration, verifyIndividualEmail } from "../../controllers/individual/registration.js";

const router = express.Router();

router.post("/initiate", initiateIndividualRegistration);
router.get("/verify", verifyIndividualEmail);

export default router;
