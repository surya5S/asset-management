import api from "./axiosInstance";

// months: 1 = monthly, 3 = quarterly, 12 = yearly
export const getDashboardSummary = (months = 6) =>
  api.get(`/dashboard/summary?months=${months}`).then((r) => r.data);

// WHY PASS MONTHS HERE:
//   React Query caches by key. ['dashboard', userId, months] means
//   switching from monthly → quarterly hits the cache if already fetched,
//   and only calls the API on the first switch to each period.
