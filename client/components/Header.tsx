import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
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

    // Close mobile menu if open
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname === "/") {
                // If already on home page, scroll to top
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                // Navigate to home and scroll to top
                navigate("/");
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 100);
              }
              setIsOpen(false);
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✨</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Hospital de Depilación
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <motion.a
              href="#features"
              onClick={(e) => handleSectionClick(e, "#features")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Características
            </motion.a>
            <motion.a
              href="#services"
              onClick={(e) => handleSectionClick(e, "#services")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Servicios
            </motion.a>
            <motion.a
              href="#process"
              onClick={(e) => handleSectionClick(e, "#process")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Proceso
            </motion.a>
            <motion.a
              href="#testimonials"
              onClick={(e) => handleSectionClick(e, "#testimonials")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Testimonios
            </motion.a>
            <motion.a
              href="/appointment"
              onClick={(e) => {
                e.preventDefault();
                navigate("/appointment");
                setIsOpen(false);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all cursor-pointer"
            >
              Reservar Ahora
            </motion.a>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
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
              onClick={(e) => handleSectionClick(e, "#features")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Características
            </a>
            <a
              href="#services"
              onClick={(e) => handleSectionClick(e, "#services")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Servicios
            </a>
            <a
              href="#process"
              onClick={(e) => handleSectionClick(e, "#process")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Proceso
            </a>
            <a
              href="#testimonials"
              onClick={(e) => handleSectionClick(e, "#testimonials")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Testimonios
            </a>
            <a
              href="/appointment"
              onClick={(e) => {
                e.preventDefault();
                navigate("/appointment");
                setIsOpen(false);
              }}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all inline-block w-fit cursor-pointer"
            >
              Reservar Ahora
            </a>
          </motion.nav>
        )}
      </div>
    </header>
  );
}
