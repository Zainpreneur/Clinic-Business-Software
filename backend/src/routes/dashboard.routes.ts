import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      todaysAppointments,
      upcomingAppointments,
      totalDoctors,
      outstandingInvoices,
      revenueThisMonthAgg,
      appointmentsByStatus,
      recentPatients,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.findMany({
        where: { date: { gte: todayStart }, status: "SCHEDULED" },
        include: { patient: true, doctor: { include: { user: { select: { name: true } } } } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 5,
      }),
      prisma.doctor.count(),
      prisma.invoice.aggregate({
        where: { status: { in: ["UNPAID", "PARTIAL"] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    const outstandingAmount =
      (outstandingInvoices._sum.totalAmount ?? 0) - (outstandingInvoices._sum.paidAmount ?? 0);

    res.json({
      totalPatients,
      totalDoctors,
      todaysAppointments,
      upcomingAppointments,
      outstanding: {
        count: outstandingInvoices._count,
        amount: outstandingAmount,
      },
      revenueThisMonth: revenueThisMonthAgg._sum.amount ?? 0,
      appointmentsByStatus,
      recentPatients,
    });
  }),
);

export default router;
