const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/leaderboard?limit=50
router.get('/', userController.getLeaderboard);

module.exports = router;
