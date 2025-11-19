import { RequestHandler } from "express";
import { query, queryOne } from "../db/connection";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  validatePassword,
  validateEmail,
} from "../utils/auth";
import type { User, PatientWithoutPassword } from "@shared/database";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ApiResponse,
} from "@shared/api";

/**
 * POST /api/auth/register
 * Register a new user account
 */
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } =
      req.body as RegisterRequest;

    // Always register as patient (role is not in RegisterRequest interface)
    const role = "patient";

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
      } as ApiResponse);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({
        success: false,
        error: "Invalid email format",
      } as ApiResponse);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        error: "Password does not meet requirements",
        message: passwordValidation.errors.join(", "),
      } as ApiResponse);
      return;
    }

    // Check if email already exists
    const existingUser = await queryOne<User>(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      } as ApiResponse);
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert new user
    const result: any = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, password_hash, role, first_name, last_name, phone || null],
    );

    const userId = result.insertId;

    // Generate tokens
    const tokenPayload = { id: userId, email, role: role as any };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, refreshToken, expiresAt],
    );

    res.status(201).json({
      success: true,
      data: {
        patient: {
          id: userId,
          email,
          first_name,
          last_name,
          role: "patient" as const,
          phone: phone || undefined,
          date_of_birth: undefined,
          gender: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          zip_code: undefined,
          emergency_contact_name: undefined,
          emergency_contact_phone: undefined,
          notes: undefined,
          is_active: true,
          is_email_verified: false,
          last_login: undefined,
          created_at: new Date(),
          updated_at: new Date(),
        } as PatientWithoutPassword,
        token,
        refreshToken,
      },
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
    } as ApiResponse);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      } as ApiResponse);
      return;
    }

    // Find user by email
    const user = await queryOne<User>("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      } as ApiResponse);
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        error: "Account is disabled",
      } as ApiResponse);
      return;
    }

    // Verify password
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      } as ApiResponse);
      return;
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, expiresAt],
    );

    // Remove password hash from response and map to patient format
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        patient: {
          ...userWithoutPassword,
          role: "patient" as const,
          is_active: true,
          is_email_verified: false,
        } as PatientWithoutPassword,
        token,
        refreshToken,
      },
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    } as ApiResponse);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export const handleRefreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: "Refresh token is required",
      } as ApiResponse);
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      } as ApiResponse);
      return;
    }

    // Check if refresh token exists in database
    const storedToken = await queryOne<{ user_id: number; expires_at: Date }>(
      "SELECT user_id, expires_at FROM refresh_tokens WHERE token = ?",
      [refreshToken],
    );

    if (!storedToken) {
      res.status(401).json({
        success: false,
        error: "Refresh token not found",
      } as ApiResponse);
      return;
    }

    // Check if token is expired
    if (new Date(storedToken.expires_at) < new Date()) {
      // Delete expired token
      await query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);

      res.status(401).json({
        success: false,
        error: "Refresh token expired",
      } as ApiResponse);
      return;
    }

    // Get user info
    const user = await queryOne<User>("SELECT * FROM users WHERE id = ?", [
      decoded.id,
    ]);

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        error: "User not found or inactive",
      } as ApiResponse);
      return;
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Delete old refresh token
    await query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, newRefreshToken, expiresAt],
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      } as RefreshTokenResponse,
    } as ApiResponse<RefreshTokenResponse>);
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Token refresh failed",
    } as ApiResponse);
  }
};

/**
 * POST /api/auth/logout
 * Logout user by invalidating refresh token
 */
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };

    if (refreshToken) {
      // Delete refresh token from database
      await query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    } as ApiResponse);
  }
};

/**
 * GET /api/auth/me
 * Get current user info
 */
export const handleGetCurrentUser: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      } as ApiResponse);
      return;
    }

    const user = await queryOne<User>("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      } as ApiResponse);
      return;
    }

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    } as ApiResponse);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user info",
    } as ApiResponse);
  }
};
