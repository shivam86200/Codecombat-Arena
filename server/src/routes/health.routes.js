const express = require('express');
const router  = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.status(200).json({
    ok:          true,
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

module.exports = router;
