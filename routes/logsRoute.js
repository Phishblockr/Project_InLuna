import express from 'express';
import { exportLogsToCsv, getAllLogs } from '../controllers/logsController.js';

const router = express.Router();

router.get('/getAllLogs', getAllLogs);
router.get('/exportLogsToCsv', exportLogsToCsv);

export default router;
