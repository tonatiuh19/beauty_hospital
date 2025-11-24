import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdOutlineLock,
  MdOutlineEmail,
  MdOutlineArrowForward,
  MdOutlineShield,
  MdOutlineCheckCircle,
  MdOutlineCalendarMonth,
  MdOutlinePeople,
  MdOutlinePayments,
  MdOutlineSettings,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/Logo";
import axios from "@/lib/axios";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if admin user exists
      const checkResponse = await axios.post("/admin/auth/check-user", {
        email,
      });

      if (checkResponse.data.success && checkResponse.data.exists) {
        const user = checkResponse.data.user;
        setUserId(user.id);
        setUserRole(user.role);
        setUserName(`${user.first_name} ${user.last_name}`);

        // Send verification code
        const codeResponse = await axios.post("/admin/auth/send-code", {
          user_id: user.id,
          email: email,
        });

        if (codeResponse.data.success) {
          setStep("code");
          setSuccess(`Código de verificación enviado a ${email}`);
        } else {
          setError(codeResponse.data.message || "Error al enviar el código");
        }
      } else {
        setError(
          "No se encontró una cuenta de administrador con este correo electrónico",
        );
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message ||
          "Error al procesar la solicitud. Por favor, intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/admin/auth/verify-code", {
        user_id: userId,
        code: parseInt(code),
      });

      if (response.data.success) {
        // Store tokens and user info
        localStorage.setItem("adminAccessToken", response.data.accessToken);
        localStorage.setItem("adminRefreshToken", response.data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(response.data.user));

        // Redirect to admin dashboard
        navigate("/admin/dashboard");
      } else {
        setError(response.data.message || "Código inválido");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message ||
          "Código inválido. Por favor, verifica e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left column - Login Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <Logo 
                className="gap-4" 
                iconClassName="h-16 w-auto" 
                textClassName="h-10 w-auto" 
              />
            </div>

            <div className="mb-2">
              <p className="text-sm text-[#6B5335] font-medium">
                Panel de Administración
              </p>
            </div>

            {/* Welcome text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === "email" ? "Bienvenido" : "Verificación"}
              </h2>
              <p className="text-gray-600">
                {step === "email"
                  ? "Ingresa tu correo electrónico para acceder al sistema"
                  : `Ingresa el código enviado a ${email}`}
              </p>
            </div>

            {/* Alert messages */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <MdOutlineCheckCircle className="h-4 w-4 text-[#4A7C59]" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <MdOutlineEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3D2E1F] w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@beautyhospital.com"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#A0812E] to-[#C9A159] hover:from-[#8B6E28] hover:to-[#A0812E] text-white font-semibold shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    "Enviando..."
                  ) : (
                    <>
                      Continuar
                      <MdOutlineArrowForward className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Code Step */}
            {step === "code" && (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MdOutlineShield className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {userName}
                      </p>
                      <p className="text-xs text-primary capitalize">
                        {userRole.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificación</Label>
                  <div className="relative">
                    <MdOutlineLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3D2E1F] w-5 h-5" />
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      maxLength={6}
                      className="pl-10 text-center text-2xl tracking-widest"
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-[#3D2E1F] text-center">
                    El código expira en 10 minutos
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#A0812E] to-[#C9A159] hover:from-[#8B6E28] hover:to-[#A0812E] text-white font-semibold shadow-md"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? "Verificando..." : "Iniciar Sesión"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  ← Volver a ingresar correo
                </button>
              </form>
            )}

            {/* Security notice */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <MdOutlineLock className="w-5 h-5 text-[#3D2E1F] mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    Acceso Seguro
                  </p>
                  <p className="text-xs text-[#3D2E1F] mt-1">
                    Utilizamos autenticación sin contraseña para mayor
                    seguridad. Recibirás un código único en tu correo.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to main site */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                ← Volver al sitio principal
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right column - Image/Branding */}
      <div className="hidden lg:block relative bg-gradient-to-br from-[#A0812E] via-[#C9A159] to-[#E8C580] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200')] bg-cover bg-center opacity-5"></div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center p-12 text-white drop-shadow-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-lg text-center"
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MdOutlineShield className="w-10 h-10" />
            </div>

            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Sistema de Gestión Integral
            </h2>
            <p className="text-lg text-white/95 mb-8 drop-shadow">
              Administra citas, pacientes, pagos y más desde un solo lugar.
              Diseñado para profesionales de la salud estética.
            </p>

            <div className="grid gap-4 text-left">
              {[
                {
                  icon: MdOutlineCalendarMonth,
                  title: "Gestión de Citas",
                  desc: "Calendario intuitivo con recordatorios automáticos",
                },
                {
                  icon: MdOutlinePeople,
                  title: "Pacientes",
                  desc: "Historial completo y expedientes médicos",
                },
                {
                  icon: MdOutlinePayments,
                  title: "Pagos y Contratos",
                  desc: "Control financiero total con reportes detallados",
                },
                {
                  icon: MdOutlineSettings,
                  title: "Configuración",
                  desc: "Personaliza servicios, horarios y cupones",
                },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30"
                  >
                    <IconComponent className="w-7 h-7 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white drop-shadow">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/90 drop-shadow">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
