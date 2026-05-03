import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getLoans, getLoanSummary, deleteLoan } from "../../api/loans";
import LoanForm from "./LoanForm";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Landmark,
  Trash2,
  Pencil,
  CalendarClock,
  TrendingDown,
} from "lucide-react";

const fmt = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

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
    label: new Date(dueDate).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    color: "text-slate-300",
  };
}

export default function Loans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans", user?.id],
    queryFn: getLoans,
    enabled: !!user?.id,
  });

  const { data: summary } = useQuery({
    queryKey: ["loansSummary", user?.id],
    queryFn: getLoanSummary,
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loansSummary"] });
      toast.success("Loan removed.");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to remove loan."),
  });

  const handleEdit = (e, loan) => {
    e.stopPropagation();
    setEditingLoan(loan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLoan(null);
  };

  const dueSoonLoans = loans.filter(
    (l) => getDueDays(l.nextDueDate) <= 7
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Loans</h1>
          <p className="text-surface-muted text-sm mt-1">
            {loans.length} {loans.length === 1 ? "loan" : "loans"} · Total
            outstanding:{" "}
            <span className="text-red-400 font-medium">
              {fmt(summary?.totalOutstanding ?? 0)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add loan
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Total outstanding
            </p>
            <p className="text-2xl font-bold text-red-400">
              {fmt(summary.totalOutstanding)}
            </p>
          </div>
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Total disbursed
            </p>
            <p className="text-2xl font-bold text-slate-100">
              {fmt(summary.totalDisbursed)}
            </p>
          </div>
          <div className="card">
            <p className="text-surface-muted text-xs uppercase tracking-wider mb-1">
              Total paid
            </p>
            <p className="text-2xl font-bold text-green-400">
              {fmt(summary.totalPaid)}
            </p>
          </div>
        </div>
      )}

      {/* Due soon */}
      {dueSoonLoans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-slate-300 text-sm font-medium mb-3 uppercase tracking-wider flex items-center gap-2">
            <CalendarClock size={15} className="text-red-400" />
            EMI due within 7 days
          </h2>
          <div className="space-y-3">
            {dueSoonLoans.map((loan) => {
              const { label, color } = getDueLabel(loan.nextDueDate);
              return (
                <div
                  key={loan.id}
                  className="card flex items-center justify-between gap-4 border border-red-500/20"
                >
                  <div>
                    <p className="text-slate-100 text-sm font-semibold">
                      {loan.loanName}
                    </p>
                    <p className="text-surface-muted text-xs">
                      {loan.lenderName} · {loan.loanType}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">EMI</p>
                      <p className="text-slate-100 font-bold text-sm">
                        {fmt(loan.emiAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">Due</p>
                      <p className={`font-semibold text-sm ${color}`}>
                        {label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loans list */}
      {isLoading ? (
        <div className="text-center text-slate-400 mt-16">Loading...</div>
      ) : loans.length === 0 ? (
        <div className="card text-center py-16">
          <Landmark size={40} className="text-surface-muted mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No loans added yet</p>
          <p className="text-surface-muted text-sm mt-1">
            Add your first loan to start tracking EMIs
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Add loan
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-slate-300 text-sm font-medium mb-3 uppercase tracking-wider">
            All loans
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loans.map((loan) => {
              const { label: dueLabel, color: dueColor } = getDueLabel(
                loan.nextDueDate,
              );
              const progressPct = Math.min(100, loan.completionPercentage ?? 0);
              return (
                <div
                  key={loan.id}
                  className="card cursor-pointer hover:border-primary-500/50
                             transition-colors duration-200 relative group"
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  {/* Progress bar at top */}
                  <div className="h-1.5 rounded-full mb-4 bg-surface overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-slate-100 font-semibold">
                        {loan.loanName}
                      </p>
                      <p className="text-surface-muted text-xs mt-0.5">
                        {loan.lenderName} · {loan.loanType}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1
                                    opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={(e) => handleEdit(e, loan)}
                        className="btn-ghost p-1.5"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(loan);
                        }}
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Balance row */}
                  <div className="flex justify-between text-sm mb-3">
                    <div>
                      <p className="text-surface-muted text-xs">Outstanding</p>
                      <p className="text-red-400 font-semibold">
                        {fmt(loan.outstandingBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-surface-muted text-xs">EMI</p>
                      <p className="text-slate-100 font-semibold">
                        {fmt(loan.emiAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress label */}
                  <div className="flex justify-between text-xs text-surface-muted mb-1">
                    <span>{progressPct.toFixed(1)}% complete</span>
                    <span className="flex items-center gap-1">
                      <TrendingDown size={11} />
                      {loan.tenureMonths} mo tenure
                    </span>
                  </div>

                  {/* Due date */}
                  <div className="mt-3 pt-3 border-t border-surface-border flex justify-between items-center">
                    <span className="text-surface-muted text-xs">Next EMI</span>
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

      {showForm && <LoanForm loan={editingLoan} onClose={handleCloseForm} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove loan"
          message={`Remove "${deleteTarget.loanName}"? This will delete all associated transactions.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
