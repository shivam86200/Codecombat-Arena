import api from './api';

/**
 * Fetch sorted leaderboard entries.
 * GET /api/leaderboard
 */
export const getLeaderboard = () => api.get('/leaderboard');
