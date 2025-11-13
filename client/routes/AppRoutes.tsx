import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import AppointmentPage from "@/pages/Appointment";
import AdminLogin from "@/pages/AdminLogin";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import DashboardHome from "@/pages/admin/DashboardHome";
import AppointmentsCalendar from "@/pages/admin/AppointmentsCalendar";
import PatientManagement from "@/pages/admin/PatientManagement";
import ContractsManagement from "@/pages/admin/ContractsManagement";
import PaymentsManagement from "@/pages/admin/PaymentsManagement";
import SettingsManagement from "@/pages/admin/SettingsManagement";
import ServicesManagement from "@/pages/admin/ServicesManagement";
import BlockedDatesManagement from "@/pages/admin/BlockedDatesManagement";
import NotFound from "@/pages/NotFound";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/appointment" element={<AppointmentPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Dashboard Routes */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="appointments" element={<AppointmentsCalendar />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="contracts" element={<ContractsManagement />} />
        <Route path="payments" element={<PaymentsManagement />} />
        <Route path="services" element={<ServicesManagement />} />
        <Route path="blocked-dates" element={<BlockedDatesManagement />} />
        <Route path="settings" element={<SettingsManagement />} />
      </Route>

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
