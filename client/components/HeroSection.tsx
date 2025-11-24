import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Variants } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

export function HeroSection() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-luxury-cream-light/50 to-luxury-cream-dark/50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow mb-8"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-700">
              Bienvenido al Hospital de Depilación
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 text-gradient"
          >
            Radiante y Hermosa
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Descubre nuestros tratamientos de depilación premium y servicios de
            bienestar diseñados para realzar tu belleza natural y aumentar tu
            confianza.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 flex items-center gap-2 group"
              onClick={() => {
                navigate("/appointment");
              }}
            >
              Reservar Tratamiento
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all hover:scale-105"
              onClick={() => {
                if (location.pathname !== "/") {
                  navigate("/");
                  setTimeout(() => {
                    const el = document.querySelector("#services");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                } else {
                  const el = document.querySelector("#services");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Ver Servicios
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col sm:flex-row gap-8 justify-center items-center text-center"
          >
            <div>
              <div className="text-3xl font-bold text-primary">5000+</div>
              <p className="text-gray-600 text-sm">Clientes Felices</p>
            </div>
            <div className="hidden sm:block h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            <div>
              <div className="text-3xl font-bold text-secondary">15+</div>
              <p className="text-gray-600 text-sm">
                Especialistas Certificados
              </p>
            </div>
            <div className="hidden sm:block h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            <div>
              <div className="text-3xl font-bold text-accent">4.9★</div>
              <p className="text-gray-600 text-sm">Calificación Promedio</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
