/**
 * Central route registry.
 * Mount all route files here — keeps server.js clean.
 */
const healthRoutes      = require('./health.routes');
const authRoutes        = require('./auth.routes');
const userRoutes        = require('./user.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const matchRoutes       = require('./match.routes');
const tournamentRoutes  = require('./tournament.routes');
const walletRoutes      = require('./wallet.routes');
const judgeRoutes       = require('./judge.routes');
const queueRoutes       = require('./queue.routes');
const submissionRoutes  = require('./submission.routes');

module.exports = (app) => {
  // Root route - informative response
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'CodeCombat Arena API is running. Use /api/health for system status.',
      docs: '/api/docs (if implemented)'
    });
  });

  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/tournaments', tournamentRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/judge', judgeRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/submissions', submissionRoutes);
};
