import { useState, type FormEvent } from "react";
import { MedicalRecordsAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import { Button, ErrorBanner, Label, Modal, Textarea } from "./ui";

export default function AddMedicalRecordModal({
  open,
  onClose,
  patientId,
  doctorId,
  appointmentId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  onCreated: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [vitals, setVitals] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setDiagnosis("");
    setPrescription("");
    setVitals("");
    setNotes("");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await MedicalRecordsAPI.create({
        patientId,
        doctorId,
        appointmentId,
        diagnosis,
        prescription: prescription || undefined,
        vitals: vitals || undefined,
        notes: notes || undefined,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add medical record" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Diagnosis</Label>
          <Textarea rows={2} required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>
        <div>
          <Label>Prescription</Label>
          <Textarea rows={2} value={prescription} onChange={(e) => setPrescription(e.target.value)} />
        </div>
        <div>
          <Label>Vitals</Label>
          <Textarea
            rows={1}
            placeholder="e.g. BP 120/80, HR 72, Temp 98.6F"
            value={vitals}
            onChange={(e) => setVitals(e.target.value)}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
