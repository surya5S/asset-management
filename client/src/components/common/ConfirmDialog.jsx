import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Yes, delete it",
  confirmClassName = "flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200",
  showWarning = true,
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full bg-red-500/10 flex items-center
                          justify-center shrink-0"
          >
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-slate-100 font-semibold text-base">{title}</h3>
            <p className="text-surface-muted text-sm mt-1 leading-relaxed">
              {message}
            </p>
            {showWarning && (
              <p className="text-red-400 text-xs mt-3 font-medium">
                This action cannot be undone.
              </p>
            )}
          </div>
          <button onClick={onCancel} className="btn-ghost p-1 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Reusable Dialog Component    - Takes title, message, onConfirm, onCancel as props.
                                    Nothing hardcoded — use this for any destructive action
                                    across the whole app (delete card, loan, asset etc).
  2. shrink-0                     - Tailwind's flex-shrink: 0. Prevents the icon and X button
                                    from shrinking when the text content is long.
  3. bg-red-500/10                - Tailwind opacity modifier. Red background at 10% opacity.
                                    Creates a subtle tinted circle without a harsh red fill.
  4. Callback Props Pattern       - onConfirm and onCancel are functions passed from the
                                    parent. The dialog doesn't know what happens — it just
                                    calls the right function. Fully reusable.
  5. Semantic Color for Danger    - Red button for destructive confirm, ghost for cancel.
                                    User's eye goes to the dangerous action — they must
                                    consciously choose it. Cancel is visually secondary.
*/
