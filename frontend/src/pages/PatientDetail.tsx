import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { PatientsAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Patient } from "../types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, EmptyState, ErrorBanner, Spinner } from "../components/ui";
import clsx from "clsx";

const TABS = ["Overview", "Appointments", "Medical Records", "Invoices"] as const;

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  function load() {
    if (!id) return;
    setLoading(true);
    PatientsAPI.get(id)
      .then((res) => setPatient(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleDelete() {
    if (!id || !confirm("Delete this patient and all related records? This cannot be undone.")) return;
    await PatientsAPI.remove(id);
    navigate("/patients");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !patient) {
    return <ErrorBanner message={error || "Patient not found"} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/patients" className="text-xs font-medium text-brand-600 hover:underline">
            ← Back to patients
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {patient.phone || "No phone"} · {patient.email || "No email"}
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <Button variant="danger" onClick={handleDelete}>
            Delete patient
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <Card className="grid grid-cols-2 gap-4 p-5 md:grid-cols-3">
          <Field label="Date of birth" value={patient.dob ? format(new Date(patient.dob), "MMM d, yyyy") : "—"} />
          <Field label="Gender" value={patient.gender || "—"} />
          <Field label="Blood group" value={patient.bloodGroup || "—"} />
          <Field label="Address" value={patient.address || "—"} />
          <Field label="Emergency contact" value={patient.emergencyContact || "—"} />
          <Field label="Allergies" value={patient.allergies || "None recorded"} />
          <Field label="Notes" value={patient.notes || "—"} full />
        </Card>
      )}

      {tab === "Appointments" && (
        <Card>
          {!patient.appointments?.length ? (
            <EmptyState title="No appointments yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {format(new Date(a.date), "MMM d, yyyy")} · {a.startTime}–{a.endTime}
                    </p>
                    <p className="text-xs text-slate-500">
                      Dr. {a.doctor?.user.name} · {a.reason || "General visit"}
                    </p>
                  </div>
                  <Badge label={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Medical Records" && (
        <Card>
          {!patient.medicalRecords?.length ? (
            <EmptyState title="No medical records yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.medicalRecords.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{r.diagnosis}</p>
                    <span className="text-xs text-slate-400">{format(new Date(r.visitDate), "MMM d, yyyy")}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Dr. {r.doctor?.user.name}</p>
                  {r.prescription && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium">Prescription: </span>
                      {r.prescription}
                    </p>
                  )}
                  {r.vitals && (
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium">Vitals: </span>
                      {r.vitals}
                    </p>
                  )}
                  {r.notes && <p className="mt-1 text-sm text-slate-600">{r.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "Invoices" && (
        <Card>
          {!patient.invoices?.length ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link to={`/billing/${inv.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {format(new Date(inv.issueDate), "MMM d, yyyy")} · ${inv.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <Badge label={inv.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-full" : undefined}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
