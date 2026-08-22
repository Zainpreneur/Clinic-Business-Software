import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { badRequest, notFound } from "../utils/AppError";
import { InvoiceStatus, INVOICE_STATUSES } from "../types/enums";

const router = Router();
router.use(requireAuth);

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().default("cash"),
  notes: z.string().optional(),
});

function computeStatus(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { patientId, status } = req.query as Record<string, string>;
    const invoices = await prisma.invoice.findMany({
      where: { patientId, status: status as InvoiceStatus | undefined },
      include: { patient: true, items: true, payments: true },
      orderBy: { issueDate: "desc" },
    });
    res.json(invoices);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { patient: true, items: true, payments: true },
    });
    if (!invoice) throw notFound("Invoice");
    res.json(invoice);
  }),
);

router.post(
  "/",
  requireRole("ADMIN", "RECEPTIONIST"),
  asyncHandler(async (req, res) => {
    const data = invoiceSchema.parse(req.body);
    const items = data.items.map((i) => ({ ...i, amount: i.quantity * i.unitPrice }));
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: await nextInvoiceNumber(),
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        totalAmount,
        items: { create: items },
      },
      include: { items: true, patient: true },
    });
    res.status(201).json(invoice);
  }),
);

router.patch(
  "/:id",
  requireRole("ADMIN", "RECEPTIONIST"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      notes: z.string().optional(),
      dueDate: z.string().optional(),
      status: z.enum(INVOICE_STATUSES).optional(),
      items: z.array(itemSchema).optional(),
    });
    const data = schema.parse(req.body);
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!existing) throw notFound("Invoice");

    let totalAmount = existing.totalAmount;
    if (data.items) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      const items = data.items.map((i) => ({ ...i, amount: i.quantity * i.unitPrice, invoiceId: existing.id }));
      await prisma.invoiceItem.createMany({ data: items });
      totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status ?? computeStatus(totalAmount, existing.paidAmount),
        totalAmount,
      },
      include: { items: true, patient: true, payments: true },
    });
    res.json(invoice);
  }),
);

router.post(
  "/:id/payments",
  requireRole("ADMIN", "RECEPTIONIST"),
  asyncHandler(async (req, res) => {
    const data = paymentSchema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw notFound("Invoice");
    if (invoice.status === "CANCELLED") throw badRequest("Cannot record payment on a cancelled invoice");

    const remaining = invoice.totalAmount - invoice.paidAmount;
    if (data.amount > remaining + 0.001) {
      throw badRequest(`Payment exceeds remaining balance of ${remaining.toFixed(2)}`);
    }

    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({ data: { ...data, invoiceId: invoice.id } }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: invoice.paidAmount + data.amount,
          status: computeStatus(invoice.totalAmount, invoice.paidAmount + data.amount),
        },
        include: { items: true, payments: true, patient: true },
      }),
    ]);

    res.status(201).json({ payment, invoice: updatedInvoice });
  }),
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
