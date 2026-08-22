export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  phone?: string | null;
  bio?: string | null;
  consultFee: number;
  createdAt: string;
  user: { id: string; name: string; email: string; active: boolean };
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  doctor?: Doctor | null;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  createdAt: string;
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  invoices?: Invoice[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  visitDate: string;
  diagnosis: string;
  prescription?: string | null;
  notes?: string | null;
  vitals?: string | null;
  doctor?: Doctor;
  patient?: Patient;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  patient?: Patient;
}

export interface DashboardSummary {
  totalPatients: number;
  totalDoctors: number;
  todaysAppointments: number;
  upcomingAppointments: Appointment[];
  outstanding: { count: number; amount: number };
  revenueThisMonth: number;
  appointmentsByStatus: { status: AppointmentStatus; _count: number }[];
  recentPatients: Patient[];
}
