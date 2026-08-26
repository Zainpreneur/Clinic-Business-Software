import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { Role, ROLES } from "../types/enums";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest, unauthorized } from "../utils/AppError";
import { requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES).optional(),
  specialty: z.string().optional(), // required if role === DOCTOR
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueToken(user: { id: string; email: string; name: string; role: string }) {
  const secret = process.env.JWT_SECRET as string;
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as string) || "7d" } as SignOptions;
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role as Role },
    secret,
    options,
  );
}

// Public: first admin can self-register only when no users exist yet.
// Subsequent user creation should go through /api/users (admin only).
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw badRequest(
        "Registration is closed. Ask an administrator to create your account from the Staff page.",
      );
    }

    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: "ADMIN", // first user is always the clinic administrator
      },
    });

    const token = issueToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !user.active) throw unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    const token = issueToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { doctor: true },
    });
    if (!user) throw unauthorized();
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }),
);

export default router;
