/**
 * Route Configuration Helper
 *
 * This file provides utilities to help you easily set up routes from the routes folder.
 *
 * Usage Instructions:
 * 1. Import the route handlers you need in your main API file
 * 2. Use the examples below as templates for setting up routes
 * 3. Copy the route patterns and adapt them to your specific handler names
 *
 * Example route imports:
 *
 * import { handleDemo } from "../server/routes/demo";
 * import { handleGetServices, handleGetServiceById } from "../server/routes/services";
 * import { createAppointment, getAppointments } from "../server/routes/appointments";
 * import { handleRegister, handleLogin } from "../server/routes/auth";
 *
 * Example route setup:
 *
 * app.get("/api/demo", handleDemo);
 * app.get("/api/services", handleGetServices);
 * app.get("/api/services/:id", handleGetServiceById);
 * app.post("/api/appointments", createAppointment);
 * app.get("/api/appointments", getAppointments);
 * app.post("/api/auth/register", handleRegister);
 * app.post("/api/auth/login", handleLogin);
 *
 * Available route files in server/routes/:
 * - admin-appointments.ts
 * - admin-auth.ts
 * - admin-dashboard.ts
 * - admin-patients.ts
 * - admin-payments.ts
 * - admin-services.ts
 * - admin-settings.ts
 * - appointments-payment.ts
 * - appointments.ts
 * - auth-passwordless.ts
 * - auth.ts
 * - blocked-dates.ts
 * - business-hours.ts
 * - demo.ts
 * - services.ts
 */

export const ROUTE_PATTERNS = {
  // Core API patterns
  CORE: {
    demo: "GET /api/demo",
    services: {
      getAll: "GET /api/services",
      getById: "GET /api/services/:id",
    },
    appointments: {
      create: "POST /api/appointments",
      getAll: "GET /api/appointments",
      getById: "GET /api/appointments/:id",
      update: "PUT /api/appointments/:id",
      cancel: "DELETE /api/appointments/:id",
      getBookedSlots: "GET /api/appointments/booked-slots/:date",
    },
    auth: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      refreshToken: "POST /api/auth/refresh-token",
      logout: "POST /api/auth/logout",
      getCurrentUser: "GET /api/auth/me",
    },
    blockedDates: {
      getAll: "GET /api/blocked-dates",
      check: "POST /api/blocked-dates/check",
      create: "POST /api/blocked-dates",
      update: "PUT /api/blocked-dates/:id",
      delete: "DELETE /api/blocked-dates/:id",
    },
    businessHours: {
      get: "GET /api/business-hours",
      update: "PUT /api/business-hours",
    },
  },

  // Admin API patterns
  ADMIN: {
    auth: {
      login: "POST /api/admin/auth/login",
      refreshToken: "POST /api/admin/auth/refresh-token",
      logout: "POST /api/admin/auth/logout",
      getCurrentUser: "GET /api/admin/auth/me",
    },
    dashboard: {
      getStats: "GET /api/admin/dashboard/stats",
    },
    appointments: {
      getAll: "GET /api/admin/appointments",
      getById: "GET /api/admin/appointments/:id",
      update: "PUT /api/admin/appointments/:id",
      cancel: "DELETE /api/admin/appointments/:id",
      updateStatus: "PUT /api/admin/appointments/:id/status",
    },
    patients: {
      getAll: "GET /api/admin/patients",
      getById: "GET /api/admin/patients/:id",
      update: "PUT /api/admin/patients/:id",
      delete: "DELETE /api/admin/patients/:id",
      getAppointments: "GET /api/admin/patients/:id/appointments",
    },
    services: {
      getAll: "GET /api/admin/services",
      getById: "GET /api/admin/services/:id",
      create: "POST /api/admin/services",
      update: "PUT /api/admin/services/:id",
      delete: "DELETE /api/admin/services/:id",
    },
    payments: {
      getAll: "GET /api/admin/payments",
      processRefund: "POST /api/admin/payments/:id/refund",
      approveRefund: "PUT /api/admin/payments/:id/refund/approve",
      getStats: "GET /api/admin/payments/stats",
    },
    settings: {
      get: "GET /api/admin/settings",
      update: "PUT /api/admin/settings",
    },
  },
};
