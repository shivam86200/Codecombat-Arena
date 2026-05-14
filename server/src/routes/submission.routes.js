const express = require('express');
const submissionController = require('../controllers/submissionController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);
router.post('/', submissionController.createSubmission);

module.exports = router;
