import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { badRequest, notFound } from "../utils/AppError";
import { APPOINTMENT_STATUSES } from "../types/enums";

const router = Router();
router.use(requireAuth);

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.string().min(1), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

async function assertNoConflict(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  if (endTime <= startTime) {
    throw badRequest("endTime must be after startTime");
  }
  const dayStart = new Date(date + "T00:00:00.000Z");
  const dayEnd = new Date(date + "T23:59:59.999Z");

  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["SCHEDULED", "COMPLETED"] },
      id: excludeId ? { not: excludeId } : undefined,
    },
  });

  const conflict = existing.some((a) => startTime < a.endTime && endTime > a.startTime);
  if (conflict) {
    throw badRequest("This doctor already has an appointment overlapping that time slot");
  }
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { doctorId, patientId, date, status, from, to } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (date) {
      where.date = { gte: new Date(date + "T00:00:00.000Z"), lte: new Date(date + "T23:59:59.999Z") };
    } else if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from + "T00:00:00.000Z") } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    res.json(appointments);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } },
        medicalRecord: true,
        invoice: true,
      },
    });
    if (!appointment) throw notFound("Appointment");
    res.json(appointment);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = appointmentSchema.parse(req.body);
    await assertNoConflict(data.doctorId, data.date, data.startTime, data.endTime);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: new Date(data.date + "T00:00:00.000Z"),
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        notes: data.notes,
        status: data.status ?? "SCHEDULED",
      },
      include: { patient: true, doctor: { include: { user: { select: { name: true } } } } },
    });
    res.status(201).json(appointment);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = appointmentSchema.partial().parse(req.body);
    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Appointment");

    const doctorId = data.doctorId ?? existing.doctorId;
    const date = data.date ?? existing.date.toISOString().slice(0, 10);
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    if (data.doctorId || data.date || data.startTime || data.endTime) {
      await assertNoConflict(doctorId, date, startTime, endTime, existing.id);
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: data.date ? new Date(data.date + "T00:00:00.000Z") : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        notes: data.notes,
        status: data.status,
      },
      include: { patient: true, doctor: { include: { user: { select: { name: true } } } } },
    });
    res.json(appointment);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
