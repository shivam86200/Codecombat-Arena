/**
 * In-memory matchmaking queue.
 * When 2 players are queued, creates a match and notifies both via Socket.IO.
 */
const Match = require('../models/Match');
const { processTransaction } = require('./walletService');

const ENTRY_COST = 20; // coins
const PROBLEMS = ['two-sum', 'valid-parentheses', 'longest-substring', 'merge-intervals', 'binary-search', 'lru-cache'];

// Queue: Map<userId(string), { userId, socketId, rank, joinedAt }>
const queue = new Map();

// Track users currently in a match to prevent double-join
const inMatch = new Set();

let io = null; // injected from server.js

exports.ENTRY_COST = ENTRY_COST;

exports.setIo = (socketIo) => { io = socketIo; };

exports.getQueueSize = () => queue.size;

/** Add user to queue. Returns { status, message } */
exports.joinQueue = async (userId, socketId, rank = 'Bronze') => {
  if (inMatch.has(userId.toString())) {
    return { status: 'IN_MATCH', message: 'You are already in a match.' };
  }
  if (queue.has(userId.toString())) {
    return { status: 'ALREADY_QUEUED', message: 'You are already searching for a match.' };
  }

  queue.set(userId.toString(), { userId, socketId, rank, joinedAt: Date.now() });
  console.log(`[Queue] User ${userId} joined. Queue size: ${queue.size}`);

  // Try to match immediately
  await tryMatch();

  return { status: 'QUEUED', message: 'Added to matchmaking queue.' };
};

/** Remove user from queue and optionally refund */
exports.leaveQueue = async (userId, refund = true) => {
  const entry = queue.get(userId.toString());
  if (!entry) return { status: 'NOT_IN_QUEUE' };

  queue.delete(userId.toString());
  console.log(`[Queue] User ${userId} left. Queue size: ${queue.size}`);

  if (refund) {
    try {
      await processTransaction(userId, ENTRY_COST, 'QUEUE_REFUND');
    } catch (e) {
      console.error('[Queue] Refund failed:', e.message);
    }
  }

  return { status: 'LEFT_QUEUE' };
};

/** Check if user is in queue */
exports.isInQueue = (userId) => queue.has(userId.toString());

/** Called when socket disconnects */
exports.handleDisconnect = async (socketId) => {
  for (const [userId, entry] of queue.entries()) {
    if (entry.socketId === socketId) {
      queue.delete(userId);
      console.log(`[Queue] User ${userId} disconnected, removed from queue.`);
      try {
        await processTransaction(userId, ENTRY_COST, 'QUEUE_REFUND');
      } catch (e) { /* ignore */ }
      break;
    }
  }
};

exports.markInMatch = (userId) => inMatch.add(userId.toString());
exports.clearInMatch = (userId) => inMatch.delete(userId.toString());

/** Core matchmaker — pairs first two users in queue */
async function tryMatch() {
  if (queue.size < 2) return;

  const entries = Array.from(queue.values());
  const playerA = entries[0];
  const playerB = entries[1];

  // Remove both from queue
  queue.delete(playerA.userId.toString());
  queue.delete(playerB.userId.toString());

  // Mark as in-match to prevent re-queue
  inMatch.add(playerA.userId.toString());
  inMatch.add(playerB.userId.toString());

  console.log(`[Queue] Matched: ${playerA.userId} vs ${playerB.userId}`);

  try {
    // Pick random problem
    const problemId = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];

    // Create match in DB
    const match = await Match.create({
      createdBy: playerA.userId,
      opponent:  playerB.userId,
      problemId,
      status: 'ACTIVE',
    });

    const matchId = match._id.toString();

    // Notify both players via Socket.IO
    if (io) {
      io.to(playerA.socketId).emit('MATCH_FOUND', { matchId, problemId });
      io.to(playerB.socketId).emit('MATCH_FOUND', { matchId, problemId });
    }

    console.log(`[Queue] Match ${matchId} created (${problemId})`);
  } catch (err) {
    console.error('[Queue] Match creation failed:', err.message);
    // Refund both
    inMatch.delete(playerA.userId.toString());
    inMatch.delete(playerB.userId.toString());
    try { await processTransaction(playerA.userId, ENTRY_COST, 'QUEUE_REFUND'); } catch {}
    try { await processTransaction(playerB.userId, ENTRY_COST, 'QUEUE_REFUND'); } catch {}
  }
}

/** Cleanup: remove users who waited >90 seconds */
setInterval(async () => {
  const now = Date.now();
  for (const [userId, entry] of queue.entries()) {
    if (now - entry.joinedAt > 90_000) {
      queue.delete(userId);
      console.log(`[Queue] User ${userId} timed out.`);
      try { await processTransaction(userId, ENTRY_COST, 'QUEUE_REFUND'); } catch {}
      if (io) io.to(entry.socketId).emit('QUEUE_TIMEOUT', { message: 'No opponent found. Coins refunded.' });
    }
  }
}, 10_000);
