import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Send cookies automatically with every request (HttpOnly JWT)
  withCredentials: true,
});

// Optional: attach Bearer token from memory if server uses Authorization header
// api.interceptors.request.use((config) => {
//   const token = window.__authToken;
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

export default api;
