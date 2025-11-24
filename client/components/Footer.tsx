import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to handle navigation to sections
  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string,
  ) => {
    e.preventDefault();

    // If we're not on the home page, navigate to home first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation to complete, then scroll to section
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      // If we're already on home page, just scroll
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-4">
              <Logo
                className="gap-3"
                iconClassName="h-12 w-auto"
                textClassName="h-12 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tratamientos de depilación y bienestar premium para personas
              modernas.
            </p>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSectionClick(e, "#features")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Características
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  onClick={(e) => handleSectionClick(e, "#testimonials")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Testimonios
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleSectionClick(e, "#contact")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href="/admin/login"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Panel de Administración
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
            <h4 className="font-bold text-white mb-4">Servicios</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Depilación Láser
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Tratamientos Médicos
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Cuidado de Piel
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
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
            <h4 className="font-bold text-white mb-4">Síguenos</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary transition-colors"></span>
                  YouTube
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          {/* Legal links */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-6">
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-primary transition-colors"
            >
              Política de Privacidad
            </a>
            <span className="hidden sm:inline text-gray-400">•</span>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-primary transition-colors"
            >
              Términos de Servicio
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <span>© {currentYear} Hospital de Depilación. Hecho con</span>
            <Heart
              size={14}
              className="fill-primary text-primary animate-pulse"
            />
            <span>para tu belleza.</span>
          </div>
        </div>

        {/* Developer credit - After all content, subtle but accessible */}
        <div className="text-center pt-4 pb-2">
          <a
            href="https://disruptinglabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-primary transition-all duration-300 inline-flex items-center gap-1.5 opacity-30 hover:opacity-100 group"
            aria-label="Website developed by DisruptingLabs.com"
          >
            <span>Developed by</span>
            <span className="font-semibold group-hover:underline">
              DisruptingLabs.com
            </span>
            <span>with</span>
            <Heart
              size={10}
              className="fill-red-500 text-red-500 animate-pulse"
            />
            <span>in Mexico</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
