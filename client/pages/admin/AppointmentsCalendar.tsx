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
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [checkInUrl, setCheckInUrl] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

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
      console.error("Error fetching appointments:", error);
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
      console.error("Error fetching services:", error);
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
        setPatients(response.data.data.patients);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };

  const handleCheckIn = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(false);
    setIsCheckInOpen(true);
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
      console.error("Error generating QR:", error);
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

  const handleCancel = async (appointmentId: number, reason: string) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/api/admin/appointments/${appointmentId}/cancel`,
        { cancelled_reason: reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        fetchAppointments();
        setIsDetailsOpen(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error al cancelar cita",
      });
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        "/api/admin/appointments/manual",
        newAppointment,
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
            <div style={{ height: "700px" }} className="calendar-container">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Button
                      onClick={() => handleCheckIn(selectedAppointment)}
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Check-in Manual con Contrato
                    </Button>
                  </div>
                )}
            </>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Buscar Paciente</Label>
                <Input
                  placeholder="Nombre, email o teléfono..."
                  onChange={(e) => searchPatients(e.target.value)}
                />
                {patients.length > 0 && (
                  <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setNewAppointment({
                            ...newAppointment,
                            patient_id: patient.id.toString(),
                            patient_name: patient.name,
                            patient_email: patient.email,
                            patient_phone: patient.phone,
                          });
                          setPatients([]);
                        }}
                      >
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-gray-500">{patient.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={newAppointment.patient_name}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      patient_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newAppointment.patient_email}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      patient_email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={newAppointment.patient_phone}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      patient_phone: e.target.value,
                    })
                  }
                />
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
              <div className="col-span-2">
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
