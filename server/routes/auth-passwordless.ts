import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import nodemailer from "nodemailer";
import { generateToken, generateRefreshToken } from "../utils/auth";

// Types for request bodies
interface CheckPatientRequest {
  email: string;
}

interface SendCodeRequest {
  patient_id: number;
  email: string;
}

interface VerifyCodeRequest {
  patient_id: number;
  code: number;
}

interface CreatePatientRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
}

// Response types
interface PatientData {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  is_email_verified: number;
  date_of_birth: string | null;
  created_at: string;
  last_login: string | null;
}

interface SessionData {
  id: number;
  patient_id: number;
  session_code: number;
  user_session: number;
  user_session_date_start: string;
}

/**
 * Check if a patient exists by email
 * POST /api/auth/check-user
 */
export const checkUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as CheckPatientRequest;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const [rows] = await pool.query<(PatientData & RowDataPacket)[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients
       WHERE email = ?`,
      [email],
    );

    if (rows.length > 0) {
      res.json({ success: true, exists: true, patient: rows[0] });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    console.error("Error checking patient:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Send verification code to patient's email
 * POST /api/auth/send-code
 */
export const sendCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendCode endpoint called");
    console.log("   Request body:", req.body);

    const { patient_id, email } = req.body as SendCodeRequest;

    if (!patient_id || !email) {
      console.log("❌ Missing patient_id or email");
      res
        .status(400)
        .json({ success: false, message: "Patient ID and email are required" });
      return;
    }

    console.log("   Patient ID:", patient_id);
    console.log("   Email:", email);

    // Get patient name from DB
    console.log("📊 Querying patient from database...");
    const [patientRows] = await pool.query<(PatientData & RowDataPacket)[]>(
      "SELECT first_name, last_name FROM patients WHERE id = ?",
      [patient_id],
    );

    if (patientRows.length === 0) {
      console.log("❌ Patient not found in database");
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    const patient_name = `${patientRows[0].first_name} ${patientRows[0].last_name}`;
    console.log("✅ Patient found:", patient_name);

    // Delete old session codes for this patient
    console.log("🗑️  Deleting old session codes...");
    await pool.query("DELETE FROM users_sessions WHERE patient_id = ?", [
      patient_id,
    ]);

    // Generate session code (fixed for test email, random otherwise)
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
          "SELECT COUNT(*) as count FROM users_sessions WHERE session_code = ?",
          [session_code],
        );
        isUnique = existingCodes[0].count === 0;
      } while (!isUnique);
      console.log("🔢 Generated unique code:", session_code);
    }

    // Insert new session code
    console.log("💾 Inserting session code into database...");
    const date_start = new Date();
    await pool.query<ResultSetHeader>(
      `INSERT INTO users_sessions (patient_id, session_code, user_session, user_session_date_start)
       VALUES (?, ?, 0, ?)`,
      [patient_id, session_code, date_start],
    );
    console.log("✅ Session code saved");

    // Send email with verification code
    console.log("📧 Calling sendVerificationEmail...");
    const emailSent = await sendVerificationEmail(
      email,
      patient_name,
      session_code,
    );

    if (emailSent) {
      console.log("✅ Email sent successfully");
      res.json({ success: true, message: "Verification code sent" });
    } else {
      console.log("❌ Email sending failed");
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  } catch (error) {
    console.error("❌ Error in sendCode endpoint:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Verify the code entered by patient
 * POST /api/auth/verify-code
 */
export const verifyCode: RequestHandler = async (req, res) => {
  try {
    const { patient_id, code } = req.body as VerifyCodeRequest;

    if (!patient_id || !code) {
      res
        .status(400)
        .json({ success: false, message: "Patient ID and code are required" });
      return;
    }

    // Check if code is valid (within last 10 minutes)
    const [sessionRows] = await pool.query<(SessionData & RowDataPacket)[]>(
      `SELECT id, patient_id, session_code, user_session
       FROM users_sessions
       WHERE patient_id = ? AND session_code = ? 
       AND user_session_date_start > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [patient_id, code],
    );

    if (sessionRows.length === 0) {
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired code" });
      return;
    }

    // Mark session as active
    await pool.query(
      "UPDATE users_sessions SET user_session = 1 WHERE id = ?",
      [sessionRows[0].id],
    );

    // Update last login and mark email as verified
    await pool.query(
      "UPDATE patients SET last_login = NOW(), is_email_verified = 1 WHERE id = ?",
      [patient_id],
    );

    // Get updated patient data
    const [patientRows] = await pool.query<(PatientData & RowDataPacket)[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients
       WHERE id = ?`,
      [patient_id],
    );

    // Generate JWT token
    const token = generateToken({
      id: patientRows[0].id,
      email: patientRows[0].email,
      role: "patient" as any,
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken({
      id: patientRows[0].id,
      email: patientRows[0].email,
      role: "patient" as any,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(
      `INSERT INTO refresh_tokens (patient_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [patient_id, refreshToken, expiresAt],
    );

    res.json({
      success: true,
      patient: patientRows[0],
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create a new patient account
 * POST /api/auth/create-user
 */
export const createUser: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { email, first_name, last_name, phone, date_of_birth } =
      req.body as CreatePatientRequest;

    if (!email || !first_name || !last_name) {
      res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      });
      return;
    }

    await connection.beginTransaction();

    // Check if patient already exists
    const [existingPatients] = await connection.query<
      (PatientData & RowDataPacket)[]
    >(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients
       WHERE email = ? FOR UPDATE`,
      [email],
    );

    if (existingPatients.length > 0) {
      await connection.commit();
      res.json({ success: true, exists: true, patient: existingPatients[0] });
      return;
    }

    // Create new patient (no password_hash for passwordless auth)
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO patients (email, role, first_name, last_name, phone, date_of_birth, is_active)
       VALUES (?, 'patient', ?, ?, ?, ?, 1)`,
      [email, first_name, last_name, phone || null, date_of_birth || null],
    );

    const newPatientId = result.insertId;

    // Get the created patient data
    const [newPatientRows] = await connection.query<
      (PatientData & RowDataPacket)[]
    >(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients
       WHERE id = ?`,
      [newPatientId],
    );

    await connection.commit();

    res.json({
      success: true,
      exists: false,
      patient: newPatientRows[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating patient:", error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    });
  } finally {
    connection.release();
  }
};

/**
 * Helper function to send verification email
 */
async function sendVerificationEmail(
  email: string,
  userName: string,
  code: number,
): Promise<boolean> {
  try {
    console.log("🔍 Checking environment variables:");
    console.log("   SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
    console.log("   SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
    console.log("   SMTP_SECURE:", process.env.SMTP_SECURE || "NOT SET");
    console.log("   SMTP_USER:", process.env.SMTP_USER || "NOT SET");
    console.log(
      "   SMTP_PASS:",
      process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET",
    );

    // For development/testing without SMTP config, use Ethereal test account
    let transportConfig: any;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(
        "⚠️  No SMTP credentials found. Using Ethereal test account...",
      );

      // Create test account on the fly (for development only)
      const testAccount = await nodemailer.createTestAccount();

      transportConfig = {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      };

      console.log("📧 Ethereal test account created:");
      console.log("   User:", testAccount.user);
      console.log("   Pass:", testAccount.pass);
    } else {
      // Use configured SMTP settings
      console.log("📧 Using configured SMTP settings:");
      console.log("   Host:", process.env.SMTP_HOST);
      console.log("   Port:", process.env.SMTP_PORT);
      console.log("   Secure:", process.env.SMTP_SECURE);
      console.log("   User:", process.env.SMTP_USER);

      transportConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
    }

    // Configure email transporter
    console.log("🔧 Creating transporter...");
    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    // Email template
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .code { font-size: 32px; font-weight: bold; color: #6366f1; text-align: center; padding: 20px; background-color: #f0f0f0; border-radius: 5px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hola ${userName},</h1>
          <p>Tu código de verificación para Beauty Hospital es:</p>
          <div class="code">${code}</div>
          <p>Este código expirará en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
          <div class="footer">
            <p>Beauty Hospital - Tu clínica de confianza</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📤 Sending email to:", email);
    const info = await transporter.sendMail({
      from: `"Beauty Hospital" <${process.env.SMTP_USER || "noreply@beautyhospital.com"}>`,
      to: email,
      subject: `${code} es tu código de verificación de Beauty Hospital`,
      html: emailBody,
    });
    console.log("✅ Email sent successfully! Message ID:", info.messageId);

    // If using Ethereal (test mode), log the preview URL
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const previewUrl = nodemailer.getTestMessageUrl(info as any);
      console.log("📬 Preview URL:", previewUrl);
      console.log("🔑 Verification code:", code);
    }

    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    return false;
  }
}
