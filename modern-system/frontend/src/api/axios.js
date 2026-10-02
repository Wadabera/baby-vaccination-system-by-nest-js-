import axios from "axios";

/**
 * In development the Vite server proxies /api to the backend, so a relative
 * baseURL works and no CORS preflight is involved. VITE_API_URL can override
 * this for deployments where the API lives on another origin.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

export const TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const SESSION_TOKEN_KEY = "sessionToken";
export const USER_KEY = "user";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Sent when present so the backend can track and invalidate single sessions.
  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
  if (sessionToken) {
    config.headers["x-session-token"] = sessionToken;
  }

  return config;
});

// Avoids a refresh storm when several requests fail at the same time.
let refreshPromise = null;

const clearSession = () => {
  for (const key of [
    TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_TOKEN_KEY,
    USER_KEY,
  ]) {
    localStorage.removeItem(key);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Retry once after refreshing an expired access token.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      refreshToken
    ) {
      original._retried = true;
      try {
        refreshPromise =
          refreshPromise ??
          axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { data } = await refreshPromise;
        refreshPromise = null;

        localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearSession();
        // A hard refresh guarantees the UI drops back to the login screen.
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
