import axios from 'axios';

/**
 * In the browser, we use relative paths (/api/...) so Next.js dev proxy
 * (configured in next.config.ts rewrites) can forward requests to
 * the Express backend at http://localhost:5000/api.
 *
 * During SSR (server-side), we need the absolute URL because there is no proxy.
 */
const getBaseURL = () => {
  if (typeof window === 'undefined') {
    // SSR — use full absolute backend URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }
  // Client browser — use relative path so Next.js proxy forwards it
  return '/api';
};

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
  withCredentials: true,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attach the JWT token from localStorage to every request
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// On 401 (expired/invalid token) — clear token and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
