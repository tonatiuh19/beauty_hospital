import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar as CalendarIcon,
  Clock,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminBlockedDates,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
} from "@/store/slices/blockedDatesSlice";

// Validation schema
const blockedDateValidationSchema = Yup.object({
  start_date: Yup.string().required("La fecha de inicio es requerida"),
  end_date: Yup.string()
    .required("La fecha de fin es requerida")
    .test(
      "is-greater-or-equal",
      "La fecha de fin debe ser igual o posterior a la fecha de inicio",
      function (value) {
        const { start_date } = this.parent;
        if (!value || !start_date) return true;
        return new Date(value) >= new Date(start_date);
      },
    ),
  start_time: Yup.string().when("all_day", {
    is: false,
    then: (schema) => schema.required("La hora de inicio es requerida"),
    otherwise: (schema) => schema,
  }),
  end_time: Yup.string().when("all_day", {
    is: false,
    then: (schema) => schema.required("La hora de fin es requerida"),
    otherwise: (schema) => schema,
  }),
  all_day: Yup.boolean(),
  reason: Yup.string(),
  notes: Yup.string(),
});

export default function BlockedDatesManagement() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { blockedDates, loading, error } = useAppSelector(
    (state) => state.blockedDates,
  );

  const [filteredDates, setFilteredDates] = useState<typeof blockedDates>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<
    (typeof blockedDates)[0] | null
  >(null);
  const [deletingDate, setDeletingDate] = useState<
    (typeof blockedDates)[0] | null
  >(null);

  // Formik instance
  const formik = useFormik({
    initialValues: {
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      all_day: true,
      reason: "",
      notes: "",
    },
    validationSchema: blockedDateValidationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          start_time: values.all_day ? null : values.start_time || null,
          end_time: values.all_day ? null : values.end_time || null,
        };

        if (editingDate) {
          await dispatch(
            updateBlockedDate({ id: editingDate.id, data: payload }),
          ).unwrap();
          toast({
            title: "Éxito",
            description: "Fecha bloqueada actualizada correctamente",
          });
        } else {
          await dispatch(createBlockedDate(payload)).unwrap();
          toast({
            title: "Éxito",
            description: "Fecha bloqueada creada correctamente",
          });
        }

        handleCloseDialog();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error || "No se pudo guardar la fecha bloqueada",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    dispatch(fetchAdminBlockedDates());
  }, [dispatch]);

  useEffect(() => {
    const filtered = blockedDates.filter(
      (date) =>
        date.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredDates(filtered);
  }, [searchQuery, blockedDates]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleOpenDialog = (date?: (typeof blockedDates)[0]) => {
    if (date) {
      setEditingDate(date);
      const startDate = new Date(date.start_date).toISOString().split("T")[0];
      const endDate = new Date(date.end_date).toISOString().split("T")[0];

      formik.setValues({
        start_date: startDate,
        end_date: endDate,
        start_time: date.start_time || "",
        end_time: date.end_time || "",
        all_day: date.all_day,
        reason: date.reason || "",
        notes: date.notes || "",
      });
    } else {
      setEditingDate(null);
      formik.resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDate(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    if (!deletingDate) return;

    try {
      await dispatch(deleteBlockedDate(deletingDate.id)).unwrap();
      toast({
        title: "Éxito",
        description: "Fecha bloqueada eliminada correctamente",
      });
      setIsDeleteDialogOpen(false);
      setDeletingDate(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "No se pudo eliminar la fecha bloqueada",
        variant: "destructive",
      });
    }
  };

  const formatDateRange = (start: Date | string, end: Date | string) => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);

    if (startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, "dd MMM yyyy", { locale: es });
    }
    return `${format(startDate, "dd MMM", { locale: es })} - ${format(endDate, "dd MMM yyyy", { locale: es })}`;
  };

  const formatTimeRange = (start: string | null, end: string | null) => {
    if (!start || !end) return "Todo el día";
    return `${start} - ${end}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fechas Bloqueadas
          </h1>
          <p className="text-gray-500 mt-1">
            Administra días y horarios bloqueados para citas
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Fecha Bloqueada
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por razón o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : filteredDates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron fechas bloqueadas
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header - Hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-700">
                <div className="col-span-3">Fecha</div>
                <div className="col-span-2">Horario</div>
                <div className="col-span-2">Razón</div>
                <div className="col-span-3">Notas</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              {/* Blocked Date Rows */}
              {filteredDates.map((date) => (
                <div
                  key={date.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">
                            {formatDateRange(date.start_date, date.end_date)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTimeRange(date.start_time, date.end_time)}
                          </span>
                        </div>
                        <Badge variant="outline" className="mb-2">
                          {date.reason || "Sin razón"}
                        </Badge>
                        {date.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {date.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(date)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingDate(date);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-3 flex items-center">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {formatDateRange(date.start_date, date.end_date)}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTimeRange(date.start_time, date.end_time)}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Badge variant="outline">
                        {date.reason || "Sin razón"}
                      </Badge>
                    </div>
                    <div className="col-span-3 flex items-center">
                      {date.notes ? (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {date.notes}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(date)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingDate(date);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDate ? "Editar Fecha Bloqueada" : "Nueva Fecha Bloqueada"}
            </DialogTitle>
            <DialogDescription>
              {editingDate
                ? "Modifica los detalles de la fecha bloqueada"
                : "Bloquea una fecha o rango de fechas para prevenir citas"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Fecha Inicio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formik.values.start_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.start_date && formik.errors.start_date
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.start_date && formik.errors.start_date && (
                  <p className="text-sm text-red-500">
                    {formik.errors.start_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">
                  Fecha Fin <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formik.values.end_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.end_date && formik.errors.end_date
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.end_date && formik.errors.end_date && (
                  <p className="text-sm text-red-500">
                    {formik.errors.end_date}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all_day"
                    checked={formik.values.all_day}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue("all_day", checked as boolean)
                    }
                  />
                  <Label htmlFor="all_day" className="cursor-pointer">
                    Todo el día
                  </Label>
                </div>
              </div>

              {!formik.values.all_day && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">
                      Hora Inicio <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formik.values.start_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={
                        formik.touched.start_time && formik.errors.start_time
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formik.touched.start_time && formik.errors.start_time && (
                      <p className="text-sm text-red-500">
                        {formik.errors.start_time}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">
                      Hora Fin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formik.values.end_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={
                        formik.touched.end_time && formik.errors.end_time
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formik.touched.end_time && formik.errors.end_time && (
                      <p className="text-sm text-red-500">
                        {formik.errors.end_time}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Razón</Label>
                <Input
                  id="reason"
                  name="reason"
                  value={formik.values.reason}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ej: Día festivo, Mantenimiento, Vacaciones"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Información adicional sobre el bloqueo"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 bg-muted/50 p-4 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Nota importante:</p>
                    <p>
                      Las fechas bloqueadas evitarán que los pacientes reserven
                      citas durante estos períodos. Asegúrate de notificar a los
                      pacientes con citas existentes si es necesario.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={!formik.isValid}>
                <Save className="h-4 w-4 mr-2" />
                {editingDate ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta fecha bloqueada? Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingDate(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
