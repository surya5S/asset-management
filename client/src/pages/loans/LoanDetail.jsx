import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLoan,
  getLoanTransactions,
  deleteLoanTransaction,
  deleteRateChange,
} from "../../api/loans";
import { useAuth } from "../../context/AuthContext";
import AddTransactionDialog from "./AddTransactionDialouge";
import AddRateChangeDialog from "./AddRateChangeDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { ArrowLeft, Plus, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function LoanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteRateTarget, setDeleteRateTarget] = useState(null);

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ["loans", user?.id, parseInt(id)],
    queryFn: () => getLoan(id),
    enabled: !!user?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["loan-transactions", parseInt(id), user?.id],
    queryFn: () => getLoanTransactions(id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ loanId, txId }) => deleteLoanTransaction(loanId, txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["loan-transactions", parseInt(id), user?.id],
      });
      toast.success("Transaction deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Something went wrong"),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateChangeId) => deleteRateChange(parseInt(id), rateChangeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id, parseInt(id)] });
      toast.success("Rate change removed");
      setDeleteRateTarget(null);
    },
    onError: () => toast.error("Something went wrong"),
  });

  if (loanLoading) return <div className="p-6 text-surface-muted">Loading...</div>;
  if (!loan) return <div className="p-6 text-surface-muted">Loan not found.</div>;

  const isOverdue = new Date(loan.nextDueDate) < new Date();
  const progressPct = Math.min(100, loan.completionPercentage);
  const rateChanges = loan.rateChanges ?? [];
  const currentRate = rateChanges.length > 0
    ? rateChanges[rateChanges.length - 1].newRate
    : loan.interestRate;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/loans")}
          className="text-surface-muted hover:text-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-100">
            {loan.loanName}
          </h1>
          <p className="text-sm text-surface-muted">
            {loan.lenderName} · {loan.loanType}
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Phase Badge */}
      {loan.isInBufferPeriod ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm text-amber-400">
            Buffer Period — EMI starts {fmtDate(loan.emiStartDate)} · Pay ₹
            {loan.partialInterestAmount?.toLocaleString("en-IN")}/month partial
            interest
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
          <span className="text-sm text-green-400">
            EMI Phase — ₹{loan.emiAmount?.toLocaleString("en-IN")}/month ·{" "}
            <span className="font-medium">{currentRate}% p.a.</span>
          </span>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Outstanding" value={fmt(loan.outstandingBalance)} highlight />
        <StatCard label="Total Disbursed" value={fmt(loan.totalDisbursed)} />
        <StatCard label="Total Paid" value={fmt(loan.totalPaid)} />
        <StatCard label="Interest Accrued" value={fmt(loan.totalInterestAccrued)} muted />
      </div>

      {/* P&I Breakdown */}
      <div className="bg-surface-card rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-100">Payment Breakdown</p>
        <div className="flex justify-between text-xs text-surface-muted">
          <span>Principal paid: {fmt(loan.principalPaid)}</span>
          <span>Interest paid: {fmt(loan.interestPaid)}</span>
        </div>
        <div className="h-2 bg-surface-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-surface-muted">
          <span>{progressPct.toFixed(1)}% complete</span>
          <span>
            Next due:{" "}
            <span className={isOverdue ? "text-red-400" : ""}>
              {fmtDate(loan.nextDueDate)}
            </span>
          </span>
        </div>
      </div>

      {/* Interest Rate History */}
      <div className="bg-surface-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-100">Interest Rate History</p>
          <button
            onClick={() => setShowRateDialog(true)}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            <TrendingUp size={13} />
            Record change
          </button>
        </div>

        <div className="space-y-2">
          {/* Original rate row */}
          <div className="flex items-center justify-between py-2 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-400" />
              <div>
                <p className="text-sm text-slate-100">Original rate</p>
                <p className="text-xs text-surface-muted">{fmtDate(loan.startDate)}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-100">
              {loan.interestRate}% p.a.
            </span>
          </div>

          {/* Rate change rows */}
          {rateChanges.map((rc) => (
            <div
              key={rc.id}
              className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div>
                  <p className="text-sm text-slate-100">
                    Rate change{rc.notes ? ` · ${rc.notes}` : ""}
                  </p>
                  <p className="text-xs text-surface-muted">{fmtDate(rc.effectiveDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-amber-400">
                  {rc.newRate}% p.a.
                </span>
                <button
                  onClick={() => setDeleteRateTarget(rc)}
                  className="text-surface-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {rateChanges.length === 0 && (
            <p className="text-surface-muted text-xs text-center py-2">
              No rate changes recorded — using original rate throughout.
            </p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-surface-card rounded-xl p-4">
        <p className="text-sm font-medium text-slate-100 mb-4">Transaction History</p>

        {txLoading ? (
          <p className="text-surface-muted text-sm">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-surface-muted text-sm text-center py-6">
            No transactions yet. Add a disbursement to start tracking.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${tx.type === "Disbursement" ? "bg-amber-400" : "bg-green-400"}`}
                  />
                  <div>
                    <p className="text-sm text-slate-100">
                      {tx.type === "Disbursement"
                        ? "Disbursement"
                        : `Payment · ${tx.paymentMethod ?? ""}`}
                    </p>
                    <p className="text-xs text-surface-muted">{fmtDate(tx.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${tx.type === "Disbursement" ? "text-amber-400" : "text-green-400"}`}
                  >
                    {tx.type === "Disbursement" ? "+" : "-"}
                    {fmt(tx.amount)}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(tx)}
                    className="text-surface-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loan Terms Reference */}
      <div className="bg-surface-card rounded-xl p-4">
        <p className="text-sm font-medium text-slate-100 mb-3">Loan Terms</p>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <InfoRow label="Principal" value={fmt(loan.principalAmount)} />
          <InfoRow label="Original Rate" value={`${loan.interestRate}% p.a.`} />
          <InfoRow label="Current Rate" value={`${currentRate}% p.a.`} />
          <InfoRow label="Tenure" value={`${loan.tenureMonths} months`} />
          <InfoRow label="EMI" value={fmt(loan.emiAmount)} />
          {loan.bufferPeriodMonths > 0 && (
            <>
              <InfoRow label="Buffer Period" value={`${loan.bufferPeriodMonths} months`} />
              <InfoRow label="Partial Interest" value={fmt(loan.partialInterestAmount)} />
            </>
          )}
          <InfoRow label="Start Date" value={fmtDate(loan.startDate)} />
          <InfoRow label="EMI Start" value={fmtDate(loan.emiStartDate)} />
        </div>
      </div>

      {/* Dialogs */}
      {showAddDialog && (
        <AddTransactionDialog
          loanId={parseInt(id)}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {showRateDialog && (
        <AddRateChangeDialog
          loanId={parseInt(id)}
          currentRate={currentRate}
          onClose={() => setShowRateDialog(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete this ${deleteTarget.type.toLowerCase()} of ${fmt(deleteTarget.amount)}? The loan balance will be recalculated automatically.`}
          onConfirm={() =>
            deleteMutation.mutate({ loanId: parseInt(id), txId: deleteTarget.id })
          }
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}

      {deleteRateTarget && (
        <ConfirmDialog
          message={`Remove the ${deleteRateTarget.newRate}% rate change from ${fmtDate(deleteRateTarget.effectiveDate)}? Interest will be recalculated using the previous rate from that date.`}
          onConfirm={() => deleteRateMutation.mutate(deleteRateTarget.id)}
          onCancel={() => setDeleteRateTarget(null)}
          loading={deleteRateMutation.isPending}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, highlight, muted }) {
  return (
    <div className="bg-surface-card rounded-xl p-3">
      <p className="text-xs text-surface-muted mb-1">{label}</p>
      <p
        className={`text-base font-semibold ${highlight ? "text-primary-400" : muted ? "text-surface-muted" : "text-slate-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <>
      <span className="text-surface-muted">{label}</span>
      <span className="text-slate-100">{value}</span>
    </>
  );
}

// WHAT'S NEW VS OLD LoanDetail:
//
// Phase Badge:
//   Shows clearly whether the loan is in buffer period or EMI phase.
//   During buffer: shows the partial interest amount the user should be paying.
//   After buffer: confirms EMI amount.
//
// Balance Cards:
//   All four values come from the backend's LoanCalculationService.
//   None of them are stored — they're calculated fresh on every loan fetch.
//   Outstanding is highlighted as the primary number.
//
// Transaction list:
//   Disbursements (amber) vs Payments (green) — color-coded for quick scanning.
//   + for disbursements (money in), - for payments (money out).
//   Delete confirmation mentions "balance will be recalculated" — sets expectations.
//
// "Add" button (top right):
//   Opens AddTransactionDialog — handles both disbursements and payments.
//   No separate "Record Payment" button anymore.
