import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  TrendingUp,
  CreditCard,
  Clock,
  AlertCircle,
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
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Payment {
  id: number;
  appointment_id: number | null;
  patient_id: number;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  service_name: string | null;
  amount: number;
  payment_method: "card" | "cash" | "transfer" | "stripe";
  payment_status:
    | "pending"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded";
  stripe_payment_id: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
  refund_status: "pending" | "approved" | "rejected" | null;
  refund_approved_by: number | null;
  created_at: string;
  processed_at: string | null;
}

interface PaymentStats {
  total_payments: number;
  total_amount: number;
  completed_amount: number;
  refunded_amount: number;
  pending_refunds: number;
  payment_methods: {
    method: string;
    count: number;
    total: number;
  }[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
  partially_refunded: "bg-orange-100 text-orange-700",
};

const statusLabels = {
  pending: "Pendiente",
  completed: "Completado",
  failed: "Fallido",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso Parcial",
};

const paymentMethodLabels = {
  card: "Tarjeta",
  cash: "Efectivo",
  transfer: "Transferencia",
  stripe: "Stripe",
};

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Refund form
  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: "",
  });

  useEffect(() => {
    const user = localStorage.getItem("adminUser");
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [searchQuery, statusFilter, methodFilter, page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
          status: statusFilter !== "all" ? statusFilter : undefined,
          payment_method: methodFilter !== "all" ? methodFilter : undefined,
          page,
          limit: 20,
        },
      });

      if (response.data.success) {
        setPayments(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/payments/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedPayment) return;

    if (!refundForm.amount || refundForm.amount <= 0) {
      alert("Ingrese un monto válido");
      return;
    }

    if (!refundForm.reason.trim()) {
      alert("Ingrese un motivo para el reembolso");
      return;
    }

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/api/admin/payments/${selectedPayment.id}/refund`,
        refundForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert(response.data.message || "Reembolso procesado exitosamente");
        fetchPayments();
        fetchStats();
        setIsRefundOpen(false);
        setRefundForm({ amount: 0, reason: "" });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al procesar reembolso");
    }
  };

  const handleApproveRefund = async (paymentId: number) => {
    if (!confirm("¿Está seguro de aprobar este reembolso?")) return;

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/api/admin/payments/${paymentId}/approve-refund`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Reembolso aprobado exitosamente");
        fetchPayments();
        fetchStats();
        setIsDetailsOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al aprobar reembolso");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const canApproveRefunds = adminUser?.role === "general_admin";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestión de Pagos
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Administra pagos, reembolsos y transacciones
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pagos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.total_payments || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats?.total_amount || 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats?.completed_amount || 0)}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Reembolsados</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(stats?.refunded_amount || 0)}
                </p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Reembolsos Pendientes</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats?.pending_refunds || 0}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Distribution */}
      {stats && stats.payment_methods && stats.payment_methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.payment_methods.map((method) => (
                <div
                  key={method.method}
                  className="p-4 bg-gray-50 rounded-lg text-center"
                >
                  <p className="text-sm text-gray-600 capitalize">
                    {paymentMethodLabels[
                      method.method as keyof typeof paymentMethodLabels
                    ] || method.method}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {method.count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(method.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="refunded">Reembolsados</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron pagos
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header - Hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-700">
                <div className="col-span-1">ID</div>
                <div className="col-span-2">Paciente</div>
                <div className="col-span-2">Servicio</div>
                <div className="col-span-2">Monto</div>
                <div className="col-span-2">Método/Fecha</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-1 text-center">Acciones</div>
              </div>

              {/* Payment Rows */}
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">
                            #{payment.id}
                          </span>
                          <Badge
                            variant="secondary"
                            className={statusColors[payment.payment_status]}
                          >
                            {statusLabels[payment.payment_status]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {payment.patient_first_name}{" "}
                          {payment.patient_last_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {payment.patient_email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.service_name || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.refund_amount && (
                          <p className="text-sm text-red-600">
                            -{formatCurrency(payment.refund_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        <span className="capitalize">
                          {paymentMethodLabels[payment.payment_method]}
                        </span>
                      </div>
                      <span>
                        {format(
                          parseISO(payment.created_at),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </span>
                    </div>
                    {payment.refund_status === "pending" && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700"
                      >
                        Reembolso Pendiente
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {payment.payment_status === "completed" &&
                        !payment.refund_amount && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRefundForm({
                                amount: payment.amount,
                                reason: "",
                              });
                              setIsRefundOpen(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      {payment.refund_status === "pending" &&
                        canApproveRefunds && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveRefund(payment.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    <div className="col-span-1 flex items-center font-mono text-sm text-gray-600">
                      #{payment.id}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.patient_first_name}{" "}
                          {payment.patient_last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.patient_email}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      {payment.service_name || "N/A"}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.refund_amount && (
                          <p className="text-xs text-red-600">
                            -{formatCurrency(payment.refund_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <CreditCard className="w-3 h-3" />
                          <span className="capitalize">
                            {paymentMethodLabels[payment.payment_method]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(
                            parseISO(payment.created_at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="secondary"
                          className={statusColors[payment.payment_status]}
                        >
                          {statusLabels[payment.payment_status]}
                        </Badge>
                        {payment.refund_status === "pending" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-700 text-xs"
                          >
                            Reembolso Pendiente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.payment_status === "completed" &&
                          !payment.refund_amount && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRefundForm({
                                  amount: payment.amount,
                                  reason: "",
                                });
                                setIsRefundOpen(true);
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        {payment.refund_status === "pending" &&
                          canApproveRefunds && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveRefund(payment.id)}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                      </div>
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

      {/* Payment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Pago</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ID de Pago</Label>
                  <p className="font-mono font-medium">#{selectedPayment.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <Badge
                    variant="secondary"
                    className={statusColors[selectedPayment.payment_status]}
                  >
                    {statusLabels[selectedPayment.payment_status]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Paciente</Label>
                  <p className="font-medium">
                    {selectedPayment.patient_first_name}{" "}
                    {selectedPayment.patient_last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedPayment.patient_email}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Servicio</Label>
                  <p className="font-medium">
                    {selectedPayment.service_name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Monto</Label>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Método de Pago</Label>
                  <p className="font-medium capitalize">
                    {paymentMethodLabels[selectedPayment.payment_method]}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha de Pago</Label>
                  <p className="font-medium">
                    {format(
                      parseISO(selectedPayment.created_at),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                </div>
                {selectedPayment.stripe_payment_id && (
                  <div>
                    <Label className="text-gray-500">Stripe Payment ID</Label>
                    <p className="font-mono text-sm">
                      {selectedPayment.stripe_payment_id}
                    </p>
                  </div>
                )}
                {selectedPayment.refund_amount && (
                  <>
                    <div>
                      <Label className="text-gray-500">Monto Reembolsado</Label>
                      <p className="font-medium text-red-600">
                        {formatCurrency(selectedPayment.refund_amount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">
                        Fecha de Reembolso
                      </Label>
                      <p className="font-medium">
                        {selectedPayment.refunded_at
                          ? format(
                              parseISO(selectedPayment.refunded_at),
                              "dd/MM/yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">
                        Motivo del Reembolso
                      </Label>
                      <p className="text-sm">
                        {selectedPayment.refund_reason || "N/A"}
                      </p>
                    </div>
                    {selectedPayment.refund_status && (
                      <div>
                        <Label className="text-gray-500">
                          Estado del Reembolso
                        </Label>
                        <Badge
                          variant="secondary"
                          className={
                            selectedPayment.refund_status === "approved"
                              ? "bg-green-100 text-green-700"
                              : selectedPayment.refund_status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }
                        >
                          {selectedPayment.refund_status === "approved"
                            ? "Aprobado"
                            : selectedPayment.refund_status === "pending"
                              ? "Pendiente"
                              : "Rechazado"}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Reembolso</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Atención:</strong> Los reembolsos requieren aprobación
                  de un administrador general.
                </p>
              </div>

              <div>
                <Label className="text-gray-500">Pago Original</Label>
                <p className="font-medium text-lg">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div>
                <Label>Monto a Reembolsar *</Label>
                <Input
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount}
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({
                      ...refundForm,
                      amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Motivo del Reembolso *</Label>
                <Textarea
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  placeholder="Explique el motivo del reembolso..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleProcessRefund}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Solicitar Reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
