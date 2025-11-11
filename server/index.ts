import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { testConnection } from "./db/connection";
import { authenticate } from "./middleware/auth";
import {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
  handleGetCurrentUser,
} from "./routes/auth";
import { handleGetServices, handleGetServiceById } from "./routes/services";
import {
  checkUser,
  sendCode,
  verifyCode,
  createUser,
} from "./routes/auth-passwordless";
import {
  getBlockedDates,
  checkDateBlocked,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
} from "./routes/blocked-dates";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from "./routes/appointments";
import {
  bookAppointmentWithPayment,
  confirmAppointmentPayment,
} from "./routes/appointments-payment";
import {
  getBusinessHours,
  getBusinessHoursByDay,
} from "./routes/business-hours";

export function createServer() {
  console.log("Creating Express server...");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("DB Host:", process.env.DB_HOST ? "Set" : "Missing");

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Log all requests for debugging
  app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("   Body:", JSON.stringify(req.body, null, 2));
    }
    next();
  });

  // Test database connection on startup (non-blocking for serverless)
  if (process.env.NODE_ENV !== "production") {
    testConnection().catch(console.error);
  }

  // Health check
  app.get("/api/health", async (_req, res) => {
    try {
      const dbConnected = await testConnection();
      res.json({
        success: true,
        message: "Beauty Hospital API is running",
        timestamp: new Date().toISOString(),
        database: dbConnected ? "connected" : "disconnected",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ==================== AUTHENTICATION ROUTES ====================
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/refresh", handleRefreshToken);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/me", authenticate, handleGetCurrentUser);

  // ==================== PASSWORDLESS AUTH ROUTES ====================
  app.post("/api/auth/check-user", checkUser);
  app.post("/api/auth/send-code", sendCode);
  app.post("/api/auth/verify-code", verifyCode);
  app.post("/api/auth/create-user", createUser);

  // ==================== SERVICES ROUTES ====================
  app.get("/api/services", handleGetServices);
  app.get("/api/services/:id", handleGetServiceById);

  // ==================== BLOCKED DATES ROUTES ====================
  // Public routes - needed for appointment calendar
  app.get("/api/blocked-dates", getBlockedDates);
  app.get("/api/blocked-dates/check", checkDateBlocked);

  // Admin-only routes
  app.post("/api/blocked-dates", authenticate, createBlockedDate);
  app.put("/api/blocked-dates/:id", authenticate, updateBlockedDate);
  app.delete("/api/blocked-dates/:id", authenticate, deleteBlockedDate);

  // ==================== BUSINESS HOURS ROUTES ====================
  // Public routes - needed for appointment calendar
  app.get("/api/business-hours", getBusinessHours);
  app.get("/api/business-hours/day/:dayOfWeek", getBusinessHoursByDay);

  // ==================== APPOINTMENTS ROUTES ====================
  app.post("/api/appointments", authenticate, createAppointment);
  app.post(
    "/api/appointments/book-with-payment",
    authenticate,
    bookAppointmentWithPayment,
  );
  app.post(
    "/api/appointments/confirm-payment",
    authenticate,
    confirmAppointmentPayment,
  );
  app.get("/api/appointments", authenticate, getAppointments);
  app.get("/api/appointments/:id", authenticate, getAppointmentById);
  app.put("/api/appointments/:id", authenticate, updateAppointment);
  app.delete("/api/appointments/:id", authenticate, cancelAppointment);

  // ==================== PROTECTED ROUTES (Examples) ====================
  // TODO: Add more routes for patients, appointments, payments, etc.
  // app.use("/api/patients", authenticate, patientsRouter);
  // app.use("/api/appointments", authenticate, appointmentsRouter);
  // app.use("/api/payments", authenticate, paymentsRouter);
  // app.use("/api/services", authenticate, servicesRouter);
  // app.use("/api/medical-records", authenticate, medicalRecordsRouter);
  // app.use("/api/contracts", authenticate, contractsRouter);

  return app;
}
