import express from 'express';
import { forgotPassword, resetPassword, sendUsernameReminder } from '../controllers/forgotDetails.js';

const router = express.Router();

router.post('/forgotUsername', sendUsernameReminder);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:token', resetPassword);


export default router;
