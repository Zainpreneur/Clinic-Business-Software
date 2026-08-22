import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { notFound } from "../utils/AppError";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      include: { user: { select: { id: true, name: true, email: true, active: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(doctors);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, active: true } } },
    });
    if (!doctor) throw notFound("Doctor");
    res.json(doctor);
  }),
);

const updateSchema = z.object({
  specialty: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  consultFee: z.number().nonnegative().optional(),
});

router.patch(
  "/:id",
  requireRole("ADMIN", "DOCTOR"),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!doctor) throw notFound("Doctor");

    if (req.user!.role === "DOCTOR" && doctor.userId !== req.user!.id) {
      throw notFound("Doctor");
    }

    const updated = await prisma.doctor.update({ where: { id: req.params.id }, data });
    res.json(updated);
  }),
);

router.get(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const date = req.query.date as string | undefined;
    if (!date) return res.json([]);
    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        date: { gte: start, lte: end },
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: "asc" },
    });
    res.json(appointments);
  }),
);

export default router;
