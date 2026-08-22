import { api } from "./client";
import type {
  AuthUser,
  Appointment,
  DashboardSummary,
  Doctor,
  Invoice,
  MedicalRecord,
  Patient,
  StaffUser,
} from "../types";

// ---- Auth ----
export const AuthAPI = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password }),
  register: (payload: { name: string; email: string; password: string }) =>
    api.post<{ token: string; user: AuthUser }>("/auth/register", payload),
  me: () => api.get("/auth/me"),
};

// ---- Staff / Users ----
export const StaffAPI = {
  list: () => api.get<StaffUser[]>("/users"),
  create: (payload: Record<string, unknown>) => api.post<StaffUser>("/users", payload),
  update: (id: string, payload: Record<string, unknown>) =>
    api.patch<StaffUser>(`/users/${id}`, payload),
  remove: (id: string) => api.delete(`/users/${id}`),
};

// ---- Doctors ----
export const DoctorsAPI = {
  list: () => api.get<Doctor[]>("/doctors"),
  get: (id: string) => api.get<Doctor>(`/doctors/${id}`),
  update: (id: string, payload: Record<string, unknown>) =>
    api.patch<Doctor>(`/doctors/${id}`, payload),
};

// ---- Patients ----
export const PatientsAPI = {
  list: (q?: string) => api.get<Patient[]>("/patients", { params: q ? { q } : undefined }),
  get: (id: string) => api.get<Patient>(`/patients/${id}`),
  create: (payload: Partial<Patient>) => api.post<Patient>("/patients", payload),
  update: (id: string, payload: Partial<Patient>) => api.patch<Patient>(`/patients/${id}`, payload),
  remove: (id: string) => api.delete(`/patients/${id}`),
};

// ---- Appointments ----
export const AppointmentsAPI = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<Appointment[]>("/appointments", { params }),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  create: (payload: Partial<Appointment>) => api.post<Appointment>("/appointments", payload),
  update: (id: string, payload: Partial<Appointment>) =>
    api.patch<Appointment>(`/appointments/${id}`, payload),
  remove: (id: string) => api.delete(`/appointments/${id}`),
};

// ---- Medical Records ----
export const MedicalRecordsAPI = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<MedicalRecord[]>("/medical-records", { params }),
  get: (id: string) => api.get<MedicalRecord>(`/medical-records/${id}`),
  create: (payload: Partial<MedicalRecord>) => api.post<MedicalRecord>("/medical-records", payload),
  update: (id: string, payload: Partial<MedicalRecord>) =>
    api.patch<MedicalRecord>(`/medical-records/${id}`, payload),
  remove: (id: string) => api.delete(`/medical-records/${id}`),
};

// ---- Invoices ----
export const InvoicesAPI = {
  list: (params?: Record<string, string | undefined>) => api.get<Invoice[]>("/invoices", { params }),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (payload: Record<string, unknown>) => api.post<Invoice>("/invoices", payload),
  update: (id: string, payload: Record<string, unknown>) =>
    api.patch<Invoice>(`/invoices/${id}`, payload),
  addPayment: (id: string, payload: { amount: number; method: string; notes?: string }) =>
    api.post<{ payment: unknown; invoice: Invoice }>(`/invoices/${id}/payments`, payload),
  remove: (id: string) => api.delete(`/invoices/${id}`),
};

// ---- Dashboard ----
export const DashboardAPI = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
