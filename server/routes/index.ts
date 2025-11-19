/**
 * Route handlers index file
 * Organizes all route handlers by category to avoid naming conflicts
 */

// Core services
import * as servicesRoutes from "./services";
import * as appointmentsRoutes from "./appointments";
import * as appointmentsPaymentRoutes from "./appointments-payment";
import * as authRoutes from "./auth";
import * as authPasswordlessRoutes from "./auth-passwordless";
import * as blockedDatesRoutes from "./blocked-dates";
import * as businessHoursRoutes from "./business-hours";
import * as demoRoutes from "./demo";

// Admin routes
import * as adminAppointmentsRoutes from "./admin-appointments";
import * as adminAuthRoutes from "./admin-auth";
import * as adminDashboardRoutes from "./admin-dashboard";
import * as adminPatientsRoutes from "./admin-patients";
import * as adminPaymentsRoutes from "./admin-payments";
import * as adminServicesRoutes from "./admin-services";
import * as adminSettingsRoutes from "./admin-settings";

// Export organized route handlers
export const routes = {
  // Core routes
  services: servicesRoutes,
  appointments: appointmentsRoutes,
  appointmentsPayment: appointmentsPaymentRoutes,
  auth: authRoutes,
  authPasswordless: authPasswordlessRoutes,
  blockedDates: blockedDatesRoutes,
  businessHours: businessHoursRoutes,
  demo: demoRoutes,

  // Admin routes
  admin: {
    appointments: adminAppointmentsRoutes,
    auth: adminAuthRoutes,
    dashboard: adminDashboardRoutes,
    patients: adminPatientsRoutes,
    payments: adminPaymentsRoutes,
    services: adminServicesRoutes,
    settings: adminSettingsRoutes,
  },
};

// Export individual route modules for direct access if needed
export {
  servicesRoutes,
  appointmentsRoutes,
  appointmentsPaymentRoutes,
  authRoutes,
  authPasswordlessRoutes,
  blockedDatesRoutes,
  businessHoursRoutes,
  demoRoutes,
  adminAppointmentsRoutes,
  adminAuthRoutes,
  adminDashboardRoutes,
  adminPatientsRoutes,
  adminPaymentsRoutes,
  adminServicesRoutes,
  adminSettingsRoutes,
};
