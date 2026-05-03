import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const isRefreshUrl = originalRequest.url?.includes("/auth/refresh");
    const isLoginUrl = originalRequest.url?.includes("/auth/login");

    // Don't attempt refresh on auth endpoints themselves
    if (!is401 || isRetry || isRefreshUrl || isLoginUrl) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark this request as retried and start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");
      const newToken = data.accessToken;

      localStorage.setItem("accessToken", newToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. withCredentials: true        - Tells axios to send cookies on every request including
                                    cross-origin ones. Without this the httpOnly refresh
                                    token cookie is never sent to the server.
  2. isRefreshing flag            - Prevents multiple simultaneous refresh calls. If 3
                                    requests fire at the same time and all get 401, only
                                    ONE refresh call goes out. The other two wait in queue.
  3. failedQueue array            - Holds the resolve/reject functions of requests that
                                    arrived while a refresh was already in flight.
                                    Once refresh completes, processQueue replays them all
                                    with the new token.
  4. processQueue                 - Iterates the queue and either resolves (success) or
                                    rejects (failure) each waiting promise. After processing,
                                    the queue is emptied for the next cycle.
  5. originalRequest._retry       - A flag stamped on the request config. Prevents infinite
                                    loops — if the retried request gets another 401, the
                                    interceptor sees _retry=true and doesn't try again.
  6. isRefreshUrl / isLoginUrl    - Guards against intercepting 401s from the refresh and
                                    login endpoints themselves. A 401 from /auth/refresh
                                    means the refresh token is expired — don't loop.
  7. api(originalRequest)         - Replays the original failed request with the new token.
                                    The user never sees the failure — it's transparent.
  8. window.dispatchEvent         - Fires a custom browser event instead of calling logout
                                    directly. axiosInstance has no access to React state
                                    or context — the event bridges that gap. AuthContext
                                    listens for this event and clears state.
  9. api.defaults.headers         - Updates the default header for all future requests too,
                                    not just the retried one. Keeps subsequent requests
                                    from getting 401s before the next manual token read.
  10. Race condition handling      - The queue pattern solves the classic race condition:
                                    without it, 3 simultaneous 401s → 3 refresh calls →
                                    first one succeeds, second and third fail because the
                                    refresh token was already rotated. Queue = one refresh,
                                    all three requests succeed.
*/
