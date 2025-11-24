import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Edit2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MetaHelmet } from "@/components/MetaHelmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InvoiceRequestModal,
  InvoiceData,
} from "@/components/InvoiceRequestModal";
import { EditAppointmentModal } from "@/components/EditAppointmentModal";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";

interface PatientAppointment {
  id: number;
  service: {
    id: number;
    name: string;
    price: number;
    category: string;
  };
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  booked_for_self: boolean;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  payment: {
    id: number;
    amount: number;
    status: string;
    method: string;
  } | null;
  is_past: boolean;
  is_upcoming: boolean;
  can_cancel: boolean;
  can_edit: boolean;
}

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export default function MyAppointments() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PatientProfile>>({});

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<PatientAppointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAppointments();
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const fetchAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/patient/appointments?patient_id=${user.id}`,
      );
      if (response.data.success) {
        setAppointments(response.data.data.appointments || []);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudieron cargar las citas",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(
        `/patient/profile?patient_id=${user.id}`,
      );
      if (response.data.success) {
        setProfile(response.data.data);
        setProfileForm(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !user?.id) return;

    try {
      setIsProcessing(true);
      const response = await axios.patch(
        `/patient/appointments/${selectedAppointment.id}/cancel`,
        {
          patient_id: user.id,
          cancellation_reason: cancellationReason,
        },
      );

      if (response.data.success) {
        const data = response.data.data;
        toast({
          title: "Cita cancelada",
          description: data.penalization_applied
            ? "❌ No habrá reembolso - cancelación con menos de 24 horas de anticipación"
            : `✅ Reembolso procesado: $${data.refund_amount?.toFixed(2)}`,
          variant: data.penalization_applied ? "destructive" : "default",
        });

        setShowCancelModal(false);
        setCancellationReason("");
        fetchAppointments();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo cancelar la cita",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescheduleAppointment = async (
    newDate: string,
    newTime: string,
  ) => {
    if (!selectedAppointment || !user?.id) return;

    try {
      setIsProcessing(true);
      const response = await axios.patch(
        `/patient/appointments/${selectedAppointment.id}/reschedule`,
        {
          patient_id: user.id,
          new_date: newDate,
          new_time: newTime,
        },
      );

      if (response.data.success) {
        toast({
          title: "Cita reagendada",
          description: "Tu cita ha sido reagendada exitosamente",
        });

        setShowEditModal(false);
        fetchAppointments();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo reagendar la cita",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInvoice = async (invoiceData: InvoiceData) => {
    if (!selectedAppointment || !user?.id) return;

    try {
      setIsProcessing(true);
      const response = await axios.post(
        `/patient/appointments/${selectedAppointment.id}/request-invoice`,
        {
          patient_id: user.id,
          invoice_info: invoiceData,
        },
      );

      if (response.data.success) {
        toast({
          title: "Factura solicitada",
          description: "Recibirás tu factura por correo electrónico en breve",
        });

        setShowInvoiceModal(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo solicitar la factura",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsProcessing(true);
      const response = await axios.put(`/patient/profile`, {
        patient_id: user.id,
        ...profileForm,
      });

      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditingProfile(false);
        toast({
          title: "Perfil actualizado",
          description: "Tus datos han sido actualizados exitosamente",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo actualizar el perfil",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: "Confirmada",
      scheduled: "Programada",
      completed: "Completada",
      cancelled: "Cancelada",
      in_progress: "En Progreso",
      no_show: "No Asistió",
    };
    return labels[status] || status;
  };

  const upcomingAppointments = appointments.filter((apt) => apt.is_upcoming);
  const pastAppointments = appointments.filter((apt) => apt.is_past);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <MetaHelmet
          title="Mis Citas - All Beauty Luxury & Wellness"
          description="Administra tus citas médicas"
        />
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600 mb-4">
              Debes iniciar sesión para ver tus citas
            </p>
            <Button onClick={() => (window.location.href = "/appointment")}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50">
      <MetaHelmet
        title="Mis Citas - All Beauty Luxury & Wellness"
        description="Administra tus citas y perfil"
      />
      <Header />

      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
          <p className="text-gray-600">
            Administra tus citas, solicita facturas y actualiza tu perfil
          </p>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="appointments">Citas</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Appointments */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Próximas Citas ({upcomingAppointments.length})
                  </h2>

                  {upcomingAppointments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        No tienes citas programadas
                      </p>
                      <Button
                        onClick={() => (window.location.href = "/appointment")}
                      >
                        Agendar Nueva Cita
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {upcomingAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onCancel={() => {
                            setSelectedAppointment(apt);
                            setShowCancelModal(true);
                          }}
                          onEdit={() => {
                            setSelectedAppointment(apt);
                            setShowEditModal(true);
                          }}
                          onRequestInvoice={() => {
                            setSelectedAppointment(apt);
                            setShowInvoiceModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Appointments */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Historial ({pastAppointments.length})
                  </h2>

                  {pastAppointments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No tienes citas anteriores
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {pastAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onRequestInvoice={() => {
                            setSelectedAppointment(apt);
                            setShowInvoiceModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {profile && (
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Mi Perfil
                  </h2>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Personal
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">Nombre *</Label>
                          <Input
                            id="first_name"
                            value={profileForm.first_name || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                first_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Apellido *</Label>
                          <Input
                            id="last_name"
                            value={profileForm.last_name || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                last_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono *</Label>
                          <Input
                            id="phone"
                            value={profileForm.phone || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                phone: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="date_of_birth">
                            Fecha de Nacimiento *
                          </Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={profileForm.date_of_birth || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                date_of_birth: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Género *</Label>
                          <Select
                            value={profileForm.gender || ""}
                            onValueChange={(value) =>
                              setProfileForm({ ...profileForm, gender: value })
                            }
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Masculino</SelectItem>
                              <SelectItem value="female">Femenino</SelectItem>
                              <SelectItem value="other">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Dirección
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="address">Calle y Número *</Label>
                          <Input
                            id="address"
                            value={profileForm.address || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                address: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">Ciudad *</Label>
                            <Input
                              id="city"
                              value={profileForm.city || ""}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  city: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">Estado *</Label>
                            <Input
                              id="state"
                              value={profileForm.state || ""}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  state: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="zip_code">Código Postal *</Label>
                            <Input
                              id="zip_code"
                              value={profileForm.zip_code || ""}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  zip_code: e.target.value,
                                })
                              }
                              maxLength={5}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Contacto de Emergencia
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergency_contact_name">
                            Nombre *
                          </Label>
                          <Input
                            id="emergency_contact_name"
                            value={profileForm.emergency_contact_name || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                emergency_contact_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency_contact_phone">
                            Teléfono *
                          </Label>
                          <Input
                            id="emergency_contact_phone"
                            value={profileForm.emergency_contact_phone || ""}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                emergency_contact_phone: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileForm(profile);
                        }}
                        disabled={isProcessing}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isProcessing}>
                        {isProcessing ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* View Mode */}
                    <ProfileSection icon={User} title="Información Personal">
                      <ProfileItem
                        label="Nombre"
                        value={`${profile.first_name} ${profile.last_name}`}
                      />
                      <ProfileItem
                        label="Email"
                        value={profile.email}
                        icon={Mail}
                      />
                      <ProfileItem
                        label="Teléfono"
                        value={profile.phone}
                        icon={Phone}
                      />
                      {profile.date_of_birth && (
                        <ProfileItem
                          label="Fecha de Nacimiento"
                          value={new Date(
                            profile.date_of_birth,
                          ).toLocaleDateString("es-MX")}
                        />
                      )}
                      {profile.gender && (
                        <ProfileItem
                          label="Género"
                          value={
                            profile.gender === "male"
                              ? "Masculino"
                              : profile.gender === "female"
                                ? "Femenino"
                                : "Otro"
                          }
                        />
                      )}
                    </ProfileSection>

                    {(profile.address || profile.city || profile.state) && (
                      <ProfileSection icon={MapPin} title="Dirección">
                        {profile.address && (
                          <ProfileItem
                            label="Dirección"
                            value={profile.address}
                          />
                        )}
                        {profile.city && (
                          <ProfileItem label="Ciudad" value={profile.city} />
                        )}
                        {profile.state && (
                          <ProfileItem label="Estado" value={profile.state} />
                        )}
                        {profile.zip_code && (
                          <ProfileItem
                            label="Código Postal"
                            value={profile.zip_code}
                          />
                        )}
                      </ProfileSection>
                    )}

                    {(profile.emergency_contact_name ||
                      profile.emergency_contact_phone) && (
                      <ProfileSection
                        icon={AlertCircle}
                        title="Contacto de Emergencia"
                      >
                        {profile.emergency_contact_name && (
                          <ProfileItem
                            label="Nombre"
                            value={profile.emergency_contact_name}
                          />
                        )}
                        {profile.emergency_contact_phone && (
                          <ProfileItem
                            label="Teléfono"
                            value={profile.emergency_contact_phone}
                          />
                        )}
                      </ProfileSection>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      {/* Modals */}
      {selectedAppointment && (
        <>
          <InvoiceRequestModal
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
            onSubmit={handleRequestInvoice}
            appointment={{
              id: selectedAppointment.id,
              service_name: selectedAppointment.service.name,
              amount:
                selectedAppointment.payment?.amount ||
                selectedAppointment.service.price,
              scheduled_at: selectedAppointment.scheduled_at,
            }}
            isLoading={isProcessing}
          />

          <EditAppointmentModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleRescheduleAppointment}
            appointment={{
              id: selectedAppointment.id,
              service_name: selectedAppointment.service.name,
              scheduled_at: selectedAppointment.scheduled_at,
              duration_minutes: selectedAppointment.duration_minutes,
            }}
            isLoading={isProcessing}
          />

          {/* Cancel Confirmation Modal */}
          <AnimatePresence>
            {showCancelModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCancelModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                    <div className="bg-red-600 p-6 text-white rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">Cancelar Cita</h2>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">
                              Política de Cancelación
                            </p>
                            <p>
                              Las cancelaciones con más de 24 horas de
                              anticipación recibirán reembolso completo.
                              Cancelaciones con menos de 24 horas{" "}
                              <strong>NO son reembolsables</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label htmlFor="cancellation_reason">
                          Motivo de cancelación (opcional)
                        </Label>
                        <Input
                          id="cancellation_reason"
                          value={cancellationReason}
                          onChange={(e) =>
                            setCancellationReason(e.target.value)
                          }
                          placeholder="Escribe el motivo..."
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCancelModal(false);
                            setCancellationReason("");
                          }}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          Volver
                        </Button>
                        <Button
                          onClick={handleCancelAppointment}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          {isProcessing
                            ? "Cancelando..."
                            : "Confirmar Cancelación"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// Appointment Card Component
interface AppointmentCardProps {
  appointment: PatientAppointment;
  onCancel?: () => void;
  onEdit?: () => void;
  onRequestInvoice?: () => void;
}

function AppointmentCard({
  appointment,
  onCancel,
  onEdit,
  onRequestInvoice,
}: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.scheduled_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {appointment.service.name}
              </h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {appointmentDate.toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {appointmentDate.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ({appointment.duration_minutes} min)
              </span>
            </div>
            {appointment.payment && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>
                  ${appointment.payment.amount.toFixed(2)} -{" "}
                  {appointment.payment.status}
                </span>
              </div>
            )}
            {!appointment.booked_for_self && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>
                  Para: {appointment.patient.first_name}{" "}
                  {appointment.patient.last_name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {appointment.can_edit && onEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="w-full lg:w-auto"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Reagendar
            </Button>
          )}
          {appointment.can_cancel && onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="w-full lg:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
          {appointment.payment &&
            appointment.payment.status === "completed" &&
            onRequestInvoice && (
              <Button
                onClick={onRequestInvoice}
                variant="outline"
                size="sm"
                className="w-full lg:w-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Solicitar Factura
              </Button>
            )}
        </div>
      </div>
    </motion.div>
  );
}

// Profile Section Component
function ProfileSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// Profile Item Component
function ProfileItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div>
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    confirmed: "Confirmada",
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
    in_progress: "En Progreso",
    no_show: "No Asistió",
  };
  return labels[status] || status;
}
