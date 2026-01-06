import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section
      id="contact"
      className="relative min-h-[500px] flex items-center overflow-hidden"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/client/assets/images/ASSETS%20WEB%20ALL%20BEAUTY-20.jpg')",
        }}
      />

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight max-w-2xl">
              Eleva tu seguridad
              <br />y confianza hoy mismo.
            </h2>

            <p className="text-base md:text-lg text-white/90 mb-10 max-w-xl leading-relaxed">
              Ya sea que quieras iniciar tu tratamiento láser o perfeccionar tu
              cuidado estético, nuestro equipo de especialistas está aquí para
              asesorarte. Juntos encontraremos la opción ideal para realzar tu
              piel de forma segura y efectiva.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-start sm:justify-end">
              <button
                onClick={() => navigate("/appointment")}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 uppercase tracking-wide text-sm"
              >
                Reservar una Cita
              </button>
              <a
                href="tel:123-945-7890"
                className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all hover:scale-105 uppercase tracking-wide text-sm text-center"
              >
                123-945-7890
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
