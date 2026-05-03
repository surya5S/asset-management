import api from "./axiosInstance";

export const getCardsApi = () => api.get("/creditcards");
export const getCardByIdApi = (cardId) => api.get(`/creditcards/${cardId}`);
export const createCardApi = (data) => api.post("/creditcards", data);
export const updateCardApi = (cardId, data) =>
  api.put(`/creditcards/${cardId}`, data);
export const deleteCardApi = (cardId) => api.delete(`/creditcards/${cardId}`);
export const getTransactionsApi = (cardId, params) =>
  api.get(`/creditcards/${cardId}/transactions`, { params });
export const addTransactionApi = (cardId, data) =>
  api.post(`/creditcards/${cardId}/transactions`, data);
export const updateTransactionApi = (cardId, transId, data) =>
  api.put(`/creditcards/${cardId}/transactions/${transId}`, data);
export const deleteTransactionApi = (cardId, transId) =>
  api.delete(`/creditcards/${cardId}/transactions/${transId}`);
export const getCardsSummaryApi = () => api.get("/creditcards/summary");
