const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');

/**
 * Process a wallet transaction atomically.
 * @param {String} userId 
 * @param {Number} amount 
 * @param {String} reason Enum reason
 * @param {String} matchId Optional match ID
 * @param {String} tournamentId Optional tournament ID
 * @returns {Number} Updated balance
 */
exports.processTransaction = async (userId, amount, reason, matchId = null, tournamentId = null) => {
  try {
    // We will use findOneAndUpdate for true atomicity even without transactions
    // If amount < 0, ensure coins >= abs(amount)
    const filter = { _id: userId };
    if (amount < 0) {
      filter.coins = { $gte: Math.abs(amount) };
    }

    const update = {
      $inc: { coins: amount }
    };

    if (reason === 'DAILY_BONUS') {
      update.$set = { lastDailyBonusAt: new Date() };
    }

    // Atomic update
    const updatedUser = await User.findOneAndUpdate(filter, update, { 
      new: true
    });

    if (!updatedUser) {
      if (amount < 0) {
        throw new AppError('Insufficient balance to perform this action.', 400);
      }
      throw new AppError('User not found.', 404);
    }

    // Create transaction log
    await Transaction.create({
      userId,
      amount,
      reason,
      matchId,
      tournamentId
    });

    return updatedUser.coins;
  } catch (error) {
    throw error;
  }
};
