const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { processTransaction } = require('../services/walletService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * Claim Daily Bonus (+10 coins)
 * POST /api/wallet/daily-bonus
 */
exports.claimDailyBonus = catchAsync(async (req, res, next) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Check if claimed in the last 24 hours
  if (user.lastDailyBonusAt) {
    const timeSinceLastBonus = Date.now() - user.lastDailyBonusAt.getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (timeSinceLastBonus < ONE_DAY) {
      return next(new AppError('Already claimed today. Please come back later.', 400));
    }
  }

  // Process Daily Bonus
  const newBalance = await processTransaction(userId, 10, 'DAILY_BONUS');

  res.status(200).json({
    status: 'success',
    message: 'Daily bonus claimed successfully!',
    data: {
      coins: newBalance
    }
  });
});
/**
 * Add Coins for Testing (Dev only)
 * POST /api/wallet/dev-coins
 */
exports.addDevCoins = catchAsync(async (req, res, next) => {
  const userId = req.userId;
  const { amount = 400 } = req.body;

  const newBalance = await processTransaction(userId, amount, 'SIGNUP');

  res.status(200).json({
    status: 'success',
    message: `${amount} Testing coins added successfully!`,
    data: {
      coins: newBalance
    }
  });
});

/**
 * Get User Ledger
 * GET /api/wallet/ledger
 */
exports.getLedger = catchAsync(async (req, res, next) => {
  const userId = req.userId;

  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100); // Limit to recent 100 for performance

  const user = await User.findById(userId).select('coins');

  res.status(200).json({
    status: 'success',
    data: {
      balance: user.coins,
      transactions
    }
  });
});
