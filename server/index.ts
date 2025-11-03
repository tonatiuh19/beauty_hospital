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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test database connection on startup
  testConnection().catch(console.error);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "Beauty Hospital API is running",
      timestamp: new Date().toISOString(),
    });
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

  // ==================== SERVICES ROUTES ====================
  app.get("/api/services", handleGetServices);
  app.get("/api/services/:id", handleGetServiceById);

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
