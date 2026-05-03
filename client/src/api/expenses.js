import api from "./axiosInstance";

export const createExpenseApi = (data) => api.post("/expenses", data);
export const getExpensesApi = (params) => api.get("/expenses", { params });
export const getExpenseByIdApi = (id) => api.get(`/expenses/${id}`);
export const updateExpenseApi = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpenseApi = (id) => api.delete(`/expenses/${id}`);
export const getExpenseSummary = (year, month) =>
  api.get("/expenses/summary", {
    params: { year, month },
  });

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. params object in axios       - Passing `{ params }` to axios automatically serializes
                                    the object as query parameters: ?year=2025&month=3.
                                    No manual string building needed.
  2. Template Literals            - `\`/expenses/${id}\`` builds the URL dynamically with
                                    the expense ID embedded in the path.
  3. Consistent API Layer         - All expense HTTP calls in one place. If the base URL
                                    or endpoint changes, you fix it here — not in 10 components.
*/
