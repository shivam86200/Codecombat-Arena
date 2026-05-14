const express = require('express');
const matchController = require('../controllers/matchController');
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

/* ── Schemas ──────────────────────────────────────────── */
const createMatchSchema = Joi.object({
  problemId: Joi.string().required(),
  opponent: Joi.string().hex().length(24).optional(), // MongoDB ID format
});

const submitCodeSchema = Joi.object({
  code: Joi.string().required(),
  language: Joi.string().valid('javascript', 'python', 'cpp', 'java').required(),
  resultSummary: Joi.string().allow('').optional(),
});

// All match routes require authentication
router.use(authRequired);

router.post('/', validate(createMatchSchema), matchController.createMatch);
router.get('/:id', matchController.getMatch);
router.post('/:id/join', matchController.joinMatch);
router.post('/:id/submit', validate(submitCodeSchema), matchController.submitCode);
router.post('/:id/ai-judge', matchController.aiJudge);

module.exports = router;
