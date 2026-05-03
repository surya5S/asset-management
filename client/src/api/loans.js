import api from "./axiosInstance";

export const getLoans = () => api.get("/loans").then((r) => r.data);
export const getLoanSummary = () => api.get("/loans/summary").then((r) => r.data);
export const getLoan = (loanId) => api.get(`/loans/${loanId}`).then((r) => r.data);
export const createLoan = (data) => api.post("/loans", data).then((r) => r.data);
export const updateLoan = (loanId, data) => api.put(`/loans/${loanId}`, data).then((r) => r.data);
export const deleteLoan = (loanId) => api.delete(`/loans/${loanId}`).then((r) => r.data);

export const addRateChange = (loanId, data) =>
  api.post(`/loans/${loanId}/rate-changes`, data).then((r) => r.data);
export const deleteRateChange = (loanId, rateChangeId) =>
  api.delete(`/loans/${loanId}/rate-changes/${rateChangeId}`).then((r) => r.data);

export const getLoanTransactions = (loanId) =>
  api.get(`/loans/${loanId}/transactions`).then((r) => r.data);
export const addLoanTransaction = (loanId, data) =>
  api.post(`/loans/${loanId}/transactions`, data).then((r) => r.data);
export const deleteLoanTransaction = (loanId, transactionId) =>
  api.delete(`/loans/${loanId}/transactions/${transactionId}`).then((r) => r.data);
