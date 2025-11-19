import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Stethoscope,
  UserCog,
  Bell,
  Package,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Citas",
    icon: Calendar,
    href: "/admin/appointments",
    roles: ["admin", "general_admin", "receptionist"],
  },
  {
    title: "Pacientes",
    icon: Users,
    href: "/admin/patients",
  },
  {
    title: "Contratos",
    icon: FileText,
    href: "#",
    roles: ["admin", "general_admin", "receptionist"],
  },
  {
    title: "Pagos",
    icon: CreditCard,
    href: "/admin/payments",
    roles: ["admin", "general_admin", "receptionist"],
  },
  {
    title: "Facturas",
    icon: FileText,
    href: "/admin/invoices",
    roles: ["admin", "general_admin", "receptionist"],
  },
  {
    title: "Servicios",
    icon: Package,
    href: "/admin/services",
    roles: ["admin", "general_admin"],
  },
  {
    title: "Fechas Bloqueadas",
    icon: CalendarX,
    href: "/admin/blocked-dates",
    roles: ["admin", "general_admin"],
  },
  {
    title: "Configuración",
    icon: Settings,
    href: "/admin/settings",
    roles: ["admin", "general_admin"],
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
      setAdminUser(JSON.parse(storedUser));
    } else {
      // Redirect to login if no user found
      navigate("/admin/login");
    }
  }, [navigate]);

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
        color: "bg-purple-100 text-purple-800",
      },
      receptionist: {
        label: "Recepcionista",
        color: "bg-blue-100 text-blue-800",
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
        return Shield;
      case "doctor":
        return Stethoscope;
      case "receptionist":
        return UserCog;
      default:
        return Shield;
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Beauty Hospital</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 flex-col z-40"
      >
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Beauty Hospital
                  </p>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mx-auto"
              >
                <Shield className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navigation.filter(canAccessRoute).map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                    isActive
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-purple-700",
                    )}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-purple-700 rounded-r"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors",
                  !sidebarOpen && "justify-center",
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={adminUser.profile_picture_url} />
                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                    {getInitials(adminUser.first_name, adminUser.last_name)}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {adminUser.first_name} {adminUser.last_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {roleBadge.label}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
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
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-600 transition-transform",
              sidebarOpen ? "rotate-90" : "-rotate-90",
            )}
          />
        </button>
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Beauty Hospital
                    </p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X />
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
                            ? "bg-purple-50 text-purple-700 font-medium"
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
                    <AvatarFallback className="bg-purple-600 text-white">
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
                  <LogOut className="w-4 h-4 mr-2" />
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
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
