import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Filter,
  X,
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
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface InvoiceRequest {
  id: number;
  appointment_id: number;
  patient_id: number;
  payment_id: number;
  invoice_number: string;
  rfc: string;
  business_name: string;
  cfdi_use: string;
  payment_method: string;
  payment_type: string;
  fiscal_address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: "pending" | "processing" | "completed" | "failed";
  pdf_url: string | null;
  xml_url: string | null;
  notes: string | null;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string;
  service_name: string;
  payment_amount: number;
  processed_by_first_name: string | null;
  processed_by_last_name: string | null;
  created_at: string;
  processed_at: string | null;
}

interface InvoiceStats {
  total_requests: number;
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const statusLabels = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
};

const cfdiLabels: Record<string, string> = {
  G01: "Adquisición de mercancías",
  G03: "Gastos en general",
  D01: "Honorarios médicos",
  D02: "Gastos médicos por incapacidad",
  D10: "Pagos por servicios educativos",
  P01: "Por definir",
};

const paymentMethodLabels: Record<string, string> = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
};

const paymentTypeLabels: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica",
  "04": "Tarjeta de crédito",
  "28": "Tarjeta de débito",
};

export default function InvoicesManagement() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRequest[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(
    null,
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [xmlUrl, setXmlUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await axios.get("/admin/invoices", { params });
      setInvoices(response.data.data.items);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      logger.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las solicitudes de factura",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/admin/invoices/stats");
      setStats(response.data.data);
    } catch (error) {
      logger.error("Error fetching invoice stats:", error);
    }
  };

  const handleViewDetails = (invoice: InvoiceRequest) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleOpenUpdateModal = (invoice: InvoiceRequest) => {
    setSelectedInvoice(invoice);
    setUpdateStatus(invoice.status);
    setPdfUrl(invoice.pdf_url || "");
    setXmlUrl(invoice.xml_url || "");
    setNotes(invoice.notes || "");
    setUpdateModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setUpdating(true);

      const updateData: any = {
        status: updateStatus,
        notes: notes || null,
      };

      if (pdfUrl) {
        updateData.pdf_url = pdfUrl;
      }

      if (xmlUrl) {
        updateData.xml_url = xmlUrl;
      }

      // Get admin user ID from session (you may need to get this from auth state)
      const adminUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (adminUser.id) {
        updateData.processed_by = adminUser.id;
      }

      await axios.patch(`/admin/invoices/${selectedInvoice.id}`, updateData);

      toast({
        title: "Éxito",
        description: "Solicitud de factura actualizada correctamente",
      });

      setUpdateModalOpen(false);
      fetchInvoices();
      fetchStats();
    } catch (error) {
      logger.error("Error updating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la solicitud de factura",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatusUpdate = async (
    invoiceId: number,
    newStatus: string,
  ) => {
    try {
      const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

      await axios.patch(`/admin/invoices/${invoiceId}`, {
        status: newStatus,
        processed_by: adminUser.id,
      });

      toast({
        title: "Éxito",
        description: "Estado actualizado correctamente",
      });

      fetchInvoices();
      fetchStats();
    } catch (error) {
      logger.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Facturas
        </h1>
        <p className="text-gray-500 mt-2">
          Administra las solicitudes de facturación de los pacientes
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Procesando</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por factura, RFC, razón social, paciente..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="failed">Fallidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
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
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No se encontraron solicitudes de factura
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.patient_first_name} {invoice.patient_last_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.rfc}
                      </TableCell>
                      <TableCell>{invoice.business_name}</TableCell>
                      <TableCell>{invoice.service_name}</TableCell>
                      <TableCell className="text-right">
                        ${invoice.payment_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(invoice.created_at), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenUpdateModal(invoice)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          {invoice.pdf_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                window.open(invoice.pdf_url!, "_blank")
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Solicitud de Factura</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Folio</Label>
                  <p className="font-medium">
                    {selectedInvoice.invoice_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedInvoice.status]}>
                      {statusLabels[selectedInvoice.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Nombre</Label>
                    <p>
                      {selectedInvoice.patient_first_name}{" "}
                      {selectedInvoice.patient_last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p>{selectedInvoice.patient_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Teléfono</Label>
                    <p>{selectedInvoice.patient_phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Datos Fiscales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">RFC</Label>
                    <p className="font-mono">{selectedInvoice.rfc}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Razón Social
                    </Label>
                    <p>{selectedInvoice.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Uso de CFDI</Label>
                    <p>
                      {selectedInvoice.cfdi_use} -{" "}
                      {cfdiLabels[selectedInvoice.cfdi_use]}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Forma de Pago
                    </Label>
                    <p>{paymentMethodLabels[selectedInvoice.payment_method]}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Método de Pago
                    </Label>
                    <p>
                      {selectedInvoice.payment_type} -{" "}
                      {paymentTypeLabels[selectedInvoice.payment_type]}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-gray-500">
                    Domicilio Fiscal
                  </Label>
                  <p>
                    {selectedInvoice.fiscal_address.street},{" "}
                    {selectedInvoice.fiscal_address.city},{" "}
                    {selectedInvoice.fiscal_address.state},{" "}
                    {selectedInvoice.fiscal_address.zipCode}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Información del Servicio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Servicio</Label>
                    <p>{selectedInvoice.service_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Monto</Label>
                    <p className="text-lg font-semibold">
                      ${selectedInvoice.payment_amount.toFixed(2)} MXN
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Fecha de Cita
                    </Label>
                    <p>
                      {format(
                        parseISO(selectedInvoice.appointment_date),
                        "dd/MM/yyyy HH:mm",
                        { locale: es },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedInvoice.pdf_url || selectedInvoice.xml_url) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Archivos</h3>
                  <div className="flex gap-4">
                    {selectedInvoice.pdf_url && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedInvoice.pdf_url!, "_blank")
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    )}
                    {selectedInvoice.xml_url && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedInvoice.xml_url!, "_blank")
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar XML
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {selectedInvoice.notes && (
                <div className="border-t pt-4">
                  <Label className="text-sm text-gray-500">Notas</Label>
                  <p className="mt-1">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Solicitado:</span>
                  <span>
                    {format(
                      parseISO(selectedInvoice.created_at),
                      "dd/MM/yyyy HH:mm",
                      { locale: es },
                    )}
                  </span>
                </div>
                {selectedInvoice.processed_at && (
                  <div className="flex justify-between mt-2">
                    <span>Procesado:</span>
                    <span>
                      {format(
                        parseISO(selectedInvoice.processed_at),
                        "dd/MM/yyyy HH:mm",
                        { locale: es },
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Actualizar Solicitud de Factura</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div>
                <Label>Estado</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>URL del PDF</Label>
                <Input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://ejemplo.com/factura.pdf"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL pública del archivo PDF de la factura
                </p>
              </div>

              <div>
                <Label>URL del XML</Label>
                <Input
                  value={xmlUrl}
                  onChange={(e) => setXmlUrl(e.target.value)}
                  placeholder="https://ejemplo.com/factura.xml"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL pública del archivo XML del timbre fiscal
                </p>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales sobre el procesamiento..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateModalOpen(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateInvoice} disabled={updating}>
              {updating ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
