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
  service_name: string;
  service_category: string;
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("month");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const handleCheckIn = async (appointmentId: number) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/api/admin/appointments/${appointmentId}/check-in`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        fetchAppointments();
        setIsDetailsOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar check-in");
    }
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
      alert(error.response?.data?.message || "Error al cancelar cita");
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
        alert("Cita creada exitosamente");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear cita");
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
    let backgroundColor = "#C9A159"; // gold default

    switch (appointment.status) {
      case "scheduled":
        backgroundColor = "#3b82f6"; // blue
        break;
      case "confirmed":
        backgroundColor = "#C9A159"; // gold
        break;
      case "completed":
        backgroundColor = "#22c55e"; // green
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red
        break;
      case "no_show":
        backgroundColor = "#f97316"; // orange
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Calendario de Citas
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Gestiona y organiza todas las citas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
      <Card>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-gray-500">Cargando calendario...</p>
            </div>
          ) : (
            <div style={{ height: "700px" }}>
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
    </div>
  );
}
