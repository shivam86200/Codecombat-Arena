import api from './api';

export const getAllTournaments = () => api.get('/tournaments');
export const getTournamentById = (id) => api.get(`/tournaments/${id}`);
export const joinTournament = (id) => api.post(`/tournaments/${id}/join`);
export const getTournamentLeaderboard = (id) => api.get(`/tournaments/${id}/leaderboard`);
export const getTournaments = () => api.get('/tournaments/current'); // keeping for backwards compat
export const createAITournament = (data) => api.post('/tournaments/create-ai', data);
export const startTournament = (id) => api.post(`/tournaments/${id}/start`);
export const submitSolution = (data) => api.post('/submissions', data);
