import api from './api';

/** POST /api/matches — create a new match */
export const createMatch = (problemId) =>
  api.post('/matches', { problemId });

/** GET /api/matches/:id — fetch match details */
export const getMatch = (id) =>
  api.get(`/matches/${id}`);

/** POST /api/matches/:id/submit — submit code (saves to DB) */
export const submitCode = (id, code, language, resultSummary = '') =>
  api.post(`/matches/${id}/submit`, { code, language, resultSummary });

/** POST /api/judge/run — run against 3 sample test cases */
export const runCode = (problemId, code, language) =>
  api.post('/judge/run', { problemId, code, language });

/** POST /api/judge/submit — run against all test cases */
export const judgeSubmit = (problemId, code, language) =>
  api.post('/judge/submit', { problemId, code, language });
