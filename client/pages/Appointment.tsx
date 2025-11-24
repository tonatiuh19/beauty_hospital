import { Header } from "@/components/Header";
import { AppointmentWizard } from "@/components/AppointmentWizard";
import { Footer } from "@/components/Footer";
import { MetaHelmet } from "@/components/MetaHelmet";

export default function AppointmentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MetaHelmet
        title="Agendar Cita - All Beauty Luxury & Wellness"
        description="Agenda tu consulta o tratamiento de estética médica. Reserva fácil en línea para depilación láser, tratamientos faciales y más."
        keywords="agendar cita, all beauty luxury wellness, agendar consulta, reservar depilación láser"
      />
      <Header />
      <div className="flex-grow">
        <AppointmentWizard />
      </div>
      <Footer />
    </div>
  );
}
