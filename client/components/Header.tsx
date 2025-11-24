import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authApiSlice";
import { AuthModal } from "./AuthModal";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    setIsOpen(false);
  };

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
            className="cursor-pointer flex-shrink-0"
          >
            <div className="hidden sm:block">
              <Logo
                className="gap-3"
                iconClassName="h-10 w-auto"
                textClassName="h-10 w-auto"
              />
            </div>
            <div className="sm:hidden">
              <Logo variant="icon" iconClassName="h-10 w-auto" />
            </div>
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

            {/* Auth Section - Desktop */}
            {isAuthenticated && user ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/my-appointments")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Mis Citas</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setAuthModalOpen(true)}
                    className="text-sm"
                  >
                    Iniciar Sesión
                  </Button>
                </motion.div>
                <motion.a
                  href="/appointment"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/appointment");
                    setIsOpen(false);
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all cursor-pointer"
                >
                  Reservar Ahora
                </motion.a>
              </>
            )}
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

            {/* Auth Section - Mobile */}
            {isAuthenticated && user ? (
              <>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium mb-2">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate("/my-appointments");
                    setIsOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  Mis Citas
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
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
              </>
            )}
          </motion.nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
