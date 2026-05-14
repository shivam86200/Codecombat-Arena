const express = require('express');
const tournamentController = require('../controllers/tournamentController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', tournamentController.getAllTournaments);
router.get('/current', tournamentController.getCurrentTournament);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/leaderboard', tournamentController.getTournamentLeaderboard);

// Seed route (public for testing purposes)
router.post('/seed', tournamentController.seedTournament);

// Protected routes
router.use(authRequired);
router.post('/create-ai', tournamentController.createAITournament);
router.post('/:id/join', tournamentController.joinTournament);
router.post('/:id/start', tournamentController.startTournament);

module.exports = router;
