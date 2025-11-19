import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { cn } from "@/lib/utils";

export default function LoadingMask() {
  const { isLoading, message } = useSelector(
    (state: RootState) => state.loading,
  );

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm",
        "animate-in fade-in duration-300",
      )}
    >
      <div className="relative flex flex-col items-center gap-6 px-8 py-10 rounded-2xl bg-white/95 shadow-2xl border border-white/20 backdrop-blur-md">
        {/* Animated loader */}
        <div className="relative w-20 h-20">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />

          {/* Middle rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-secondary border-b-accent border-l-primary/20 animate-spin" />

          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary via-secondary to-accent animate-pulse" />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white shadow-lg animate-bounce" />
          </div>
        </div>

        {/* Loading message */}
        {message && (
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground animate-pulse">
              {message}
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
            </div>
          </div>
        )}

        {!message && (
          <p className="text-base font-medium text-muted-foreground animate-pulse">
            Cargando...
          </p>
        )}
      </div>
    </div>
  );
}
