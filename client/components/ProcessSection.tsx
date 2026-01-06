import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const devices = [
  {
    name: "VENUS BLISS MAX",
    subtitle: "La Revolución en Medicina Corporal",
    image: "/client/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-13.jpg",
    features: [
      "Tecnología dual clínica de alt mercado",
      "6 Licitros laser gran performance de grasa",
      "Sistema patentado de enfriamiento profundo tecnología",
      "Dos tratamientos simultáneos",
      "Resultados visibles desde la primera sesión",
      "Sin dolor ni tiempo de recuperación",
    ],
  },
  {
    name: "VENUS LEGACY",
    subtitle: "El Mejor Aliado Contra Celulitis y Flacidez",
    image: "/client/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-14.jpg",
    features: [
      "Combina",
      "Radiofrecuencia multipolar (Elo)",
      "Campos electromagnéticos pulsados",
      "VarioPulse™ (succión pulsada)",
      "Efectos térmicos en estrato graso IV",
      "Radiofrecuencia cutánea profunda",
      "Tratamiento no doloroso con masaje",
    ],
  },
  {
    name: "VENUS GLOW",
    subtitle: "Hidrodermobrasión de Nueva Generación",
    image: "/client/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-15.jpg",
    features: [
      "Características:",
      "Limpieza profunda con seción controlada",
      "Exfoliación suave",
      "Hidratación intradérmica",
      "Infusión de ingredientes activos",
      "Resultados inmediatos",
      "Tratamiento personalizado",
    ],
  },
  {
    name: "VENUS VELOCITY",
    subtitle: "Depilación Láser de Alta Precisión",
    image: "/client/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-16.jpg",
    features: [
      "Beneficios:",
      "Tecnología láser de diodo",
      "Tratamiento rápido y eficaz para piel",
      "Tratamiento rápido",
      "Mínima molestia",
      "Resultados permanentes",
    ],
  },
];

export function ProcessSection() {
  const navigate = useNavigate();

  return (
    <section
      id="process"
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
          <p className="text-lg text-primary mb-2 font-medium">
            Trabajamos con la mejor tecnología del mercado.
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Líderes Mundiales en Estética No Invasiva
          </h2>
          <p className="text-base text-gray-700 max-w-4xl mx-auto">
            Venus Concept es una empresa global con presencia en más de 60
            países y miles de equipos instalados en clínicas y spas médicos de
            todo el mundo. Su tecnología representa el estándar de oro en
            tratamientos estéticos no invasivos.
          </p>
        </motion.div>

        {/* Devices grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {devices.map((device, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Device image */}
              <div className="h-48 overflow-hidden bg-gray-100">
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold mb-1 text-foreground">
                  {device.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{device.subtitle}</p>

                {/* Features list */}
                <ul className="space-y-2">
                  {device.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-gray-700"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={() => navigate("/appointment")}
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm"
          >
            Reservar una Cita
          </button>
        </motion.div>
      </div>
    </section>
  );
}
