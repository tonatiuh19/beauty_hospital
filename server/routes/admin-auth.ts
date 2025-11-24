import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import nodemailer from "nodemailer";
import { generateToken, generateRefreshToken } from "../utils/auth";

// Types for request bodies
interface CheckAdminRequest {
  email: string;
}

interface SendCodeRequest {
  user_id: number;
  email: string;
}

interface VerifyCodeRequest {
  user_id: number;
  code: number;
}

// Response types
interface AdminUserData {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  is_email_verified: number;
  employee_id: string | null;
  specialization: string | null;
  profile_picture_url: string | null;
  created_at: string;
  last_login: string | null;
}

interface AdminSessionData {
  id: number;
  user_id: number;
  session_code: number;
  is_active: number;
  expires_at: string;
}

/**
 * Check if an admin user exists by email
 * POST /api/admin/auth/check-user
 */
export const checkAdminUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as CheckAdminRequest;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const [rows] = await pool.query<(AdminUserData & RowDataPacket)[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, 
              employee_id, specialization, profile_picture_url, created_at, last_login
       FROM users
       WHERE email = ? AND role IN ('admin', 'general_admin', 'receptionist', 'doctor')`,
      [email],
    );

    if (rows.length > 0) {
      if (rows[0].is_active === 0) {
        res.status(403).json({
          success: false,
          message: "This account has been deactivated",
        });
        return;
      }
      res.json({ success: true, exists: true, user: rows[0] });
    } else {
      res.json({
        success: true,
        exists: false,
        message: "No admin account found with this email",
      });
    }
  } catch (error) {
    console.error("Error checking admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Send verification code to admin user's email
 * POST /api/admin/auth/send-code
 */
export const sendAdminCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendAdminCode endpoint called");
    console.log("   Request body:", req.body);

    const { user_id, email } = req.body as SendCodeRequest;

    if (!user_id || !email) {
      console.log("❌ Missing user_id or email");
      res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
      return;
    }

    // Get admin user details from DB
    console.log("📊 Querying admin user from database...");
    const [userRows] = await pool.query<(AdminUserData & RowDataPacket)[]>(
      `SELECT first_name, last_name, role, is_active 
       FROM users 
       WHERE id = ? AND role IN ('admin', 'general_admin', 'receptionist', 'doctor')`,
      [user_id],
    );

    if (userRows.length === 0) {
      console.log("❌ Admin user not found in database");
      res.status(404).json({ success: false, message: "Admin user not found" });
      return;
    }

    if (userRows[0].is_active === 0) {
      console.log("❌ Admin user account is deactivated");
      res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
      return;
    }

    const user_name = `${userRows[0].first_name} ${userRows[0].last_name}`;
    const user_role = userRows[0].role;
    console.log("✅ Admin user found:", user_name, "Role:", user_role);

    // Delete old session codes for this user
    console.log("🗑️  Deleting old admin session codes...");
    await pool.query("DELETE FROM admin_sessions WHERE user_id = ?", [user_id]);

    // Generate session code
    let session_code: number;
    if (email === "test@beautyhospital.com") {
      session_code = 123456;
      console.log("🧪 Using test code:", session_code);
    } else {
      // Generate unique code
      let isUnique = false;
      do {
        session_code = Math.floor(100000 + Math.random() * 900000);
        const [existingCodes] = await pool.query<RowDataPacket[]>(
          "SELECT COUNT(*) as count FROM admin_sessions WHERE session_code = ?",
          [session_code],
        );
        isUnique = existingCodes[0].count === 0;
      } while (!isUnique);
      console.log("🔢 Generated unique code:", session_code);
    }

    // Insert new session code (expires in 10 minutes)
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("💾 Inserting new admin session code...");
    await pool.query(
      `INSERT INTO admin_sessions (user_id, session_code, is_active, expires_at) 
       VALUES (?, ?, 1, ?)`,
      [user_id, session_code, expires_at],
    );

    // Send email with the code
    console.log("📧 Sending email...");
    const emailSent = await sendAdminVerificationEmail(
      email,
      user_name,
      session_code,
      user_role,
    );

    if (emailSent) {
      console.log("✅ Email sent successfully");
      res.json({
        success: true,
        message: "Verification code sent successfully",
        expires_in_minutes: 10,
      });
    } else {
      console.log("❌ Email sending failed");
      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }
  } catch (error) {
    console.error("Error sending admin code:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Verify admin code and log in
 * POST /api/admin/auth/verify-code
 */
export const verifyAdminCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 verifyAdminCode endpoint called");
    const { user_id, code } = req.body as VerifyCodeRequest;

    if (!user_id || !code) {
      res.status(400).json({
        success: false,
        message: "User ID and code are required",
      });
      return;
    }

    // Check if the code is valid and not expired
    const [sessionRows] = await pool.query<
      (AdminSessionData & RowDataPacket)[]
    >(
      `SELECT id, user_id, session_code, is_active, expires_at
       FROM admin_sessions
       WHERE user_id = ? AND session_code = ? AND is_active = 1`,
      [user_id, code],
    );

    if (sessionRows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid code" });
      return;
    }

    const session = sessionRows[0];
    const now = new Date();
    const sessionExpiresAt = new Date(session.expires_at);

    if (now > sessionExpiresAt) {
      // Deactivate expired session
      await pool.query("UPDATE admin_sessions SET is_active = 0 WHERE id = ?", [
        session.id,
      ]);
      res.status(401).json({ success: false, message: "Code has expired" });
      return;
    }

    // Get admin user details
    const [userRows] = await pool.query<(AdminUserData & RowDataPacket)[]>(
      `SELECT id, email, role, first_name, last_name, phone, 
              employee_id, specialization, profile_picture_url
       FROM users
       WHERE id = ?`,
      [user_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userRows[0];

    // Update last login and email verification
    await pool.query(
      "UPDATE users SET last_login = NOW(), is_email_verified = 1 WHERE id = ?",
      [user_id],
    );

    // Deactivate the used session code
    await pool.query("UPDATE admin_sessions SET is_active = 0 WHERE id = ?", [
      session.id,
    ]);

    // Generate tokens
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    // Store refresh token in database
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, tokenExpiresAt],
    );

    // Log the admin login in audit logs
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
       VALUES (?, 'admin_login', 'user', ?, ?, ?)`,
      [
        user.id,
        user.id,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent"),
      ],
    );

    console.log("✅ Admin login successful for:", user.email);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        employee_id: user.employee_id,
        specialization: user.specialization,
        profile_picture_url: user.profile_picture_url,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error verifying admin code:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Refresh admin access token
 * POST /api/admin/auth/refresh
 */
export const refreshAdminToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
      return;
    }

    // Verify the refresh token exists in the database
    const [tokenRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, expires_at FROM refresh_tokens WHERE token = ? AND user_id IS NOT NULL",
      [refreshToken],
    );

    if (tokenRows.length === 0) {
      res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const { user_id, expires_at } = tokenRows[0];

    // Check if token is expired
    if (new Date(expires_at) < new Date()) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
      res
        .status(401)
        .json({ success: false, message: "Refresh token expired" });
      return;
    }

    // Get user details
    const [userRows] = await pool.query<(AdminUserData & RowDataPacket)[]>(
      "SELECT id, email, role FROM users WHERE id = ?",
      [user_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = userRows[0];

    // Generate new access token
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("Error refreshing admin token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Admin logout
 * POST /api/admin/auth/logout
 */
export const logoutAdmin: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during admin logout:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Helper function to translate role names to Spanish
 */
function getRoleNameInSpanish(role: string): string {
  const roleTranslations: { [key: string]: string } = {
    admin: "Administrador",
    general_admin: "Administrador General",
    receptionist: "Recepcionista",
    doctor: "Doctor",
  };
  return roleTranslations[role] || role;
}

/**
 * Helper function to send admin verification email
 */
async function sendAdminVerificationEmail(
  email: string,
  userName: string,
  code: number,
  role: string,
): Promise<boolean> {
  try {
    console.log("🔍 Checking SMTP environment variables:");
    console.log("   SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
    console.log("   SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
    console.log("   SMTP_SECURE:", process.env.SMTP_SECURE || "NOT SET");
    console.log("   SMTP_USER:", process.env.SMTP_USER || "NOT SET");
    console.log(
      "   SMTP_PASS:",
      process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET",
    );

    // Use configured SMTP settings (Hostgator)
    const transportConfig = {
      host: process.env.SMTP_HOST || "mail.garbrix.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    console.log("📧 Using configured SMTP settings:");
    console.log("   Host:", transportConfig.host);
    console.log("   Port:", transportConfig.port);
    console.log("   Secure:", transportConfig.secure);
    console.log("   User:", transportConfig.auth.user);

    // Configure email transporter
    console.log("🔧 Creating transporter...");
    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    // Admin email template
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #777; font-size: 12px; padding: 20px; background-color: #f9f9f9; }
          .role-badge { display: inline-block; background: #764ba2; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 Verificación de Inicio de Sesión Admin</h1>
            <p style="margin: 10px 0 0 0;">Panel de Administración All Beauty Luxury & Wellness</p>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Has solicitado iniciar sesión en el Panel de Administración de All Beauty Luxury & Wellness.</p>
            <div style="text-align: center;">
              <span class="role-badge">${getRoleNameInSpanish(role)}</span>
            </div>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tu código de verificación es:</p>
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              ⚠️ <strong>Importante:</strong> Este código expirará en 10 minutos. Si no solicitaste este código, por favor contacta a tu administrador del sistema inmediatamente.
            </div>
            
            <p>Ingresa este código en la página de inicio de sesión de admin para acceder a tu panel.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Este es un mensaje automatizado. Por favor no respondas a este correo.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} All Beauty Luxury & Wellness. Todos los derechos reservados.</p>
            <p style="margin: 5px 0;">Este correo fue enviado a ${email} como verificación de seguridad para acceso administrativo.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📤 Sending email to:", email);
    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} es tu código de verificación de Admin - All Beauty Luxury & Wellness`,
      html: emailBody,
    });
    console.log("✅ Email sent successfully! Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("❌ Error sending admin verification email:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    return false;
  }
}
