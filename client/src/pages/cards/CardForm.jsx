import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCardApi, updateCardApi } from "../../api/cards";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CARD_COLORS = [
  "#0284c7",
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#65a30d",
];

const defaultForm = {
  bankName: "",
  cardName: "",
  lastFourDigits: "",
  creditLimit: "",
  currentBalance: "",
  interestRate: "",
  billingCycleDay: "1",
  dueDateDay: "25",
  aprEndDate: "",
  cardColor: "#0284c7",
};

export default function CardForm({ card, onClose }) {
  const queryClient = useQueryClient();
  const isEditing = !!card;

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (card) {
      setForm({
        bankName: card.bankName,
        cardName: card.cardName,
        lastFourDigits: card.lastFourDigits,
        creditLimit: card.creditLimit,
        currentBalance: card.currentBalance,
        interestRate: card.interestRate,
        billingCycleDay: card.billingCycleDay,
        dueDateDay: card.dueDateDay,
        aprEndDate: card.aprEndDate
          ? new Date(card.aprEndDate).toISOString().split("T")[0]
          : "",
        cardColor: card.cardColor,
      });
    }
  }, [card]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateCardApi(card.id, data) : createCardApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success(isEditing ? "Card updated." : "Card added.");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong.");
    },
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      form.lastFourDigits.length !== 4 ||
      !/^\d{4}$/.test(form.lastFourDigits)
    ) {
      toast.error("Last 4 digits must be exactly 4 numbers.");
      return;
    }
    mutation.mutate({
      ...form,
      creditLimit: +form.creditLimit,
      currentBalance: +form.currentBalance,
      interestRate: +form.interestRate,
      billingCycleDay: +form.billingCycleDay,
      dueDateDay: +form.dueDateDay,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">
            {isEditing ? "Edit card" : "Add credit card"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Bank name
              </label>
              <input
                name="bankName"
                type="text"
                value={form.bankName}
                onChange={handleChange}
                className="input-field"
                placeholder="Chase"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Card name
              </label>
              <input
                name="cardName"
                type="text"
                value={form.cardName}
                onChange={handleChange}
                className="input-field"
                placeholder="Sapphire Reserve"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Last 4 digits
              </label>
              <input
                name="lastFourDigits"
                type="text"
                value={form.lastFourDigits}
                onChange={handleChange}
                className="input-field"
                placeholder="1234"
                maxLength={4}
                disabled={isEditing}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Interest rate (%)
              </label>
              <input
                name="interestRate"
                type="number"
                step="0.01"
                value={form.interestRate}
                onChange={handleChange}
                className="input-field"
                placeholder="18.99"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Credit limit ($)
              </label>
              <input
                name="creditLimit"
                type="number"
                step="0.01"
                value={form.creditLimit}
                onChange={handleChange}
                className="input-field"
                placeholder="5000"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Current balance ($)
              </label>
              <input
                name="currentBalance"
                type="number"
                step="0.01"
                value={form.currentBalance}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Billing cycle day
              </label>
              <input
                name="billingCycleDay"
                type="number"
                min="1"
                max="31"
                value={form.billingCycleDay}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Payment due day
              </label>
              <input
                name="dueDateDay"
                type="number"
                min="1"
                max="31"
                value={form.dueDateDay}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              APR end date
              <span className="text-surface-muted text-xs ml-1.5">
                — interest is charged monthly until this date
              </span>
            </label>
            <input
              name="aprEndDate"
              type="date"
              value={form.aprEndDate}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Card color
            </label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, cardColor: color }))
                  }
                  className="w-8 h-8 rounded-full transition-transform duration-150
                             hover:scale-110"
                  style={{
                    background: color,
                    outline:
                      form.cardColor === color ? `3px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
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
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
