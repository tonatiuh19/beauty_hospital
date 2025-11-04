import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server/index";

// Create the Express app once (reused across invocations)
let app: ReturnType<typeof createServer> | null = null;

function getApp() {
  if (!app) {
    console.log("Initializing Express app...");
    app = createServer();
  }
  return app;
}

// Export handler for Vercel serverless
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const expressApp = getApp();
    
    // Handle the request with Express
    expressApp(req as any, res as any);
  } catch (error) {
    console.error("API Handler Error:", error);
    
    // Only send response if headers haven't been sent
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: "500",
          message: "A server error has occurred",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
};
