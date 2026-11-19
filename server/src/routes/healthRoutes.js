import express from 'express';
import { getConnectionStatus } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns application health status, database connection state, and uptime.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    mongoStatus: getConnectionStatus(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
