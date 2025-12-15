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
  getBookedTimeSlots,
} from "./routes/appointments";
import {
  bookAppointmentWithPayment,
  confirmAppointmentPayment,
} from "./routes/appointments-payment";
import {
  getBusinessHours,
  getBusinessHoursByDay,
} from "./routes/business-hours";
import {
  checkAdminUser,
  sendAdminCode,
  verifyAdminCode,
  refreshAdminToken,
  logoutAdmin,
} from "./routes/admin-auth";
import {
  authenticateAdmin,
  requireGeneralAdmin,
  requireReceptionist,
  requireDoctor,
  requireAnyAdmin,
} from "./middleware/admin-auth";
import {
  getDashboardMetrics,
  getRevenueChart,
  getCalendarAppointments,
  getRecentActivity,
} from "./routes/admin-dashboard";
import {
  checkInAppointment,
  cancelAppointment as adminCancelAppointment,
  rescheduleAppointment,
  createManualAppointment,
  updateAppointmentStatus,
  sendAppointmentReminder,
} from "./routes/admin-appointments";
import {
  getAllPatients,
  getPatientById,
  updatePatient,
  togglePatientActive,
  getPatientStats,
  addMedicalRecord,
} from "./routes/admin-patients";
import {
  getAllPayments,
  processRefund,
  approveRefund,
  getPaymentStats,
} from "./routes/admin-payments";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "./routes/admin-services";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  getSettings,
  updateSetting,
  getContentPages,
  updateContentPage,
  getAdminUsers,
  createAdminUser,
  getAdminUser,
  updateAdminUser,
  toggleAdminUserActive,
  deleteAdminUser,
  resetAdminUserAccess,
  getAdminUserActivity,
} from "./routes/admin-settings";
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
        message: "All Beauty Luxury & Wellness API is running",
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
  // Public route - needed for showing available time slots
  app.get("/api/appointments/booked-slots", getBookedTimeSlots);

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

  // ==================== ADMIN AUTHENTICATION ROUTES ====================
  app.post("/api/admin/auth/check-user", checkAdminUser);
  app.post("/api/admin/auth/send-code", sendAdminCode);
  app.post("/api/admin/auth/verify-code", verifyAdminCode);
  app.post("/api/admin/auth/refresh", refreshAdminToken);
  app.post("/api/admin/auth/logout", logoutAdmin);

  // ==================== ADMIN DASHBOARD ROUTES ====================
  app.get(
    "/api/admin/dashboard/metrics",
    authenticateAdmin,
    requireAnyAdmin,
    getDashboardMetrics,
  );
  app.get(
    "/api/admin/dashboard/revenue-chart",
    authenticateAdmin,
    requireAnyAdmin,
    getRevenueChart,
  );
  app.get(
    "/api/admin/dashboard/calendar",
    authenticateAdmin,
    requireAnyAdmin,
    getCalendarAppointments,
  );
  app.get(
    "/api/admin/dashboard/activity",
    authenticateAdmin,
    requireGeneralAdmin,
    getRecentActivity,
  );

  // ==================== ADMIN APPOINTMENTS ROUTES ====================
  app.post(
    "/api/admin/appointments/:id/check-in",
    authenticateAdmin,
    requireReceptionist,
    checkInAppointment,
  );
  app.post(
    "/api/admin/appointments/:id/cancel",
    authenticateAdmin,
    requireReceptionist,
    adminCancelAppointment,
  );
  app.post(
    "/api/admin/appointments/:id/reschedule",
    authenticateAdmin,
    requireReceptionist,
    rescheduleAppointment,
  );
  app.post(
    "/api/admin/appointments/create",
    authenticateAdmin,
    requireReceptionist,
    createManualAppointment,
  );
  app.put(
    "/api/admin/appointments/:id/status",
    authenticateAdmin,
    requireReceptionist,
    updateAppointmentStatus,
  );
  app.post(
    "/api/admin/appointments/:id/send-reminder",
    authenticateAdmin,
    requireReceptionist,
    sendAppointmentReminder,
  );

  // ==================== ADMIN PATIENTS ROUTES ====================
  app.get(
    "/api/admin/patients",
    authenticateAdmin,
    requireAnyAdmin,
    getAllPatients,
  );
  app.get(
    "/api/admin/patients/:id",
    authenticateAdmin,
    requireAnyAdmin,
    getPatientById,
  );
  app.put(
    "/api/admin/patients/:id",
    authenticateAdmin,
    requireReceptionist,
    updatePatient,
  );
  app.put(
    "/api/admin/patients/:id/toggle-active",
    authenticateAdmin,
    requireGeneralAdmin,
    togglePatientActive,
  );
  app.get(
    "/api/admin/patients/:id/stats",
    authenticateAdmin,
    requireAnyAdmin,
    getPatientStats,
  );
  app.post(
    "/api/admin/patients/:id/medical-records",
    authenticateAdmin,
    requireDoctor,
    addMedicalRecord,
  );

  // ==================== ADMIN PAYMENTS ROUTES ====================
  // Stats route MUST come before :id routes
  app.get(
    "/api/admin/payments/stats",
    authenticateAdmin,
    requireAnyAdmin,
    getPaymentStats,
  );
  app.get(
    "/api/admin/payments",
    authenticateAdmin,
    requireAnyAdmin,
    getAllPayments,
  );
  app.post(
    "/api/admin/payments/:id/refund",
    authenticateAdmin,
    requireReceptionist,
    processRefund,
  );
  app.post(
    "/api/admin/payments/:id/approve-refund",
    authenticateAdmin,
    requireGeneralAdmin,
    approveRefund,
  );

  // ==================== ADMIN SERVICES ROUTES ====================
  app.get(
    "/api/admin/services",
    authenticateAdmin,
    requireAnyAdmin,
    getAllServices,
  );
  app.get(
    "/api/admin/services/:id",
    authenticateAdmin,
    requireAnyAdmin,
    getServiceById,
  );
  app.post(
    "/api/admin/services",
    authenticateAdmin,
    requireAnyAdmin,
    createService,
  );
  app.put(
    "/api/admin/services/:id",
    authenticateAdmin,
    requireAnyAdmin,
    updateService,
  );
  app.delete(
    "/api/admin/services/:id",
    authenticateAdmin,
    requireAnyAdmin,
    deleteService,
  );

  // ==================== ADMIN BLOCKED DATES ROUTES ====================
  app.get(
    "/api/admin/blocked-dates",
    authenticateAdmin,
    requireAnyAdmin,
    getBlockedDates,
  );
  app.post(
    "/api/admin/blocked-dates",
    authenticateAdmin,
    requireAnyAdmin,
    createBlockedDate,
  );
  app.put(
    "/api/admin/blocked-dates/:id",
    authenticateAdmin,
    requireAnyAdmin,
    updateBlockedDate,
  );
  app.delete(
    "/api/admin/blocked-dates/:id",
    authenticateAdmin,
    requireAnyAdmin,
    deleteBlockedDate,
  );

  // ==================== ADMIN SETTINGS ROUTES ====================
  app.get(
    "/api/admin/settings/coupons",
    authenticateAdmin,
    requireGeneralAdmin,
    getAllCoupons,
  );
  app.post(
    "/api/admin/settings/coupons",
    authenticateAdmin,
    requireGeneralAdmin,
    createCoupon,
  );
  app.put(
    "/api/admin/settings/coupons/:id",
    authenticateAdmin,
    requireGeneralAdmin,
    updateCoupon,
  );
  app.get(
    "/api/admin/settings",
    authenticateAdmin,
    requireGeneralAdmin,
    getSettings,
  );
  app.put(
    "/api/admin/settings/:key",
    authenticateAdmin,
    requireGeneralAdmin,
    updateSetting,
  );
  app.get(
    "/api/admin/settings/content-pages",
    authenticateAdmin,
    requireGeneralAdmin,
    getContentPages,
  );
  app.put(
    "/api/admin/settings/content-pages/:id",
    authenticateAdmin,
    requireGeneralAdmin,
    updateContentPage,
  );

  // Admin User Management
  app.get(
    "/api/admin/settings/users",
    authenticateAdmin,
    requireGeneralAdmin,
    getAdminUsers,
  );
  app.get(
    "/api/admin/settings/users/:id",
    authenticateAdmin,
    requireGeneralAdmin,
    getAdminUser,
  );
  app.post(
    "/api/admin/settings/users",
    authenticateAdmin,
    requireGeneralAdmin,
    createAdminUser,
  );
  app.put(
    "/api/admin/settings/users/:id",
    authenticateAdmin,
    requireGeneralAdmin,
    updateAdminUser,
  );
  app.patch(
    "/api/admin/settings/users/:id/toggle-active",
    authenticateAdmin,
    requireGeneralAdmin,
    toggleAdminUserActive,
  );
  app.delete(
    "/api/admin/settings/users/:id",
    authenticateAdmin,
    requireGeneralAdmin,
    deleteAdminUser,
  );
  app.post(
    "/api/admin/settings/users/:id/reset-access",
    authenticateAdmin,
    requireGeneralAdmin,
    resetAdminUserAccess,
  );
  app.get(
    "/api/admin/settings/users/:id/activity",
    authenticateAdmin,
    requireGeneralAdmin,
    getAdminUserActivity,
  );

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
