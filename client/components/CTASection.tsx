import { motion } from "framer-motion";
import { ArrowRight, Phone, Mail } from "lucide-react";

export function CTASection() {
  return (
    <section id="contact" className="py-20 md:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-white" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 md:p-16 border border-gray-200 shadow-xl"
        >
          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-foreground">
            ¿Listo para Brillar con
            <span className="block text-gradient">tu Belleza Natural?</span>
          </h2>

          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Reserva tu primer tratamiento hoy y experimenta la diferencia del Hospital de Depilación.
            Nuestro equipo experto está listo para ayudarte a alcanzar tus objetivos de belleza.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 flex items-center gap-2 group w-full sm:w-auto justify-center">
              Reservar Consulta
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button className="px-10 py-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all hover:scale-105 w-full sm:w-auto">
              Más Información
            </button>
          </div>

          {/* Contact info */}
          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Llámanos hoy</p>
                <p className="font-semibold text-foreground">(555) 123-4567</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Envíanos un email</p>
                <p className="font-semibold text-foreground">info@hospitaldepilacion.com</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
