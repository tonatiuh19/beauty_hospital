import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Martínez",
    title: "Ejecutiva de Marketing",
    image: "👩‍💼",
    rating: 5,
    text: "¡El Hospital de Depilación transformó mi piel en solo 4 semanas! Los resultados son increíbles y el equipo es muy profesional y atento.",
  },
  {
    name: "Emily González",
    title: "Empresaria",
    image: "👱‍♀️",
    rating: 5,
    text: "He visitado muchas clínicas, pero el Hospital de Depilación destaca. Su enfoque personalizado y tratamientos avanzados son incomparables.",
  },
  {
    name: "Jessica Rodríguez",
    title: "Diseñadora de Moda",
    image: "💃",
    rating: 5,
    text: "La mejor inversión que he hecho. Los programas de bienestar me ayudaron a sentirme más confiada y energética que nunca.",
  },
  {
    name: "Lisa Wong",
    title: "Directora Corporativa",
    image: "👩‍🦰",
    rating: 5,
    text: "Los tratamientos médicos del Hospital de Depilación son de primera categoría. La Dra. Sarah y su equipo son muy profesionales y confiables.",
  },
  {
    name: "Amanda Bravo",
    title: "Artista",
    image: "🎨",
    rating: 5,
    text: "Un santuario para la belleza y el bienestar. Cada visita se siente como una celebración del autocuidado. ¡Altamente recomendado!",
  },
  {
    name: "Nicole Torres",
    title: "Coach de Bienestar",
    image: "🧘",
    rating: 5,
    text: "El Hospital de Depilación se alinea perfectamente con mi filosofía de bienestar. Su enfoque integral a la belleza es refrescante y efectivo.",
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="py-20 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

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
            Amado por <span className="text-gradient">5000+ Clientes</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Historias reales de personas que transformaron su belleza y bienestar
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="text-3xl">{testimonial.image}</div>
                <div>
                  <div className="font-bold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.title}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
