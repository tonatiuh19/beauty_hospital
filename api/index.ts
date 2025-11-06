import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create the Express app once (reused across invocations)
let app: express.Application | null = null;

function createServer() {
  console.log("Creating Express server for Vercel...");

  const expressApp = express();

  // Middleware
  expressApp.use(cors());
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  // Log requests
  expressApp.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check
  expressApp.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        success: true,
        message: "Beauty Hospital API is running",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Ping endpoint
  expressApp.get("/api/ping", (_req, res) => {
    res.json({ message: "pong" });
  });

  // Demo endpoint
  expressApp.get("/api/demo", (_req, res) => {
    res.status(200).json({
      message: "Hello from Express server",
    });
  });

  // ==================== SERVICES ROUTES ====================
  expressApp.get("/api/services", async (_req, res) => {
    try {
      const [rows] = await pool.query<any[]>(
        `SELECT 
          id, 
          name, 
          description, 
          category, 
          price, 
          duration_minutes, 
          is_active, 
          created_at, 
          updated_at 
        FROM services 
        WHERE is_active = 1 
        ORDER BY category, name`,
      );

      // Parse numeric fields
      const services = rows.map((row) => ({
        ...row,
        price: parseFloat(row.price),
        duration_minutes: parseInt(row.duration_minutes, 10),
      }));

      res.json({
        success: true,
        data: services,
      });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch services",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  expressApp.get("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await pool.query<any[]>(
        `SELECT 
          id, 
          name, 
          description, 
          category, 
          price, 
          duration_minutes, 
          is_active, 
          created_at, 
          updated_at 
        FROM services 
        WHERE id = ? AND is_active = 1`,
        [id],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Parse numeric fields
      const service = {
        ...rows[0],
        price: parseFloat(rows[0].price),
        duration_minutes: parseInt(rows[0].duration_minutes, 10),
      };

      res.json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch service",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // 404 handler - must come after all other routes
  expressApp.use((_req, res, next) => {
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: "API endpoint not found",
      });
    } else {
      next();
    }
  });

  // Error handler
  expressApp.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Express error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    },
  );

  return expressApp;
}

function getApp() {
  if (!app) {
    console.log("Initializing Express app for serverless...");
    app = createServer();
  }
  return app;
}

// Export handler for Vercel serverless
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const expressApp = getApp();
    expressApp(req as any, res as any);
  } catch (error) {
    console.error("API Handler Error:", error);
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
