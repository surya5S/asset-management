import { useState } from "react";
import { X } from "lucide-react";

export default function PaymentDialog({ card, onConfirm, onCancel }) {
  const fmt = (n = 0) =>
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

  const [amount, setAmount] = useState(card.cycleBalance.toFixed(2));
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (val > card.cycleBalance) {
      setError(`Amount cannot exceed the cycle balance of ${fmt(card.cycleBalance)}.`);
      return;
    }
    onConfirm(val);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-slate-100 font-semibold text-base">Record Payment</h3>
            <p className="text-surface-muted text-sm mt-0.5">
              {card.cardName} &bull;&bull;&bull;&bull; {card.lastFourDigits}
            </p>
          </div>
          <button onClick={onCancel} className="btn-ghost p-1 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm py-2 border-b border-surface-border">
            <span className="text-surface-muted">Cycle balance due</span>
            <span className="text-slate-100 font-medium">{fmt(card.cycleBalance)}</span>
          </div>

          <div>
            <label className="text-surface-muted text-xs mb-1.5 block">Amount Paid</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              className="input-field"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary flex-1">
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}
