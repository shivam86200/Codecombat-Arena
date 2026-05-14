import api from './api';

/** POST /api/matches/:id/ai-judge — trigger AI referee */
export const runAiJudge = (matchId) =>
  api.post(`/matches/${matchId}/ai-judge`);
