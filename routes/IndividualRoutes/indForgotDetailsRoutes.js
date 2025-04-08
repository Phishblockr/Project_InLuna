import express from 'express';
import { handleForgotDetailsInd, resetPasswordInd } from '../../controllers/individual/indForgotDetailsController.js';

const router = express.Router();

router.post("/forgotDetails", handleForgotDetailsInd);
router.post("/resetPassword/:token", resetPasswordInd);


export default router;
