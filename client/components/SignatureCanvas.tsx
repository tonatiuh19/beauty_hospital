import { useRef, useState, useEffect } from "react";
import SignaturePad from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Check } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureComplete: (signatureDataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  existingSignature?: string;
}

export default function SignatureCanvas({
  onSignatureComplete,
  onClear,
  disabled = false,
  existingSignature,
}: SignatureCanvasProps) {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

  useEffect(() => {
    // Adjust canvas size based on device
    const updateCanvasSize = () => {
      const container = document.getElementById("signature-container");
      if (container) {
        const width = Math.min(container.clientWidth - 32, 600);
        const height = Math.min(width * 0.4, 250);
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    if (existingSignature && signaturePadRef.current) {
      signaturePadRef.current.fromDataURL(existingSignature);
      setIsEmpty(false);
    }
  }, [existingSignature]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onClear?.();
    }
  };

  const handleEnd = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL();
      onSignatureComplete(dataUrl);
    }
  };

  return (
    <div id="signature-container" className="space-y-4">
      <Card className="border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Firma del Paciente *
              </label>
              <div className="flex gap-2">
                {!isEmpty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
                {!isEmpty && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={disabled}
                    className="text-xs bg-primary hover:bg-primary/90"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirmar
                  </Button>
                )}
              </div>
            </div>

            <div
              className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
              style={{
                width: "100%",
                maxWidth: `${canvasSize.width}px`,
                margin: "0 auto",
              }}
            >
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  className: "signature-canvas touch-action-none",
                  style: { touchAction: "none" },
                }}
                backgroundColor="rgb(255, 255, 255)"
                penColor="rgb(0, 0, 0)"
                minWidth={1}
                maxWidth={2.5}
                velocityFilterWeight={0.7}
                onEnd={handleEnd}
                clearOnResize={false}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Firme dentro del recuadro usando su dedo o un stylus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        .signature-canvas {
          cursor: crosshair;
        }
        
        .signature-canvas:active {
          cursor: crosshair;
        }

        /* Optimize for touch devices */
        @media (hover: none) and (pointer: coarse) {
          .signature-canvas {
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
          }
        }
      `}</style>
    </div>
  );
}
