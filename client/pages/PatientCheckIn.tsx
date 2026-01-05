import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SignatureCanvas from "@/components/SignatureCanvas";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { jsPDF } from "jspdf";
import { logger } from "@/lib/logger";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";

interface AppointmentData {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service_name: string;
  service_price: number;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  check_in_at: string | null;
}

export default function PatientCheckIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [contractTerms, setContractTerms] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de check-in inválido");
      setLoading(false);
      return;
    }
    fetchAppointmentData();
  }, [token]);

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/check-in/validate/${token}`);

      if (response.data.success) {
        setAppointment(response.data.data.appointment);
        setContractTerms(
          response.data.data.contract_terms ||
            "Términos y condiciones del servicio.",
        );
      } else {
        setError(response.data.message || "No se pudo validar el token");
      }
    } catch (err: any) {
      logger.error("Error validating check-in token:", err);
      setError(
        err.response?.data?.message ||
          "Token expirado o inválido. Por favor, solicite un nuevo código QR.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureComplete = (dataUrl: string) => {
    setSignatureData(dataUrl);
  };

  const handleSubmit = async () => {
    if (!signatureData) {
      toast({
        variant: "destructive",
        title: "Firma requerida",
        description: "Por favor, firme el contrato antes de continuar",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Términos no aceptados",
        description: "Debe aceptar los términos y condiciones",
      });
      return;
    }

    if (!appointment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Información de la cita no disponible",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Generate PDF client-side with compression
      const pdf = new jsPDF({
        compress: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("All Beauty Luxury & Wellness", pageWidth / 2, yPosition, {
        align: "center",
      });

      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text("Contrato de Servicio", pageWidth / 2, yPosition, {
        align: "center",
      });

      yPosition += 15;

      // Patient Information
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("INFORMACIÓN DEL PACIENTE", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Nombre: ${appointment.patient_name}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${appointment.patient_email}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Teléfono: ${appointment.patient_phone}`, margin, yPosition);
      yPosition += 10;

      // Service Information
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("INFORMACIÓN DEL SERVICIO", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Servicio: ${appointment.service_name}`, margin, yPosition);
      yPosition += 6;
      pdf.text(
        `Precio: $${appointment.service_price.toLocaleString("es-MX")}`,
        margin,
        yPosition,
      );
      yPosition += 6;
      pdf.text(
        `Fecha: ${format(parseISO(appointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: es })}`,
        margin,
        yPosition,
      );
      yPosition += 6;
      pdf.text(`Hora: ${appointment.scheduled_time}`, margin, yPosition);
      yPosition += 10;

      // Contract Terms
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("TÉRMINOS Y CONDICIONES", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      // Split contract terms into lines
      const terms = contractTerms.split("\n");
      const maxWidth = pageWidth - margin * 2;

      for (const line of terms) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        const splitLines = pdf.splitTextToSize(line || " ", maxWidth);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += 5;
        }
      }

      // Signature section
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      yPosition += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("FIRMA DEL PACIENTE", margin, yPosition);
      yPosition += 10;

      // Add signature image - optimize and compress
      try {
        // Create a temporary canvas to resize and compress signature
        const img = new Image();
        img.src = signatureData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Create smaller canvas for compression
        const canvas = document.createElement("canvas");
        const targetWidth = 200; // Reduced from original
        const targetHeight = 75; // Reduced from original
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // White background for JPEG
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          // Draw resized signature
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        // Convert to JPEG with quality compression (smaller than PNG)
        const compressedSignature = canvas.toDataURL("image/jpeg", 0.7);

        // Add compressed signature to PDF (smaller dimensions)
        pdf.addImage(compressedSignature, "JPEG", margin, yPosition, 60, 22.5);
        yPosition += 28;
      } catch (err) {
        logger.error("Error adding signature to PDF:", err);
        yPosition += 28;
      }

      // Date and time of signature
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        `Fecha y hora de firma: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        margin,
        yPosition,
      );

      // Add page numbers to all pages
      const pageCount = pdf.getNumberOfPages();
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      // Convert PDF to base64
      const pdfBase64 = pdf.output("dataurlstring");

      // Submit to backend with PDF
      const response = await axios.post(`/check-in/complete`, {
        token,
        signature_data: signatureData,
        terms_accepted: termsAccepted,
        pdf_base64: pdfBase64,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 5000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.data.message || "Error al procesar el check-in",
        });
      }
    } catch (err: any) {
      logger.error("Error completing check-in:", err);
      toast({
        variant: "destructive",
        title: "Error al completar check-in",
        description:
          err.response?.data?.message ||
          "Error al completar el check-in. Por favor, intente nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-gray-600 font-medium">
                Validando token de check-in...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Error de Validación
              </h2>
              <p className="text-gray-600">{error}</p>
              <Button
                onClick={() => navigate("/")}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                ¡Check-in Completado!
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>Su contrato ha sido firmado exitosamente.</p>
                <p className="text-sm">
                  Recibirá una copia por correo electrónico en breve.
                </p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Redirigiendo en 5 segundos...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointment.check_in_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-blue-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Ya Registrado
              </h2>
              <p className="text-gray-600">
                Esta cita ya fue registrada el{" "}
                {format(
                  parseISO(appointment.check_in_at),
                  "d 'de' MMMM 'a las' HH:mm",
                  {
                    locale: es,
                  },
                )}
              </p>
              <Button
                onClick={() => navigate("/")}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl">
                Check-in de Cita
              </CardTitle>
              <p className="text-sm text-gray-600">
                Por favor, revise la información y firme el contrato
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Información de la Cita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Paciente</Label>
                  <p className="font-medium">{appointment.patient_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium text-sm">
                    {appointment.patient_email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Teléfono</Label>
                  <p className="font-medium">{appointment.patient_phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Servicio</Label>
                  <p className="font-medium">{appointment.service_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Fecha</Label>
                  <p className="font-medium">
                    {format(
                      parseISO(appointment.scheduled_date),
                      "d 'de' MMMM 'de' yyyy",
                      {
                        locale: es,
                      },
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Hora</Label>
                  <p className="font-medium">{appointment.scheduled_time}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Precio del servicio:
                </span>
                <Badge className="bg-primary text-white text-lg px-4 py-1">
                  ${appointment.service_price.toLocaleString("es-MX")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {contractTerms}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Firma del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignatureCanvas
              onSignatureComplete={handleSignatureComplete}
              disabled={submitting}
            />

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) =>
                  setTermsAccepted(checked as boolean)
                }
                disabled={submitting}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
              >
                He leído y acepto los términos y condiciones del servicio.
                Confirmo que la información proporcionada es correcta y autorizo
                el tratamiento según lo establecido.
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!signatureData || !termsAccepted || submitting}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Completar Check-in
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
