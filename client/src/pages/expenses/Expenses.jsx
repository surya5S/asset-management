import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpensesApi, deleteExpenseApi } from "../../api/expenses";
import { getExpenseSummary } from "../../api/expenses";
import ExpenseForm from "./ExpenseForm";
import ExpenseFilters from "./ExpenseFilters";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import { Trash2, Pencil, PlusCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CATEGORY_COLORS = {
  "Food & Dining": {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    bar: "bg-orange-400",
  },
  Transport: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    bar: "bg-blue-400",
  },
  Shopping: { bg: "bg-pink-500/15", text: "text-pink-400", bar: "bg-pink-400" },
  Entertainment: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    bar: "bg-purple-400",
  },
  Health: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    bar: "bg-green-400",
  },
  Car: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
  },
  Utilities: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    bar: "bg-cyan-400",
  },
  Rent: { bg: "bg-red-500/15", text: "text-red-400", bar: "bg-red-400" },
  Education: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    bar: "bg-indigo-400",
  },
  Travel: { bg: "bg-teal-500/15", text: "text-teal-400", bar: "bg-teal-400" },
  Other: { bg: "bg-slate-500/15", text: "text-slate-400", bar: "bg-slate-400" },
};

const DEFAULT_COLOR = {
  bg: "bg-slate-500/15",
  text: "text-slate-400",
  bar: "bg-slate-400",
};

export default function Expenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const now = new Date();

  const [filters, setFilters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", user?.id, filters],
    queryFn: () => getExpensesApi(filters).then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", user?.id, filters.year, filters.month ?? null],
    queryFn: () =>
      getExpenseSummary(filters.year, filters.month).then((r) => r.data),
    enabled: !!filters.year && !!user?.id,
  });

  const categoryMap = Object.fromEntries(
    (summary?.byCategory ?? []).map((c) => [c.category, c]),
  );

  const deleteMutation = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      toast.success("Expense deleted.");
      setDeleteTarget(null);
    },
  });

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };
  const handleDeleteClick = (expense) => setDeleteTarget(expense);
  const handleDeleteCancel = () => setDeleteTarget(null);
  const handleDeleteConfirm = () => deleteMutation.mutate(deleteTarget.id);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-surface-muted text-sm mt-1">
            {expenses.length} records · Total:{" "}
            <span className="text-primary-400 font-medium">
              $
              {totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add expense
        </button>
      </div>

      <ExpenseFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="text-slate-400 text-sm mt-8 text-center">
          Loading...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center mt-16">
          <p className="text-slate-400">No expenses found for this period.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          {expenses.map((expense) => {
            const color = CATEGORY_COLORS[expense.category] ?? DEFAULT_COLOR;
            const catData = categoryMap[expense.category];
            const percentage = catData?.percentage ?? 0;

            return (
              <div key={expense.id} className="card flex items-center gap-4">
                {/* Category Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                                 text-xs font-bold shrink-0 ${color.bg} ${color.text}`}
                >
                  {expense.category.slice(0, 2).toUpperCase()}
                </div>

                {/* Title + Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-100 font-medium truncate">
                      {expense.title}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium
                                     shrink-0 ${color.bg} ${color.text}`}
                    >
                      {expense.category}
                    </span>
                  </div>
                  <p className="text-surface-muted text-xs mt-0.5">
                    {expense.paymentMethod} ·{" "}
                    {new Date(expense.date).toLocaleDateString()}
                  </p>

                  {/* Category progress bar */}
                  {catData && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-muted shrink-0 w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-100 font-semibold text-sm">
                    $
                    {expense.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="btn-ghost p-2"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(expense)}
                    className="btn-ghost p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={handleCloseForm}
          filters={filters}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete expense"
          message={`Are you sure you want to delete "${deleteTarget.title}"?`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. CATEGORY_COLORS map          - A lookup object keyed by category name. Each entry
                                    has three Tailwind classes: bg (background tint),
                                    text (label color), bar (progress fill color).
                                    Centralizing colors means changing a category's color
                                    updates the avatar, badge, and bar in one place.
  2. DEFAULT_COLOR fallback       - `CATEGORY_COLORS[expense.category] ?? DEFAULT_COLOR`
                                    handles any custom or unknown category gracefully.
                                    Never crashes, always renders something sensible.
  3. categoryMap (Object.fromEntries) - Converts the summary's byCategory array into a
                                    lookup object keyed by category name. Without this
                                    you'd need .find() inside the map loop — O(n²).
                                    With it, every lookup is O(1) — much faster at scale.
  4. enabled: !!filters.year      - Prevents the query from firing if year is somehow
                                    undefined. `!!` converts to boolean — only runs
                                    when year is a truthy value.
  5. percentage from summary      - The bar width comes from the server-calculated
                                    percentage in ExpenseSummaryDto. No client-side
                                    math needed — just render what the server computed.
  6. min-w-0 on flex-1            - Without this, a flex child with flex-1 won't shrink
                                    below its content's min-width. Long expense titles
                                    would overflow the card. min-w-0 allows proper truncation.
  7. truncate                     - Tailwind's text-overflow: ellipsis + overflow: hidden
                                    + white-space: nowrap combo. Long titles get "..." 
                                    instead of breaking the card layout.
  8. transition-all duration-500  - The progress bar animates width smoothly when data
                                    loads or changes. Small detail, noticeable polish.
  9. shrink-0 on amount+actions   - Prevents the amount and action buttons from shrinking
                                    when the title section needs more space. The right
                                    side always stays at its natural width.
  10. flex-wrap on badge row      - Title and category badge wrap on narrow screens instead
                                    of overflowing. Mobile-friendly without media queries.
*/
