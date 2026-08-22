import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { InvoicesAPI, PatientsAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Invoice, InvoiceStatus, Patient } from "../types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, EmptyState, ErrorBanner, Label, Modal, Select, Spinner } from "../components/ui";
import CreateInvoiceModal from "../components/CreateInvoiceModal";

const STATUS_OPTIONS: InvoiceStatus[] = ["UNPAID", "PARTIAL", "PAID", "CANCELLED"];

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pickPatientOpen, setPickPatientOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  function load() {
    setLoading(true);
    InvoicesAPI.list({ status: statusFilter || undefined })
      .then((res) => setInvoices(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);
  useEffect(() => {
    PatientsAPI.list().then((res) => setPatients(res.data));
  }, []);

  const totals = invoices.reduce(
    (acc, inv) => {
      acc.billed += inv.totalAmount;
      acc.collected += inv.paidAmount;
      return acc;
    },
    { billed: 0, collected: 0 },
  );

  const canManage = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoice(s)</p>
        </div>
        {canManage && <Button onClick={() => setPickPatientOpen(true)}>+ New invoice</Button>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total billed</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${totals.billed.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total collected</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600">${totals.collected.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-red-600">${(totals.billed - totals.collected).toFixed(2)}</p>
        </Card>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {inv.patient?.firstName} {inv.patient?.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{format(new Date(inv.issueDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-slate-700">${inv.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">${inv.paidAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge label={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/billing/${inv.id}`} className="text-brand-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={pickPatientOpen} onClose={() => setPickPatientOpen(false)} title="Select patient">
        <div className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPickPatientOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedPatientId}
              onClick={() => {
                setPickPatientOpen(false);
                setCreateOpen(true);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {createOpen && selectedPatientId && (
        <CreateInvoiceModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          patientId={selectedPatientId}
          onCreated={load}
        />
      )}
    </div>
  );
}
