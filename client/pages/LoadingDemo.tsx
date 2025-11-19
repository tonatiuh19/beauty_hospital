import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "@/store/slices/loadingSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchBusinessHours } from "@/store/slices/businessHoursSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoadingDemo() {
  const dispatch = useDispatch();

  // Manual loading examples
  const demoSimpleLoading = () => {
    dispatch(showLoading());
    setTimeout(() => {
      dispatch(hideLoading());
    }, 2000);
  };

  const demoWithMessage = () => {
    dispatch(showLoading("Procesando tu solicitud..."));
    setTimeout(() => {
      dispatch(hideLoading());
    }, 3000);
  };

  const demoMultiStep = async () => {
    const steps = [
      "Validando información...",
      "Procesando datos...",
      "Guardando cambios...",
      "Finalizando...",
    ];

    for (const step of steps) {
      dispatch(showLoading(step));
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    dispatch(hideLoading());
  };

  const demoLongOperation = () => {
    dispatch(showLoading("Esto puede tardar un momento..."));
    setTimeout(() => {
      dispatch(hideLoading());
    }, 5000);
  };

  // Automatic loading examples
  const demoAutoServices = () => {
    // @ts-ignore - dispatch returns the thunk action
    dispatch(fetchServices());
  };

  const demoAutoBusinessHours = () => {
    // @ts-ignore - dispatch returns the thunk action
    dispatch(fetchBusinessHours());
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Loading Mask Demo
          </h1>
          <p className="text-muted-foreground">
            Automatic and manual loading mask variations
          </p>
        </div>

        {/* Automatic Loading Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Automatic Loading</h2>
            <Badge variant="default">✨ New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Loading mask appears automatically for Redux async thunks - no
            manual dispatch needed!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Fetch Services</CardTitle>
                <CardDescription>
                  Automatically shows "Cargando servicios..."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoAutoServices}
                  className="w-full"
                  variant="default"
                >
                  Fetch Services (Auto)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Fetch Business Hours</CardTitle>
                <CardDescription>
                  Automatically shows "Cargando horarios..."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoAutoBusinessHours}
                  className="w-full"
                  variant="default"
                >
                  Fetch Hours (Auto)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Manual Loading Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Manual Loading</h2>
          <p className="text-sm text-muted-foreground">
            For custom operations or when you need specific control
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Loading</CardTitle>
                <CardDescription>
                  Basic loading mask without custom message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoSimpleLoading}
                  className="w-full"
                  variant="outline"
                >
                  Show Simple Loading (2s)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Custom Message</CardTitle>
                <CardDescription>
                  Loading mask with a custom message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoWithMessage}
                  className="w-full"
                  variant="outline"
                >
                  Show With Message (3s)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Step Process</CardTitle>
                <CardDescription>
                  Loading mask that changes message for each step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoMultiStep}
                  className="w-full"
                  variant="outline"
                >
                  Show Multi-Step (6s)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Long Operation</CardTitle>
                <CardDescription>
                  Loading mask for longer operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={demoLongOperation}
                  className="w-full"
                  variant="outline"
                >
                  Show Long Loading (5s)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-2xl">Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">✨ Automatic (Recommended)</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{`// Loading mask shows automatically!
import { fetchServices } from "@/store/slices/servicesSlice";

dispatch(fetchServices()); // That's it!`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🎯 Manual (When needed)</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{`import { showLoading, hideLoading } from "@/store/slices/loadingSlice";

const handleAction = async () => {
  try {
    dispatch(showLoading("Processing..."));
    await customOperation();
  } finally {
    dispatch(hideLoading());
  }
};`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            The loading mask uses your brand colors: primary, secondary, and
            accent
          </p>
          <p className="text-xs text-muted-foreground">
            All Redux async thunks trigger loading automatically via middleware
          </p>
        </div>
      </div>
    </div>
  );
}
