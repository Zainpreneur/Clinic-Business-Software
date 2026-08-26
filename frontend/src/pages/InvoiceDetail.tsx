import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { InvoicesAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Invoice } from "../types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, ErrorBanner, Input, Label, Modal, Select, Spinner } from "../components/ui";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [payError, setPayError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    InvoicesAPI.get(id)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  const remaining = invoice ? invoice.totalAmount - invoice.paidAmount : 0;

  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setPayError("");
    setSaving(true);
    try {
      await InvoicesAPI.addPayment(id, { amount: Number(amount), method });
      setPayOpen(false);
      setAmount("");
      load();
    } catch (err) {
      setPayError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canManage = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !invoice) {
    return <ErrorBanner message={error || "Invoice not found"} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/billing" className="text-xs font-medium text-brand-600 hover:underline">
            ← Back to billing
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-slate-500">
            <Link to={`/patients/${invoice.patientId}`} className="hover:text-brand-600">
              {invoice.patient?.firstName} {invoice.patient?.lastName}
            </Link>{" "}
            · Issued {format(new Date(invoice.issueDate), "MMM d, yyyy")}
          </p>
        </div>
        <Badge label={invoice.status} />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Line items</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-slate-700">{item.description}</td>
                <td className="py-2 text-slate-600">{item.quantity}</td>
                <td className="py-2 text-slate-600">${item.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right text-slate-800">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total</span>
            <span className="font-medium text-slate-900">${invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Paid</span>
            <span className="font-medium text-emerald-600">${invoice.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Balance due</span>
            <span className="font-semibold text-red-600">${remaining.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Payments</h2>
          {canManage && remaining > 0 && invoice.status !== "CANCELLED" && (
            <Button onClick={() => setPayOpen(true)}>Record payment</Button>
          )}
        </div>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-slate-400">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex justify-between py-2 text-sm">
                <span className="text-slate-600">
                  {format(new Date(p.paidAt), "MMM d, yyyy")} · {p.method}
                </span>
                <span className="font-medium text-slate-800">${p.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <Label>Amount ($)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              max={remaining}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">Remaining balance: ${remaining.toFixed(2)}</p>
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="insurance">Insurance</option>
            </Select>
          </div>
          {payError && <ErrorBanner message={payError} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Recording…" : "Record payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
