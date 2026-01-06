import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Service, ServiceCategory } from "@shared/database";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices } from "@/store/slices/servicesSlice";

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { services, loading, error } = useAppSelector(
    (state) => state.services,
  );

  useEffect(() => {
    // Only fetch if we don't have services already
    if (services.length === 0 && !loading) {
      dispatch(fetchServices());
    }
  }, [dispatch, services.length, loading]);

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
      className="py-20 md:py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Nuestros Mejores Servicios
          </h2>
          <p className="text-base text-gray-700 max-w-3xl mx-auto">
            En All Beauty te ofrecemos una amplia gama de tratamientos estéticos
            no quirúrgicos diseñados para realzar tu belleza natural y ayudarte
            a verte y sentirte lo mejor posible.
          </p>
        </motion.div>

        {/* Services grid - 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.slice(0, 8).map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              onClick={() => navigate("/appointment")}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{
                  backgroundImage: service.image_url
                    ? `url('${service.image_url}')`
                    : `url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800')`,
                }}
              />

              {/* Dark overlay (default state) */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 group-hover:opacity-0 transition-opacity duration-300" />

              {/* Light overlay (hover state) */}
              <div className="absolute inset-0 bg-luxury-cream-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content overlay */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                {/* Title - always visible */}
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary leading-tight mb-2 transition-colors duration-300">
                    {service.name}
                  </h3>

                  {/* Additional info - visible on hover */}
                  <div className="max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 overflow-hidden transition-all duration-300">
                    {service.description && (
                      <p className="text-sm text-primary mb-3 leading-relaxed font-medium">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow button */}
                <div className="flex justify-end">
                  <button className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg">
                    <ArrowRight size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm">
            Ver Todos Lo Servicios
          </button>
        </motion.div>
      </div>
    </section>
  );
}
