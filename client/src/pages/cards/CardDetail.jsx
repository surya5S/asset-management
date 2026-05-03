import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getTransactionsApi,
  addTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
} from "../../api/cards";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  X,
  Percent,
} from "lucide-react";

const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Travel",
  "Payment",
  "Other",
];

const defaultTxn = {
  title: "",
  amount: "",
  category: "Shopping",
  type: 0,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function CardDetail({ card, onBack }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();

  const [txnFilters, setTxnFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [txnForm, setTxnForm] = useState(defaultTxn);
  const [editingTxn, setEditingTxn] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", user?.id, card.id, txnFilters],
    queryFn: () => getTransactionsApi(card.id, txnFilters).then((r) => r.data),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: (data) => addTransactionApi(card.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", user?.id, card.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cardsSummary"] });
      toast.success("Transaction added.");
      setShowTxnForm(false);
      setTxnForm(defaultTxn);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTransactionApi(card.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", user?.id, card.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cardsSummary"] });
      toast.success("Transaction updated.");
      setEditingTxn(null);
      setEditForm(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: (txnId) => deleteTransactionApi(card.id, txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", user?.id, card.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cardsSummary"] });
      toast.success("Transaction deleted.");
      setDeleteTarget(null);
    },
  });

  const handleTxnChange = (e) => {
    setTxnForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTxnSubmit = (e) => {
    e.preventDefault();
    if (!txnForm.amount || +txnForm.amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }
    addMutation.mutate({
      ...txnForm,
      amount: +txnForm.amount,
      type: +txnForm.type,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.amount || +editForm.amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }
    updateMutation.mutate({
      id: editingTxn.id,
      data: {
        title: editForm.title,
        amount: +editForm.amount,
        category: editForm.category,
        date: editForm.date,
        notes: editForm.notes,
      },
    });
  };

  const startEdit = (txn) => {
    setEditingTxn(txn);
    setEditForm({
      title: txn.title,
      amount: txn.amount,
      category: txn.category,
      date: new Date(txn.date).toISOString().split("T")[0],
      notes: txn.notes ?? "",
    });
    setShowTxnForm(false);
  };

  const cancelEdit = () => {
    setEditingTxn(null);
    setEditForm(null);
  };

  const fmt = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const totalDebits = transactions
    .filter((t) => t.type === "Debit")
    .reduce((s, t) => s + t.amount, 0);

  const totalCredits = transactions
    .filter((t) => t.type === "Credit")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="btn-ghost flex items-center gap-2 mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Back to cards
      </button>

      {/* Card header */}
      <div className="card mb-6">
        <div
          className="h-1.5 rounded-full mb-4"
          style={{ background: card.cardColor }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {card.cardName}
            </h1>
            <p className="text-surface-muted text-sm">
              {card.bankName} · •••• {card.lastFourDigits}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right">
            <div>
              <p className="text-surface-muted text-xs">Balance</p>
              <p className="text-red-400 font-bold">
                {fmt(card.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-surface-muted text-xs">Available</p>
              <p className="text-green-400 font-bold">
                {fmt(card.availableCredit)}
              </p>
            </div>
            <div>
              <p className="text-surface-muted text-xs">Due</p>
              <p className="text-amber-400 font-bold">
                {new Date(card.nextDueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Utilization */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-surface-muted mb-1">
            <span>Utilization · {card.utilizationPercentage}%</span>
            <span>{fmt(card.creditLimit)} limit</span>
          </div>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                card.utilizationPercentage >= 70
                  ? "bg-red-400"
                  : card.utilizationPercentage >= 40
                    ? "bg-amber-400"
                    : "bg-green-400"
              }`}
              style={{ width: `${Math.min(card.utilizationPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* APR info */}
        <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-surface-muted">
            <Percent size={12} />
            {card.interestRate}% APR
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-green-400">
              Interest-free until{" "}
              {new Date(card.nextDueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className={new Date(card.aprEndDate) < new Date() ? "text-red-400" : "text-surface-muted"}>
              {new Date(card.aprEndDate) < new Date()
                ? "APR expired"
                : `APR ends ${new Date(card.aprEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-surface-muted text-xs">Spent this period</p>
            <p className="text-red-400 font-bold">{fmt(totalDebits)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingDown size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-surface-muted text-xs">Paid this period</p>
            <p className="text-green-400 font-bold">{fmt(totalCredits)}</p>
          </div>
        </div>
      </div>

      {/* Transactions header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <select
            value={txnFilters.month}
            onChange={(e) =>
              setTxnFilters((p) => ({ ...p, month: +e.target.value }))
            }
            className="input-field w-auto text-sm"
          >
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ].map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={txnFilters.year}
            onChange={(e) =>
              setTxnFilters((p) => ({ ...p, year: +e.target.value }))
            }
            className="input-field w-auto text-sm"
          >
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i,
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setShowTxnForm((p) => !p);
            cancelEdit();
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusCircle size={15} />
          Add transaction
        </button>
      </div>

      {/* Add transaction form */}
      {showTxnForm && (
        <div className="card mb-4">
          <form onSubmit={handleTxnSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  value={txnForm.title}
                  onChange={handleTxnChange}
                  className="input-field"
                  placeholder="e.g. Amazon purchase"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount ($)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={txnForm.amount}
                  onChange={handleTxnChange}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <select
                  name="type"
                  value={txnForm.type}
                  onChange={handleTxnChange}
                  className="input-field"
                >
                  <option value={0}>Debit (spent)</option>
                  <option value={1}>Credit (payment)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  name="category"
                  value={txnForm.category}
                  onChange={handleTxnChange}
                  className="input-field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  name="date"
                  type="date"
                  value={txnForm.date}
                  onChange={handleTxnChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTxnForm(false)}
                className="btn-ghost flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="btn-primary flex-1 text-sm"
              >
                {addMutation.isPending ? "Adding..." : "Add transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction list */}
      {isLoading ? (
        <div className="text-center text-slate-400 mt-8">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center mt-12">
          <p className="text-slate-400 text-sm">No transactions for this period.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => (
            <div key={txn.id}>
              {/* Edit form inline */}
              {editingTxn?.id === txn.id ? (
                <div className="card mb-0 border border-primary-500/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-slate-300 text-sm font-medium">Edit transaction</p>
                    <button onClick={cancelEdit} className="btn-ghost p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <form onSubmit={handleEditSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Title</label>
                        <input
                          name="title"
                          type="text"
                          value={editForm.title}
                          onChange={handleEditChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Amount ($)</label>
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.amount}
                          onChange={handleEditChange}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Type</label>
                        <input
                          className="input-field bg-surface-border/30 cursor-not-allowed text-surface-muted"
                          value={txn.type}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Category</label>
                        <select
                          name="category"
                          value={editForm.category}
                          onChange={handleEditChange}
                          className="input-field"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Date</label>
                        <input
                          name="date"
                          type="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn-ghost flex-1 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="btn-primary flex-1 text-sm"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className={`card flex items-center justify-between py-3 ${
                  txn.category === "Interest" ? "border border-amber-500/20" : ""
                }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        txn.category === "Interest"
                          ? "bg-amber-500/10"
                          : txn.type === "Debit"
                            ? "bg-red-500/10"
                            : "bg-green-500/10"
                      }`}
                    >
                      {txn.category === "Interest" ? (
                        <Percent size={14} className="text-amber-400" />
                      ) : txn.type === "Debit" ? (
                        <TrendingUp size={14} className="text-red-400" />
                      ) : (
                        <TrendingDown size={14} className="text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-slate-100 text-sm font-medium">{txn.title}</p>
                      <p className="text-surface-muted text-xs">
                        {txn.category} · {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-semibold text-sm ${
                        txn.category === "Interest"
                          ? "text-amber-400"
                          : txn.type === "Debit"
                            ? "text-red-400"
                            : "text-green-400"
                      }`}
                    >
                      -{fmt(txn.amount)}
                    </span>
                    {txn.category !== "Interest" && (
                      <button
                        onClick={() => startEdit(txn)}
                        className="btn-ghost p-1.5"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(txn)}
                      className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete transaction"
          message={`Delete "${deleteTarget.title}" for ${fmt(deleteTarget.amount)}? This will reverse the balance on your card.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
