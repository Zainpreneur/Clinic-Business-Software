import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import doctorRoutes from "./routes/doctors.routes";
import patientRoutes from "./routes/patients.routes";
import appointmentRoutes from "./routes/appointments.routes";
import medicalRecordRoutes from "./routes/medicalRecords.routes";
import invoiceRoutes from "./routes/invoices.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler, notFoundMiddleware } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
      credentials: true,
    }),
  );
  app.use(express.json());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/medical-records", medicalRecordRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
