import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRateChange } from "../../api/loans";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AddRateChangeDialog({ loanId, currentRate, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    newRate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data) => addRateChange(loanId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id, loanId] });
      toast.success("Rate change recorded");
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
      newRate: parseFloat(form.newRate),
      effectiveDate: form.effectiveDate,
      notes: form.notes || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">
          Record Rate Change
        </h2>
        <p className="text-sm text-surface-muted mb-5">
          Current rate:{" "}
          <span className="text-slate-100 font-medium">{currentRate}% p.a.</span>
          &nbsp;· Interest recalculates from the effective date.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-surface-muted mb-1">
              New Rate (% p.a.)
            </label>
            <input
              name="newRate"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={form.newRate}
              onChange={handleChange}
              className="input-field"
              placeholder="9.5"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-surface-muted mb-1">
              Effective Date
            </label>
            <input
              name="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-surface-muted mb-1">
              Notes (optional)
            </label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. RBI repo rate cut"
            />
          </div>

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
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
