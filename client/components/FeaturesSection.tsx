import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const whyChooseUs = [
  {
    title: "Certificación Internacional",
    description:
      "Todo nuestros equipos cuentan con certificación FDA, CE, Anvisa, Cofepris que garantizan la efectividad de cada tratamiento.",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800",
  },
  {
    title: "Profesionales Certificados",
    description:
      "Equipo de especialistas con amplia trayectoria y certificación internacional. Tecnología Venus Concept.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800",
  },
  {
    title: "Resultados Comprobados",
    description:
      "Miles de clientes satisfechos en más de 60 países respaldan la efectividad de nuestros tratamientos.",
    image:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800",
  },
];

const concerns = [
  {
    title: "Arrugas",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400",
  },
  {
    title: "Celulitis",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=400",
  },
  {
    title: "Flacidez Facial",
    image:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=400",
  },
  {
    title: "Grasa Corporal",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400",
  },
  {
    title: "Verrugas o lesiones Benignas",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=400",
  },
];

export function FeaturesSection() {
  const navigate = useNavigate();

  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Why Choose Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-foreground">
            ¿Por qué Elegirnos?
          </h2>

          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Concerns Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            ¿Cuál es tu Preocupación?
          </h2>
          <p className="text-base text-gray-700 max-w-4xl mx-auto mb-12">
            ¿No estás seguro que necesitas? En All Beauty Luxury & Wellness nos
            enorgullece ofrecer una valoración 100% gratuita para abordar todas
            tus inquietudes de belleza y brindarte un plan de tratamiento que te
            ayude a alcanzar tus objetivos con nosotros. Elige una de las
            siguientes opciones y visítanos.
          </p>

          {/* Concerns grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {concerns.map((concern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative h-48 rounded-xl overflow-hidden cursor-pointer"
              >
                <img
                  src={concern.image}
                  alt={concern.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-sm font-bold text-white">
                    {concern.title}
                  </h3>
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
          >
            <button
              onClick={() => navigate("/appointment")}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm"
            >
              Reservar una Cita
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
