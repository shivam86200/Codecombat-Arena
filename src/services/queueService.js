import api from './api';

export const joinQueue   = (socketId, rank) => api.post('/queue/join',  { socketId, rank });
export const leaveQueue  = ()               => api.post('/queue/leave');
export const queueStatus = ()               => api.get('/queue/status');
