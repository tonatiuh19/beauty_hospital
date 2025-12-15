import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdOutlineDashboard,
  MdOutlineCalendarToday,
  MdOutlinePeople,
  MdOutlineDescription,
  MdOutlinePayment,
  MdOutlineSettings,
  MdOutlineLogout,
  MdOutlineMenu,
  MdOutlineClose,
  MdOutlineExpandMore,
  MdOutlineShield,
  MdOutlineLocalHospital,
  MdOutlineManageAccounts,
  MdOutlineNotifications,
  MdOutlineShoppingCart,
  MdOutlineEventBusy,
  MdOutlineMedicalServices,
  MdOutlineSupervisorAccount,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  employee_id?: string;
  specialization?: string;
  profile_picture_url?: string;
}

interface NavItem {
  title: string;
  icon: any;
  href: string;
  badge?: number;
  roles?: string[]; // If specified, only show for these roles
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    icon: MdOutlineDashboard,
    href: "/admin/dashboard",
    roles: ["admin", "general_admin"],
  },
  {
    title: "Citas",
    icon: MdOutlineCalendarToday,
    href: "/admin/appointments",
    roles: ["admin", "general_admin", "receptionist", "pos"],
  },
  {
    title: "Pacientes",
    icon: MdOutlinePeople,
    href: "/admin/patients",
    roles: ["admin", "general_admin", "receptionist", "pos", "doctor"],
  },
  {
    title: "Contratos",
    icon: MdOutlineDescription,
    href: "/admin/contracts",
    roles: ["admin", "general_admin", "receptionist", "pos"],
  },
  {
    title: "Pagos",
    icon: MdOutlinePayment,
    href: "/admin/payments",
    roles: ["admin", "general_admin", "receptionist", "pos"],
  },
  {
    title: "Facturas",
    icon: MdOutlineDescription,
    href: "/admin/invoices",
    roles: ["admin", "general_admin", "receptionist", "pos"],
  },
  {
    title: "Expedientes Médicos",
    icon: MdOutlineMedicalServices,
    href: "/admin/medical-records",
    roles: ["general_admin", "doctor"],
  },
  {
    title: "Servicios",
    icon: MdOutlineShoppingCart,
    href: "/admin/services",
    roles: ["admin", "general_admin"],
  },
  {
    title: "Fechas Bloqueadas",
    icon: MdOutlineEventBusy,
    href: "/admin/blocked-dates",
    roles: ["admin", "general_admin"],
  },
  {
    title: "Gestión de Usuarios",
    icon: MdOutlineSupervisorAccount,
    href: "/admin/users",
    roles: ["general_admin"],
  },
  {
    title: "Configuración",
    icon: MdOutlineSettings,
    href: "/admin/settings",
    roles: ["general_admin"],
  },
];

export default function AdminDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Load admin user from localStorage
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAdminUser(user);

      // Check if current route is accessible for this user
      const currentRoute = navigation.find(
        (item) => item.href === location.pathname,
      );
      const isAccessible =
        currentRoute &&
        (!currentRoute.roles || currentRoute.roles.includes(user.role));

      // If not accessible or on base /admin path, redirect to first available route
      if (
        !isAccessible ||
        location.pathname === "/admin" ||
        location.pathname === "/admin/"
      ) {
        const firstAccessibleRoute = navigation.find(
          (item) => !item.roles || item.roles.includes(user.role),
        );

        if (
          firstAccessibleRoute &&
          location.pathname !== firstAccessibleRoute.href
        ) {
          navigate(firstAccessibleRoute.href, { replace: true });
        }
      }
    } else {
      // Redirect to login if no user found
      navigate("/admin/login");
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Admin", color: "bg-red-100 text-red-800" },
      general_admin: {
        label: "General Admin",
        color: "bg-primary/20 text-primary",
      },
      receptionist: {
        label: "Recepcionista",
        color: "bg-blue-100 text-blue-800",
      },
      pos: {
        label: "POS",
        color: "bg-purple-100 text-purple-800",
      },
      doctor: { label: "Doctor", color: "bg-green-100 text-green-800" },
    };
    return (
      roleConfig[role as keyof typeof roleConfig] || {
        label: role,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
      case "general_admin":
        return MdOutlineShield;
      case "doctor":
        return MdOutlineLocalHospital;
      case "receptionist":
        return MdOutlineManageAccounts;
      default:
        return MdOutlineShield;
    }
  };

  const canAccessRoute = (item: NavItem) => {
    if (!item.roles || !adminUser) return true;
    return item.roles.includes(adminUser.role);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!adminUser) {
    return null; // Will redirect in useEffect
  }

  const RoleIcon = getRoleIcon(adminUser.role);
  const roleBadge = getRoleBadge(adminUser.role);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light rounded-lg flex items-center justify-center">
            <MdOutlineShield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">
            All Beauty Luxury & Wellness
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <MdOutlineClose /> : <MdOutlineMenu />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-[#1a1a1a] flex-col z-40"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <Logo variant="icon" iconClassName="h-8" />
                <div>
                  <p className="text-sm font-bold text-white">
                    All Beauty Luxury & Wellness
                  </p>
                  <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <Logo variant="icon" iconClassName="h-8" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-2 px-3">
            {navigation.filter(canAccessRoute).map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                    isActive
                      ? "bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                      isActive && "text-white",
                    )}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/10 p-4 relative">
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "hidden lg:flex absolute -top-5 w-8 h-8 bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light rounded-full items-center justify-center hover:shadow-lg transition-all shadow-md",
              sidebarOpen ? "right-4" : "left-1/2 -translate-x-1/2",
            )}
          >
            <MdOutlineExpandMore
              className={cn(
                "w-5 h-5 text-white transition-transform",
                sidebarOpen ? "rotate-90" : "-rotate-90",
              )}
            />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors",
                  !sidebarOpen && "justify-center",
                )}
              >
                <Avatar className="w-10 h-10 ring-2 ring-luxury-gold-light/50">
                  <AvatarImage src={adminUser.profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light text-white text-sm font-semibold">
                    {getInitials(adminUser.first_name, adminUser.last_name)}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">
                        {adminUser.first_name} {adminUser.last_name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {roleBadge.label}
                      </p>
                    </div>
                    <MdOutlineExpandMore className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <RoleIcon className="w-4 h-4" />
                  <span>{adminUser.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminUser.employee_id && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-gray-500">
                    ID: {adminUser.employee_id}
                  </span>
                </DropdownMenuItem>
              )}
              {adminUser.specialization && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-gray-500">
                    {adminUser.specialization}
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <MdOutlineLogout className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-280 bg-white z-50 flex flex-col"
            >
              <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Logo variant="icon" iconClassName="h-8" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      All Beauty Luxury & Wellness
                    </p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MdOutlineClose />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-3">
                  {navigation.filter(canAccessRoute).map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 p-2 mb-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={adminUser.profile_picture_url} />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(adminUser.first_name, adminUser.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {adminUser.first_name} {adminUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{adminUser.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <MdOutlineLogout className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          "lg:ml-[280px]",
          !sidebarOpen && "lg:ml-[80px]",
          "pt-16 lg:pt-0",
        )}
      >
        <div className="min-h-screen lg:p-6 lg:bg-[#1a1a1a]">
          <div className="lg:bg-white lg:rounded-3xl lg:shadow-sm min-h-screen lg:min-h-[calc(100vh-3rem)] overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
