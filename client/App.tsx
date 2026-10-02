import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { store } from "@/store";
import { AppRoutes } from "@/routes/AppRoutes";
import { clearUser, restoreUser } from "@/store/slices/authSlice";
import LoadingMask from "@/components/LoadingMask";

const queryClient = new QueryClient();

function AppContent() {
  useEffect(() => {
    store.dispatch(restoreUser());
    const onExpired = () => store.dispatch(clearUser());
    window.addEventListener("patient-session-expired", onExpired);
    return () =>
      window.removeEventListener("patient-session-expired", onExpired);
  }, []);

  return (
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LoadingMask />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  );
}

export const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  </Provider>
);
