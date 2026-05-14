import api from './api';

/**
 * Fetch a single user's profile by ID.
 * GET /api/users/:id
 */
export const getUser = (id) => api.get(`/users/${id}`);

/**
 * Patch user stats (wins / losses) after a match.
 * PATCH /api/users/:id/stats
 * body: { result: 'win' | 'loss' }
 */
export const updateStats = (id, result) =>
  api.patch(`/users/${id}/stats`, { result });
