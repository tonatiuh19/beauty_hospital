import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Sarah Martínez",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
    rating: 5,
    text: "¡El Hospital de Depilación transformó mi piel en solo 4 semanas! Los resultados son increíbles y el equipo es muy profesional y atento.",
  },
  {
    name: "Ulises Torres",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    rating: 5,
    text: "Mi experiencia en All Beauty fue excepcional. Recibí un servicio de primera. Su enfoque integral es refrescante y efectivo.",
  },
  {
    name: "Jessica Rodríguez",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200",
    rating: 5,
    text: "La mejor inversión que he hecho. Los programas de bienestar me ayudaron a sentirme más confiada y energética que nunca.",
  },
  {
    name: "Emily González",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200",
    rating: 5,
    text: "He visitado muchas clínicas, pero All Beauty destaca. Su enfoque personalizado y tratamientos avanzados son incomparables.",
  },
  {
    name: "Lisa Wong",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
    rating: 5,
    text: "Los tratamientos médicos son de primera categoría. El equipo es muy profesional y confiable.",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  // Get 3 testimonials to display
  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ];

  return (
    <section
      id="testimonials"
      className="py-20 md:py-32 bg-luxury-cream-light relative overflow-hidden"
    >
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
            ¿Qué dicen Nuestros Clientes?
          </h2>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={prevSlide}
            className="hidden md:inline-flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 lg:-translate-x-16 z-10 w-12 h-12 bg-primary hover:bg-primary/90 rounded-full items-center justify-center transition-all hover:scale-110 shadow-lg"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          {/* Right arrow */}
          <button
            onClick={nextSlide}
            className="hidden md:inline-flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 lg:translate-x-16 z-10 w-12 h-12 bg-primary hover:bg-primary/90 rounded-full items-center justify-center transition-all hover:scale-110 shadow-lg"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          {/* Testimonials grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {visibleTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${currentIndex}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Profile image */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-center mb-4 text-foreground">
                  {testimonial.name}
                </h3>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className="fill-primary text-primary"
                    />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-gray-700 text-center leading-relaxed text-sm">
                  {testimonial.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Read more button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm">
            Leer Más Reseñas
          </button>
        </motion.div>
      </div>
    </section>
  );
}
