import { motion } from "framer-motion";
import { Facebook, Instagram, Youtube } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/ASSETS%20WEBSITE%20ALL%20BEAUTY-02.jpg')",
        }}
      />
      {/* Social Media Icons */}
      <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-6">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110"
        >
          <Facebook size={24} className="text-white" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110"
        >
          <Instagram size={24} className="text-white" />
        </a>
        <a
          href="https://tiktok.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            className="fill-white"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110"
        >
          <Youtube size={24} className="text-white" />
        </a>
      </div>

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-16 py-20 min-h-screen flex flex-col justify-between">
        {/* Main content - centered vertically on left */}
        <div className="flex-1 flex items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-left max-w-2xl"
          >
            {/* Main heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight"
            >
              Centro de Belleza
              <br />y Cuidado Personal
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-white/90 mb-10 max-w-lg leading-relaxed"
            >
              Tu espacio de confianza para cuidados de belleza avanzados y
              atención profesional.
            </motion.p>
          </motion.div>
        </div>

        {/* CTA Buttons - bottom right */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-4 items-center justify-center sm:justify-end pb-8"
        >
          <button
            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm"
            onClick={() => {
              navigate("/appointment");
            }}
          >
            Reservar una Cita
          </button>
          <button
            className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all hover:scale-105 uppercase tracking-wide text-sm"
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
      </div>
    </section>
  );
}
