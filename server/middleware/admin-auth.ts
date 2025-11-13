import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Admin role type
export type AdminRole = "admin" | "general_admin" | "receptionist" | "doctor";

// Extend Express Request type to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: number;
        email: string;
        role: AdminRole;
      };
    }
  }
}

export interface AdminJWTPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Middleware to verify JWT token for admin users
 */
export function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret) as AdminJWTPayload;

    // Check if user has admin role
    const adminRoles: AdminRole[] = [
      "admin",
      "general_admin",
      "receptionist",
      "doctor",
    ];
    if (!adminRoles.includes(decoded.role as AdminRole)) {
      res.status(403).json({
        success: false,
        error: "Access denied. Admin privileges required.",
      });
      return;
    }

    // Add user to request object
    req.adminUser = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as AdminRole,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return;
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during authentication",
    });
  }
}

/**
 * Middleware to check for specific admin roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireAdminRole(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        userRole: req.adminUser.role,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware specifically for general admin only
 */
export const requireGeneralAdmin = requireAdminRole("general_admin", "admin");

/**
 * Middleware for receptionist and above
 */
export const requireReceptionist = requireAdminRole(
  "receptionist",
  "general_admin",
  "admin",
);

/**
 * Middleware for doctor and above
 */
export const requireDoctor = requireAdminRole(
  "doctor",
  "general_admin",
  "admin",
);

/**
 * Middleware that allows any admin role
 */
export const requireAnyAdmin = requireAdminRole(
  "admin",
  "general_admin",
  "receptionist",
  "doctor",
);
