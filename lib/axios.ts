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
// On 401 (expired/invalid token) — try to refresh access token silently.
// If refresh also fails, clear session and redirect to login.
let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const flushQueue = (error: any, token: string | null = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  pendingQueue = [];
};

export const refreshAccessToken = async (): Promise<string> => {
  if (typeof window === 'undefined') throw new Error('Client-side only');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await axiosClient.post('/auth/refresh', { refreshToken });
  const newToken: string = data?.data?.token || data?.data?.accessToken || '';
  const newRefreshToken: string = data?.data?.refreshToken || refreshToken;

  if (!newToken) throw new Error('No token returned from refresh');

  localStorage.setItem('token', newToken);
  localStorage.setItem('refreshToken', newRefreshToken);
  axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  return newToken;
};

const forceLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 responses (not refresh endpoint itself)
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // If another request is already refreshing, queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        forceLogout();
        return Promise.reject(error);
      }

      try {
        // Call the backend refresh endpoint
        const { data } = await axiosClient.post('/auth/refresh', { refreshToken });
        const newToken: string = data?.data?.token || data?.data?.accessToken || '';
        const newRefreshToken: string = data?.data?.refreshToken || refreshToken;

        if (!newToken) throw new Error('No token returned from refresh');

        // Persist the new tokens
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update default auth header
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // Flush pending requests with the new token
        flushQueue(null, newToken);

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
