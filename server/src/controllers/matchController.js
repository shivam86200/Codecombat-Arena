const Match = require('../models/Match');
const Submission = require('../models/Submission');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { processTransaction } = require('../services/walletService');

/**
 * Create a new match.
 * POST /api/matches
 * Body: { problemId, opponent(optional) }
 */
exports.createMatch = catchAsync(async (req, res, next) => {
  const { problemId, opponent } = req.body;

  if (!problemId) {
    return next(new AppError('Please provide a problemId.', 400));
  }

  // Deduct 20 coins for creating/joining a match
  await processTransaction(req.userId, -20, 'JOIN_MATCH');

  const match = await Match.create({
    createdBy: req.userId,
    opponent: opponent || null,
    problemId,
    status: opponent ? 'ACTIVE' : 'PENDING',
  });

  res.status(201).json({
    status: 'success',
    data: {
      match,
    },
  });
});

/**
 * Get match details.
 * GET /api/matches/:id
 */
exports.getMatch = catchAsync(async (req, res, next) => {
  const match = await Match.findById(req.params.id)
    .populate('createdBy', 'name rank wins losses')
    .populate('opponent', 'name rank wins losses')
    .populate('submissions'); // Using virtual populate

  if (!match) {
    return next(new AppError('No match found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      match,
    },
  });
});

/**
 * Join an existing match.
 * POST /api/matches/:id/join
 */
exports.joinMatch = catchAsync(async (req, res, next) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    return next(new AppError('No match found with that ID.', 404));
  }

  // Prevent creator from joining their own match as opponent
  if (match.createdBy.toString() === req.userId.toString()) {
    return next(new AppError('You cannot join your own match.', 400));
  }

  if (match.status !== 'PENDING' || match.opponent !== null) {
    return next(new AppError('This match is no longer available.', 400));
  }

  // Deduct 10 coins
  await processTransaction(req.userId, -10, 'JOIN_MATCH', match._id);

  match.opponent = req.userId;
  match.status = 'ACTIVE';
  await match.save();

  res.status(200).json({
    status: 'success',
    data: {
      match,
    },
  });
});

/**
 * Submit code for a match.
 * POST /api/matches/:id/submit
 * Body: { code, language, resultSummary }
 */
exports.submitCode = catchAsync(async (req, res, next) => {
  const { code, language, resultSummary } = req.body;
  const matchId = req.params.id;
  const userId = req.userId;

  const match = await Match.findById(matchId);

  if (!match) {
    return next(new AppError('No match found with that ID.', 404));
  }

  if (!['ACTIVE', 'PENDING'].includes(match.status)) {
    return next(new AppError('Match is already completed.', 400));
  }

  // Ensure user is part of the match
  const isCreator  = match.createdBy.toString() === userId.toString();
  const isOpponent = match.opponent && match.opponent.toString() === userId.toString();

  if (!isCreator && !isOpponent) {
    return next(new AppError('You are not a participant in this match.', 403));
  }

  // Check if user already submitted
  const existingSubmission = await Submission.findOne({ matchId, userId });
  if (existingSubmission) {
    return next(new AppError('You have already submitted code for this match.', 400));
  }

  // Create submission
  const submission = await Submission.create({
    matchId,
    userId,
    code,
    language,
    resultSummary,
  });

  // Check if both players have submitted
  const allSubmissions = await Submission.find({ matchId });
  if (allSubmissions.length >= 2) {
    match.status = 'COMPLETED';
    await match.save();
  }

  res.status(201).json({
    status: 'success',
    data: {
      submission,
      matchStatus: match.status,
    },
  });
});

const aiReferee = require('../services/aiReferee');
const User = require('../models/User');

function computeRank(wins) {
  if (wins >= 15) return 'Gold';
  if (wins >= 5) return 'Silver';
  return 'Bronze';
}

async function completeMatch(matchId) {
  const match = await Match.findById(matchId)
    .populate('submissions'); // we assume submissions are populated or we can query them

  if (!match) throw new AppError('Match not found', 404);
  if (match.status === 'COMPLETED' && match.aiVerdictWinnerUserId) {
    return match; // already completed
  }

  const submissions = await Submission.find({ matchId });
  if (submissions.length !== 2) {
    throw new AppError('Cannot judge: Need exactly 2 submissions.', 400);
  }

  const subA = submissions[0];
  const subB = submissions[1];
  const userAId = subA.userId.toString();
  const userBId = subB.userId.toString();

  const result = await aiReferee.evaluateSubmissions({
    subA: subA.code,
    subB: subB.code,
    userAId,
    userBId
  });

  const winnerId = result.winnerUserId;
  const loserId = winnerId === userAId ? userBId : (winnerId === userBId ? userAId : null);

  if (winnerId) {
    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);

    if (winner) {
      winner.wins += 1;
      winner.rank = computeRank(winner.wins);
      await winner.save();
      await processTransaction(winnerId, 30, 'MATCH_WIN', matchId).catch(console.error);
    }
    
    if (loser) {
      loser.losses += 1;
      // rank optional to update on loss, we skip downranking for now
      await loser.save();
      await processTransaction(loserId, -10, 'MATCH_LOSS', matchId).catch(console.error);
    }
  }

  match.status = 'COMPLETED';
  match.aiVerdictWinnerUserId = winnerId;
  match.aiVerdictReason = result.reason;
  match.aiScoreA = result.scoreA;
  match.aiScoreB = result.scoreB;
  match.aiVerdictImprovementsA = result.improvementsA;
  match.aiVerdictImprovementsB = result.improvementsB;
  
  await match.save();
  return { match, result };
}

/**
 * Run AI Judge and complete match
 * POST /api/matches/:id/ai-judge
 */
exports.aiJudge = catchAsync(async (req, res, next) => {
  const { match, result } = await completeMatch(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      match,
      verdict: result
    },
  });
});

