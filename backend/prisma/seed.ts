import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Database already has data — skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Alex Admin", email: "admin@clinic.test", passwordHash, role: "ADMIN" },
  });

  const receptionist = await prisma.user.create({
    data: { name: "Rita Reception", email: "reception@clinic.test", passwordHash, role: "RECEPTIONIST" },
  });

  const doctorUser1 = await prisma.user.create({
    data: {
      name: "Maria Chen",
      email: "maria.chen@clinic.test",
      passwordHash,
      role: "DOCTOR",
      doctor: { create: { specialty: "General Medicine", phone: "555-0101", consultFee: 75 } },
    },
    include: { doctor: true },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      name: "James Okafor",
      email: "james.okafor@clinic.test",
      passwordHash,
      role: "DOCTOR",
      doctor: { create: { specialty: "Pediatrics", phone: "555-0102", consultFee: 90 } },
    },
    include: { doctor: true },
  });

  const patient1 = await prisma.patient.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1985-04-12"),
      gender: "MALE",
      phone: "555-1001",
      email: "john.doe@example.com",
      address: "12 Elm Street",
      bloodGroup: "O+",
      allergies: "Penicillin",
      emergencyContact: "Jane Doe - 555-1002",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      firstName: "Emily",
      lastName: "Smith",
      dob: new Date("1992-09-30"),
      gender: "FEMALE",
      phone: "555-1003",
      email: "emily.smith@example.com",
      address: "48 Oak Avenue",
      bloodGroup: "A-",
    },
  });

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser1.doctor!.id,
      date: new Date(dateStr + "T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "09:30",
      status: "SCHEDULED",
      reason: "Annual checkup",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorUser2.doctor!.id,
      date: new Date(dateStr + "T00:00:00.000Z"),
      startTime: "10:30",
      endTime: "11:00",
      status: "SCHEDULED",
      reason: "Follow-up vaccination",
    },
  });

  await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser1.doctor!.id,
      diagnosis: "Seasonal allergy",
      prescription: "Antihistamine, once daily for 7 days",
      notes: "Advised to avoid known allergens.",
      vitals: "BP 118/76, HR 72, Temp 98.4F",
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-" + new Date().getFullYear() + "-00001",
      patientId: patient1.id,
      appointmentId: appointment1.id,
      totalAmount: 75,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: { create: [{ description: "General consultation", quantity: 1, unitPrice: 75, amount: 75 }] },
    },
  });

  await prisma.payment.create({
    data: { invoiceId: invoice.id, amount: 30, method: "cash" },
  });
  await prisma.invoice.update({ where: { id: invoice.id }, data: { paidAmount: 30, status: "PARTIAL" } });

  console.log("Seed complete. Demo accounts (password: password123):");
  console.log(`  Admin:        ${admin.email}`);
  console.log(`  Receptionist: ${receptionist.email}`);
  console.log(`  Doctor:       ${doctorUser1.email}`);
  console.log(`  Doctor:       ${doctorUser2.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
