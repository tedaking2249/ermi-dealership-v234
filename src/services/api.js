import axios from 'axios';

const TOKEN_KEY = 'ermi_token';

// Fired when the server rejects our token (expired, deactivated, etc.)
export const UNAUTHORIZED_EVENT = 'ermi:unauthorized';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private window, quota): the session just will not survive a refresh
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Generous, because the free database can take a few seconds to wake up
  timeout: 30000,
});

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our token is no good, end the session everywhere
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

// Turns any request error into a message that is safe to show the user
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};

export default api;