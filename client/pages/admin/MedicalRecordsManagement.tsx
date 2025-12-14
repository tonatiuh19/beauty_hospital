import { useState, useEffect } from "react";
import {
  MdOutlineMedicalServices,
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineVisibility,
  MdOutlineSearch,
  MdOutlineFilterList,
  MdOutlineLocalHospital,
  MdOutlineDescription,
  MdOutlineImage,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMedicalRecords,
  fetchPatients,
  fetchAppointments,
  createMedicalRecord,
  updateMedicalRecord,
  selectRecord,
  type MedicalRecord,
  type MedicalRecordFormData,
} from "@/store/slices/medicalRecordsSlice";

export default function MedicalRecordsManagement() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { records, patients, appointments, loading, error } = useAppSelector(
    (state) => state.medicalRecords,
  );
  const selectedRecord = useAppSelector(
    (state) => state.medicalRecords.selectedRecord,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patient_id: null,
    appointment_id: null,
    visit_date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    treatment: "",
    notes: "",
    prescriptions: "",
  });

  useEffect(() => {
    dispatch(fetchMedicalRecords());
    dispatch(fetchPatients());
  }, [dispatch]);

  // Fetch appointments when patient is selected in form
  useEffect(() => {
    if (formData.patient_id) {
      dispatch(fetchAppointments(formData.patient_id));
    }
  }, [formData.patient_id, dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCreateRecord = async () => {
    try {
      await dispatch(createMedicalRecord(formData)).unwrap();
      toast({
        title: "Éxito",
        description: "Expediente médico creado exitosamente",
      });
      setIsCreateModalOpen(false);
      resetForm();
      dispatch(fetchMedicalRecords());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "No se pudo crear el expediente médico",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord) return;
    try {
      await dispatch(
        updateMedicalRecord({ id: selectedRecord.id, data: formData }),
      ).unwrap();
      toast({
        title: "Éxito",
        description: "Expediente médico actualizado exitosamente",
      });
      setIsEditModalOpen(false);
      resetForm();
      dispatch(fetchMedicalRecords());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "No se pudo actualizar el expediente médico",
        variant: "destructive",
      });
    }
  };

  const openViewModal = (record: MedicalRecord) => {
    dispatch(selectRecord(record));
    setIsViewModalOpen(true);
  };

  const openEditModal = (record: MedicalRecord) => {
    dispatch(selectRecord(record));
    setFormData({
      patient_id: record.patient_id,
      appointment_id: record.appointment_id || null,
      visit_date: record.visit_date.split("T")[0],
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes || "",
      prescriptions: record.prescriptions || "",
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      patient_id: null,
      appointment_id: null,
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: "",
      treatment: "",
      notes: "",
      prescriptions: "",
    });
    dispatch(selectRecord(null));
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.patient.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPatient =
      selectedPatient === "all" ||
      record.patient_id === parseInt(selectedPatient);

    return matchesSearch && matchesPatient;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MdOutlineMedicalServices className="w-8 h-8 text-green-600" />
            Expedientes Médicos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los expedientes médicos de los pacientes
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <MdOutlineAdd className="w-5 h-5 mr-2" />
          Nuevo Expediente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, diagnóstico o tratamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MdOutlineFilterList className="w-4 h-4" />
                  <SelectValue placeholder="Filtrar por paciente" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expedientes ({filteredRecords.length})</CardTitle>
          <CardDescription>
            Lista de todos los expedientes médicos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Fecha de Visita</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Cargando expedientes...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No se encontraron expedientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {record.patient.first_name[0]}
                            {record.patient.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {record.patient.first_name}{" "}
                            {record.patient.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.patient.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(record.visit_date).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.diagnosis}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MdOutlineLocalHospital className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{record.doctor_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(record)}
                        >
                          <MdOutlineVisibility className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(record)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Record Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Expediente Médico</DialogTitle>
            <DialogDescription>
              Registra un nuevo expediente médico para un paciente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente</Label>
              <Select
                value={formData.patient_id?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    patient_id: parseInt(value),
                    appointment_id: null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.first_name} {patient.last_name} - {patient.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.patient_id && (
              <div className="space-y-2">
                <Label htmlFor="appointment">Cita (Opcional)</Label>
                <Select
                  value={formData.appointment_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      appointment_id: value === "none" ? null : parseInt(value),
                    })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loading
                          ? "Cargando citas..."
                          : appointments.filter(
                                (apt) => apt.patient_id === formData.patient_id,
                              ).length === 0
                            ? "No hay citas para este paciente"
                            : "Seleccionar cita relacionada"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {appointments
                      .filter((apt) => apt.patient_id === formData.patient_id)
                      .map((appointment) => (
                        <SelectItem
                          key={appointment.id}
                          value={appointment.id.toString()}
                        >
                          {appointment.service_name} -{" "}
                          {new Date(appointment.scheduled_at).toLocaleString(
                            "es-MX",
                          )}{" "}
                          ({appointment.status})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {appointments.filter(
                  (apt) => apt.patient_id === formData.patient_id,
                ).length === 0 &&
                  !loading && (
                    <p className="text-xs text-gray-500">
                      Este paciente no tiene citas registradas. Puedes crear el
                      expediente sin asociarlo a una cita.
                    </p>
                  )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="visit_date">Fecha de Visita</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) =>
                  setFormData({ ...formData, visit_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment">Tratamiento</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) =>
                  setFormData({ ...formData, treatment: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prescriptions">Recetas</Label>
              <Textarea
                id="prescriptions"
                value={formData.prescriptions}
                onChange={(e) =>
                  setFormData({ ...formData, prescriptions: e.target.value })
                }
                rows={3}
                placeholder="Medicamentos prescritos, dosis, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Observaciones, recomendaciones, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateRecord}>Crear Expediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Expediente Médico</DialogTitle>
            <DialogDescription>
              Actualiza la información del expediente médico
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_patient">Paciente</Label>
              <Select
                value={formData.patient_id?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    patient_id: parseInt(value),
                    appointment_id: null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.first_name} {patient.last_name} - {patient.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.patient_id && (
              <div className="space-y-2">
                <Label htmlFor="edit_appointment">Cita (Opcional)</Label>
                <Select
                  value={formData.appointment_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      appointment_id: value === "none" ? null : parseInt(value),
                    })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loading
                          ? "Cargando citas..."
                          : appointments.filter(
                                (apt) => apt.patient_id === formData.patient_id,
                              ).length === 0
                            ? "No hay citas para este paciente"
                            : "Seleccionar cita relacionada"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {appointments
                      .filter((apt) => apt.patient_id === formData.patient_id)
                      .map((appointment) => (
                        <SelectItem
                          key={appointment.id}
                          value={appointment.id.toString()}
                        >
                          {appointment.service_name} -{" "}
                          {new Date(appointment.scheduled_at).toLocaleString(
                            "es-MX",
                          )}{" "}
                          ({appointment.status})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {appointments.filter(
                  (apt) => apt.patient_id === formData.patient_id,
                ).length === 0 &&
                  !loading && (
                    <p className="text-xs text-gray-500">
                      Este paciente no tiene citas registradas. Puedes
                      actualizar el expediente sin asociarlo a una cita.
                    </p>
                  )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit_visit_date">Fecha de Visita</Label>
              <Input
                id="edit_visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) =>
                  setFormData({ ...formData, visit_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_diagnosis">Diagnóstico</Label>
              <Textarea
                id="edit_diagnosis"
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_treatment">Tratamiento</Label>
              <Textarea
                id="edit_treatment"
                value={formData.treatment}
                onChange={(e) =>
                  setFormData({ ...formData, treatment: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_prescriptions">Recetas</Label>
              <Textarea
                id="edit_prescriptions"
                value={formData.prescriptions}
                onChange={(e) =>
                  setFormData({ ...formData, prescriptions: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notas Adicionales</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateRecord}>Actualizar Expediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Record Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Expediente Médico</DialogTitle>
            <DialogDescription>
              Información completa del expediente médico
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Paciente</Label>
                  <p className="font-medium">
                    {selectedRecord.patient.first_name}{" "}
                    {selectedRecord.patient.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedRecord.patient.email}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Doctor</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MdOutlineLocalHospital className="w-4 h-4 text-green-600" />
                    {selectedRecord.doctor_name}
                  </p>
                </div>
              </div>
              {selectedRecord.appointment && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-blue-700 flex items-center gap-2">
                    <MdOutlineDescription className="w-4 h-4" />
                    Cita Relacionada
                  </Label>
                  <p className="text-sm text-blue-900 mt-1">
                    {selectedRecord.appointment.service_name}
                  </p>
                  <p className="text-xs text-blue-600">
                    {new Date(
                      selectedRecord.appointment.scheduled_at,
                    ).toLocaleString("es-MX")}{" "}
                    • {selectedRecord.appointment.status}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">Fecha de Visita</Label>
                <p className="font-medium">
                  {new Date(selectedRecord.visit_date).toLocaleDateString(
                    "es-MX",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Diagnóstico</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">
                      {selectedRecord.diagnosis}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Label className="text-gray-500">Tratamiento</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">
                      {selectedRecord.treatment}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {selectedRecord.prescriptions && (
                <div>
                  <Label className="text-gray-500">Recetas</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.prescriptions}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <Label className="text-gray-500">Notas Adicionales</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.notes}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Creado:{" "}
                  {new Date(selectedRecord.created_at).toLocaleString("es-MX")}
                </p>
                <p className="text-xs text-gray-500">
                  Última actualización:{" "}
                  {new Date(selectedRecord.updated_at).toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                dispatch(selectRecord(null));
              }}
            >
              Cerrar
            </Button>
            {selectedRecord && (
              <Button onClick={() => openEditModal(selectedRecord)}>
                <MdOutlineEdit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
