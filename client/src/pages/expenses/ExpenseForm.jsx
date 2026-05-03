import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpenseApi, updateExpenseApi } from "../../api/expenses";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Rent",
  "Education",
  "Travel",
  "Car",
  "Other",
];

const PAYMENT_METHODS = [
  { label: "Cash", value: 0 },
  { label: "Debit Card", value: 1 },
  { label: "Credit Card", value: 2 },
  { label: "Bank Transfer", value: 3 },
  { label: "UPI", value: 4 },
  { label: "Other", value: 5 },
];

const defaultForm = {
  title: "",
  amount: "",
  category: "Food & Dining",
  paymentMethod: 0,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function ExpenseForm({ expense, onClose, filters }) {
  const queryClient = useQueryClient();
  const isEditing = !!expense;

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        paymentMethod:
          PAYMENT_METHODS.find((p) => p.label === expense.paymentMethod)
            ?.value ?? 0,
        date: new Date(expense.date).toISOString().split("T")[0],
        notes: expense.notes || "",
      });
    }
  }, [expense]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateExpenseApi(expense.id, data) : createExpenseApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      toast.success(isEditing ? "Expense updated." : "Expense added.");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong.");
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || +form.amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }
    mutation.mutate({
      ...form,
      amount: +form.amount,
      paymentMethod: +form.paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">
            {isEditing ? "Edit expense" : "Add expense"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Title</label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. Grocery shopping"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Amount ($|₹)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Date</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Payment method
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="input-field"
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input-field resize-none"
              rows={2}
              placeholder="Any additional details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. useEffect for edit mode      - When `expense` prop changes (edit clicked), useEffect
                                    populates the form with existing values. Dependency
                                    array [expense] means it only runs when expense changes.
  2. Modal pattern                - `fixed inset-0` covers the full viewport. `bg-black/60`
                                    is a semi-transparent overlay. The card is centered with
                                    flexbox. This is the standard CSS-only modal pattern.
  3. Create vs Edit (same form)   - `isEditing = !!expense` drives the entire form behavior.
                                    One component handles both modes — DRY principle.
  4. mutation.isPending           - React Query's loading state for mutations. Replaces
                                    manual `loading` useState — it's built in.
  5. Checkbox handleChange        - `type === 'checkbox' ? checked : value` — checkboxes
                                    use `e.target.checked` not `e.target.value`. The ternary
                                    handles both in one handler.
  6. type="number" step="0.01"    - Allows decimal input (cents). Without step, browsers
                                    may round to integers. `min="0"` blocks negative amounts.
  7. Coercion before submit       - `+form.amount` and `+form.paymentMethod` convert strings
                                    to numbers before sending. Form inputs are always strings
                                    — the API expects numbers.
  8. Constants outside component  - CATEGORIES and PAYMENT_METHODS are defined outside the
                                    component so they're not recreated on every render.
  9. defaultForm object           - Single source of truth for the empty form state.
                                    Used on initial render and could be used for reset.
  10. ISO date string             - `new Date().toISOString().split('T')[0]` gives "2025-04-29"
                                    — the format HTML date inputs expect (YYYY-MM-DD).
*/
