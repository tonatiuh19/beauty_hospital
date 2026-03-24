import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  MoreVertical,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import {
  format,
  parseISO,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CheckInWithContract from "@/components/CheckInWithContract";
import { QRCodeSVG } from "qrcode.react";
import { logger } from "@/lib/logger";

// Setup the localizer for react-big-calendar
const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarAppointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service_id: number;
  service_name: string;
  service_category: string;
  service_price: number;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  checked_in_at: string | null;
  booking_source: "online" | "walk_in" | "phone" | "admin";
  notes: string | null;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarAppointment;
}

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
}

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-primary/20 text-primary",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-orange-100 text-orange-700",
};

const statusLabels = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No Show",
};

export default function AppointmentsCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("month");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"reschedule" | "cancel" | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    appointment_date: "",
    appointment_time: "",
    notes: "",
    cancellation_reason: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  // Cancel confirmation & Stripe refund state
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [stripePaymentInfo, setStripePaymentInfo] = useState<{
    has_stripe_payment: boolean;
    amount?: number;
  } | null>(null);
  const [offerRefund, setOfferRefund] = useState(false);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [checkInUrl, setCheckInUrl] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientComboOpen, setPatientComboOpen] = useState(false);

  // Super-admin check (role === 'admin' is the top role)
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
  const isSuperAdmin = adminUser?.role === "admin";

  // Create appointment form
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    service_id: "",
    scheduled_date: format(new Date(), "yyyy-MM-dd"),
    scheduled_time: "09:00",
    notes: "",
    payment_amount: 0,
    payment_method: "cash",
  });

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [currentDate, view]);

  useEffect(() => {
    // Convert appointments to calendar events
    const events: CalendarEvent[] = appointments.map((apt) => {
      // Extract just the date part if scheduled_date is a datetime
      let dateStr = apt.scheduled_date;
      if (dateStr.includes("T")) {
        dateStr = dateStr.split("T")[0];
      }

      const dateTimeString = `${dateStr}T${apt.scheduled_time}`;
      const startDate = parseISO(dateTimeString);
      const endDate = new Date(
        startDate.getTime() + (apt.duration_minutes || 60) * 60000,
      );

      return {
        id: apt.id,
        title: `${apt.patient_name} - ${apt.service_name}`,
        start: startDate,
        end: endDate,
        resource: apt,
      };
    });

    setCalendarEvents(events);
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");

      // Get date range based on current view
      let startDate: string;
      let endDate: string;

      if (view === "month") {
        startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
        endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
      } else if (view === "week") {
        startDate = format(startOfWeek(currentDate), "yyyy-MM-dd");
        endDate = format(endOfWeek(currentDate), "yyyy-MM-dd");
      } else {
        startDate = format(currentDate, "yyyy-MM-dd");
        endDate = format(currentDate, "yyyy-MM-dd");
      }

      const response = await axios.get("/admin/dashboard/calendar", {
        headers: { Authorization: `Bearer ${token}` },
        params: { start_date: startDate, end_date: endDate },
      });

      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      logger.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get("/services");
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      logger.error("Error fetching services:", error);
    }
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/patients", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: query, limit: 10 },
      });

      if (response.data.success) {
        const mapped = (response.data.data || []).map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          phone: p.phone,
        }));
        setPatients(mapped);
      }
    } catch (error) {
      logger.error("Error searching patients:", error);
    }
  };

  const handleCheckIn = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(false);
    setIsCheckInOpen(true);
  };

  const handleOpenEdit = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setEditMode(null);
    setCancelConfirming(false);
    setStripePaymentInfo(null);
    setOfferRefund(false);
    setEditForm({
      appointment_date: appointment.scheduled_date.split("T")[0],
      appointment_time: appointment.scheduled_time,
      notes: "",
      cancellation_reason: "",
    });
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  };

  const handleSelectCancelMode = async (appointmentId: number) => {
    setEditMode("cancel");
    setCancelConfirming(false);
    setStripePaymentInfo(null);
    setOfferRefund(false);
    setLoadingPaymentInfo(true);
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(
        `/admin/appointments/${appointmentId}/payment-info`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setStripePaymentInfo(response.data);
        if (response.data.has_stripe_payment) setOfferRefund(true);
      }
    } catch {
      // non-critical, proceed without refund info
    } finally {
      setLoadingPaymentInfo(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAppointment) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem("adminAccessToken");
      if (editMode === "reschedule") {
        const response = await axios.post(
          `/admin/appointments/${selectedAppointment.id}/reschedule`,
          {
            appointment_date: editForm.appointment_date,
            appointment_time: editForm.appointment_time,
            notes: editForm.notes || undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          toast({
            title: "Cita reprogramada",
            description:
              "La cita fue reprogramada y el paciente fue notificado por email.",
          });
          fetchAppointments();
          setIsEditOpen(false);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              response.data.message || "No se pudo reprogramar la cita.",
          });
        }
      } else if (editMode === "cancel") {
        const response = await axios.post(
          `/admin/appointments/${selectedAppointment.id}/cancel`,
          {
            cancellation_reason: editForm.cancellation_reason || undefined,
            refund: offerRefund && stripePaymentInfo?.has_stripe_payment,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          const refundMsg = response.data.refund_issued
            ? " Se procesó el reembolso al paciente."
            : "";
          toast({
            title: "Cita cancelada",
            description: `La cita fue cancelada y el paciente fue notificado por email.${refundMsg}`,
          });
          fetchAppointments();
          setIsEditOpen(false);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              response.data.message || "No se pudo cancelar la cita.",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Ocurrió un error.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleGenerateQR = async (appointment: CalendarAppointment) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        "/check-in/generate-token",
        { appointment_id: appointment.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setCheckInUrl(response.data.data.check_in_url);
        setSelectedAppointment(appointment);
        setIsDetailsOpen(false);
        setIsQRModalOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.data.message || "Error al generar código QR",
        });
      }
    } catch (error: any) {
      logger.error("Error generating QR:", error);
      toast({
        variant: "destructive",
        title: "Error al generar QR",
        description:
          error.response?.data?.message || "No se pudo generar el código QR",
      });
    }
  };

  const handleCheckInSuccess = () => {
    fetchAppointments();
    setIsCheckInOpen(false);
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      const response = await axios.post(
        "/admin/appointments/manual",
        { ...newAppointment, created_by: adminUser?.id || null },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        fetchAppointments();
        setIsCreateOpen(false);
        resetCreateForm();
        toast({
          title: "Cita creada",
          description: "La cita se creó exitosamente",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error al crear cita",
      });
    }
  };

  const resetCreateForm = () => {
    setNewAppointment({
      patient_id: "",
      patient_name: "",
      patient_email: "",
      patient_phone: "",
      service_id: "",
      scheduled_date: format(currentDate, "yyyy-MM-dd"),
      scheduled_time: "09:00",
      notes: "",
      payment_amount: 0,
      payment_method: "cash",
    });
    setPatients([]);
    setPatientSearch("");
    setPatientComboOpen(false);
  };

  // Event style getter for react-big-calendar
  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource;
    let background = "linear-gradient(135deg, #C9A159 0%, #D4AF6A 100%)"; // gold gradient default

    switch (appointment.status) {
      case "scheduled":
        background = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"; // blue gradient
        break;
      case "confirmed":
        background = "linear-gradient(135deg, #C9A159 0%, #D4AF6A 100%)"; // gold gradient
        break;
      case "completed":
        background = "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"; // green gradient
        break;
      case "cancelled":
        background = "linear-gradient(135deg, #f87171 0%, #ef4444 100%)"; // red gradient
        break;
      case "no_show":
        background = "linear-gradient(135deg, #fb923c 0%, #f97316 100%)"; // orange gradient
        break;
    }

    return {
      style: {
        background,
        borderRadius: "8px",
        color: "white",
        border: "none",
        display: "block",
        fontWeight: "500",
      },
    };
  };

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setIsDetailsOpen(true);
  }, []);

  // Handle slot selection (create new appointment)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      setNewAppointment((prev) => ({
        ...prev,
        scheduled_date: format(slotInfo.start, "yyyy-MM-dd"),
        scheduled_time: format(slotInfo.start, "HH:mm"),
      }));
      setIsCreateOpen(true);
    },
    [],
  );

  // Handle navigate (month/week/day change)
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Calendario de Citas
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Gestiona y organiza todas las citas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light hover:shadow-lg transition-all w-full sm:w-auto text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-primary focus:ring-primary"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programadas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Big Calendar */}
      <Card className="border-gray-200 shadow-md overflow-hidden">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Cargando calendario...
                </p>
              </div>
            </div>
          ) : (
            <div
              className="calendar-container"
              style={{ height: "clamp(400px, 70vh, 700px)" }}
            >
              <style>{`
                .calendar-container .rbc-calendar {
                  font-family: inherit;
                }
                .calendar-container .rbc-header {
                  padding: 12px 8px;
                  font-weight: 600;
                  font-size: 14px;
                  color: #374151;
                  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
                  border-bottom: 2px solid #e5e7eb;
                }
                .calendar-container .rbc-today {
                  background-color: #fef3c7;
                }
                .calendar-container .rbc-off-range-bg {
                  background-color: #f9fafb;
                }
                .calendar-container .rbc-day-bg {
                  border-color: #e5e7eb;
                }
                .calendar-container .rbc-month-row {
                  border-color: #e5e7eb;
                }
                .calendar-container .rbc-date-cell {
                  padding: 8px;
                  font-weight: 500;
                  color: #1f2937;
                }
                .calendar-container .rbc-current {
                  color: #C9A159;
                  font-weight: 700;
                }
                .calendar-container .rbc-toolbar {
                  padding: 16px;
                  background: white;
                  border-radius: 12px;
                  margin-bottom: 16px;
                  border: 1px solid #e5e7eb;
                }
                .calendar-container .rbc-toolbar button {
                  color: #374151;
                  border: 1px solid #d1d5db;
                  padding: 8px 16px;
                  border-radius: 8px;
                  font-weight: 500;
                  transition: all 0.2s;
                }
                .calendar-container .rbc-toolbar button:hover {
                  background: linear-gradient(to right, #C9A159, #D4AF6A);
                  color: white;
                  border-color: #C9A159;
                }
                .calendar-container .rbc-toolbar button.rbc-active {
                  background: linear-gradient(to right, #C9A159, #D4AF6A);
                  color: white;
                  border-color: #C9A159;
                  box-shadow: 0 2px 8px rgba(201, 161, 89, 0.3);
                }
                .calendar-container .rbc-event {
                  padding: 4px 8px;
                  border-radius: 6px;
                  border: none;
                  font-size: 13px;
                  font-weight: 500;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .calendar-container .rbc-event:hover {
                  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                  transform: translateY(-1px);
                  transition: all 0.2s;
                }
                .calendar-container .rbc-show-more {
                  background: linear-gradient(to right, #C9A159, #D4AF6A);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 600;
                }
              `}</style>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                view={view}
                date={currentDate}
                selectable
                eventPropGetter={eventStyleGetter}
                culture="es"
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Cita",
                  noEventsInRange: "No hay citas en este rango",
                  showMore: (total) => `+${total} más`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Paciente</Label>
                    <p className="font-medium">
                      {selectedAppointment.patient_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estado</Label>
                    <Badge className={statusColors[selectedAppointment.status]}>
                      {statusLabels[selectedAppointment.status]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha</Label>
                    <p className="font-medium">
                      {format(
                        parseISO(selectedAppointment.scheduled_date),
                        "d 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Hora</Label>
                    <p className="font-medium">
                      {selectedAppointment.scheduled_time}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Servicio</Label>
                    <p className="font-medium">
                      {selectedAppointment.service_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Origen</Label>
                    <p className="font-medium capitalize">
                      {selectedAppointment.booking_source.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="font-medium">
                      {selectedAppointment.patient_email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Teléfono</Label>
                    <p className="font-medium">
                      {selectedAppointment.patient_phone}
                    </p>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="text-gray-500">Notas</Label>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
                {selectedAppointment.checked_in_at && (
                  <div>
                    <Label className="text-gray-500">Check-in</Label>
                    <p className="text-sm text-green-600">
                      Registrado el{" "}
                      {format(
                        parseISO(selectedAppointment.checked_in_at),
                        "d/MM/yyyy HH:mm",
                      )}
                    </p>
                  </div>
                )}
              </div>
              {!selectedAppointment.checked_in_at &&
                selectedAppointment.status !== "cancelled" &&
                selectedAppointment.status !== "completed" && (
                  <div className="mt-4 space-y-2">
                    <Button
                      onClick={() => handleOpenEdit(selectedAppointment)}
                      className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light hover:shadow-lg transition-all text-white font-semibold"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar Cita
                    </Button>
                    <Button
                      onClick={() => handleGenerateQR(selectedAppointment)}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      Generar Código QR para Check-in
                    </Button>
                  </div>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditMode(null);
            setCancelConfirming(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Patient & service summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold text-gray-800">
                  {selectedAppointment.patient_name}
                </p>
                <p className="text-gray-500">
                  {selectedAppointment.service_name}
                </p>
                <p className="text-gray-500">
                  {selectedAppointment.scheduled_date.split("T")[0]} ·{" "}
                  {selectedAppointment.scheduled_time}
                </p>
              </div>

              {/* Action selector */}
              {!editMode && (
                <div
                  className={`grid gap-3 ${isSuperAdmin ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  <button
                    onClick={() => setEditMode("reschedule")}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                      Reprogramar
                    </span>
                  </button>
                  {isSuperAdmin ? (
                    <button
                      onClick={() =>
                        handleSelectCancelMode(selectedAppointment.id)
                      }
                      className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-red-500">
                        Cancelar Cita
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-400 text-center leading-tight">
                        Solo super admin
                        <br />
                        puede cancelar
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reschedule form */}
              {editMode === "reschedule" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => setEditMode(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Volver
                  </button>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary font-medium">
                    El paciente recibirá un email con la nueva fecha y hora.
                  </div>
                  <div>
                    <Label>Nueva Fecha *</Label>
                    <Input
                      type="date"
                      value={editForm.appointment_date}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          appointment_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Nueva Hora *</Label>
                    <Input
                      type="time"
                      value={editForm.appointment_time}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          appointment_time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      placeholder="Motivo del cambio..."
                      rows={2}
                    />
                  </div>
                </motion.div>
              )}

              {/* Cancel form — step 1: reason & refund choice */}
              {editMode === "cancel" && !cancelConfirming && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => setEditMode(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Volver
                  </button>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">
                    El paciente recibirá un email notificando la cancelación.
                  </div>
                  <div>
                    <Label>Motivo de cancelación (opcional)</Label>
                    <Textarea
                      value={editForm.cancellation_reason}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          cancellation_reason: e.target.value,
                        })
                      }
                      placeholder="Ej: Reagendado por el médico, emergencia, etc."
                      rows={2}
                    />
                  </div>

                  {/* Stripe refund toggle */}
                  {loadingPaymentInfo ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Verificando pago...
                    </div>
                  ) : stripePaymentInfo?.has_stripe_payment ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-800">
                        Pago detectado: $
                        {Number(stripePaymentInfo.amount).toFixed(2)} MXN vía
                        Stripe
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => setOfferRefund(!offerRefund)}
                          className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${offerRefund ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${offerRefund ? "translate-x-5" : "translate-x-0.5"}`}
                          />
                        </div>
                        <span className="text-xs text-amber-800 font-medium">
                          {offerRefund
                            ? "Reembolsar al paciente"
                            : "No reembolsar"}
                        </span>
                      </label>
                    </div>
                  ) : stripePaymentInfo &&
                    !stripePaymentInfo.has_stripe_payment ? (
                    <p className="text-xs text-gray-400">
                      Sin pago por Stripe — no aplica reembolso.
                    </p>
                  ) : null}
                </motion.div>
              )}

              {/* Cancel form — step 2: final confirmation */}
              {editMode === "cancel" && cancelConfirming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-red-800">
                      ¿Confirmar cancelación?
                    </p>
                    <p className="text-xs text-red-600">
                      Se cancelará la cita de{" "}
                      <strong>{selectedAppointment.patient_name}</strong> y se
                      notificará por email.
                    </p>
                    {offerRefund && stripePaymentInfo?.has_stripe_payment && (
                      <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                        Se procesará un reembolso de $
                        {Number(stripePaymentInfo.amount).toFixed(2)} MXN
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Footer */}
          {editMode === "reschedule" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditMode(null)}
                disabled={editLoading}
              >
                Atrás
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={
                  editLoading ||
                  !editForm.appointment_date ||
                  !editForm.appointment_time
                }
                className="bg-primary hover:bg-primary/90"
              >
                {editLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  "Reprogramar y Notificar"
                )}
              </Button>
            </DialogFooter>
          )}
          {editMode === "cancel" && !cancelConfirming && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditMode(null)}
                disabled={editLoading}
              >
                Atrás
              </Button>
              <Button
                onClick={() => setCancelConfirming(true)}
                disabled={loadingPaymentInfo}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Continuar
              </Button>
            </DialogFooter>
          )}
          {editMode === "cancel" && cancelConfirming && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelConfirming(false)}
                disabled={editLoading}
              >
                Atrás
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {editLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelando...
                  </span>
                ) : (
                  "Sí, cancelar y notificar"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Código QR de Check-in
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && checkInUrl && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Paciente:{" "}
                  <span className="font-semibold">
                    {selectedAppointment.patient_name}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Servicio:{" "}
                  <span className="font-semibold">
                    {selectedAppointment.service_name}
                  </span>
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex justify-center">
                <QRCodeSVG
                  value={checkInUrl}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Instrucciones:</strong>
                  </p>
                  <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                    <li>
                      El paciente escanea este código QR con el iPad o su
                      teléfono
                    </li>
                    <li>Se abrirá la página de check-in automáticamente</li>
                    <li>El paciente lee y firma el contrato</li>
                    <li>Recibirá una copia por email</li>
                  </ol>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Este código QR es válido por 24 horas
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(checkInUrl);
                      toast({
                        title: "URL copiado",
                        description: "El enlace se copió al portapapeles",
                      });
                    } catch (err) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "No se pudo copiar el enlace",
                      });
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copiar URL
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="flex-1"
                >
                  Imprimir QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Cita Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label>Paciente *</Label>
                <Popover
                  open={patientComboOpen}
                  onOpenChange={setPatientComboOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-white hover:border-primary transition-colors ${
                        newAppointment.patient_id
                          ? "border-green-500 text-gray-900"
                          : "border-input text-muted-foreground"
                      }`}
                    >
                      <span
                        className={
                          newAppointment.patient_id
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                      >
                        {newAppointment.patient_name || "Buscar paciente..."}
                      </span>
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Nombre, email o teléfono..."
                        value={patientSearch}
                        onValueChange={(val) => {
                          setPatientSearch(val);
                          searchPatients(val);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                          {patientSearch.length < 2
                            ? "Escribe al menos 2 caracteres"
                            : "Sin resultados"}
                        </CommandEmpty>
                        {patients.length > 0 && (
                          <CommandGroup heading="Pacientes">
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={patient.id.toString()}
                                onSelect={() => {
                                  setNewAppointment({
                                    ...newAppointment,
                                    patient_id: patient.id.toString(),
                                    patient_name: patient.name,
                                    patient_email: patient.email,
                                    patient_phone: patient.phone,
                                  });
                                  setPatientSearch("");
                                  setPatients([]);
                                  setPatientComboOpen(false);
                                }}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <p className="font-medium text-sm">
                                    {patient.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {patient.email} · {patient.phone}
                                  </p>
                                </div>
                                {newAppointment.patient_id ===
                                  patient.id.toString() && (
                                  <Check className="w-4 h-4 text-green-600" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {newAppointment.patient_id && (
                  <div className="mt-2 flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {newAppointment.patient_name}
                      </p>
                      <p className="text-xs text-green-600">
                        {newAppointment.patient_email} ·{" "}
                        {newAppointment.patient_phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAppointment({
                          ...newAppointment,
                          patient_id: "",
                          patient_name: "",
                          patient_email: "",
                          patient_phone: "",
                        });
                        setPatientSearch("");
                      }}
                      className="text-green-600 hover:text-green-800 text-xs underline ml-3"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Label>Servicio *</Label>
                <Select
                  value={newAppointment.service_id}
                  onValueChange={(value) => {
                    const service = services.find(
                      (s) => s.id === parseInt(value),
                    );
                    setNewAppointment({
                      ...newAppointment,
                      service_id: value,
                      payment_amount: service?.price || 0,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                      >
                        {service.name} - ${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={newAppointment.scheduled_date}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      scheduled_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={newAppointment.scheduled_time}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      scheduled_time: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Monto a Pagar *</Label>
                <Input
                  type="number"
                  value={newAppointment.payment_amount}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      payment_amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Método de Pago *</Label>
                <Select
                  value={newAppointment.payment_method}
                  onValueChange={(value) =>
                    setNewAppointment({
                      ...newAppointment,
                      payment_method: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              className="bg-primary hover:bg-primary/90"
            >
              Crear Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In with Contract Modal */}
      <CheckInWithContract
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        appointment={
          selectedAppointment
            ? {
                id: selectedAppointment.id,
                patient_id: selectedAppointment.patient_id,
                patient_name: selectedAppointment.patient_name,
                patient_email: selectedAppointment.patient_email,
                service_id: selectedAppointment.service_id,
                service_name: selectedAppointment.service_name,
                service_price: selectedAppointment.service_price,
                scheduled_date: selectedAppointment.scheduled_date,
                scheduled_time: selectedAppointment.scheduled_time,
              }
            : null
        }
        onCheckInSuccess={handleCheckInSuccess}
      />
    </div>
  );
}
