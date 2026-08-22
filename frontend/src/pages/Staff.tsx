import { useEffect, useState, type FormEvent } from "react";
import { StaffAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { Role, StaffUser } from "../types";
import { Badge, Button, Card, EmptyState, ErrorBanner, Input, Label, Modal, Select, Spinner } from "../components/ui";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "RECEPTIONIST" as Role,
  specialty: "",
  phone: "",
  consultFee: "0",
};

export default function Staff() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    StaffAPI.list()
      .then((res) => setUsers(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await StaffAPI.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        specialty: form.role === "DOCTOR" ? form.specialty : undefined,
        phone: form.role === "DOCTOR" ? form.phone : undefined,
        consultFee: form.role === "DOCTOR" ? Number(form.consultFee) || 0 : undefined,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: StaffUser) {
    try {
      await StaffAPI.update(u.id, { active: !u.active });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">Manage clinic staff accounts and roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New staff member</Button>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No staff accounts yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge label={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={u.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => toggleActive(u)}>
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New staff member">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Temporary password</Label>
            <Input
              type="password"
              minLength={6}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          {form.role === "DOCTOR" && (
            <>
              <div>
                <Label>Specialty</Label>
                <Input
                  required
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Consult fee ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.consultFee}
                    onChange={(e) => setForm({ ...form, consultFee: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
          {formError && <ErrorBanner message={formError} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
