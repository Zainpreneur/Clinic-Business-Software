// SQLite has no native enum support, so Prisma models store these as plain strings.
// These are the single source of truth for valid values, used by zod schemas and
// anywhere the value needs a TypeScript type.

export const ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const INVOICE_STATUSES = ["UNPAID", "PARTIAL", "PAID", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];
