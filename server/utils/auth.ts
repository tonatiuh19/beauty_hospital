import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { JWTPayload } from "../middleware/auth";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT access token
 */
export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "24h") as any,
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
  });
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return jwt.verify(token, secret) as JWTPayload;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
