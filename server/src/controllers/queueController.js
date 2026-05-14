const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { processTransaction } = require('../services/walletService');
const matchmaking = require('../services/matchmakingService');

const ENTRY_COST = matchmaking.ENTRY_COST; // 20

/**
 * POST /api/queue/join
 * Deducts entry coins, then enqueues user.
 */
exports.joinQueue = catchAsync(async (req, res, next) => {
  const userId = req.userId;
  const { socketId, rank } = req.body;

  if (!socketId) return next(new AppError('socketId is required.', 400));

  // Prevent double-join
  if (matchmaking.isInQueue(userId)) {
    return res.status(200).json({ status: 'success', data: { queueStatus: 'ALREADY_QUEUED' } });
  }

  // Deduct coins atomically (throws if insufficient)
  await processTransaction(userId, -ENTRY_COST, 'JOIN_MATCH');

  // Enqueue
  const result = await matchmaking.joinQueue(userId, socketId, rank || 'Bronze');

  res.status(200).json({ status: 'success', data: { queueStatus: result.status, entryCost: ENTRY_COST } });
});

/**
 * POST /api/queue/leave
 * Removes user from queue, refunds coins.
 */
exports.leaveQueue = catchAsync(async (req, res) => {
  const userId = req.userId;
  const result = await matchmaking.leaveQueue(userId, true);
  res.status(200).json({ status: 'success', data: result });
});

/**
 * GET /api/queue/status
 */
exports.queueStatus = catchAsync(async (req, res) => {
  const inQueue = matchmaking.isInQueue(req.userId);
  res.status(200).json({
    status: 'success',
    data: { inQueue, queueSize: matchmaking.getQueueSize(), entryCost: ENTRY_COST },
  });
});
