import express from 'express';
import { savePhishtankData } from '../controllers/phishtankController.js';

const router = express.Router();

router.post('/save', savePhishtankData);

export default router;
