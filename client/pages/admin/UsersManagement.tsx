import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  MdOutlineSupervisorAccount,
  MdOutlineAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineSearch,
  MdOutlineFilterList,
  MdOutlineShield,
  MdOutlineLocalHospital,
  MdOutlineManageAccounts,
  MdOutlineStorefront,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  selectUser as selectUserAction,
  type AdminUser,
  type UserFormData,
} from "@/store/slices/usersSlice";

// Validation schema
const userValidationSchema = Yup.object({
  first_name: Yup.string()
    .required("El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: Yup.string()
    .required("El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  email: Yup.string()
    .required("El email es requerido")
    .email("Debe ser un email válido"),
  role: Yup.string()
    .required("El rol es requerido")
    .oneOf(
      ["admin", "general_admin", "receptionist", "doctor", "pos"],
      "Rol inválido",
    ),
  employee_id: Yup.string(),
  phone: Yup.string(),
  specialization: Yup.string().when("role", {
    is: "doctor",
    then: (schema) =>
      schema.required("La especialización es requerida para doctores"),
    otherwise: (schema) => schema,
  }),
  is_active: Yup.boolean(),
});

export default function UsersManagement() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const selectedUser = useAppSelector((state) => state.users.selectedUser);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Formik for create modal
  const createFormik = useFormik({
    initialValues: {
      email: "",
      role: "receptionist",
      first_name: "",
      last_name: "",
      phone: "",
      employee_id: "",
      specialization: "",
      is_active: true,
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values) => {
      // Check for duplicate email
      const emailExists = users.some(
        (user) => user.email.toLowerCase() === values.email.toLowerCase(),
      );

      if (emailExists) {
        toast({
          title: "Error",
          description: "Ya existe un usuario con este correo electrónico",
          variant: "destructive",
        });
        return;
      }

      try {
        await dispatch(createUser(values)).unwrap();
        toast({
          title: "Éxito",
          description: "Usuario creado exitosamente",
        });
        setIsCreateModalOpen(false);
        createFormik.resetForm();
        dispatch(fetchUsers());
      } catch (error: any) {
        toast({
          title: "Error",
          description: error || "No se pudo crear el usuario",
          variant: "destructive",
        });
      }
    },
  });

  // Formik for edit modal
  const editFormik = useFormik({
    initialValues: {
      email: "",
      role: "receptionist",
      first_name: "",
      last_name: "",
      phone: "",
      employee_id: "",
      specialization: "",
      is_active: true,
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values) => {
      if (!selectedUser) return;

      // Check for duplicate email (excluding current user)
      const emailExists = users.some(
        (user) =>
          user.id !== selectedUser.id &&
          user.email.toLowerCase() === values.email.toLowerCase(),
      );

      if (emailExists) {
        toast({
          title: "Error",
          description: "Ya existe otro usuario con este correo electrónico",
          variant: "destructive",
        });
        return;
      }

      try {
        await dispatch(
          updateUser({ id: selectedUser.id, data: values }),
        ).unwrap();
        toast({
          title: "Éxito",
          description: "Usuario actualizado exitosamente",
        });
        setIsEditModalOpen(false);
        editFormik.resetForm();
        dispatch(fetchUsers());
      } catch (error: any) {
        toast({
          title: "Error",
          description: error || "No se pudo actualizar el usuario",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(deleteUser(selectedUser.id)).unwrap();
      toast({
        title: "Éxito",
        description: "Usuario eliminado exitosamente",
      });
      setIsDeleteModalOpen(false);
      dispatch(selectUserAction(null));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (user: AdminUser) => {
    dispatch(selectUserAction(user));
    editFormik.setValues({
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      employee_id: user.employee_id || "",
      specialization: user.specialization || "",
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: AdminUser) => {
    dispatch(selectUserAction(user));
    setIsDeleteModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    createFormik.resetForm();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    editFormik.resetForm();
    dispatch(selectUserAction(null));
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> =
      {
        admin: {
          label: "Admin",
          color: "bg-red-100 text-red-800",
          icon: MdOutlineShield,
        },
        general_admin: {
          label: "General Admin",
          color: "bg-primary/20 text-primary",
          icon: MdOutlineShield,
        },
        receptionist: {
          label: "Recepcionista",
          color: "bg-blue-100 text-blue-800",
          icon: MdOutlineManageAccounts,
        },
        pos: {
          label: "POS",
          color: "bg-purple-100 text-purple-800",
          icon: MdOutlineStorefront,
        },
        doctor: {
          label: "Doctor",
          color: "bg-green-100 text-green-800",
          icon: MdOutlineLocalHospital,
        },
      };
    return config[role] || config.admin;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MdOutlineSupervisorAccount className="w-8 h-8 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1">
            Administra usuarios del sistema (staff y administradores)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <MdOutlineAdd className="w-5 h-5 mr-2" />
          Crear Usuario
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
                placeholder="Buscar por nombre, email o ID de empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MdOutlineFilterList className="w-4 h-4" />
                  <SelectValue placeholder="Filtrar por rol" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="general_admin">General Admin</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Lista de todos los usuarios administrativos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>ID Empleado</TableHead>
                <TableHead>Especialización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = getRoleBadge(user.role);
                  const RoleIcon = roleConfig.icon;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.profile_picture_url} />
                            <AvatarFallback>
                              {user.first_name[0]}
                              {user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1.5", roleConfig.color)}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.employee_id || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>{user.specialization || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                          >
                            <MdOutlineEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <MdOutlineDelete className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario administrativo al sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createFormik.handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={createFormik.values.first_name}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                    className={
                      createFormik.touched.first_name &&
                      createFormik.errors.first_name
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {createFormik.touched.first_name &&
                    createFormik.errors.first_name && (
                      <p className="text-sm text-red-500">
                        {createFormik.errors.first_name}
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={createFormik.values.last_name}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                    className={
                      createFormik.touched.last_name &&
                      createFormik.errors.last_name
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {createFormik.touched.last_name &&
                    createFormik.errors.last_name && (
                      <p className="text-sm text-red-500">
                        {createFormik.errors.last_name}
                      </p>
                    )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={createFormik.values.email}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  className={
                    createFormik.touched.email && createFormik.errors.email
                      ? "border-red-500"
                      : ""
                  }
                />
                {createFormik.touched.email && createFormik.errors.email && (
                  <p className="text-sm text-red-500">
                    {createFormik.errors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={createFormik.values.role}
                    onValueChange={(value) =>
                      createFormik.setFieldValue("role", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="general_admin">
                        General Admin
                      </SelectItem>
                      <SelectItem value="receptionist">
                        Recepcionista
                      </SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                  {createFormik.touched.role && createFormik.errors.role && (
                    <p className="text-sm text-red-500">
                      {createFormik.errors.role}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">ID Empleado</Label>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    value={createFormik.values.employee_id}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={createFormik.values.phone}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">
                    Especialización (Doctores)
                    {createFormik.values.role === "doctor" && (
                      <span className="text-red-500"> *</span>
                    )}
                  </Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={createFormik.values.specialization}
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
                    disabled={createFormik.values.role !== "doctor"}
                    className={
                      createFormik.touched.specialization &&
                      createFormik.errors.specialization
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {createFormik.touched.specialization &&
                    createFormik.errors.specialization && (
                      <p className="text-sm text-red-500">
                        {createFormik.errors.specialization}
                      </p>
                    )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateModal}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!createFormik.isValid}>
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editFormik.handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_first_name"
                    name="first_name"
                    value={editFormik.values.first_name}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className={
                      editFormik.touched.first_name &&
                      editFormik.errors.first_name
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {editFormik.touched.first_name &&
                    editFormik.errors.first_name && (
                      <p className="text-sm text-red-500">
                        {editFormik.errors.first_name}
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_last_name"
                    name="last_name"
                    value={editFormik.values.last_name}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className={
                      editFormik.touched.last_name &&
                      editFormik.errors.last_name
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {editFormik.touched.last_name &&
                    editFormik.errors.last_name && (
                      <p className="text-sm text-red-500">
                        {editFormik.errors.last_name}
                      </p>
                    )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={editFormik.values.email}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  className={
                    editFormik.touched.email && editFormik.errors.email
                      ? "border-red-500"
                      : ""
                  }
                />
                {editFormik.touched.email && editFormik.errors.email && (
                  <p className="text-sm text-red-500">
                    {editFormik.errors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_role">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editFormik.values.role}
                    onValueChange={(value) =>
                      editFormik.setFieldValue("role", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="general_admin">
                        General Admin
                      </SelectItem>
                      <SelectItem value="receptionist">
                        Recepcionista
                      </SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                  {editFormik.touched.role && editFormik.errors.role && (
                    <p className="text-sm text-red-500">
                      {editFormik.errors.role}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_employee_id">ID Empleado</Label>
                  <Input
                    id="edit_employee_id"
                    name="employee_id"
                    value={editFormik.values.employee_id}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Teléfono</Label>
                  <Input
                    id="edit_phone"
                    name="phone"
                    value={editFormik.values.phone}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_specialization">
                    Especialización (Doctores)
                    {editFormik.values.role === "doctor" && (
                      <span className="text-red-500"> *</span>
                    )}
                  </Label>
                  <Input
                    id="edit_specialization"
                    name="specialization"
                    value={editFormik.values.specialization}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    disabled={editFormik.values.role !== "doctor"}
                    className={
                      editFormik.touched.specialization &&
                      editFormik.errors.specialization
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {editFormik.touched.specialization &&
                    editFormik.errors.specialization && (
                      <p className="text-sm text-red-500">
                        {editFormik.errors.specialization}
                      </p>
                    )}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="edit_is_active" className="text-base">
                    Estado del Usuario
                  </Label>
                  <p className="text-sm text-gray-500">
                    {editFormik.values.is_active
                      ? "Usuario activo en el sistema"
                      : "Usuario desactivado, no podrá iniciar sesión"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      editFormik.values.is_active ? "default" : "secondary"
                    }
                    className={
                      editFormik.values.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {editFormik.values.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Switch
                    id="edit_is_active"
                    checked={editFormik.values.is_active}
                    onCheckedChange={(checked) =>
                      editFormik.setFieldValue("is_active", checked)
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!editFormik.isValid}>
                Actualizar Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                dispatch(selectUserAction(null));
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Eliminar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
