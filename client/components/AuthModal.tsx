import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  checkUserExists,
  sendVerificationCode,
  verifyLoginCode,
  createNewUser,
} from "../store/slices/authApiSlice";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthStep = "email" | "verify-code" | "sign-up";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = () => {
    setStep("email");
    setEmail("");
    setUserId(null);
    setCode("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setDateOfBirth("");
    setError("");
    setIsSubmitting(false);
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Check if user exists
      const result = await dispatch(checkUserExists({ email })).unwrap();

      if (result.exists && result.user) {
        // User exists, send verification code
        setUserId(result.user.id);
        await dispatch(
          sendVerificationCode({ user_id: result.user.id, email }),
        ).unwrap();
        setStep("verify-code");
      } else {
        // User doesn't exist, go to sign up
        setStep("sign-up");
      }
    } catch (err: any) {
      setError(err || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error("Usuario no encontrado");
      }

      await dispatch(
        verifyLoginCode({ user_id: userId, code: parseInt(code) }),
      ).unwrap();

      // Success! Close modal
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err || "Código inválido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sign up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Create new user
      const newUser = await dispatch(
        createNewUser({
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          date_of_birth: dateOfBirth,
        }),
      ).unwrap();

      // Send verification code to new user
      setUserId(newUser.id);
      await dispatch(
        sendVerificationCode({ user_id: newUser.id, email }),
      ).unwrap();

      // Go to verification step
      setStep("verify-code");
    } catch (err: any) {
      setError(err || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!userId) return;

    setError("");
    setIsSubmitting(true);

    try {
      await dispatch(sendVerificationCode({ user_id: userId, email })).unwrap();
      setError("");
    } catch (err: any) {
      setError(err || "Error al reenviar código");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {step === "email" && "Iniciar Sesión"}
            {step === "verify-code" && "Verificar Código"}
            {step === "sign-up" && "Crear Cuenta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Recibirás un código de verificación por email
              </p>
            </form>
          )}

          {/* Verify Code Step */}
          {step === "verify-code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificación</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  required
                  disabled={isSubmitting}
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-muted-foreground">
                  Enviamos un código de 6 dígitos a{" "}
                  <span className="font-medium">{email}</span>
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || code.length !== 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  ← Volver
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleResendCode}
                  disabled={isSubmitting}
                >
                  Reenviar código
                </Button>
              </div>
            </form>
          )}

          {/* Sign Up Step */}
          {step === "sign-up" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No encontramos una cuenta con{" "}
                  <span className="font-medium">{email}</span>. Vamos a crear
                  una nueva.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  disabled={isSubmitting}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 123 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !firstName ||
                  !lastName ||
                  !dateOfBirth ||
                  !phone
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => {
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                ← Volver
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
