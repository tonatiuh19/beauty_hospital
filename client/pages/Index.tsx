import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProcessSection } from "@/components/ProcessSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { MetaHelmet } from "@/components/MetaHelmet";
import { useAppDispatch } from "@/store/hooks";
import { fetchServices } from "@/store/slices/servicesSlice";

export default function Index() {
  const dispatch = useAppDispatch();

  // Fetch services when the page loads
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      <MetaHelmet
        title="Beauty Hospital - Centro de Estética Médica | Atención Experta y Tecnología Avanzada"
        description="Transforma tu belleza con nuestros servicios de estética médica expertos. Depilación láser, tratamientos faciales y corporales con tecnología avanzada y atención personalizada."
        keywords="beauty hospital, depilación láser, tratamientos estéticos, estética médica, tratamientos faciales, tratamientos corporales, clínica de depilación"
      />
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <ProcessSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
