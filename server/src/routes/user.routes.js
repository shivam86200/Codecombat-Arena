const express = require('express');
const userController = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Protected routes (requires authentication)
router.use(authRequired);

router.patch('/:id/stats', userController.updateStats);

module.exports = router;
