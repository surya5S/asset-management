import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addLoanTransaction } from "../../api/loans";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  "Cash",
  "DebitCard",
  "CreditCard",
  "BankTransfer",
  "UPI",
  "Other",
];

export default function AddTransactionDialog({ loanId, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    type: 1, // Default to Payment (most common action)
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: 4, // Default to UPI
    notes: "",
  });

  const isDisbursement = parseInt(form.type, 10) === 0;

  const mutation = useMutation({
    mutationFn: (data) => addLoanTransaction(loanId, data),
    onSuccess: () => {
      // Invalidate both — transaction list changed AND loan balance changed
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["loan-transactions", loanId, user?.id],
      });
      toast.success(isDisbursement ? "Disbursement recorded" : "Payment added");
      onClose();
    },
    onError: () => toast.error("Something went wrong"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      type: parseInt(form.type, 10),
      amount: parseFloat(form.amount),
      date: form.date,
      // Send null for disbursements — backend validates this
      paymentMethod: isDisbursement ? null : parseInt(form.paymentMethod, 10),
      notes: form.notes || null,
    });
  };

  const inputClass =
    "w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary";
  const labelClass = "block text-xs text-text-muted mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-1 rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-5">
          Add Transaction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type — most important field, shown first */}
          <div>
            <label className={labelClass}>Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 1 }))}
                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                  !isDisbursement
                    ? "bg-primary border-primary text-white"
                    : "border-white/10 text-text-muted hover:text-text-primary"
                }`}
              >
                Payment
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 0 }))}
                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                  isDisbursement
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-white/10 text-text-muted hover:text-text-primary"
                }`}
              >
                Disbursement
              </button>
            </div>
            {isDisbursement && (
              <p className="text-xs text-amber-400 mt-2">
                Recording money received from lender. This adds to your
                principal and starts compounding interest.
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className={inputClass}
              placeholder="50000"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Payment Method — only shown for payments */}
          {!isDisbursement && (
            <div>
              <label className={labelClass}>Paid Via</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className={inputClass}
              >
                {PAYMENT_METHODS.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-text-muted hover:text-text-primary text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isDisbursement
                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {mutation.isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DESIGN DECISIONS:
//
// Type selector as toggle buttons (not a dropdown):
//   Two options only, and the choice matters visually.
//   Toggle buttons make it obvious what you're selecting.
//   The disbursement button uses amber color to signal "this is unusual/important" —
//   most of the time users are logging payments, not disbursements.
//
// Disbursement warning text:
//   First-time users won't know what "disbursement" means in context.
//   The note explains it in plain terms and warns that interest starts compounding.
//
// Submit button changes color based on type:
//   Payment = primary blue (normal action)
//   Disbursement = amber (important, less frequent)
//   Muscle memory helps users notice if they're about to submit the wrong type.
//
// PaymentMethod hidden for disbursements:
//   No need to ask. Disbursements come from the bank, not from you.
//   Hiding it keeps the form minimal and avoids user confusion.
//
// Button text is just "Add":
//   Per the requirements — short, clean, not "Record Payment".
