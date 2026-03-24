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
  XCircle,
  Loader2,
  DollarSign,
  Sparkles,
  ChevronRight,
  Shield,
  Download,
  ReceiptText,
  CalendarCheck2,
  CalendarX2,
  HeartPulse,
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
import {
  InvoiceRequestModal,
  InvoiceData,
} from "@/components/InvoiceRequestModal";
import { EditAppointmentModal } from "@/components/EditAppointmentModal";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import {
  fetchPatientAppointments,
  fetchPatientProfile,
  updatePatientProfile,
  downloadContract,
  cancelAppointment,
  resetAppointments,
} from "@/store/slices/patientAppointmentsSlice";

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
  contract_id?: number;
  contract_status?: string;
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

type ActiveTab = "appointments" | "profile";

export default function MyAppointments() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const {
    appointments,
    profile,
    loading,
    profileLoading,
    downloadingContractId,
    error,
  } = useAppSelector((state) => state.patientAppointments);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>("appointments");
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
      dispatch(fetchPatientAppointments(user.id));
      dispatch(fetchPatientProfile(user.id));
    }
    return () => {
      dispatch(resetAppointments());
    };
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (profile) setProfileForm(profile);
  }, [profile]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
    }
  }, [error, toast]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !user?.id) return;
    try {
      setIsProcessing(true);
      await dispatch(
        cancelAppointment({
          appointmentId: selectedAppointment.id,
          patientId: user.id,
          reason: cancellationReason,
        }),
      ).unwrap();
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada exitosamente",
      });
      setShowCancelModal(false);
      setCancellationReason("");
      setSelectedAppointment(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "No se pudo cancelar la cita",
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
        { patient_id: user.id, new_date: newDate, new_time: newTime },
      );
      if (response.data.success) {
        toast({
          title: "Cita reagendada",
          description: "Tu cita ha sido reagendada exitosamente",
        });
        setShowEditModal(false);
        if (user?.id) dispatch(fetchPatientAppointments(user.id));
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
        { patient_id: user.id, invoice_info: invoiceData },
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
      await dispatch(
        updatePatientProfile({ patientId: user.id, updates: profileForm }),
      ).unwrap();
      setIsEditingProfile(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados exitosamente",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "No se pudo actualizar el perfil",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadContract = async (
    contractId: number,
    appointmentId: number,
  ) => {
    try {
      await dispatch(downloadContract({ contractId, appointmentId })).unwrap();
      toast({
        title: "Contrato descargado",
        description: "El contrato se ha descargado exitosamente",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "No se pudo descargar el contrato",
      });
    }
  };

  const upcomingAppointments = appointments.filter((apt) => apt.is_upcoming);
  const pastAppointments = appointments.filter((apt) => apt.is_past);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8EF] to-[#FFF3E0]">
        <MetaHelmet
          title="Mis Citas - All Beauty Luxury & Wellness"
          description="Administra tus citas médicas"
        />
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#C9A159] to-[#A0812E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#C9A159]/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#3D2E1F] mb-3">
              Acceso Restringido
            </h2>
            <p className="text-[#3D2E1F]/60 mb-6">
              Inicia sesión para administrar tus citas
            </p>
            <button
              onClick={() => (window.location.href = "/appointment")}
              className="px-8 py-3 bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#C9A159]/30 transition-all"
            >
              Iniciar Sesión
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8EF] to-[#FEFCF7]">
      <MetaHelmet
        title="Mis Citas - All Beauty Luxury & Wellness"
        description="Administra tus citas y perfil"
      />
      <Header />

      <main className="flex-grow">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3D2E1F] via-[#4A3728] to-[#2C1F14] px-4 pt-10 pb-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptNiAwaDZ2LTZoLTZ2NnptLTEyIDBoLTZ2Nmg2di02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="max-w-5xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <Sparkles className="w-4 h-4 text-[#C9A159]" />
              <span className="text-[#C9A159] text-sm font-medium tracking-widest uppercase">
                Mi Espacio
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-white mb-2"
            >
              Mis Citas
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-base"
            >
              Bienvenid@ {profile?.first_name}! Aquí puedes ver y administrar
              tus citas, así como actualizar tu perfil.
            </motion.p>

            {/* Stats Row */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                {[
                  {
                    label: "Próximas",
                    value: upcomingAppointments.length,
                    icon: CalendarCheck2,
                    color: "text-[#C9A159]",
                  },
                  {
                    label: "Historial",
                    value: pastAppointments.length,
                    icon: CalendarX2,
                    color: "text-[#E8C580]",
                  },
                  {
                    label: "Total",
                    value: appointments.length,
                    icon: HeartPulse,
                    color: "text-white/70",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10"
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <div className="text-white font-bold text-xl leading-none">
                        {stat.value}
                      </div>
                      <div className="text-white/50 text-xs mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F5E9D0] shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2">
            {(["appointments", "profile"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white shadow-md shadow-[#C9A159]/20"
                    : "text-[#3D2E1F]/60 hover:bg-[#FFF8EF]"
                }`}
              >
                {tab === "appointments" ? "Citas" : "Perfil"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
          <AnimatePresence mode="wait">
            {activeTab === "appointments" ? (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#C9A159]" />
                    <p className="text-[#3D2E1F]/50 text-sm">
                      Cargando tus citas...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Upcoming */}
                    <section>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF8EF] flex items-center justify-center">
                          <CalendarCheck2 className="w-4 h-4 text-[#C9A159]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#3D2E1F]">
                          Próximas Citas
                          <span className="ml-2 text-sm font-normal text-[#3D2E1F]/40">
                            ({upcomingAppointments.length})
                          </span>
                        </h2>
                      </div>

                      {upcomingAppointments.length === 0 ? (
                        <EmptyState
                          icon={CalendarCheck2}
                          title="Sin citas próximas"
                          action={{
                            label: "Agendar Nueva Cita",
                            href: "/appointment",
                          }}
                        />
                      ) : (
                        <div className="space-y-4">
                          {upcomingAppointments.map((apt, i) => (
                            <AppointmentCard
                              key={apt.id}
                              appointment={apt}
                              index={i}
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
                              onDownloadContract={
                                apt.contract_id &&
                                apt.contract_status === "signed"
                                  ? () =>
                                      handleDownloadContract(
                                        apt.contract_id!,
                                        apt.id,
                                      )
                                  : undefined
                              }
                              isDownloadingContract={
                                downloadingContractId === apt.contract_id
                              }
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    {/* History */}
                    <section>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF8EF] flex items-center justify-center">
                          <CalendarX2 className="w-4 h-4 text-[#A0812E]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#3D2E1F]">
                          Historial
                          <span className="ml-2 text-sm font-normal text-[#3D2E1F]/40">
                            ({pastAppointments.length})
                          </span>
                        </h2>
                      </div>

                      {pastAppointments.length === 0 ? (
                        <EmptyState
                          icon={FileText}
                          title="Sin citas anteriores"
                        />
                      ) : (
                        <div className="space-y-4">
                          {pastAppointments.map((apt, i) => (
                            <AppointmentCard
                              key={apt.id}
                              appointment={apt}
                              index={i}
                              isPast
                              onRequestInvoice={() => {
                                setSelectedAppointment(apt);
                                setShowInvoiceModal(true);
                              }}
                              onDownloadContract={
                                apt.contract_id &&
                                apt.contract_status === "signed"
                                  ? () =>
                                      handleDownloadContract(
                                        apt.contract_id!,
                                        apt.id,
                                      )
                                  : undefined
                              }
                              isDownloadingContract={
                                downloadingContractId === apt.contract_id
                              }
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {profileLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#C9A159]" />
                    <p className="text-[#3D2E1F]/50 text-sm">
                      Cargando perfil...
                    </p>
                  </div>
                ) : profile ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#F5E9D0] overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-[#3D2E1F] to-[#4A3728] px-8 py-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#C9A159] to-[#A0812E] rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">
                            {profile.first_name?.[0]}
                            {profile.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-white font-bold text-xl">
                            {profile.first_name} {profile.last_name}
                          </h2>
                          <p className="text-white/50 text-sm">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all border border-white/20"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      )}
                    </div>

                    <div className="p-8">
                      {isEditingProfile ? (
                        <form
                          onSubmit={handleUpdateProfile}
                          className="space-y-8"
                        >
                          <ProfileFormSection
                            title="Información Personal"
                            icon={User}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                {
                                  id: "first_name",
                                  label: "Nombre *",
                                  field: "first_name" as keyof PatientProfile,
                                },
                                {
                                  id: "last_name",
                                  label: "Apellido *",
                                  field: "last_name" as keyof PatientProfile,
                                },
                                {
                                  id: "phone",
                                  label: "Teléfono *",
                                  field: "phone" as keyof PatientProfile,
                                },
                                {
                                  id: "date_of_birth",
                                  label: "Fecha de Nacimiento *",
                                  field:
                                    "date_of_birth" as keyof PatientProfile,
                                  type: "date",
                                },
                              ].map(({ id, label, field, type }) => (
                                <div key={id}>
                                  <Label
                                    htmlFor={id}
                                    className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                  >
                                    {label}
                                  </Label>
                                  <Input
                                    id={id}
                                    type={type || "text"}
                                    value={(profileForm[field] as string) || ""}
                                    onChange={(e) =>
                                      setProfileForm({
                                        ...profileForm,
                                        [field]: e.target.value,
                                      })
                                    }
                                    className="border-[#F5E9D0] focus:border-[#C9A159] focus:ring-[#C9A159]/20 rounded-xl"
                                    required
                                  />
                                </div>
                              ))}
                              <div>
                                <Label
                                  htmlFor="gender"
                                  className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                >
                                  Género *
                                </Label>
                                <Select
                                  value={profileForm.gender || ""}
                                  onValueChange={(v) =>
                                    setProfileForm({
                                      ...profileForm,
                                      gender: v,
                                    })
                                  }
                                >
                                  <SelectTrigger className="border-[#F5E9D0] rounded-xl">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">
                                      Masculino
                                    </SelectItem>
                                    <SelectItem value="female">
                                      Femenino
                                    </SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </ProfileFormSection>

                          <ProfileFormSection title="Dirección" icon={MapPin}>
                            <div className="space-y-4">
                              <div>
                                <Label
                                  htmlFor="address"
                                  className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                >
                                  Calle y Número *
                                </Label>
                                <Input
                                  id="address"
                                  value={profileForm.address || ""}
                                  onChange={(e) =>
                                    setProfileForm({
                                      ...profileForm,
                                      address: e.target.value,
                                    })
                                  }
                                  className="border-[#F5E9D0] focus:border-[#C9A159] rounded-xl"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                  {
                                    id: "city",
                                    label: "Ciudad *",
                                    field: "city" as keyof PatientProfile,
                                  },
                                  {
                                    id: "state",
                                    label: "Estado *",
                                    field: "state" as keyof PatientProfile,
                                  },
                                  {
                                    id: "zip_code",
                                    label: "C.P. *",
                                    field: "zip_code" as keyof PatientProfile,
                                    maxLength: 5,
                                  },
                                ].map(({ id, label, field, maxLength }) => (
                                  <div key={id}>
                                    <Label
                                      htmlFor={id}
                                      className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                    >
                                      {label}
                                    </Label>
                                    <Input
                                      id={id}
                                      value={
                                        (profileForm[field] as string) || ""
                                      }
                                      onChange={(e) =>
                                        setProfileForm({
                                          ...profileForm,
                                          [field]: e.target.value,
                                        })
                                      }
                                      maxLength={maxLength}
                                      className="border-[#F5E9D0] focus:border-[#C9A159] rounded-xl"
                                      required
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </ProfileFormSection>

                          <ProfileFormSection
                            title="Contacto de Emergencia"
                            icon={AlertCircle}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="ec_name"
                                  className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                >
                                  Nombre *
                                </Label>
                                <Input
                                  id="ec_name"
                                  value={
                                    profileForm.emergency_contact_name || ""
                                  }
                                  onChange={(e) =>
                                    setProfileForm({
                                      ...profileForm,
                                      emergency_contact_name: e.target.value,
                                    })
                                  }
                                  className="border-[#F5E9D0] focus:border-[#C9A159] rounded-xl"
                                  required
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="ec_phone"
                                  className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                                >
                                  Teléfono *
                                </Label>
                                <Input
                                  id="ec_phone"
                                  value={
                                    profileForm.emergency_contact_phone || ""
                                  }
                                  onChange={(e) =>
                                    setProfileForm({
                                      ...profileForm,
                                      emergency_contact_phone: e.target.value,
                                    })
                                  }
                                  className="border-[#F5E9D0] focus:border-[#C9A159] rounded-xl"
                                  required
                                />
                              </div>
                            </div>
                          </ProfileFormSection>

                          <div className="flex gap-3 pt-2 border-t border-[#F5E9D0]">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileForm(profile);
                              }}
                              disabled={isProcessing}
                              className="px-6 py-2.5 rounded-xl border border-[#F5E9D0] text-[#3D2E1F]/70 font-medium text-sm hover:bg-[#FFF8EF] transition-all disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isProcessing}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#C9A159]/30 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                  Guardando...
                                </>
                              ) : (
                                "Guardar Cambios"
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-8">
                          <ProfileViewSection
                            title="Información Personal"
                            icon={User}
                          >
                            <ProfileField
                              label="Nombre completo"
                              value={`${profile.first_name} ${profile.last_name}`}
                            />
                            <ProfileField
                              label="Email"
                              value={profile.email}
                              icon={Mail}
                            />
                            <ProfileField
                              label="Teléfono"
                              value={profile.phone}
                              icon={Phone}
                            />
                            {profile.date_of_birth && (
                              <ProfileField
                                label="Fecha de Nacimiento"
                                value={new Date(
                                  profile.date_of_birth,
                                ).toLocaleDateString("es-MX")}
                              />
                            )}
                            {profile.gender && (
                              <ProfileField
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
                          </ProfileViewSection>

                          {(profile.address ||
                            profile.city ||
                            profile.state) && (
                            <ProfileViewSection title="Dirección" icon={MapPin}>
                              {profile.address && (
                                <ProfileField
                                  label="Dirección"
                                  value={profile.address}
                                />
                              )}
                              {profile.city && (
                                <ProfileField
                                  label="Ciudad"
                                  value={profile.city}
                                />
                              )}
                              {profile.state && (
                                <ProfileField
                                  label="Estado"
                                  value={profile.state}
                                />
                              )}
                              {profile.zip_code && (
                                <ProfileField
                                  label="Código Postal"
                                  value={profile.zip_code}
                                />
                              )}
                            </ProfileViewSection>
                          )}

                          {(profile.emergency_contact_name ||
                            profile.emergency_contact_phone) && (
                            <ProfileViewSection
                              title="Contacto de Emergencia"
                              icon={AlertCircle}
                            >
                              {profile.emergency_contact_name && (
                                <ProfileField
                                  label="Nombre"
                                  value={profile.emergency_contact_name}
                                />
                              )}
                              {profile.emergency_contact_phone && (
                                <ProfileField
                                  label="Teléfono"
                                  value={profile.emergency_contact_phone}
                                  icon={Phone}
                                />
                              )}
                            </ProfileViewSection>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={User} title="No se pudo cargar el perfil" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

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

          {/* Cancel Modal */}
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
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gradient-to-br from-[#3D2E1F] to-[#2C1F14] px-7 py-6 relative">
                      <button
                        onClick={() => setShowCancelModal(false)}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <XCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <h2 className="text-white font-bold text-2xl">
                        Cancelar Cita
                      </h2>
                      <p className="text-white/50 text-sm mt-1">
                        {selectedAppointment.service.name}
                      </p>
                    </div>
                    <div className="p-7 space-y-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-semibold mb-0.5">
                            Política de Cancelación
                          </p>
                          <p className="leading-relaxed">
                            Más de 24 hrs → reembolso completo. Menos de 24 hrs
                            → <strong>sin reembolso</strong>.
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="cancel_reason"
                          className="text-[#3D2E1F]/70 text-sm font-medium mb-1.5 block"
                        >
                          Motivo (opcional)
                        </Label>
                        <Input
                          id="cancel_reason"
                          value={cancellationReason}
                          onChange={(e) =>
                            setCancellationReason(e.target.value)
                          }
                          placeholder="¿Por qué cancelas?"
                          disabled={isProcessing}
                          className="border-[#F5E9D0] rounded-xl"
                        />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCancelModal(false);
                            setCancellationReason("");
                          }}
                          disabled={isProcessing}
                          className="flex-1 py-3 rounded-xl border border-[#F5E9D0] text-[#3D2E1F]/70 font-medium text-sm hover:bg-[#FFF8EF] transition-all disabled:opacity-50"
                        >
                          Volver
                        </button>
                        <button
                          onClick={handleCancelAppointment}
                          disabled={isProcessing}
                          className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Cancelando...
                            </>
                          ) : (
                            "Confirmar"
                          )}
                        </button>
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

// ─── Appointment Card ──────────────────────────────────────────────────────────
interface AppointmentCardProps {
  appointment: PatientAppointment;
  index: number;
  isPast?: boolean;
  onCancel?: () => void;
  onEdit?: () => void;
  onRequestInvoice?: () => void;
  onDownloadContract?: () => void;
  isDownloadingContract?: boolean;
}

function AppointmentCard({
  appointment,
  index,
  isPast = false,
  onCancel,
  onEdit,
  onRequestInvoice,
  onDownloadContract,
  isDownloadingContract = false,
}: AppointmentCardProps) {
  const date = new Date(appointment.scheduled_at);
  const dateStr = date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    confirmed: {
      label: "Confirmada",
      bg: "bg-[#FFF8EF]",
      text: "text-[#A0812E]",
      dot: "bg-[#C9A159]",
    },
    scheduled: {
      label: "Programada",
      bg: "bg-[#FFF8EF]",
      text: "text-[#3D2E1F]",
      dot: "bg-[#C9A159]",
    },
    completed: {
      label: "Completada",
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
    cancelled: {
      label: "Cancelada",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
    in_progress: {
      label: "En Progreso",
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    no_show: {
      label: "No Asistió",
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
  };

  const s = statusConfig[appointment.status] || statusConfig.completed;

  const accentColor = isPast ? "#94A3B8" : "#C9A159";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-[#F5E9D0]/60 overflow-hidden hover:shadow-md transition-shadow group"
    >
      {/* Left accent bar */}
      <div className="flex">
        <div
          className="w-1 flex-shrink-0 rounded-l-2xl"
          style={{
            background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)`,
          }}
        />

        <div className="flex-grow px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Info */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <h3 className="text-base font-bold text-[#3D2E1F] truncate">
                  {appointment.service.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[#3D2E1F]/60">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="capitalize">{dateStr}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {timeStr} · {appointment.duration_minutes} min
                </span>
                {appointment.payment && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />$
                    {appointment.payment.amount.toFixed(2)}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${appointment.payment.status === "completed" ? "bg-[#FFF8EF] text-[#A0812E]" : "bg-amber-50 text-amber-600"}`}
                    >
                      {appointment.payment.status === "completed"
                        ? "Pagado"
                        : appointment.payment.status}
                    </span>
                  </span>
                )}
                {!appointment.booked_for_self && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    Para: {appointment.patient.first_name}{" "}
                    {appointment.patient.last_name}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
              {appointment.can_edit && onEdit && (
                <ActionButton
                  onClick={onEdit}
                  icon={Edit2}
                  label="Reagendar"
                  variant="default"
                />
              )}
              {appointment.can_cancel && onCancel && (
                <ActionButton
                  onClick={onCancel}
                  icon={XCircle}
                  label="Cancelar"
                  variant="danger"
                />
              )}
              {onDownloadContract && (
                <ActionButton
                  onClick={onDownloadContract}
                  icon={isDownloadingContract ? Loader2 : Download}
                  label={isDownloadingContract ? "Descargando..." : "Contrato"}
                  disabled={isDownloadingContract}
                  spinning={isDownloadingContract}
                  variant="success"
                />
              )}
              {appointment.payment?.status === "completed" &&
                onRequestInvoice && (
                  <ActionButton
                    onClick={onRequestInvoice}
                    icon={ReceiptText}
                    label="Factura"
                    variant="default"
                  />
                )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────────
function ActionButton({
  onClick,
  icon: Icon,
  label,
  variant = "default",
  disabled = false,
  spinning = false,
}: {
  onClick: () => void;
  icon: any;
  label: string;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  spinning?: boolean;
}) {
  const styles = {
    default:
      "bg-[#FFF8EF] text-[#3D2E1F]/70 hover:bg-[#F5E9D0] border-[#F5E9D0]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border-red-100",
    success: "bg-[#FFF8EF] text-[#A0812E] hover:bg-[#F5E9D0] border-[#F5E9D0]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 whitespace-nowrap ${styles[variant]}`}
    >
      <Icon
        className={`w-3.5 h-3.5 flex-shrink-0 ${spinning ? "animate-spin" : ""}`}
      />
      {label}
    </button>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: any;
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#F5E9D0] p-12 text-center">
      <div className="w-14 h-14 bg-[#FFF8EF] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[#C9A159]/60" />
      </div>
      <p className="text-[#3D2E1F]/50 font-medium mb-4">{title}</p>
      {action && (
        <a
          href={action.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C9A159] to-[#A0812E] text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#C9A159]/30 transition-all"
        >
          {action.label}
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ─── Profile Form Section ──────────────────────────────────────────────────────
function ProfileFormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#FFF8EF] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#C9A159]" />
        </div>
        <h3 className="font-semibold text-[#3D2E1F] text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Profile View Section ──────────────────────────────────────────────────────
function ProfileViewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F5E9D0]">
        <div className="w-7 h-7 rounded-lg bg-[#FFF8EF] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#C9A159]" />
        </div>
        <h3 className="font-semibold text-[#3D2E1F] text-base">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ─── Profile Field ─────────────────────────────────────────────────────────────
function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div className="bg-[#FAFAF9] rounded-xl p-4 border border-[#F5E9D0]">
      <span className="text-xs text-[#3D2E1F]/40 font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2 mt-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#C9A159]" />}
        <p className="font-semibold text-[#3D2E1F] text-sm">{value}</p>
      </div>
    </div>
  );
}
