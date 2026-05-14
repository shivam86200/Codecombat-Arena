const express = require('express');
const { authRequired } = require('../middleware/auth');
const { judge } = require('../services/judgeService');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(authRequired);

/**
 * POST /api/judge/run
 * Body: { problemId, code, language }
 * Runs against first 3 sample test cases
 */
router.post('/run', catchAsync(async (req, res) => {
  const { problemId, code, language } = req.body;
  if (!problemId || !code || !language) {
    return res.status(400).json({ status: 'fail', message: 'problemId, code and language are required.' });
  }
  const result = await judge({ problemId, code, language, mode: 'run' });
  res.status(200).json({ status: 'success', data: result });
}));

/**
 * POST /api/judge/submit
 * Body: { problemId, code, language, matchId }
 * Runs against all test cases and returns score
 */
router.post('/submit', catchAsync(async (req, res) => {
  const { problemId, code, language } = req.body;
  if (!problemId || !code || !language) {
    return res.status(400).json({ status: 'fail', message: 'problemId, code and language are required.' });
  }
  const result = await judge({ problemId, code, language, mode: 'submit' });
  res.status(200).json({ status: 'success', data: result });
}));

module.exports = router;
