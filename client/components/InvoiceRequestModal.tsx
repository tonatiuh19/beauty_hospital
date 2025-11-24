import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface InvoiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: InvoiceData) => void;
  appointment: {
    id: number;
    service_name: string;
    amount: number;
    scheduled_at: string;
  };
  isLoading?: boolean;
}

export interface InvoiceData {
  // RFC Information
  rfc: string;
  business_name: string;

  // Fiscal Address
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;

  // Contact
  email: string;
  phone?: string;

  // Invoice Options
  use_cfdi: string; // Uso del CFDI
  payment_method: string; // Forma de pago
  payment_type: string; // Método de pago
}

const CFDI_USES = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "D01", label: "D01 - Honorarios médicos" },
  { value: "D02", label: "D02 - Gastos médicos por incapacidad" },
  { value: "D10", label: "D10 - Pagos por servicios educativos" },
  { value: "P01", label: "P01 - Por definir" },
];

const PAYMENT_METHODS = [
  { value: "PUE", label: "PUE - Pago en una sola exhibición" },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido" },
];

const PAYMENT_TYPES = [
  { value: "01", label: "01 - Efectivo" },
  { value: "02", label: "02 - Cheque nominativo" },
  { value: "03", label: "03 - Transferencia electrónica de fondos" },
  { value: "04", label: "04 - Tarjeta de crédito" },
  { value: "28", label: "28 - Tarjeta de débito" },
];

export function InvoiceRequestModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  isLoading = false,
}: InvoiceRequestModalProps) {
  const [formData, setFormData] = useState<InvoiceData>({
    rfc: "",
    business_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "México",
    email: "",
    phone: "",
    use_cfdi: "G03",
    payment_method: "PUE",
    payment_type: "04",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof InvoiceData, string>>
  >({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InvoiceData, string>> = {};

    // RFC validation (12-13 characters)
    if (!formData.rfc || formData.rfc.length < 12 || formData.rfc.length > 13) {
      newErrors.rfc = "RFC debe tener 12 o 13 caracteres";
    }

    // Required fields
    if (!formData.business_name)
      newErrors.business_name = "Razón social es requerida";
    if (!formData.address) newErrors.address = "Dirección es requerida";
    if (!formData.city) newErrors.city = "Ciudad es requerida";
    if (!formData.state) newErrors.state = "Estado es requerido";
    if (!formData.zip_code || formData.zip_code.length !== 5) {
      newErrors.zip_code = "Código postal debe tener 5 dígitos";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Email válido es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof InvoiceData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light p-6 text-white relative">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Solicitar Factura</h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      Servicio: {appointment.service_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <form
                onSubmit={handleSubmit}
                className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]"
              >
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Información importante</p>
                    <p>
                      La factura se generará con los datos proporcionados y se
                      enviará a tu correo electrónico. Verifica que toda la
                      información sea correcta antes de solicitar.
                    </p>
                  </div>
                </div>

                {/* Appointment Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Resumen de la Cita
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Servicio:</span>
                      <p className="font-medium">{appointment.service_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monto:</span>
                      <p className="font-medium">
                        ${appointment.amount.toFixed(2)} MXN
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Fecha:</span>
                      <p className="font-medium">
                        {new Date(appointment.scheduled_at).toLocaleDateString(
                          "es-MX",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RFC Section */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Datos Fiscales
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rfc">RFC *</Label>
                      <Input
                        id="rfc"
                        value={formData.rfc}
                        onChange={(e) =>
                          handleChange("rfc", e.target.value.toUpperCase())
                        }
                        placeholder="XAXX010101000"
                        maxLength={13}
                        disabled={isLoading}
                        className={errors.rfc ? "border-red-500" : ""}
                      />
                      {errors.rfc && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.rfc}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="business_name">
                        Razón Social / Nombre *
                      </Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) =>
                          handleChange("business_name", e.target.value)
                        }
                        placeholder="Nombre o razón social"
                        disabled={isLoading}
                        className={errors.business_name ? "border-red-500" : ""}
                      />
                      {errors.business_name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.business_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Dirección Fiscal
                  </h3>

                  <div>
                    <Label htmlFor="address">Calle y Número *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Ej: Av. Reforma 123"
                      disabled={isLoading}
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="Ciudad"
                        disabled={isLoading}
                        className={errors.city ? "border-red-500" : ""}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        placeholder="Estado"
                        disabled={isLoading}
                        className={errors.state ? "border-red-500" : ""}
                      />
                      {errors.state && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="zip_code">Código Postal *</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) =>
                          handleChange("zip_code", e.target.value)
                        }
                        placeholder="00000"
                        maxLength={5}
                        disabled={isLoading}
                        className={errors.zip_code ? "border-red-500" : ""}
                      />
                      {errors.zip_code && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.zip_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Contacto
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="correo@ejemplo.com"
                        disabled={isLoading}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        La factura se enviará a este correo
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono (Opcional)</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="5512345678"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* CFDI Options */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Opciones de Facturación
                  </h3>

                  <div>
                    <Label htmlFor="use_cfdi">Uso del CFDI *</Label>
                    <Select
                      value={formData.use_cfdi}
                      onValueChange={(value) => handleChange("use_cfdi", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CFDI_USES.map((use) => (
                          <SelectItem key={use.value} value={use.value}>
                            {use.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment_method">Forma de Pago *</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) =>
                          handleChange("payment_method", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="payment_type">Método de Pago *</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value) =>
                          handleChange("payment_type", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-luxury-gold-dark to-luxury-gold-light hover:from-luxury-gold-dark/90 hover:to-luxury-gold-light/90"
                  >
                    {isLoading ? "Procesando..." : "Solicitar Factura"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
