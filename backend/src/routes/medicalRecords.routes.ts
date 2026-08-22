import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { notFound } from "../utils/AppError";

const router = Router();
router.use(requireAuth);

const recordSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  visitDate: z.string().optional(),
  diagnosis: z.string().min(1),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  vitals: z.string().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { patientId, doctorId } = req.query as Record<string, string>;
    const records = await prisma.medicalRecord.findMany({
      where: { patientId, doctorId },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { visitDate: "desc" },
    });
    res.json(records);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!record) throw notFound("Medical record");
    res.json(record);
  }),
);

router.post(
  "/",
  requireRole("ADMIN", "DOCTOR"),
  asyncHandler(async (req, res) => {
    const data = recordSchema.parse(req.body);
    const record = await prisma.medicalRecord.create({
      data: {
        ...data,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      },
    });

    if (data.appointmentId) {
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    res.status(201).json(record);
  }),
);

router.patch(
  "/:id",
  requireRole("ADMIN", "DOCTOR"),
  asyncHandler(async (req, res) => {
    const data = recordSchema.partial().parse(req.body);
    const existing = await prisma.medicalRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Medical record");

    const record = await prisma.medicalRecord.update({
      where: { id: req.params.id },
      data: {
        ...data,
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      },
    });
    res.json(record);
  }),
);

router.delete(
  "/:id",
  requireRole("ADMIN", "DOCTOR"),
  asyncHandler(async (req, res) => {
    await prisma.medicalRecord.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
