import { useState, useEffect } from "react";
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
import axios from "@/lib/axios";

interface BlockedDate {
  id: number;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_first_name?: string;
  creator_last_name?: string;
}

export default function BlockedDatesManagement() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [filteredDates, setFilteredDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [deletingDate, setDeletingDate] = useState<BlockedDate | null>(null);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    all_day: true,
    reason: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  useEffect(() => {
    const filtered = blockedDates.filter(
      (date) =>
        date.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredDates(filtered);
  }, [searchQuery, blockedDates]);

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/blocked-dates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBlockedDates(response.data.data.items || []);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las fechas bloqueadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDialog = (date?: BlockedDate) => {
    if (date) {
      setEditingDate(date);
      // Convert ISO date strings to YYYY-MM-DD format for date inputs
      const startDate = new Date(date.start_date).toISOString().split("T")[0];
      const endDate = new Date(date.end_date).toISOString().split("T")[0];

      setFormData({
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
      setFormData({
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        all_day: true,
        reason: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDate(null);
    setFormData({
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      all_day: true,
      reason: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("adminAccessToken");
      const payload = {
        ...formData,
        start_time: formData.all_day ? null : formData.start_time || null,
        end_time: formData.all_day ? null : formData.end_time || null,
      };

      if (editingDate) {
        await axios.put(`/admin/blocked-dates/${editingDate.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast({
          title: "Éxito",
          description: "Fecha bloqueada actualizada correctamente",
        });
      } else {
        await axios.post("/admin/blocked-dates", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast({
          title: "Éxito",
          description: "Fecha bloqueada creada correctamente",
        });
      }

      handleCloseDialog();
      fetchBlockedDates();
    } catch (error) {
      console.error("Error saving blocked date:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la fecha bloqueada",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingDate) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/blocked-dates/${deletingDate.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: "Éxito",
        description: "Fecha bloqueada eliminada correctamente",
      });
      setIsDeleteDialogOpen(false);
      setDeletingDate(null);
      fetchBlockedDates();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la fecha bloqueada",
        variant: "destructive",
      });
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (start === end) {
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha Inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha Fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all_day"
                    checked={formData.all_day}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, all_day: checked as boolean })
                    }
                  />
                  <Label htmlFor="all_day" className="cursor-pointer">
                    Todo el día
                  </Label>
                </div>
              </div>

              {!formData.all_day && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Hora Inicio</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required={!formData.all_day}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Hora Fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required={!formData.all_day}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Razón *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Ej: Día festivo, Mantenimiento, Vacaciones"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
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
              <Button type="submit">
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
