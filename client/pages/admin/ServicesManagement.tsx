import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Clock,
  Tag,
  Save,
  X,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { logger } from "@/lib/logger";

interface Service {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categoryOptions = [
  { value: "laser_hair_removal", label: "Depilación Láser" },
  { value: "facial_treatment", label: "Tratamiento Facial" },
  { value: "body_treatment", label: "Tratamiento Corporal" },
  { value: "consultation", label: "Consulta" },
  { value: "other", label: "Otro" },
];

// Validation schema
const serviceValidationSchema = Yup.object({
  name: Yup.string()
    .required("El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  description: Yup.string(),
  category: Yup.string().required("La categoría es requerida"),
  price: Yup.number()
    .required("El precio es requerido")
    .min(0, "El precio debe ser mayor o igual a 0"),
  duration_minutes: Yup.number()
    .required("La duración es requerida")
    .min(1, "La duración debe ser al menos 1 minuto"),
  is_active: Yup.boolean(),
});

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const { toast } = useToast();

  // Formik instance
  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      category: "laser_hair_removal",
      price: 0,
      duration_minutes: 0,
      is_active: true,
    },
    validationSchema: serviceValidationSchema,
    onSubmit: async (values) => {
      try {
        const token = localStorage.getItem("adminAccessToken");
        if (editingService) {
          await axios.put(`/admin/services/${editingService.id}`, values, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast({
            title: "Éxito",
            description: "Servicio actualizado correctamente",
          });
        } else {
          await axios.post("/admin/services", values, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast({
            title: "Éxito",
            description: "Servicio creado correctamente",
          });
        }
        handleCloseDialog();
        fetchServices();
      } catch (error) {
        logger.error("Error saving service:", error);
        toast({
          title: "Error",
          description: "No se pudo guardar el servicio",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredServices(filtered);
  }, [searchQuery, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setServices(response.data.data || []);
    } catch (error) {
      logger.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      formik.setValues({
        name: service.name,
        description: service.description || "",
        category: service.category,
        price: service.price,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      formik.resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/services/${deletingService.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      setIsDeleteDialogOpen(false);
      setDeletingService(null);
      fetchServices();
    } catch (error) {
      logger.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    return (
      categoryOptions.find((opt) => opt.value === category)?.label || category
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Servicios
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los servicios disponibles en tu clínica
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron servicios
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header - Hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-700">
                <div className="col-span-3">Nombre</div>
                <div className="col-span-2">Categoría</div>
                <div className="col-span-2">Precio</div>
                <div className="col-span-2">Duración</div>
                <div className="col-span-1 text-center">Estado</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              {/* Service Rows */}
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={service.is_active ? "default" : "secondary"}
                        className={
                          service.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {service.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {getCategoryLabel(service.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />$
                        {service.price.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingService(service);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-3 flex flex-col justify-center">
                      <div className="font-medium text-gray-900">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-sm text-gray-600 line-clamp-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Badge variant="outline" className="text-sm">
                        <Tag className="h-3 w-3 mr-1" />
                        {getCategoryLabel(service.category)}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-900 font-medium">
                      <DollarSign className="h-4 w-4 mr-1" />$
                      {service.price.toFixed(2)}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.duration_minutes} min
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Badge
                        variant={service.is_active ? "default" : "secondary"}
                        className={
                          service.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {service.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingService(service);
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
              {editingService ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Modifica los detalles del servicio"
                : "Crea un nuevo servicio para tu clínica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Nombre del Servicio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ej: Láser Diodo - Área Pequeña"
                  className={
                    formik.touched.name && formik.errors.name
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Descripción detallada del servicio"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formik.values.category}
                  onValueChange={(value) =>
                    formik.setFieldValue("category", value)
                  }
                >
                  <SelectTrigger
                    className={
                      formik.touched.category && formik.errors.category
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <p className="text-sm text-red-500">
                    {formik.errors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="0.00"
                  className={
                    formik.touched.price && formik.errors.price
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.price && formik.errors.price && (
                  <p className="text-sm text-red-500">{formik.errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">
                  Duración (minutos) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="1"
                  value={formik.values.duration_minutes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="30"
                  className={
                    formik.touched.duration_minutes &&
                    formik.errors.duration_minutes
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.duration_minutes &&
                  formik.errors.duration_minutes && (
                    <p className="text-sm text-red-500">
                      {formik.errors.duration_minutes}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Estado</Label>
                <Select
                  value={formik.values.is_active ? "true" : "false"}
                  onValueChange={(value) =>
                    formik.setFieldValue("is_active", value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
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
                {editingService ? "Actualizar" : "Crear"}
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
              ¿Estás seguro de que deseas eliminar el servicio "
              {deletingService?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingService(null);
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
