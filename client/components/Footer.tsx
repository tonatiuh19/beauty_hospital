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
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          {/* Brand column with logo, button and phone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <Logo
                className="gap-2"
                iconClassName="h-10 w-auto"
                textClassName="h-10 w-auto"
              />
            </div>
            <button className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full text-sm font-semibold mb-4 transition-all">
              RESERVAR UNA CITA
            </button>
            <a
              href="tel:1233457890"
              className="block text-white border-2 border-white hover:bg-white hover:text-black px-6 py-3 rounded-full text-center text-sm font-semibold transition-all"
            >
              123-345-7890
            </a>
          </motion.div>

          {/* Menú Rápido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4 text-sm">Menú Rápido</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Inicio
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSectionClick(e, "#features")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Sobre Nosotros
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Tratamientos
                </a>
              </li>
              <li>
                <a
                  href="#process"
                  onClick={(e) => handleSectionClick(e, "#process")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Tecnología
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleSectionClick(e, "#faq")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a
                  href="#cta"
                  onClick={(e) => handleSectionClick(e, "#cta")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Contacto
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Descargar Aplicación
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Promociones
                </a>
              </li>
              <li>
                <a
                  href="/admin/login"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Panel de Administración
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Tratamientos Populares */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4 text-sm">
              Tratamientos Populares
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Reducción de Grasa
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Tonificación Muscular
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Rejuvenecimiento Facial
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  onClick={(e) => handleSectionClick(e, "#services")}
                  className="text-gray-400 hover:text-primary transition-colors text-sm cursor-pointer block"
                >
                  • Eliminación de Celulitis
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4 text-sm">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="tel:+525551234"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • +52 555 1234
                </a>
              </li>
              <li>
                <p className="text-gray-400 text-sm">
                  • Tabasco, Mexico Av 123
                </p>
              </li>
              <li>
                <a
                  href="mailto:info@allbeauty"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • info@allbeauty
                </a>
              </li>
              <li>
                <a
                  href="https://center.com"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • center.com
                </a>
              </li>
              <li>
                <p className="text-gray-400 text-sm">• Horario: Lun - Sáb</p>
              </li>
              <li>
                <p className="text-gray-400 text-sm">
                  • 09:00 a.m. - 06:00 p.m.
                </p>
              </li>
            </ul>
          </motion.div>

          {/* Síguenos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-white mb-4 text-sm">Síguenos</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Facebook
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • TikTok
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors text-sm block"
                >
                  • Youtube
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 pt-6">
          {/* Aviso Legal */}
          <div className="text-center mb-4">
            <h5 className="text-white font-semibold text-sm mb-2">
              Aviso Legal
            </h5>
            <p className="text-gray-400 text-xs mb-2">
              Todos los tratamientos son realizados con equipos certificados FDA
              y COFEPRIS.
            </p>
            <p className="text-gray-400 text-xs">
              Los resultados pueden variar según cada persona. © {currentYear}{" "}
              ALL BEAUTY Luxury and Wellness Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Developer credit - Very bottom */}
        {/*  <div className="text-center pt-8 pb-4">
          <a
            href="https://disruptinglabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-primary transition-all duration-300 inline-flex items-center gap-1.5 opacity-40 hover:opacity-100"
            aria-label="Website developed by DisruptingLabs.com"
          >
            <span>Developed with</span>
            <Heart size={10} className="fill-red-500 text-red-500" />
            <span>by</span>
            <span className="font-semibold hover:underline">
              disruptinglabs.com
            </span>
          </a>
        </div> */}
      </div>
    </footer>
  );
}
