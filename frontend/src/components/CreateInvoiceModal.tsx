import { useState, type FormEvent } from "react";
import { InvoicesAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import { Button, ErrorBanner, Input, Label, Modal } from "./ui";

interface Line {
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyLine: Line = { description: "", quantity: "1", unitPrice: "0" };

export default function CreateInvoiceModal({
  open,
  onClose,
  patientId,
  appointmentId,
  defaultDescription,
  defaultAmount,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
  appointmentId?: string;
  defaultDescription?: string;
  defaultAmount?: number;
  onCreated: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    defaultDescription
      ? { description: defaultDescription, quantity: "1", unitPrice: String(defaultAmount ?? 0) }
      : emptyLine,
  ]);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await InvoicesAPI.create({
        patientId,
        appointmentId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        items: lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create invoice" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-6">
                {i === 0 && <Label>Description</Label>}
                <Input
                  required
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <Label>Qty</Label>}
                <Input
                  type="number"
                  min="1"
                  required
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                {i === 0 && <Label>Unit price ($)</Label>}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={line.unitPrice}
                  onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="mb-2 text-slate-400 hover:text-red-600"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-xs font-medium text-brand-600 hover:underline">
            + Add line item
          </button>
        </div>

        <div>
          <Label>Due date (optional)</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="max-w-xs" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-base font-semibold text-slate-900">${total.toFixed(2)}</span>
        </div>

        {error && <ErrorBanner message={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
