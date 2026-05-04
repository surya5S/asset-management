import api from "./axiosInstance";

export const registerApi = (data) => api.post("auth/register", data);
export const loginApi = (data) => api.post("auth/login", data);
export const refreshApi = () => api.post("/auth/refresh");
export const logoutApi = () => api.post("/auth/logout");
export const forgotPasswordApi = (data) => api.post("auth/forgot-password", data);
export const resetPasswordApi = (data) => api.post("auth/reset-password", data);

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. API Layer                    - All auth-related HTTP calls in one file. Pages and hooks
                                    import from here — never call axios directly in a component.
  2. Arrow Function Exports       - Short, clean. Each function wraps one API call.
                                    Returns the axios promise — the caller handles .then / await.
  3. Implicit Return              - `(data) => api.post(...)` returns the promise without
                                    needing a `return` keyword. Single-expression arrow functions
                                    return implicitly.
*/
