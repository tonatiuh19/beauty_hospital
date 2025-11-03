import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import AppointmentPage from "@/pages/Appointment";
import NotFound from "@/pages/NotFound";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/appointment" element={<AppointmentPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
