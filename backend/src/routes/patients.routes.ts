import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { notFound } from "../utils/AppError";
import { GENDERS } from "../types/enums";

const router = Router();
router.use(requireAuth);

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().datetime().optional().or(z.literal("")).optional(),
  gender: z.enum(GENDERS).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

function toData(input: z.infer<typeof patientSchema>) {
  return {
    ...input,
    dob: input.dob ? new Date(input.dob) : undefined,
    email: input.email || undefined,
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const patients = await prisma.patient.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json(patients);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: {
          include: { doctor: { include: { user: { select: { name: true } } } } },
          orderBy: { date: "desc" },
        },
        medicalRecords: {
          include: { doctor: { include: { user: { select: { name: true } } } } },
          orderBy: { visitDate: "desc" },
        },
        invoices: { orderBy: { issueDate: "desc" } },
      },
    });
    if (!patient) throw notFound("Patient");
    res.json(patient);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = patientSchema.parse(req.body);
    const patient = await prisma.patient.create({ data: toData(data) });
    res.status(201).json(patient);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = patientSchema.partial().parse(req.body);
    const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Patient");
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: toData(data as z.infer<typeof patientSchema>),
    });
    res.json(patient);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
