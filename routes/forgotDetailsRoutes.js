import express from 'express';
import { handleForgotDetails, resetPassword } from '../controllers/forgotDetails.js';

const router = express.Router();

router.post("/forgotDetails", handleForgotDetails);
router.post("/resetPassword/:token", resetPassword);


export default router;
