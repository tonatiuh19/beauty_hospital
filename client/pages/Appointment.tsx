import { Header } from "@/components/Header";
import { AppointmentWizard } from "@/components/AppointmentWizard";
import { Footer } from "@/components/Footer";

export default function AppointmentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <AppointmentWizard />
      </div>
      <Footer />
    </div>
  );
}
