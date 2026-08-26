import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { AppointmentsAPI, DoctorsAPI, PatientsAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Appointment, AppointmentStatus, Doctor, Patient } from "../types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, Modal, Select, Spinner, Textarea } from "../components/ui";
import AddMedicalRecordModal from "../components/AddMedicalRecordModal";
import CreateInvoiceModal from "../components/CreateInvoiceModal";

const STATUS_OPTIONS: AppointmentStatus[] = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [date, setDate] = useState(todayStr());
  const [doctorFilter, setDoctorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: todayStr(),
    startTime: "09:00",
    endTime: "09:30",
    reason: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [recordFor, setRecordFor] = useState<Appointment | null>(null);
  const [invoiceFor, setInvoiceFor] = useState<Appointment | null>(null);

  function load() {
    setLoading(true);
    AppointmentsAPI.list({
      date: date || undefined,
      doctorId: doctorFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [date, doctorFilter, statusFilter]);

  useEffect(() => {
    PatientsAPI.list().then((res) => setPatients(res.data));
    DoctorsAPI.list().then((res) => setDoctors(res.data));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await AppointmentsAPI.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(appointment: Appointment, status: AppointmentStatus) {
    try {
      await AppointmentsAPI.update(appointment.id, { status });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500">{appointments.length} appointment(s)</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New appointment</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Doctor</Label>
          <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="min-w-[10rem]">
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[10rem]">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        {date && (
          <button className="text-xs font-medium text-slate-500 hover:text-brand-600" onClick={() => setDate("")}>
            Clear date filter
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments found" subtitle="Adjust your filters or schedule a new appointment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {format(new Date(a.date), "MMM d")} · {a.startTime}–{a.endTime}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">Dr. {a.doctor?.user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.reason || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge label={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {a.status === "SCHEDULED" && (
                          <>
                            <button
                              className="text-xs font-medium text-emerald-600 hover:underline"
                              onClick={() => updateStatus(a, "COMPLETED")}
                            >
                              Complete
                            </button>
                            <button
                              className="text-xs font-medium text-amber-600 hover:underline"
                              onClick={() => updateStatus(a, "NO_SHOW")}
                            >
                              No-show
                            </button>
                            <button
                              className="text-xs font-medium text-red-600 hover:underline"
                              onClick={() => updateStatus(a, "CANCELLED")}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(user?.role === "ADMIN" || user?.role === "DOCTOR") && (
                          <button
                            className="text-xs font-medium text-brand-600 hover:underline"
                            onClick={() => setRecordFor(a)}
                          >
                            Add record
                          </button>
                        )}
                        {(user?.role === "ADMIN" || user?.role === "RECEPTIONIST") && (
                          <button
                            className="text-xs font-medium text-slate-600 hover:underline"
                            onClick={() => setInvoiceFor(a)}
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New appointment" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient</Label>
              <Select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Doctor</Label>
              <Select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor…</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.name} ({d.specialty})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start time</Label>
                <Input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End time</Label>
                <Input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Reason for visit</Label>
            <Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          {formError && <ErrorBanner message={formError} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Scheduling…" : "Schedule appointment"}
            </Button>
          </div>
        </form>
      </Modal>

      {recordFor && (
        <AddMedicalRecordModal
          open={!!recordFor}
          onClose={() => setRecordFor(null)}
          patientId={recordFor.patientId}
          doctorId={recordFor.doctorId}
          appointmentId={recordFor.id}
          onCreated={load}
        />
      )}

      {invoiceFor && (
        <CreateInvoiceModal
          open={!!invoiceFor}
          onClose={() => setInvoiceFor(null)}
          patientId={invoiceFor.patientId}
          appointmentId={invoiceFor.id}
          defaultDescription={`Consultation with Dr. ${invoiceFor.doctor?.user.name}`}
          defaultAmount={invoiceFor.doctor?.consultFee}
          onCreated={load}
        />
      )}
    </div>
  );
}
