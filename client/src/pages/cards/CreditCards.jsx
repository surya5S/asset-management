import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getCardsApi,
  deleteCardApi,
  addTransactionApi,
  getCardsSummaryApi,
} from "../../api/cards";
import CardForm from "./CardForm";
import CardDetail from "./CardDetail";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PaymentDialog from "../../components/common/PaymentDialog";
import toast from "react-hot-toast";
import {
  PlusCircle,
  CreditCard,
  Trash2,
  Pencil,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
} from "lucide-react";

function UtilizationBar({ percentage }) {
  const color =
    percentage >= 70
      ? "bg-red-400"
      : percentage >= 30
        ? "bg-amber-400"
        : "bg-green-400";

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-surface-muted mb-1">
        <span>Utilization</span>
        <span
          className={
            percentage >= 70
              ? "text-red-400"
              : percentage >= 40
                ? "text-amber-400"
                : "text-green-400"
          }
        >
          {percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function getDueDays(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function getDueLabel(dueDate) {
  const days = getDueDays(dueDate);
  if (days < 0) return { label: "Overdue", color: "text-red-400" };
  if (days === 0) return { label: "Due today", color: "text-red-400" };
  if (days <= 7) return { label: `Due in ${days}d`, color: "text-red-400" };
  return {
    label: new Date(dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    color: "text-slate-300",
  };
}

export default function CreditCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards", user?.id],
    queryFn: () => getCardsApi().then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: summary } = useQuery({
    queryKey: ["cardsSummary", user?.id],
    queryFn: () => getCardsSummaryApi().then((r) => r.data),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCardApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cardsSummary"] });
      toast.success("Card removed.");
      setDeleteTarget(null);
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ card, amount }) =>
      addTransactionApi(card.id, {
        title: "Payment",
        amount,
        category: "Payment",
        type: 1,
        date: new Date().toISOString().split("T")[0],
        notes: "Card payment",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cardsSummary"] });
      toast.success("Payment recorded.");
      setPayTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed."),
  });

  const handleEdit = (card) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCard(null);
  };

  const fmt = (n = 0) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const dueSoonCards = cards.filter(
    (c) => getDueDays(c.nextDueDate) <= 7 && c.cycleBalance > 0
  );

  if (activeCard) {
    return <CardDetail card={activeCard} onBack={() => setActiveCard(null)} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Credit Cards</h1>
          <p className="text-surface-muted text-sm mt-1">
            {cards.length} {cards.length === 1 ? "card" : "cards"} · Total
            balance:{" "}
            <span className="text-red-400 font-medium">
              {fmt(summary?.totalBalance ?? 0)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add card
        </button>
      </div>

      {/* Spend summary: daily / monthly / yearly */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-surface-muted text-xs uppercase tracking-wider">
                Today
              </p>
              <p className="text-slate-100 font-bold">
                {fmt(summary.todaySpend)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-surface-muted text-xs uppercase tracking-wider">
                This month
              </p>
              <p className="text-slate-100 font-bold">
                {fmt(summary.monthlySpend)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-surface-muted text-xs uppercase tracking-wider">
                This year
              </p>
              <p className="text-slate-100 font-bold">
                {fmt(summary.yearlySpend)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall stats row */}
      {cards.length > 0 && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Total balance
            </p>
            <p className="text-2xl font-bold text-red-400">
              {fmt(summary.totalBalance)}
            </p>
          </div>
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Total limit
            </p>
            <p className="text-2xl font-bold text-slate-100">
              {fmt(summary.totalLimit)}
            </p>
          </div>
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Available credit
            </p>
            <p className="text-2xl font-bold text-green-400">
              {fmt(summary.totalAvailable)}
            </p>
          </div>
        </div>
      )}

      {/* Dues Dashboard */}
      {dueSoonCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-slate-300 text-sm font-medium mb-3 uppercase tracking-wider flex items-center gap-2">
            <CalendarClock size={15} className="text-red-400" />
            Dues within 7 days
          </h2>
          <div className="space-y-3">
            {dueSoonCards.map((card) => {
              const { label, color } = getDueLabel(card.nextDueDate);
              return (
                <div
                  key={card.id}
                  className="card flex items-center justify-between gap-4 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: card.cardColor }}
                    />
                    <div>
                      <p className="text-slate-100 text-sm font-semibold">
                        {card.cardName}
                      </p>
                      <p className="text-surface-muted text-xs">
                        {card.bankName} · •••• {card.lastFourDigits}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">Cycle Due</p>
                      <p className="text-red-400 font-bold text-sm">
                        {fmt(card.cycleBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">Due</p>
                      <p className={`font-semibold text-sm ${color}`}>
                        {label}
                      </p>
                    </div>
                    <button
                      onClick={() => setPayTarget(card)}
                      className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
                    >
                      <CheckCircle2 size={13} />
                      Mark as Paid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="text-center text-slate-400 mt-16">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="card text-center py-16">
          <CreditCard size={40} className="text-surface-muted mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No cards added yet</p>
          <p className="text-surface-muted text-sm mt-1">
            Add your first credit card to start tracking
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Add card
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-slate-300 text-sm font-medium mb-3 uppercase tracking-wider">
            All cards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card) => {
              const { label: dueLabel, color: dueColor } = getDueLabel(
                card.nextDueDate,
              );
              return (
                <div
                  key={card.id}
                  className="card cursor-pointer hover:border-primary-500/50
                             transition-colors duration-200 relative group"
                  onClick={() => setActiveCard(card)}
                >
                  {/* Card top bar color */}
                  <div
                    className="h-1.5 rounded-full mb-4"
                    style={{ background: card.cardColor }}
                  />

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-slate-100 font-semibold">
                        {card.cardName}
                      </p>
                      <p className="text-surface-muted text-xs mt-0.5">
                        {card.bankName}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1
                                    opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(card);
                        }}
                        className="btn-ghost p-1.5"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(card);
                        }}
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Card number */}
                  <p className="text-surface-muted text-sm font-mono tracking-widest mb-4">
                    •••• •••• •••• {card.lastFourDigits}
                  </p>

                  {/* Balance / Available row */}
                  <div className="flex justify-between text-sm mb-1">
                    <div>
                      <p className="text-surface-muted text-xs">Balance</p>
                      <p className="text-red-400 font-semibold">
                        {fmt(card.currentBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">Available</p>
                      <p className="text-green-400 font-semibold">
                        {fmt(card.availableCredit)}
                      </p>
                    </div>
                  </div>

                  <UtilizationBar percentage={card.utilizationPercentage} />

                  {/* Due date */}
                  <div
                    className="mt-3 pt-3 border-t border-surface-border flex
                                  justify-between items-center"
                  >
                    <span className="text-surface-muted text-xs">Next due</span>
                    <span className={`text-xs font-medium ${dueColor}`}>
                      {dueLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showForm && <CardForm card={editingCard} onClose={handleCloseForm} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove card"
          message={`Remove "${deleteTarget.cardName}" ending in ${deleteTarget.lastFourDigits}? Transaction history will be preserved.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {payTarget && (
        <PaymentDialog
          card={payTarget}
          onConfirm={(amount) => payMutation.mutate({ card: payTarget, amount })}
          onCancel={() => setPayTarget(null)}
        />
      )}
    </div>
  );
}
