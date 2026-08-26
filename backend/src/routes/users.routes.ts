import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLES } from "../types/enums";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { badRequest, notFound } from "../utils/AppError";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  consultFee: z.number().nonnegative().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
  role: z.enum(ROLES).optional(),
  password: z.string().min(6).optional(),
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { doctor: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map(({ passwordHash, ...u }) => u));
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    if (data.role === "DOCTOR" && !data.specialty) {
      throw badRequest("specialty is required when creating a doctor account");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        doctor:
          data.role === "DOCTOR"
            ? {
                create: {
                  specialty: data.specialty!,
                  phone: data.phone,
                  consultFee: data.consultFee ?? 0,
                },
              }
            : undefined,
      },
      include: { doctor: true },
    });

    const { passwordHash: _omit, ...safe } = user;
    res.status(201).json(safe);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("User");

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        active: data.active,
        role: data.role,
        ...(passwordHash ? { passwordHash } : {}),
      },
      include: { doctor: true },
    });
    const { passwordHash: _omit, ...safe } = user;
    res.json(safe);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
