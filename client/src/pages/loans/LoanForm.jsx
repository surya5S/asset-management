import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLoan, updateLoan } from "../../api/loans";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const LOAN_TYPES = [
  "Personal",
  "Home",
  "Vehicle",
  "Education",
  "Business",
  "Other",
];

const defaultForm = {
  loanName: "",
  lenderName: "",
  loanType: 0,
  principalAmount: "",
  interestRate: "",
  tenureMonths: "",
  emiAmount: "",
  bufferPeriodMonths: 0,
  partialInterestAmount: 0,
  emiStartDate: "",
  startDate: "",
  nextDueDate: "",
};

export default function LoanForm({ loan, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!loan;

  const [form, setForm] = useState(defaultForm);
  const [hasBuffer, setHasBuffer] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (loan) {
      setForm({
        loanName: loan.loanName,
        lenderName: loan.lenderName,
        loanType: LOAN_TYPES.indexOf(loan.loanType),
        principalAmount: loan.principalAmount,
        interestRate: loan.interestRate,
        tenureMonths: loan.tenureMonths,
        emiAmount: loan.emiAmount,
        bufferPeriodMonths: loan.bufferPeriodMonths,
        partialInterestAmount: loan.partialInterestAmount,
        emiStartDate: loan.emiStartDate?.split("T")[0] ?? "",
        startDate: loan.startDate?.split("T")[0] ?? "",
        nextDueDate: loan.nextDueDate?.split("T")[0] ?? "",
      });
      setHasBuffer(loan.bufferPeriodMonths > 0);
    }
  }, [loan]);

  // Auto-calculate EMI start date when startDate + bufferPeriodMonths change
  useEffect(() => {
    if (!hasBuffer || !form.startDate || !form.bufferPeriodMonths) return;

    const start = new Date(form.startDate);
    start.setMonth(start.getMonth() + parseInt(form.bufferPeriodMonths, 10));
    setForm((f) => ({ ...f, emiStartDate: start.toISOString().split("T")[0] }));
  }, [form.startDate, form.bufferPeriodMonths, hasBuffer]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateLoan(loan.id, data) : createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      toast.success(isEdit ? "Loan updated" : "Loan added");
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
      ...form,
      loanType: parseInt(form.loanType, 10),
      principalAmount: parseFloat(form.principalAmount),
      interestRate: parseFloat(form.interestRate),
      tenureMonths: parseInt(form.tenureMonths, 10),
      emiAmount: parseFloat(form.emiAmount),
      bufferPeriodMonths: hasBuffer ? parseInt(form.bufferPeriodMonths, 10) : 0,
      partialInterestAmount: hasBuffer
        ? parseFloat(form.partialInterestAmount)
        : 0,
      // If no buffer, EMI starts on loan start date
      emiStartDate: hasBuffer ? form.emiStartDate : form.startDate,
      startDate: form.startDate,
      nextDueDate: form.nextDueDate,
    });
  };

  const inputClass = "input-field";
  const labelClass = "block text-xs text-surface-muted mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-5">
          {isEdit ? "Edit Loan" : "Add Loan"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Loan Name</label>
              <input
                name="loanName"
                value={form.loanName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Home Loan - HDFC"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Lender Name</label>
              <input
                name="lenderName"
                value={form.lenderName}
                onChange={handleChange}
                className={inputClass}
                placeholder="HDFC Bank"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Loan Type</label>
            <select
              name="loanType"
              value={form.loanType}
              onChange={handleChange}
              className={inputClass}
            >
              {LOAN_TYPES.map((t, i) => (
                <option key={i} value={i}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Terms */}
          <div className="border-t border-surface-border pt-4">
            <p className="text-xs text-surface-muted mb-3 uppercase tracking-wide">
              Loan Terms
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Principal Amount (₹)</label>
                <input
                  name="principalAmount"
                  type="number"
                  value={form.principalAmount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="2000000"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Interest Rate (% p.a.)</label>
                <input
                  name="interestRate"
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="8.5"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Tenure (months)</label>
                <input
                  name="tenureMonths"
                  type="number"
                  value={form.tenureMonths}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="240"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>EMI Amount (₹)</label>
                <input
                  name="emiAmount"
                  type="number"
                  value={form.emiAmount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="17551"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buffer Period Toggle */}
          <div className="border-t border-surface-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-100">Buffer Period</p>
                <p className="text-xs text-surface-muted">
                  Interest-only phase before EMI starts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasBuffer((b) => !b)}
                className={`w-11 h-6 rounded-full transition-colors ${hasBuffer ? "bg-primary" : "bg-surface-border/30"}`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${hasBuffer ? "translate-x-5" : ""}`}
                />
              </button>
            </div>

            {hasBuffer && (
              <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-surface-bg rounded-lg">
                <div>
                  <label className={labelClass}>Buffer Duration (months)</label>
                  <input
                    name="bufferPeriodMonths"
                    type="number"
                    value={form.bufferPeriodMonths}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="36"
                    required={hasBuffer}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Monthly Partial Interest (₹)
                  </label>
                  <input
                    name="partialInterestAmount"
                    type="number"
                    value={form.partialInterestAmount}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="5000"
                    required={hasBuffer}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>
                    EMI Start Date (auto-calculated)
                  </label>
                  <input
                    name="emiStartDate"
                    type="date"
                    value={form.emiStartDate}
                    onChange={handleChange}
                    className={inputClass}
                    required={hasBuffer}
                  />
                  <p className="text-xs text-surface-muted mt-1">
                    Auto-fills from start date + buffer months. Adjust if
                    needed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="border-t border-surface-border pt-4">
            <p className="text-xs text-surface-muted mb-3 uppercase tracking-wide">
              Dates
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Loan Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Next Due Date</label>
                <input
                  name="nextDueDate"
                  type="date"
                  value={form.nextDueDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-surface-border text-surface-muted hover:text-slate-100 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Update Loan"
                  : "Add Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// WHAT'S NEW IN THIS FORM:
//
// hasBuffer toggle:
//   A simple boolean state that shows/hides the buffer fields.
//   If toggled off, we send bufferPeriodMonths=0 and partialInterestAmount=0 to the API.
//   No separate form required — the toggle keeps the UI clean.
//
// Auto-calculated emiStartDate:
//   useEffect watches startDate + bufferPeriodMonths.
//   When both are filled, it calculates: startDate + bufferMonths = emiStartDate.
//   User can still manually override it if the bank's date differs.
//
// LOAN_TYPES.indexOf(loan.loanType):
//   The API returns LoanType as a string ("Home", "Personal", etc.)
//   The select needs the numeric index (0, 1, 2...).
//   indexOf converts string → index for the edit form.
