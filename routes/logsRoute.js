import { getAllLogs } from '../controllers/logsController';

const express = require('express');
const router = express.Router();

router.get('/api/logs/getAllLogs', getAllLogs);

export default router;