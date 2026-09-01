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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { logger } from "@/lib/logger";
import { useAppDispatch } from "@/store/hooks";
import {
  fetchContractByAppointment,
  createAdminContract,
  fetchContractStatus,
} from "@/store/slices/contractsSlice";
import {
  generateCheckInQr,
  checkInAdminAppointment,
} from "@/store/slices/calendarSlice";

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
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"check" | "configure" | "sign" | "complete">(
    "check",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [contractNumber, setContractNumber] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);

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

5. VIGENCIA
   - Este contrato tiene una vigencia de 12 meses desde la fecha de firma
   - Las sesiones no utilizadas dentro de este período expirarán

6. PRIVACIDAD Y PROTECCIÓN DE DATOS
   - Sus datos personales serán tratados conforme a nuestra política de privacidad
   - La información médica es estrictamente confidencial

Al firmar este documento, el paciente confirma haber leído, entendido y aceptado todos los términos y condiciones aquí establecidos.`,
  });

  const isSigned = (status?: string | null, signedAt?: string | null) =>
    status === "signed" || status === "completed" || Boolean(signedAt);

  const checkExistingContract = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      const contract = await dispatch(
        fetchContractByAppointment(appointment.id),
      ).unwrap();

      if (contract) {
        setContractId(contract.contract_id);
        setContractNumber(contract.contract_number || null);
        setContractStatus(contract.contract_status);

        if (isSigned(contract.contract_status, contract.signed_at)) {
          setStep("complete");
          await performCheckIn();
        } else {
          await startPatientSigning(contract.contract_id);
        }
      } else {
        setStep("configure");
      }
    } catch (err: any) {
      setError(err || "Error checking contract status");
      setStep("configure");
    } finally {
      setLoading(false);
    }
  };

  const createContractAndShowQr = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      const created = await dispatch(
        createAdminContract({
          patient_id: appointment.patient_id,
          service_id: appointment.service_id,
          appointment_id: appointment.id,
          total_amount: contractForm.total_amount,
          sessions_included: contractForm.sessions_included,
          terms_and_conditions: contractForm.terms_and_conditions,
        }),
      ).unwrap();

      setContractId(created.contract_id);
      setContractNumber(created.contract_number);
      await startPatientSigning(created.contract_id);
    } catch (err: any) {
      setError(err || "Error creating contract");
    } finally {
      setLoading(false);
    }
  };

  const startPatientSigning = async (id: number) => {
    if (!appointment) return;
    try {
      const qr = await dispatch(generateCheckInQr(appointment.id)).unwrap();
      setCheckInUrl(qr.check_in_url);
      setContractId(id);
      setStep("sign");
    } catch (err: any) {
      setError(err || "No se pudo generar el código QR de firma");
      setStep("sign");
    }
  };

  const checkSignatureStatus = async (): Promise<string | null> => {
    if (!contractId) return null;

    try {
      const data = await dispatch(fetchContractStatus(contractId)).unwrap();
      setContractStatus(data.status);
      setContractNumber(data.contract_number);

      if (isSigned(data.status, data.signed_at)) {
        setStep("complete");
        await performCheckIn();
      }

      return data.status;
    } catch (err: any) {
      logger.error("Error checking signature status:", err);
    }

    return null;
  };

  const performCheckIn = async () => {
    if (!appointment) return;

    setLoading(true);
    setError(null);

    try {
      await dispatch(checkInAdminAppointment(appointment.id)).unwrap();
      onCheckInSuccess();
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (err: any) {
      setError(err || "Error during check-in");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep("check");
    setContractId(null);
    setContractNumber(null);
    setContractStatus(null);
    setCheckInUrl(null);
    setError(null);
    setContractForm({
      total_amount: 0,
      sessions_included: 1,
      terms_and_conditions: contractForm.terms_and_conditions,
    });
  };

  useEffect(() => {
    if (isOpen && appointment) {
      setContractForm((prev) => ({
        ...prev,
        total_amount: appointment.service_price || 0,
      }));
      checkExistingContract();
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (step !== "sign" || !contractId) return;
    const poll = setInterval(() => {
      void checkSignatureStatus();
    }, 3000);
    return () => clearInterval(poll);
  }, [step, contractId]);

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

        {step === "check" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Clock className="w-16 h-16 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Verificando contrato existente...</p>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Ingresa los detalles del contrato. El paciente firmará en la
                pantalla de check-in con el código QR.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={createContractAndShowQr}
                disabled={loading || contractForm.total_amount <= 0}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? "Preparando..." : "Generar QR de firma"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "sign" && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Pide al paciente que escanee el código QR y firme el contrato
                en su dispositivo. El check-in se completará al firmar.
              </AlertDescription>
            </Alert>

            {checkInUrl && (
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG value={checkInUrl} size={200} />
                <p className="text-xs text-gray-500 break-all text-center">
                  {checkInUrl}
                </p>
              </div>
            )}

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

            {contractStatus && (
              <div className="flex items-center gap-2">
                <Label>Estado:</Label>
                <Badge
                  variant={
                    contractStatus === "signed" ||
                    contractStatus === "completed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {contractStatus === "pending_signature" && "Pendiente de firma"}
                  {contractStatus === "draft" && "Borrador"}
                  {contractStatus === "signed" && "Firmado"}
                  {contractStatus === "completed" && "Completado"}
                  {![
                    "pending_signature",
                    "draft",
                    "signed",
                    "completed",
                  ].includes(contractStatus) && contractStatus}
                </Badge>
              </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                El estado se actualiza automáticamente cada 3 segundos mientras
                esta ventana está abierta.
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

        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-primary" />
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
