const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Car",
  "Health",
  "Utilities",
  "Rent",
  "Education",
  "Travel",
  "Other",
];

export default function ExpenseFilters({ filters, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.year}
        onChange={(e) =>
          onChange({ ...filters, year: +e.target.value, day: null })
        }
        className="input-field w-auto"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={filters.month ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            month: e.target.value ? +e.target.value : null,
            day: null,
          })
        }
        className="input-field w-auto"
      >
        <option value="">All months</option>
        {months.map((m, i) => (
          <option key={i} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={filters.day ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            day: e.target.value ? +e.target.value : null,
          })
        }
        className="input-field w-auto"
        disabled={!filters.month}
      >
        <option value="">All days</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={filters.category ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            category: e.target.value || null,
          })
        }
        className="input-field w-auto"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {(filters.month || filters.day || filters.category) && (
        <button
          onClick={() =>
            onChange({
              year: filters.year,
              month: null,
              day: null,
              category: null,
            })
          }
          className="btn-ghost text-sm text-red-400 hover:text-red-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Category filter              - New select maps to filters.category. Empty string means
                                    "All categories" — null is stored in state so the API
                                    receives no category param when unset.
  2. || null pattern              - `e.target.value || null` converts the empty string
                                    from "All categories" option back to null. Keeps state
                                    clean — null means "no filter", not empty string.
  3. Clear filters button         - Only renders when at least one optional filter is active.
                                    The condition `(filters.month || filters.day || filters.category)`
                                    is falsy when all three are null — button stays hidden
                                    when nothing is filtered. Year is never cleared since
                                    something must always be selected for year.
  4. Partial reset                - Clear filters resets month, day, category back to null
                                    but preserves the selected year. Intentional — year is
                                    the primary anchor, the others are refinements.
*/
