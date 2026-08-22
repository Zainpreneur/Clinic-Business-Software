import { useEffect, useState, type FormEvent } from "react";
import { DoctorsAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Doctor } from "../types";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, Modal, Spinner, Textarea } from "../components/ui";

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ specialty: "", phone: "", bio: "", consultFee: "0" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    setLoading(true);
    DoctorsAPI.list()
      .then((res) => setDoctors(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openEdit(d: Doctor) {
    setEditing(d);
    setForm({
      specialty: d.specialty,
      phone: d.phone ?? "",
      bio: d.bio ?? "",
      consultFee: String(d.consultFee),
    });
  }

  function canEdit(d: Doctor) {
    return user?.role === "ADMIN" || (user?.role === "DOCTOR" && user.id === d.userId);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError("");
    setSaving(true);
    try {
      await DoctorsAPI.update(editing.id, {
        specialty: form.specialty,
        phone: form.phone,
        bio: form.bio,
        consultFee: Number(form.consultFee) || 0,
      });
      setEditing(null);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Doctors</h1>
        <p className="text-sm text-slate-500">{doctors.length} doctor(s) on staff</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors yet" subtitle="Add one from the Staff page." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Dr. {d.user.name}</p>
                  <p className="text-xs text-slate-500">{d.specialty}</p>
                </div>
                <Badge label={d.user.active ? "active" : "inactive"} />
              </div>
              <dl className="mt-3 space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Phone</dt>
                  <dd>{d.phone || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Email</dt>
                  <dd className="truncate">{d.user.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Consult fee</dt>
                  <dd>${d.consultFee.toFixed(2)}</dd>
                </div>
              </dl>
              {d.bio && <p className="mt-3 text-xs text-slate-500">{d.bio}</p>}
              {canEdit(d) && (
                <Button variant="secondary" className="mt-4 w-full" onClick={() => openEdit(d)}>
                  Edit profile
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit doctor profile">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Specialty</Label>
            <Input required value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Consultation fee ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.consultFee}
              onChange={(e) => setForm({ ...form, consultFee: e.target.value })}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          {formError && <ErrorBanner message={formError} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
