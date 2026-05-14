const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { computeRank } = require('../utils/rank');

/**
 * Update user stats (wins/losses)
 * PATCH /api/users/:id/stats
 */
exports.updateStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { winsDelta = 0, lossesDelta = 0 } = req.body;

  // Ensure user is only updating their own stats
  // (req.userId is set by authRequired middleware)
  if (req.userId.toString() !== id) {
    return next(new AppError('You can only update your own stats.', 403));
  }

  // Find user
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Increment stats
  user.wins += Number(winsDelta);
  user.losses += Number(lossesDelta);

  // Prevent negative stats
  if (user.wins < 0) user.wins = 0;
  if (user.losses < 0) user.losses = 0;

  // Recompute rank
  user.rank = computeRank(user.wins);

  // Save changes
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

/**
 * Get Leaderboard
 * GET /api/leaderboard?limit=50
 */
exports.getLeaderboard = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 50;

  const leaderboard = await User.find()
    .sort({ wins: -1, losses: 1 })
    .limit(limit)
    .select('name wins losses coins rank');

  res.status(200).json({
    status: 'success',
    results: leaderboard.length,
    data: {
      leaderboard,
    },
  });
});
