import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✨</span>
            </div>
            <span className="text-xl font-bold text-foreground">Hospital de Depilación</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <motion.a
              href="#features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Características
            </motion.a>
            <motion.a
              href="#services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Servicios
            </motion.a>
            <motion.a
              href="#process"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Proceso
            </motion.a>
            <motion.a
              href="#testimonials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Testimonios
            </motion.a>
            <motion.a
              href="/appointment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Reservar Ahora
            </motion.a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 flex flex-col gap-4"
          >
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Características
            </a>
            <a
              href="#services"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Servicios
            </a>
            <a
              href="#process"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Proceso
            </a>
            <a
              href="#testimonials"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Testimonios
            </a>
            <a
              href="/appointment"
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all inline-block w-fit"
            >
              Reservar Ahora
            </a>
          </motion.nav>
        )}
      </div>
    </header>
  );
}
