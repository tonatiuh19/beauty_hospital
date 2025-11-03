import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✨</span>
              </div>
              <span className="text-xl font-bold text-foreground">Hospital de Depilación</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tratamientos de depilación y bienestar premium para personas modernas.
            </p>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-foreground mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Características
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Testimonios
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-foreground mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Depilación Láser
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Tratamientos Médicos
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Cuidado de Piel
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Tratamientos Especiales
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-foreground mb-4">Síguenos</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 py-8">
          {/* Legal links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-primary transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Términos de Servicio
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Configuración de Cookies
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <span>© {currentYear} Hospital de Depilación. Hecho con</span>
            <Heart size={14} className="fill-primary text-primary" />
            <span>para tu belleza.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
