import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@shared/database";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
    }
  }
}

export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
}

/**
 * Middleware to verify JWT token
 */
export function authenticate(
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

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
      return;
    }

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
}

/**
 * Middleware to check if user has required role
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid but doesn't fail if token is missing
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
