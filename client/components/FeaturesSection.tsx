import { motion } from "framer-motion";
import { Heart, Zap, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Atención Personalizada",
    description:
      "Cada tratamiento se personaliza según tu tipo de piel y objetivos de bienestar.",
    color: "from-primary to-pink-500",
  },
  {
    icon: Zap,
    title: "Tecnología Avanzada",
    description:
      "Utilizamos la tecnología de depilación y belleza más moderna para resultados óptimos.",
    color: "from-secondary to-primary",
  },
  {
    icon: Shield,
    title: "Seguridad Garantizada",
    description:
      "Todos los tratamientos realizados por especialistas certificados en ambiente estéril.",
    color: "from-accent to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Resultados Visibles",
    description:
      "Observa mejoras notables en tu piel y bienestar general en pocas semanas.",
    color: "from-rose-500 to-orange-500",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            ¿Por qué elegir <span className="text-gradient">Hospital de Depilación</span>?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experimenta la combinación perfecta de tratamientos premium y atención experta
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary/30 transition-all hover:shadow-xl"
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="text-white" size={24} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
