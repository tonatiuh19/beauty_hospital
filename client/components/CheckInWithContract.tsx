import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import axios from "@/lib/axios";

interface CheckInWithContractProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_email: string;
    service_id: number;
    service_name: string;
    service_price: number;
    scheduled_date: string;
    scheduled_time: string;
  } | null;
  onCheckInSuccess: () => void;
}

export default function CheckInWithContract({
  isOpen,
  onClose,
  appointment,
  onCheckInSuccess,
}: CheckInWithContractProps) {
  const [step, setStep] = useState<"check" | "configure" | "sign" | "complete">(
    "check",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [contractNumber, setContractNumber] = useState<string | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string | null>(null);

  // Contract creation form
  const [contractForm, setContractForm] = useState({
    total_amount: 0,
    sessions_included: 1,
    terms_and_conditions: `TÉRMINOS Y CONDICIONES DEL SERVICIO

1. ALCANCE DEL SERVICIO
   El presente contrato cubre las sesiones especificadas del servicio contratado.

2. PROGRAMACIÓN Y ASISTENCIA
   - Las citas deben programarse con anticipación
   - Se requiere llegar 10 minutos antes de la hora programada
   - En caso de no asistir sin previo aviso, se considerará como sesión utilizada

3. POLÍTICA DE CANCELACIÓN
   - Las cancelaciones deben hacerse con al menos 24 horas de anticipación
   - Las cancelaciones con menos de 24 horas de anticipación podrían contar como sesión utilizada

4. CUIDADOS Y RECOMENDACIONES
   - Seguir todas las indicaciones del personal médico
   - Informar sobre cualquier cambio en el estado de salud
   - Acudir a todas las sesiones programadas para obtener mejores resultados

5. VIGENCIA
   - Este contrato tiene una vigencia de 12 meses desde la fecha de firma
   - Las sesiones no utilizadas dentro de este período expirarán

6. PRIVACIDAD Y PROTECCIÓN DE DATOS
   - Sus datos personales serán tratados conforme a nuestra política de privacidad
   - La información médica es estrictamente confidencial

Al firmar este documento, el paciente confirma haber leído, entendido y aceptado todos los términos y condiciones aquí establecidos.`,
  });

  const checkExistingContract = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(
        `/admin/contracts/appointment/${appointment.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.data) {
        const contract = response.data.data;
        setContractId(contract.contract_id);
        setContractStatus(contract.docusign_status);
        setEnvelopeId(contract.docusign_envelope_id);

        if (
          contract.docusign_status === "signed" ||
          contract.docusign_status === "completed"
        ) {
          setStep("complete");
          await performCheckIn();
        } else if (contract.docusign_status === "sent") {
          setStep("sign");
        } else {
          setStep("configure");
        }
      } else {
        setStep("configure");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error checking contract status");
      setStep("configure");
    } finally {
      setLoading(false);
    }
  };

  const createContractAndOpenDocuSign = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        "/admin/contracts/create-and-configure",
        {
          patient_id: appointment.patient_id,
          patient_name: appointment.patient_name,
          patient_email: appointment.patient_email,
          service_id: appointment.service_id,
          service_name: appointment.service_name,
          total_amount: contractForm.total_amount,
          sessions_included: contractForm.sessions_included,
          return_url: window.location.href,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setContractId(response.data.data.contract_id);
        setContractNumber(response.data.data.contract_number);
        setEnvelopeId(response.data.data.envelope_id);
        const configUrl = response.data.data.configuration_url;

        const docusignWindow = window.open(
          configUrl,
          "_blank",
          "width=1200,height=800",
        );

        if (docusignWindow) {
          setStep("sign");
          const pollInterval = setInterval(async () => {
            const status = await checkSignatureStatus();
            if (status === "signed" || status === "completed") {
              clearInterval(pollInterval);
              if (docusignWindow && !docusignWindow.closed) {
                docusignWindow.close();
              }
            }
          }, 3000);
        } else {
          setError(
            "Por favor permite las ventanas emergentes para abrir DocuSign",
          );
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating contract");
    } finally {
      setLoading(false);
    }
  };

  const openDocuSignConfiguration = async () => {
    if (!contractId || !appointment) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.post(
        `/admin/contracts/${contractId}/open-docusign`,
        {
          patient_name: appointment.patient_name,
          patient_email: appointment.patient_email,
          return_url: window.location.href,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const configUrl = response.data.data.configuration_url;

        const docusignWindow = window.open(
          configUrl,
          "_blank",
          "width=1200,height=800",
        );

        if (docusignWindow) {
          setStep("sign");
          const pollInterval = setInterval(async () => {
            const status = await checkSignatureStatus();
            if (status === "signed" || status === "completed") {
              clearInterval(pollInterval);
              if (docusignWindow && !docusignWindow.closed) {
                docusignWindow.close();
              }
            }
          }, 3000);
        } else {
          setError(
            "Por favor permite las ventanas emergentes para abrir DocuSign",
          );
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error opening DocuSign");
    } finally {
      setLoading(false);
    }
  };

  const checkSignatureStatus = async (): Promise<string | null> => {
    if (!contractId) return null;

    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(
        `/admin/contracts/${contractId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const status = response.data.data.docusign_status;
        const contractStat = response.data.data.status;
        setContractStatus(status);
        setContractNumber(response.data.data.contract_number);
        setEnvelopeId(response.data.data.docusign_envelope_id);

        if (status === "completed" || contractStat === "signed") {
          setStep("complete");
          await performCheckIn();
        }

        return status;
      }
    } catch (err: any) {
      console.error("Error checking signature status:", err);
    }

    return null;
  };

  const performCheckIn = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminAccessToken");
      await axios.post(
        `/admin/appointments/${appointment.id}/check-in`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      onCheckInSuccess();
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error during check-in");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep("check");
    setContractId(null);
    setContractNumber(null);
    setEnvelopeId(null);
    setSigningUrl(null);
    setContractStatus(null);
    setError(null);
    setContractForm({
      total_amount: 0,
      sessions_included: 1,
      terms_and_conditions: contractForm.terms_and_conditions,
    });
  };

  // Check for existing contract when dialog opens
  useEffect(() => {
    if (isOpen && appointment) {
      // Auto-populate form with service price
      setContractForm((prev) => ({
        ...prev,
        total_amount: appointment.service_price || 0,
      }));
      checkExistingContract();
    }
  }, [isOpen, appointment]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          resetState();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Check-In con Contrato
          </DialogTitle>
          {appointment && (
            <DialogDescription>
              Paciente: {appointment.patient_name} | Servicio:{" "}
              {appointment.service_name}
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step: Checking existing contract */}
        {step === "check" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Clock className="w-16 h-16 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Verificando contrato existente...</p>
          </div>
        )}

        {/* Step: Configure Contract */}
        {step === "configure" && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Ingresa los detalles del contrato. DocuSign se abrirá para que
                puedas subir el PDF y configurar los campos de firma.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto Total *</Label>
                <Input
                  type="number"
                  value={contractForm.total_amount}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      total_amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Número de Sesiones *</Label>
                <Input
                  type="number"
                  value={contractForm.sessions_included}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      sessions_included: parseInt(e.target.value),
                    })
                  }
                  min={1}
                />
              </div>
            </div>

            {/* <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-blue-900">
                En DocuSign podrás:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Subir el archivo PDF del contrato</li>
                <li>
                  Arrastrar los campos de firma donde el paciente debe firmar
                </li>
                <li>Configurar campos adicionales (fecha, iniciales, etc.)</li>
                <li>Enviar para que el paciente firme inmediatamente</li>
              </ul>
            </div> */}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={createContractAndOpenDocuSign}
                disabled={loading || contractForm.total_amount <= 0}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? "Abriendo DocuSign..." : "Abrir DocuSign"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Waiting for Signature */}
        {step === "sign" && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                El contrato ha sido enviado a DocuSign. El paciente debe firmar
                antes de proceder con el check-in.
              </AlertDescription>
            </Alert>

            {contractNumber && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Número de Contrato:
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {contractNumber}
                </p>
              </div>
            )}

            {envelopeId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  ID de Sobre DocuSign:
                </p>
                <p className="text-sm text-blue-700 font-mono">{envelopeId}</p>
              </div>
            )}

            {contractStatus && (
              <div className="flex items-center gap-2">
                <Label>Estado:</Label>
                <Badge
                  variant={
                    contractStatus === "completed" ||
                    contractStatus === "signed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {contractStatus === "sent" && "Enviado"}
                  {contractStatus === "delivered" && "Entregado"}
                  {contractStatus === "completed" && "Completado"}
                  {contractStatus === "signed" && "Firmado"}
                  {!["sent", "delivered", "completed", "signed"].includes(
                    contractStatus,
                  ) && contractStatus}
                </Badge>
              </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ℹ️ El estado se actualiza automáticamente cada 3 segundos
                mientras esta ventana está abierta.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={checkSignatureStatus}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? "Verificando..." : "Verificar Estado Ahora"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-lg font-medium text-gray-900">
              ¡Check-in Completado!
            </p>
            <p className="text-gray-600">
              El contrato ha sido firmado y el paciente ha sido registrado.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
