import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Calendar,
  FileText,
  DollarSign,
  Activity,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "@/lib/axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

interface PatientDetails extends Patient {
  appointments: Array<{
    id: number;
    service_name: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    processed_at?: string;
  }>;
  medical_records: Array<{
    id: number;
    doctor_name: string;
    record_type: string;
    notes: string;
    created_at: string;
  }>;
  contracts: Array<{
    id: number;
    service_name: string;
    total_sessions: number;
    completed_sessions: number;
    status: string;
  }>;
}

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMedicalRecordOpen, setIsMedicalRecordOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Edit form
  const [editForm, setEditForm] = useState<Partial<Patient>>({});

  // Medical record form
  const [medicalRecord, setMedicalRecord] = useState({
    record_type: "consultation",
    notes: "",
    attachments: "",
  });

  useEffect(() => {
    const user = localStorage.getItem("adminUser");
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [searchQuery, page]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/patients", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
          page,
          limit: 20,
        },
      });

      if (response.data.success) {
        setPatients(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]); // Set empty array on error to prevent undefined
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(`/admin/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const patientData = {
          ...response.data.data.patient,
          appointments: response.data.data.appointments || [],
          payments: response.data.data.payments || [],
          medical_records: response.data.data.medicalRecords || [],
          contracts: response.data.data.contracts || [],
        };
        setSelectedPatient(patientData);
        setEditForm(response.data.data.patient);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.put(
        `/admin/patients/${selectedPatient.id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Paciente actualizado exitosamente");
        fetchPatients();
        fetchPatientDetails(selectedPatient.id);
        setIsEditOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al actualizar paciente");
    }
  };

  const handleToggleActive = async (
    patientId: number,
    currentStatus: boolean,
  ) => {
    if (
      !confirm(
        `¿Está seguro de ${currentStatus ? "desactivar" : "activar"} este paciente?`,
      )
    )
      return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.patch(
        `/api/admin/patients/${patientId}/toggle-active`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        fetchPatients();
        if (selectedPatient?.id === patientId) {
          fetchPatientDetails(patientId);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleAddMedicalRecord = async () => {
    if (!selectedPatient) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/api/admin/patients/${selectedPatient.id}/medical-records`,
        medicalRecord,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Registro médico agregado exitosamente");
        fetchPatientDetails(selectedPatient.id);
        setIsMedicalRecordOpen(false);
        setMedicalRecord({
          record_type: "consultation",
          notes: "",
          attachments: "",
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al agregar registro");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const isDoctorRole = adminUser?.role === "doctor";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Pacientes
          </h1>
          <p className="text-gray-500 mt-1">
            Administra la información de tus pacientes
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron pacientes
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header - Hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-700">
                <div className="col-span-3">Nombre</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Teléfono</div>
                <div className="col-span-2">Fecha Registro</div>
                <div className="col-span-2">Último Acceso</div>
                <div className="col-span-1 text-center">Estado</div>
              </div>

              {/* Patient Rows */}
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fetchPatientDetails(patient.id)}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {patient.email}
                        </p>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      </div>
                      <Badge
                        variant={patient.is_active ? "default" : "secondary"}
                        className={
                          patient.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {patient.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Registro:{" "}
                        {format(parseISO(patient.created_at), "dd/MM/yyyy")}
                      </span>
                      <span>
                        Último:{" "}
                        {patient.last_login
                          ? format(parseISO(patient.last_login), "dd/MM/yyyy")
                          : "Nunca"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(patient.id, patient.is_active);
                        }}
                      >
                        {patient.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-3 flex items-center font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600 truncate">
                      {patient.email}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      {patient.phone}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      {format(parseISO(patient.created_at), "dd/MM/yyyy")}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      {patient.last_login
                        ? format(parseISO(patient.last_login), "dd/MM/yyyy")
                        : "Nunca"}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Badge
                        variant={patient.is_active ? "default" : "secondary"}
                        className={
                          patient.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {patient.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Paciente</DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="appointments">Citas</TabsTrigger>
                <TabsTrigger value="payments">Pagos</TabsTrigger>
                <TabsTrigger value="medical">Historial Médico</TabsTrigger>
                <TabsTrigger value="contracts">Contratos</TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleActive(
                        selectedPatient.id,
                        selectedPatient.is_active,
                      )
                    }
                  >
                    {selectedPatient.is_active ? (
                      <ToggleRight className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 mr-2" />
                    )}
                    {selectedPatient.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Nombre Completo</Label>
                    <p className="font-medium">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="font-medium">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Teléfono</Label>
                    <p className="font-medium">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha de Nacimiento</Label>
                    <p className="font-medium">
                      {selectedPatient.date_of_birth
                        ? format(
                            parseISO(selectedPatient.date_of_birth),
                            "dd/MM/yyyy",
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Género</Label>
                    <p className="font-medium capitalize">
                      {selectedPatient.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estado</Label>
                    <Badge
                      variant={
                        selectedPatient.is_active ? "default" : "secondary"
                      }
                      className={
                        selectedPatient.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {selectedPatient.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">Dirección</Label>
                    <p className="font-medium">
                      {selectedPatient.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Ciudad</Label>
                    <p className="font-medium">
                      {selectedPatient.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estado</Label>
                    <p className="font-medium">
                      {selectedPatient.state || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">
                      Contacto de Emergencia
                    </Label>
                    <p className="font-medium">
                      {selectedPatient.emergency_contact_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">
                      Teléfono de Emergencia
                    </Label>
                    <p className="font-medium">
                      {selectedPatient.emergency_contact_phone || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">Notas</Label>
                    <p className="text-sm">
                      {selectedPatient.notes || "Sin notas"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-2">
                {selectedPatient.appointments?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay citas registradas
                  </p>
                ) : (
                  selectedPatient.appointments?.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {appointment.service_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(
                                parseISO(appointment.scheduled_date),
                                "dd/MM/yyyy",
                              )}{" "}
                              - {appointment.scheduled_time}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-2">
                {selectedPatient.payments?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay pagos registrados
                  </p>
                ) : (
                  selectedPatient.payments?.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {payment.payment_method} -{" "}
                              {payment.created_at &&
                                format(
                                  parseISO(payment.created_at),
                                  "dd/MM/yyyy",
                                )}
                            </p>
                          </div>
                          <Badge
                            variant={
                              payment.payment_status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              payment.payment_status === "completed"
                                ? "bg-green-100 text-green-700"
                                : ""
                            }
                          >
                            {payment.payment_status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Medical Records Tab */}
              <TabsContent value="medical" className="space-y-4">
                {!isDoctorRole && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Solo los doctores pueden agregar registros médicos
                  </p>
                )}

                {isDoctorRole && (
                  <Button
                    onClick={() => setIsMedicalRecordOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Registro
                  </Button>
                )}

                {selectedPatient.medical_records?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay registros médicos
                  </p>
                ) : (
                  selectedPatient.medical_records?.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium capitalize">
                                {record.record_type.replace("_", " ")}
                              </p>
                              <p className="text-sm text-gray-500">
                                Dr. {record.doctor_name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {format(
                                parseISO(record.created_at),
                                "dd/MM/yyyy HH:mm",
                              )}
                            </p>
                          </div>
                          <p className="text-sm">{record.notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Contracts Tab */}
              <TabsContent value="contracts" className="space-y-2">
                {selectedPatient.contracts?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay contratos registrados
                  </p>
                ) : (
                  selectedPatient.contracts?.map((contract) => (
                    <Card key={contract.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {contract.service_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {contract.completed_sessions} /{" "}
                              {contract.total_sessions} sesiones completadas
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {contract.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={editForm.first_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={editForm.last_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  disabled
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, date_of_birth: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Género</Label>
                <Select
                  value={editForm.gender || ""}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, gender: value as any })
                  }
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
              <div className="col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={editForm.address || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editForm.city || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={editForm.state || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, state: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Contacto de Emergencia</Label>
                <Input
                  value={editForm.emergency_contact_name || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergency_contact_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Teléfono de Emergencia</Label>
                <Input
                  value={editForm.emergency_contact_phone || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergency_contact_phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={editForm.notes || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePatient}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medical Record Modal */}
      <Dialog open={isMedicalRecordOpen} onOpenChange={setIsMedicalRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Registro Médico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Registro *</Label>
              <Select
                value={medicalRecord.record_type}
                onValueChange={(value) =>
                  setMedicalRecord({ ...medicalRecord, record_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="treatment">Tratamiento</SelectItem>
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                  <SelectItem value="diagnosis">Diagnóstico</SelectItem>
                  <SelectItem value="prescription">Receta</SelectItem>
                  <SelectItem value="lab_results">Resultados de Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas *</Label>
              <Textarea
                value={medicalRecord.notes}
                onChange={(e) =>
                  setMedicalRecord({ ...medicalRecord, notes: e.target.value })
                }
                rows={6}
                placeholder="Detalles del registro médico..."
              />
            </div>
            <div>
              <Label>Archivos Adjuntos (URLs separadas por coma)</Label>
              <Input
                value={medicalRecord.attachments}
                onChange={(e) =>
                  setMedicalRecord({
                    ...medicalRecord,
                    attachments: e.target.value,
                  })
                }
                placeholder="https://ejemplo.com/archivo1.pdf, ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMedicalRecordOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMedicalRecord}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Agregar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
