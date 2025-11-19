import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  Users,
  Tag,
  FileText,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Eye,
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
import { Switch } from "@/components/ui/switch";
import axios from "@/lib/axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

interface ContentPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "general_admin" | "receptionist" | "doctor";
  is_active: boolean;
  specialization: string | null;
  employee_id: string | null;
  created_at: string;
  last_login?: string | null;
  appointments_created?: number;
  medical_records_added?: number;
}

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("coupons");
  const [adminUser, setAdminUser] = useState<any>(null);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    is_active: true,
  });

  // Settings
  const [settings, setSettings] = useState<any>({});
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);

  // Content Pages
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [pageForm, setPageForm] = useState({
    slug: "",
    title: "",
    content: "",
    is_published: true,
  });

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userActivity, setUserActivity] = useState<{
    appointments?: any[];
    medicalRecords?: any[];
  }>({});
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "receptionist" as
      | "admin"
      | "general_admin"
      | "receptionist"
      | "doctor",
    specialization: "",
    employee_id: "",
  });

  useEffect(() => {
    const user = localStorage.getItem("adminUser");
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "coupons") fetchCoupons();
    else if (activeTab === "settings") fetchSettings();
    else if (activeTab === "pages") fetchContentPages();
    else if (activeTab === "users") fetchAdminUsers();
  }, [activeTab]);

  // Coupons Functions
  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/settings/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCoupons(response.data.data.items || []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
    }
  };

  const handleSaveCoupon = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      if (editingCoupon) {
        await axios.put(
          `/api/admin/settings/coupons/${editingCoupon.id}`,
          couponForm,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post("/admin/settings/coupons", couponForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      alert("Cupón guardado exitosamente");
      fetchCoupons();
      setIsCouponModalOpen(false);
      resetCouponForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar cupón");
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este cupón?")) return;
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/settings/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Cupón eliminado exitosamente");
      fetchCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar cupón");
    }
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase_amount: 0,
      max_discount_amount: 0,
      usage_limit: 0,
      valid_from: format(new Date(), "yyyy-MM-dd"),
      valid_until: "",
      is_active: true,
    });
    setEditingCoupon(null);
  };

  // Settings Functions
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSettings(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettings({});
    }
  };

  const handleUpdateSetting = async (setting: Setting) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.put(
        `/api/admin/settings/${setting.id}`,
        {
          setting_value: setting.setting_value,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Configuración actualizada");
      fetchSettings();
      setEditingSetting(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al actualizar");
    }
  };

  // Content Pages Functions
  const fetchContentPages = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/settings/content-pages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setContentPages(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching content pages:", error);
      setContentPages([]);
    }
  };

  const handleSavePage = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      if (editingPage) {
        await axios.put(
          `/api/admin/settings/content-pages/${editingPage.id}`,
          pageForm,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post("/admin/settings/content-pages", pageForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      alert("Página guardada exitosamente");
      fetchContentPages();
      setIsPageModalOpen(false);
      resetPageForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar página");
    }
  };

  const handleDeletePage = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta página?")) return;
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/settings/content-pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Página eliminada exitosamente");
      fetchContentPages();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar página");
    }
  };

  const resetPageForm = () => {
    setPageForm({
      slug: "",
      title: "",
      content: "",
      is_published: true,
    });
    setEditingPage(null);
  };

  // Admin Users Functions
  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/settings/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setAdminUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
      setAdminUsers([]);
    }
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.post("/admin/settings/users", userForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Usuario creado exitosamente");
      fetchAdminUsers();
      setIsUserModalOpen(false);
      resetUserForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al crear usuario");
    }
  };

  const handleToggleUserActive = async (
    userId: number,
    currentStatus: boolean,
  ) => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.patch(
        `/api/admin/settings/users/${userId}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchAdminUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleViewUserDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsUserDetailsModalOpen(true);

    try {
      const token = localStorage.getItem("adminAccessToken");

      // Fetch detailed user info
      const userResponse = await axios.get(
        `/api/admin/settings/users/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (userResponse.data.success) {
        setSelectedUser(userResponse.data.data);
      }

      // Fetch user activity
      const activityResponse = await axios.get(
        `/api/admin/settings/users/${user.id}/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (activityResponse.data.success) {
        setUserActivity(activityResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization || "",
      employee_id: user.employee_id || "",
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.put(
        `/api/admin/settings/users/${selectedUser.id}`,
        {
          first_name: userForm.name.split(" ")[0],
          last_name: userForm.name.split(" ").slice(1).join(" "),
          role: userForm.role,
          specialization: userForm.specialization,
          employee_id: userForm.employee_id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Usuario actualizado exitosamente");
      fetchAdminUsers();
      setIsEditUserModalOpen(false);
      resetUserForm();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.delete(`/admin/settings/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Usuario eliminado exitosamente");
      fetchAdminUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar usuario");
    }
  };

  const handleResetUserAccess = async (userId: number) => {
    if (
      !confirm(
        "¿Está seguro de resetear el acceso de este usuario? Deberá iniciar sesión nuevamente.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.post(
        `/api/admin/settings/users/${userId}/reset-access`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Acceso del usuario reseteado exitosamente");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al resetear acceso");
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      role: "receptionist",
      specialization: "",
      employee_id: "",
    });
  };

  const isGeneralAdmin = adminUser?.role === "general_admin";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">
          Administra cupones, ajustes del sistema y usuarios
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="coupons">
            <Tag className="w-4 h-4 mr-2" />
            Cupones
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Sliders className="w-4 h-4 mr-2" />
            Ajustes
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="w-4 h-4 mr-2" />
            Páginas
          </TabsTrigger>
          <TabsTrigger value="users" disabled={!isGeneralAdmin}>
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetCouponForm();
                setIsCouponModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cupón
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Válido Desde</TableHead>
                    <TableHead>Válido Hasta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No hay cupones creados
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-medium">
                          {coupon.code}
                        </TableCell>
                        <TableCell>
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `$${coupon.discount_value}`}
                        </TableCell>
                        <TableCell>
                          {coupon.usage_count} / {coupon.usage_limit || "∞"}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(coupon.valid_from), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {coupon.valid_until
                            ? format(parseISO(coupon.valid_until), "dd/MM/yyyy")
                            : "Sin límite"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={coupon.is_active ? "default" : "secondary"}
                            className={
                              coupon.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {coupon.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCoupon(coupon);
                                setCouponForm({
                                  code: coupon.code,
                                  discount_type: coupon.discount_type,
                                  discount_value: coupon.discount_value,
                                  min_purchase_amount:
                                    coupon.min_purchase_amount || 0,
                                  max_discount_amount:
                                    coupon.max_discount_amount || 0,
                                  usage_limit: coupon.usage_limit || 0,
                                  valid_from: coupon.valid_from.split("T")[0],
                                  valid_until: coupon.valid_until
                                    ? coupon.valid_until.split("T")[0]
                                    : "",
                                  is_active: coupon.is_active,
                                });
                                setIsCouponModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
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
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.keys(settings).length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay configuraciones disponibles
                </p>
              ) : (
                Object.entries(settings).map(
                  ([category, categorySettings]: [string, any]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-semibold capitalize text-gray-900 border-b pb-2">
                        {category}
                      </h3>
                      {categorySettings.map((setting: any) => (
                        <div
                          key={setting.id}
                          className="p-4 border rounded-lg flex items-start justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <Label className="font-medium">
                              {setting.setting_key}
                            </Label>
                            {setting.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {setting.description}
                              </p>
                            )}
                            {editingSetting?.id === setting.id ? (
                              <Input
                                value={editingSetting.setting_value}
                                onChange={(e) =>
                                  setEditingSetting({
                                    ...editingSetting,
                                    setting_value: e.target.value,
                                  })
                                }
                                className="mt-2"
                              />
                            ) : (
                              <p className="text-sm font-mono mt-2 p-2 bg-gray-50 rounded">
                                {setting.setting_value}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {editingSetting?.id === setting.id ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateSetting(editingSetting)
                                }
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSetting(setting)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetPageForm();
                setIsPageModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Página
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentPages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{page.title}</h3>
                      <p className="text-sm text-gray-500 font-mono">
                        /{page.slug}
                      </p>
                    </div>
                    <Badge
                      variant={page.is_published ? "default" : "secondary"}
                      className={
                        page.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {page.is_published ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {page.content.substring(0, 100)}...
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPage(page);
                        setPageForm({
                          slug: page.slug,
                          title: page.title,
                          content: page.content,
                          is_published: page.is_published,
                        });
                        setIsPageModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contentPages.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No hay páginas de contenido
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Crea páginas para términos, privacidad, etc.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Admin Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetUserForm();
                setIsUserModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>ID Empleado</TableHead>
                    <TableHead>Especialización</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No hay usuarios administrativos
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="secondary">
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.employee_id || "N/A"}</TableCell>
                        <TableCell>{user.specialization || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                            className={
                              user.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUserDetails(user)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4 text-purple-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleUserActive(user.id, user.is_active)
                              }
                              title={user.is_active ? "Desactivar" : "Activar"}
                            >
                              {user.is_active ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
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
        </TabsContent>
      </Tabs>

      {/* Coupon Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VERANO2024"
                />
              </div>
              <div>
                <Label>Tipo de Descuento *</Label>
                <Select
                  value={couponForm.discount_type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setCouponForm({ ...couponForm, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto Fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor del Descuento *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.discount_value}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discount_value: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Compra Mínima</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.min_purchase_amount}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      min_purchase_amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Descuento Máximo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.max_discount_amount}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      max_discount_amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Límite de Uso</Label>
                <Input
                  type="number"
                  value={couponForm.usage_limit}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      usage_limit: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Válido Desde *</Label>
                <Input
                  type="date"
                  value={couponForm.valid_from}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, valid_from: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Válido Hasta</Label>
                <Input
                  type="date"
                  value={couponForm.valid_until}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      valid_until: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  checked={couponForm.is_active}
                  onCheckedChange={(checked) =>
                    setCouponForm({ ...couponForm, is_active: checked })
                  }
                />
                <Label>Cupón activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCouponModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCoupon}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Guardar Cupón
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Page Modal */}
      <Dialog open={isPageModalOpen} onOpenChange={setIsPageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Editar Página" : "Nueva Página"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Slug (URL) *</Label>
              <Input
                value={pageForm.slug}
                onChange={(e) =>
                  setPageForm({
                    ...pageForm,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="terminos-y-condiciones"
              />
            </div>
            <div>
              <Label>Título *</Label>
              <Input
                value={pageForm.title}
                onChange={(e) =>
                  setPageForm({ ...pageForm, title: e.target.value })
                }
                placeholder="Términos y Condiciones"
              />
            </div>
            <div>
              <Label>Contenido *</Label>
              <Textarea
                value={pageForm.content}
                onChange={(e) =>
                  setPageForm({ ...pageForm, content: e.target.value })
                }
                rows={12}
                placeholder="Contenido de la página en HTML o Markdown..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={pageForm.is_published}
                onCheckedChange={(checked) =>
                  setPageForm({ ...pageForm, is_published: checked })
                }
              />
              <Label>Publicar página</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPageModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePage}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Guardar Página
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario Administrativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Rol *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: any) =>
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="general_admin">
                    Administrador General
                  </SelectItem>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID de Empleado</Label>
              <Input
                value={userForm.employee_id}
                onChange={(e) =>
                  setUserForm({ ...userForm, employee_id: e.target.value })
                }
              />
            </div>
            {userForm.role === "doctor" && (
              <div>
                <Label>Especialización</Label>
                <Input
                  value={userForm.specialization}
                  onChange={(e) =>
                    setUserForm({ ...userForm, specialization: e.target.value })
                  }
                  placeholder="Dermatología, Láser, etc."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Rol *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: any) =>
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="general_admin">
                    Administrador General
                  </SelectItem>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID de Empleado</Label>
              <Input
                value={userForm.employee_id}
                onChange={(e) =>
                  setUserForm({ ...userForm, employee_id: e.target.value })
                }
              />
            </div>
            {userForm.role === "doctor" && (
              <div>
                <Label>Especialización</Label>
                <Input
                  value={userForm.specialization}
                  onChange={(e) =>
                    setUserForm({ ...userForm, specialization: e.target.value })
                  }
                  placeholder="Dermatología, Láser, etc."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Actualizar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog
        open={isUserDetailsModalOpen}
        onOpenChange={setIsUserDetailsModalOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Nombre</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Rol</Label>
                  <Badge variant="secondary" className="capitalize">
                    {selectedUser.role.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <Badge
                    variant={selectedUser.is_active ? "default" : "secondary"}
                    className={
                      selectedUser.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {selectedUser.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {selectedUser.employee_id && (
                  <div>
                    <Label className="text-gray-500">ID Empleado</Label>
                    <p className="font-medium">{selectedUser.employee_id}</p>
                  </div>
                )}
                {selectedUser.specialization && (
                  <div>
                    <Label className="text-gray-500">Especialización</Label>
                    <p className="font-medium">{selectedUser.specialization}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500">Creado</Label>
                  <p className="font-medium">
                    {selectedUser.created_at
                      ? format(
                          parseISO(selectedUser.created_at),
                          "dd MMM yyyy",
                          {
                            locale: es,
                          },
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Último Acceso</Label>
                  <p className="font-medium">
                    {selectedUser.last_login
                      ? format(
                          parseISO(selectedUser.last_login),
                          "dd MMM yyyy HH:mm",
                          {
                            locale: es,
                          },
                        )
                      : "Nunca"}
                  </p>
                </div>
              </div>

              {/* Activity Stats */}
              {userActivity && (
                <div>
                  <h3 className="font-semibold mb-3">Actividad Reciente</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Citas Creadas</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {userActivity.appointments?.length || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500">
                          Expedientes Médicos
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {userActivity.medicalRecords?.length || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Activity Log */}
                  {userActivity.appointments &&
                    userActivity.appointments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">
                          Últimas Citas Creadas
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userActivity.appointments.map((apt: any) => (
                            <div
                              key={apt.id}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {apt.patient_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {apt.service_name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400">
                                {format(
                                  parseISO(apt.appointment_date),
                                  "dd MMM yyyy",
                                  { locale: es },
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUserDetailsModalOpen(false);
                    handleEditUser(selectedUser);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleResetUserAccess(selectedUser.id);
                  }}
                >
                  Resetear Acceso
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsUserDetailsModalOpen(false);
                    handleDeleteUser(selectedUser.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUserDetailsModalOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
