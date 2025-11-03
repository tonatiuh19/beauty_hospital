import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Service, ServiceCategory } from "@shared/database";
import { GetServicesResponse } from "@shared/api";

// Category display names and icons
const categoryInfo: Record<
  ServiceCategory,
  { emoji: string; displayName: string }
> = {
  [ServiceCategory.LASER_HAIR_REMOVAL]: {
    emoji: "✨",
    displayName: "Depilación Láser",
  },
  [ServiceCategory.FACIAL_TREATMENT]: {
    emoji: "🧖",
    displayName: "Tratamiento Facial",
  },
  [ServiceCategory.BODY_TREATMENT]: {
    emoji: "💆",
    displayName: "Tratamiento Corporal",
  },
  [ServiceCategory.CONSULTATION]: { emoji: "👨‍⚕️", displayName: "Consulta" },
  [ServiceCategory.OTHER]: { emoji: "💅", displayName: "Otros" },
};

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data: GetServicesResponse = await response.json();

        if (data.success && data.data) {
          setServices(data.data);
        } else {
          setError("Failed to load services");
        }
      } catch (err) {
        setError("Failed to load services");
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Group services by category
  const groupedServices = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<ServiceCategory, Service[]>,
  );

  if (loading) {
    return (
      <section
        id="services"
        className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <p className="text-lg text-gray-600">Cargando servicios...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="services"
        className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="services"
      className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Nuestros <span className="text-gradient">Servicios</span> Premium
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Soluciones completas de depilación y bienestar para cada necesidad
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const categoryData =
              categoryInfo[service.category] ||
              categoryInfo[ServiceCategory.OTHER];

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-primary/30 transition-all hover:shadow-2xl"
              >
                {/* Card header with gradient background */}
                <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 h-24 flex items-center justify-center group-hover:from-primary/20 group-hover:via-secondary/20 group-hover:to-accent/20 transition-colors">
                  <span className="text-5xl group-hover:scale-125 transition-transform">
                    {categoryData.emoji}
                  </span>
                </div>

                {/* Card content */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description || "Servicio profesional de calidad"}
                  </p>

                  {/* Service details */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                      Duración: {service.duration_minutes} minutos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                      Categoría: {categoryData.displayName}
                    </li>
                  </ul>

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 group-hover:border-primary/20 transition-colors">
                    <span className="font-bold text-primary">
                      ${service.price.toFixed(2)}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all group-hover:translate-x-1 flex items-center gap-2">
                      <span>Reservar</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
