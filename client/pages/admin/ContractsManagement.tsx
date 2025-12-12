import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Eye,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  DollarSign,
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
import { Progress } from "@/components/ui/progress";
import axios from "@/lib/axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Contract {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  service_id: number;
  service_name: string;
  total_sessions: number;
  completed_sessions: number;
  remaining_sessions: number;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed" | "cancelled" | "expired";
  contract_file_url: string | null;
  signature_url: string | null;
  signed_at: string | null;
  created_at: string;
}

interface ContractSession {
  id: number;
  contract_id: number;
  appointment_id: number | null;
  session_number: number;
  completed_at: string | null;
  notes: string | null;
}

const statusColors = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
};

const statusLabels = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
  expired: "Vencido",
};

export default function ContractsManagement() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [contractSessions, setContractSessions] = useState<ContractSession[]>(
    [],
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    total_contracts: 0,
    active_contracts: 0,
    completed_contracts: 0,
    total_revenue: 0,
    pending_revenue: 0,
  });

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [searchQuery, statusFilter, page]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminAccessToken");

      // Note: This endpoint would need to be created in the backend
      // For now, we'll use a mock response structure
      const response = await axios.get("/admin/contracts", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          limit: 20,
        },
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      // Mock data for demonstration
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/contracts/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchContractDetails = async (contractId: number) => {
    try {
      setLoadingDetails(true);
      setIsDetailsOpen(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(`/admin/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedContract(response.data.data.contract);
        setContractSessions(response.data.data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setIsDetailsOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const downloadContractPDF = async (contractId: number) => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(
        `/admin/contracts/${contractId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contrato-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading contract PDF:", error);
      alert("Error al descargar el contrato");
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const calculateProgress = (completed: number, total: number) => {
    return (completed / total) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Contratos
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los contratos de sesiones múltiples
          </p>
        </div>
        {/* <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contrato
        </Button> */}
      </div>

      {/* Stats */}
      {/*       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total_contracts}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.active_contracts}
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
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.completed_contracts}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.total_revenue || 0)}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendiente</p>
                <p className="text-xl font-bold text-orange-600 mt-1">
                  {formatCurrency(stats.pending_revenue || 0)}
                </p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
 */}
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente o servicio..."
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
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Sesiones</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No se encontraron contratos
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Los contratos aparecerán aquí cuando se generen
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.patient_name}</p>
                        <p className="text-xs text-gray-500">
                          {contract.patient_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{contract.service_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">
                          {contract.completed_sessions}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          / {contract.total_sessions}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress
                          value={calculateProgress(
                            contract.completed_sessions,
                            contract.total_sessions,
                          )}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.total_amount)}
                    </TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      {formatCurrency(contract.amount_pending)}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(contract.start_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[contract.status]}
                      >
                        {statusLabels[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchContractDetails(contract.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadContractPDF(contract.id)}
                          title="Descargar PDF firmado"
                          disabled={downloading}
                        >
                          {downloading ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

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

      {/* Contract Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Contrato</DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">
                  Cargando detalles del contrato...
                </p>
              </div>
            </div>
          ) : (
            selectedContract && (
              <div className="space-y-6">
                {/* Contract Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Paciente</Label>
                    <p className="font-medium">
                      {selectedContract.patient_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedContract.patient_email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estado</Label>
                    <Badge
                      variant="secondary"
                      className={statusColors[selectedContract.status]}
                    >
                      {statusLabels[selectedContract.status]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-500">Servicio</Label>
                    <p className="font-medium">
                      {selectedContract.service_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Total de Sesiones</Label>
                    <p className="font-medium">
                      {selectedContract.total_sessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">
                      Sesiones Completadas
                    </Label>
                    <p className="font-medium text-green-600">
                      {selectedContract.completed_sessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Sesiones Restantes</Label>
                    <p className="font-medium text-orange-600">
                      {selectedContract.remaining_sessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Monto Total</Label>
                    <p className="font-medium">
                      {formatCurrency(selectedContract.total_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Monto Pagado</Label>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedContract.amount_paid)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Monto Pendiente</Label>
                    <p className="font-medium text-orange-600">
                      {formatCurrency(selectedContract.amount_pending)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha de Inicio</Label>
                    <p className="font-medium">
                      {format(
                        parseISO(selectedContract.start_date),
                        "dd/MM/yyyy",
                      )}
                    </p>
                  </div>
                  {selectedContract.signed_at && (
                    <div>
                      <Label className="text-gray-500">Firmado el</Label>
                      <p className="font-medium">
                        {format(
                          parseISO(selectedContract.signed_at),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <Label className="text-gray-500 mb-2 block">
                    Progreso del Contrato
                  </Label>
                  <Progress
                    value={calculateProgress(
                      selectedContract.completed_sessions,
                      selectedContract.total_sessions,
                    )}
                    className="h-3"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {calculateProgress(
                      selectedContract.completed_sessions,
                      selectedContract.total_sessions,
                    ).toFixed(1)}
                    % completado
                  </p>
                </div>

                {/* Sessions */}
                <div>
                  <Label className="text-gray-500 mb-3 block">
                    Historial de Sesiones
                  </Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {contractSessions.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No hay sesiones registradas
                      </p>
                    ) : (
                      contractSessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-3 border rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              Sesión #{session.session_number}
                            </p>
                            {session.notes && (
                              <p className="text-sm text-gray-500">
                                {session.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {session.completed_at ? (
                              <>
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700"
                                >
                                  Completada
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(
                                    parseISO(session.completed_at),
                                    "dd/MM/yyyy",
                                  )}
                                </p>
                              </>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                              >
                                Pendiente
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadContractPDF(selectedContract.id)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin mr-2" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF Firmado
                      </>
                    )}
                  </Button>
                  {selectedContract.signature_url && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(selectedContract.signature_url!, "_blank")
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Firma
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
