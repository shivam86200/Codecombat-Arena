const express = require('express');
const { authRequired } = require('../middleware/auth');
const queueController = require('../controllers/queueController');

const router = express.Router();
router.use(authRequired);

router.post('/join',   queueController.joinQueue);
router.post('/leave',  queueController.leaveQueue);
router.get('/status',  queueController.queueStatus);

module.exports = router;
