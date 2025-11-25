import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import type { RequestHandler } from "express";
import type { DemoResponse } from "../shared/api";
import nodemailer from "nodemailer";
import Stripe from "stripe";

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

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️  WARNING: STRIPE_SECRET_KEY is not configured. Payment processing will fail.",
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// ==================== INLINE ROUTE HANDLERS ====================

/**
 * Demo endpoint handler
 * GET /api/demo
 */
const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};

/**
 * GET /api/services
 * Fetch all active services from the database
 */
const handleGetServices: RequestHandler = async (req, res) => {
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

    // Parse numeric fields since MySQL returns them as strings
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
};

/**
 * GET /api/services/:id
 * Fetch a specific service by ID
 */
const handleGetServiceById: RequestHandler = async (req, res) => {
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
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, phone, firstName, lastName } = req.body;

    // Validation
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query<any[]>(
      "SELECT id FROM patients WHERE email = ? OR phone = ?",
      [email, phone],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Create new user
    const [result] = await pool.query<any>(
      "INSERT INTO patients (email, phone, first_name, last_name, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, phone, firstName, lastName],
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: result.insertId,
        email,
        phone,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/auth/login
 * Login user (passwordless)
 */
const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    // Find user
    const [users] = await pool.query<any[]>(
      "SELECT id, email, phone, first_name, last_name FROM patients WHERE email = ? OR phone = ?",
      [email, phone],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // In a real implementation, you would:
    // 1. Generate and send OTP
    // 2. Store OTP temporarily
    // 3. Return success message

    res.json({
      success: true,
      message: "Login initiated. Check your phone for OTP.",
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/appointments
 * Create a new appointment
 */
const createAppointment: RequestHandler = async (req, res) => {
  try {
    const { patientId, serviceId, appointmentDate, appointmentTime, notes } =
      req.body;

    // Validation
    if (!patientId || !serviceId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, service ID, date, and time are required",
      });
    }

    // Check if service exists
    const [services] = await pool.query<any[]>(
      "SELECT id, name, price, duration_minutes FROM services WHERE id = ? AND is_active = 1",
      [serviceId],
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = services[0];

    // Combine date and time into a timestamp
    const scheduledAt = `${appointmentDate} ${appointmentTime}:00`;

    // Check if time slot is available
    const [conflicts] = await pool.query<any[]>(
      "SELECT id FROM appointments WHERE scheduled_at = ? AND status != 'cancelled'",
      [scheduledAt],
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Create appointment
    const [result] = await pool.query<any>(
      `INSERT INTO appointments 
       (patient_id, service_id, scheduled_at, duration_minutes,
        status, notes, created_by, booked_for_self) 
       VALUES (?, ?, ?, ?, 'scheduled', ?, ?, 1)`,
      [
        patientId,
        serviceId,
        scheduledAt,
        service.duration_minutes,
        notes || null,
        patientId, // created_by is the patient who booked
      ],
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        id: result.insertId,
        patientId,
        serviceId,
        serviceName: service.name,
        scheduled_at: scheduledAt,
        appointmentDate, // Keep for backwards compatibility
        appointmentTime, // Keep for backwards compatibility
        duration_minutes: service.duration_minutes,
        status: "scheduled",
        notes,
      },
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments
 * Get appointments for a user
 */
const getAppointments: RequestHandler = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const [appointments] = await pool.query<any[]>(
      `SELECT 
         a.id, 
         a.scheduled_at,
         DATE(a.scheduled_at) as appointment_date,
         TIME(a.scheduled_at) as appointment_time,
         a.status, 
         a.duration_minutes,
         a.notes,
         s.name as service_name,
         s.duration_minutes as service_duration
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [patientId],
    );

    res.json({
      success: true,
      data: appointments.map((apt) => ({
        ...apt,
        duration_minutes: parseInt(apt.duration_minutes, 10),
        service_duration: parseInt(apt.service_duration, 10),
      })),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/auth/check-user
 * Check if a patient exists by email
 */
const checkUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients WHERE email = ?`,
      [email],
    );

    if (rows.length > 0) {
      res.json({ success: true, exists: true, patient: rows[0] });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    console.error("Error checking patient:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/auth/send-code
 * Send verification code to patient's email
 */
const sendCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendCode endpoint called");
    console.log("   Request body:", req.body);

    const { patient_id, email } = req.body;

    if (!patient_id || !email) {
      console.log("❌ Missing patient_id or email");
      return res.status(400).json({
        success: false,
        message: "Patient ID and email are required",
      });
    }

    console.log("   Patient ID:", patient_id);
    console.log("   Email:", email);

    // Get patient name from DB
    console.log("📊 Querying patient from database...");
    const [patientRows] = await pool.query<any[]>(
      "SELECT first_name, last_name FROM patients WHERE id = ?",
      [patient_id],
    );

    if (patientRows.length === 0) {
      console.log("❌ Patient not found in database");
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
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
        const [existingCodes] = await pool.query<any[]>(
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
    await pool.query(
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
      res.json({
        success: true,
        message: "Verification code sent",
        // Remove this in production - only for testing
        debug_code:
          process.env.NODE_ENV === "development" ? session_code : undefined,
      });
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
 * POST /api/auth/verify-code
 * Verify the code and login the user
 */
const verifyCode: RequestHandler = async (req, res) => {
  try {
    const { patient_id, code } = req.body;

    if (!patient_id || !code) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and code are required",
      });
    }

    // Check if code matches (temporarily ignoring expiration for debugging)
    const [sessions] = await pool.query<any[]>(
      `SELECT id, patient_id, session_code, user_session, user_session_date_start
       FROM users_sessions
       WHERE patient_id = ? AND session_code = ?`,
      [patient_id, code],
    );

    console.log("🔍 Verify Code Debug:");
    console.log("   Looking for patient_id:", patient_id, "code:", code);
    console.log("   Found sessions:", sessions.length);
    if (sessions.length > 0) {
      console.log("   Session data:", sessions[0]);
    }

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid code - no matching session found",
      });
    }

    // Mark session as active
    await pool.query(
      "UPDATE users_sessions SET user_session = 1 WHERE id = ?",
      [sessions[0].id],
    );

    // Update last login and mark email as verified
    await pool.query(
      "UPDATE patients SET last_login = NOW(), is_email_verified = 1 WHERE id = ?",
      [patient_id],
    );

    // Get updated patient data
    const [patients] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patient = patients[0];

    res.json({
      success: true,
      patient: {
        id: patient.id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        role: patient.role,
        is_active: patient.is_active,
        is_email_verified: patient.is_email_verified,
        date_of_birth: patient.date_of_birth,
        created_at: patient.created_at,
        last_login: patient.last_login,
      },
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ success: false, message: "Failed to verify code" });
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
      // Use configured SMTP settings (Hostgator)
      transportConfig = {
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
          .code { font-size: 32px; font-weight: bold; color: #C9A159; text-align: center; padding: 20px; background-color: #f0f0f0; border-radius: 5px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hola ${userName},</h1>
          <p>Tu código de verificación para All Beauty Luxury & Wellness es:</p>
          <div class="code">${code}</div>
          <p>Este código expirará en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
          <div class="footer">
            <p>All Beauty Luxury & Wellness - Tu clínica de confianza</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📤 Sending email to:", email);
    console.log(
      "   From field:",
      process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness" <${process.env.SMTP_USER}>`,
    );
    console.log(
      "   Subject:",
      `${code} es tu código de verificación de All Beauty Luxury & Wellness`,
    );

    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} es tu código de verificación de All Beauty Luxury & Wellness`,
      html: emailBody,
    });

    console.log("✅ Email sent successfully!");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", JSON.stringify(info.response || "No response"));
    console.log("   Envelope:", JSON.stringify(info.envelope || "No envelope"));
    console.log("   Accepted:", JSON.stringify(info.accepted || []));
    console.log("   Rejected:", JSON.stringify(info.rejected || []));

    // If using Ethereal (test mode), log the preview URL
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const previewUrl = nodemailer.getTestMessageUrl(info as any);
      console.log("📬 Preview URL:", previewUrl);
      console.log("🔑 Verification code:", code);
    } else {
      // Production mode - log additional debug info
      console.log("🏭 PRODUCTION EMAIL SENT:");
      console.log("   Production SMTP used: mail.garbrix.com");
      console.log("   Target email:", email);
      console.log("   Patient name:", userName);
      console.log("   Verification code:", code);
      console.log("   Environment check:");
      console.log("     NODE_ENV:", process.env.NODE_ENV);
      console.log("     SMTP_FROM:", process.env.SMTP_FROM || "NOT SET");
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

/**
 * Helper function to send appointment confirmation email
 */
async function sendAppointmentConfirmationEmail(
  email: string,
  patientName: string,
  appointmentDetails: {
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
  },
): Promise<boolean> {
  try {
    console.log("🔍 Sending appointment confirmation email to:", email);

    // Configure email transporter (same as verification email)
    let transportConfig: any;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(
        "⚠️  No SMTP credentials found. Using Ethereal test account...",
      );

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

      console.log("📧 Ethereal test account created for confirmation email");
    } else {
      transportConfig = {
        host: process.env.SMTP_HOST || "mail.garbrix.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      console.log("📧 Using configured SMTP for confirmation email");
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP connection verified for confirmation email");

    // Format date and time for display
    const appointmentDate = new Date(appointmentDetails.date);
    const formattedDate = appointmentDate.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Email template without emojis - using HTML/CSS for better compatibility
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            background-color: #f4f7fa; 
            padding: 20px; 
            line-height: 1.6;
          }
          .container { 
            background-color: #ffffff; 
            border-radius: 12px; 
            padding: 40px; 
            max-width: 600px; 
            margin: 0 auto; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #C9A159 0%, #E8C580 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 10px 0 0 0;
            font-size: 28px;
            font-weight: bold;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background-color: #10b981;
            border-radius: 50%;
            margin: 0 auto 15px;
            position: relative;
          }
          .success-icon::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 35px;
            border: solid white;
            border-width: 0 4px 4px 0;
            transform: translate(-50%, -60%) rotate(45deg);
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 15px;
          }
          .message {
            color: #374151;
            margin-bottom: 25px;
          }
          .details {
            background-color: #f9fafb;
            border-left: 4px solid #C9A159;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .detail-row {
            display: table;
            width: 100%;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            display: table-cell;
            font-weight: bold;
            color: #374151;
            width: 40%;
          }
          .detail-value {
            display: table-cell;
            color: #C9A159;
            font-weight: 600;
            text-align: right;
          }
          .icon-box {
            display: inline-block;
            width: 20px;
            height: 20px;
            background-color: #C9A159;
            border-radius: 3px;
            margin-right: 8px;
            vertical-align: middle;
          }
          .amount-section {
            background-color: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .amount-label {
            font-size: 14px;
            color: #059669;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .amount {
            font-size: 32px;
            color: #059669;
            font-weight: bold;
          }
          .info-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .info-box h3 {
            color: #1e40af;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .info-box p {
            color: #1e3a8a;
            margin: 10px 0;
          }
          .info-icon {
            display: inline-block;
            width: 18px;
            height: 18px;
            background-color: #3b82f6;
            border-radius: 50%;
            margin-right: 8px;
            vertical-align: middle;
            position: relative;
          }
          .info-icon::after {
            content: 'i';
            position: absolute;
            color: white;
            font-weight: bold;
            font-size: 12px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          .contact-info {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .contact-info h3 {
            color: #374151;
            text-align: center;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .contact-item {
            color: #374151;
            margin: 10px 0;
            text-align: center;
          }
          .contact-item strong {
            color: #C9A159;
          }
          .footer { 
            color: #6b7280; 
            font-size: 14px; 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 8px 0;
          }
          .footer-note {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon"></div>
            <h1>Cita Confirmada</h1>
            <p>Tu pago ha sido procesado exitosamente</p>
          </div>
          
          <p class="greeting">Hola <strong>${patientName}</strong>,</p>
          
          <p class="message">
            Nos complace confirmar que tu cita ha sido agendada exitosamente. Tu pago ha sido procesado y tu reserva está confirmada.
          </p>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label"><span class="icon-box"></span> Servicio</span>
              <span class="detail-value">${appointmentDetails.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><span class="icon-box"></span> Fecha</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><span class="icon-box"></span> Hora</span>
              <span class="detail-value">${appointmentDetails.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><span class="icon-box"></span> Duracion</span>
              <span class="detail-value">${appointmentDetails.duration} minutos</span>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-label">MONTO PAGADO</div>
            <div class="amount">$${appointmentDetails.amount.toFixed(2)} MXN</div>
          </div>

          <div class="info-box">
            <h3><span class="info-icon"></span> Informacion Importante</h3>
            <p><strong>Por favor llega 10 minutos antes</strong> de tu cita para completar el registro.</p>
            <p>Si necesitas cancelar o reprogramar tu cita, por favor contactanos con al menos 24 horas de anticipacion.</p>
          </div>

          <div class="contact-info">
            <h3>Necesitas ayuda?</h3>
            <div class="contact-item">Telefono: <strong>+52 1234567890</strong></div>
            <div class="contact-item">Email: <strong>info@hospital.mx</strong></div>
          </div>

          <div class="footer">
            <p><strong>All Beauty Luxury & Wellness</strong></p>
            <p>Tu clinica de confianza para tratamientos de belleza y estetica</p>
            <p class="footer-note">
              Este es un correo automatico, por favor no respondas directamente a este mensaje.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending confirmation email to:", email);

    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Confirmacion de Cita - All Beauty Luxury & Wellness",
      html: emailBody,
    });

    console.log("Confirmation email sent successfully!");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", JSON.stringify(info.response || "No response"));
    console.log("   Accepted:", JSON.stringify(info.accepted || []));
    console.log("   Rejected:", JSON.stringify(info.rejected || []));

    // If using Ethereal (test mode), log the preview URL
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const previewUrl = nodemailer.getTestMessageUrl(info as any);
      console.log("Preview URL:", previewUrl);
    } else {
      // Production mode - log additional debug info
      console.log("PRODUCTION CONFIRMATION EMAIL SENT:");
      console.log("   Target email:", email);
      console.log("   Patient name:", patientName);
      console.log("   Service:", appointmentDetails.serviceName);
      console.log("   Date:", appointmentDetails.date);
      console.log("   Time:", appointmentDetails.time);
    }

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    return false;
  }
}

/**
 * Helper function to send admin verification email
 */
async function sendAdminVerificationEmail(
  email: string,
  adminName: string,
  code: number,
): Promise<boolean> {
  try {
    console.log("🔍 Checking environment variables for admin email:");
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
      // Use configured SMTP settings (Hostgator)
      transportConfig = {
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
    }

    // Configure email transporter
    console.log("🔧 Creating admin transporter...");
    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    // Admin email template (simplified for better deliverability)
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>All Beauty Luxury & Wellness - Acceso Administrativo</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 20px; border: 1px solid #ddd;">
              <h1 style="color: #d32f2f; text-align: center; margin-bottom: 20px;">ACCESO ADMINISTRATIVO</h1>
              
              <p>Hola <strong>${adminName}</strong>,</p>
              
              <p>Se ha solicitado acceso al panel administrativo de All Beauty Luxury & Wellness.</p>
              
              <p><strong>Tu codigo de verificacion es:</strong></p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding: 20px;">
                    <div style="font-size: 28px; font-weight: bold; color: #d32f2f; background-color: #f5f5f5; padding: 15px; border: 2px solid #d32f2f; display: inline-block;">${code}</div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #d32f2f; font-weight: bold;">IMPORTANTE: Este codigo expirara en 10 minutos</p>
              
              <p>Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.</p>
              
              <hr style="border: 1px solid #eee; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #666; text-align: center;">
                All Beauty Luxury & Wellness - Panel Administrativo<br>
                Este es un mensaje automatico del sistema - No responder
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log("📤 Sending admin email to:", email);
    console.log(
      "   From field:",
      process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness Admin" <${process.env.SMTP_USER}>`,
    );
    console.log(
      "   Subject:",
      `${code} - Codigo de acceso administrativo All Beauty Luxury & Wellness`,
    );

    // Plain text version for better deliverability
    const textBody = `
ACCESO ADMINISTRATIVO - ALL BEAUTY LUXURY & WELLNESS

Hola ${adminName},

Se ha solicitado acceso al panel administrativo de All Beauty Luxury & Wellness.

Tu codigo de verificacion es: ${code}

IMPORTANTE: Este codigo expirara en 10 minutos

Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.

---
All Beauty Luxury & Wellness - Panel Administrativo
Este es un mensaje automatico del sistema - No responder
    `;

    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"All Beauty Luxury & Wellness Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} - Codigo de acceso administrativo All Beauty Luxury & Wellness`,
      text: textBody.trim(),
      html: emailBody,
    });

    console.log("✅ Admin email sent successfully!");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", JSON.stringify(info.response || "No response"));
    console.log("   Envelope:", JSON.stringify(info.envelope || "No envelope"));
    console.log("   Accepted:", JSON.stringify(info.accepted || []));
    console.log("   Rejected:", JSON.stringify(info.rejected || []));

    // If using Ethereal (test mode), log the preview URL
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const previewUrl = nodemailer.getTestMessageUrl(info as any);
      console.log("📬 Admin Preview URL:", previewUrl);
      console.log("🔑 Admin Verification code:", code);
    } else {
      // Production mode - log additional debug info
      console.log("🏭 PRODUCTION EMAIL SENT:");
      console.log("   Production SMTP used: mail.garbrix.com");
      console.log("   Target email:", email);
      console.log("   Admin name:", adminName);
      console.log("   Verification code:", code);
      console.log("   Environment check:");
      console.log("     NODE_ENV:", process.env.NODE_ENV);
      console.log("     SMTP_FROM:", process.env.SMTP_FROM || "NOT SET");
    }

    return true;
  } catch (error) {
    console.error("❌ Error sending admin email:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    return false;
  }
}

/**
 * GET /api/business-hours
 * Get business hours
 */
const getBusinessHours: RequestHandler = async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, day_of_week, is_open, open_time, close_time, break_start, break_end, notes, created_at, updated_at 
       FROM business_hours 
       ORDER BY day_of_week ASC`,
    );

    const businessHours = rows.map((row) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      is_open: Boolean(row.is_open),
      open_time: row.open_time,
      close_time: row.close_time,
      break_start: row.break_start || null,
      break_end: row.break_end || null,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json({
      success: true,
      data: businessHours,
    });
  } catch (error) {
    console.error("Error fetching business hours:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch business hours",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/blocked-dates
 * Get blocked dates
 */
const getBlockedDates: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date, page = 1, pageSize = 100 } = req.query;

    let query = `
      SELECT bd.*, 
             u.id as creator_id,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name,
             u.email as creator_email
      FROM blocked_dates bd
      LEFT JOIN users u ON bd.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ` AND bd.end_date >= ?`;
      params.push(start_date);
    } else {
      // Default: only show future blocked dates
      query += ` AND bd.end_date >= CURDATE()`;
    }

    if (end_date) {
      query += ` AND bd.start_date <= ?`;
      params.push(end_date);
    }

    // Get total count for pagination
    const countQuery = query.replace(
      "SELECT bd.*, u.id as creator_id, u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email",
      "SELECT COUNT(*) as total",
    );
    const [countResult] = await pool.query<any[]>(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += ` ORDER BY bd.start_date ASC, bd.start_time ASC`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const [rows] = await pool.query<any[]>(query, params);

    const blockedDates = rows.map((row) => ({
      id: row.id,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      end_time: row.end_time,
      all_day: Boolean(row.all_day),
      reason: row.reason,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: row.creator_id
        ? {
            id: row.creator_id,
            first_name: row.creator_first_name,
            last_name: row.creator_last_name,
            email: row.creator_email,
          }
        : null,
    }));

    res.json({
      success: true,
      data: {
        items: blockedDates,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blocked dates",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/blocked-dates/check
 * Check if a specific date/time is blocked
 */
const checkDateBlocked: RequestHandler = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    let query: string;
    let params: any[];

    if (time) {
      // Check if specific date and time is blocked
      query = `
        SELECT COUNT(*) as count, start_time, end_time, all_day, reason
        FROM blocked_dates
        WHERE ? BETWEEN start_date AND end_date
        AND (
          all_day = 1
          OR (
            all_day = 0
            AND ? >= start_time
            AND ? < end_time
          )
        )
      `;
      params = [date, time, time];
    } else {
      // Check if entire date is blocked (for calendar display)
      query = `
        SELECT COUNT(*) as count
        FROM blocked_dates
        WHERE ? BETWEEN start_date AND end_date
      `;
      params = [date];
    }

    const [rows] = await pool.query<any[]>(query, params);
    const isBlocked = rows[0]?.count > 0;

    res.json({
      success: true,
      data: {
        blocked: isBlocked,
        ...(isBlocked &&
          time && {
            reason: rows[0]?.reason,
            start_time: rows[0]?.start_time,
            end_time: rows[0]?.end_time,
            all_day: Boolean(rows[0]?.all_day),
          }),
      },
    });
  } catch (error) {
    console.error("Error checking blocked date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check blocked date",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/admin/auth/check-user
 * Check if an admin user exists by email
 */
const checkAdminUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, 
              employee_id, specialization, profile_picture_url, created_at, last_login
       FROM users
       WHERE email = ? AND role IN ('admin', 'general_admin', 'receptionist', 'doctor')`,
      [email],
    );

    if (rows.length > 0) {
      if (rows[0].is_active === 0) {
        return res.status(403).json({
          success: false,
          message: "This account has been deactivated",
        });
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
 * POST /api/admin/auth/send-code
 * Send verification code to admin user's email
 */
const sendAdminCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendAdminCode endpoint called");
    console.log("   Request body:", req.body);

    const { user_id, email } = req.body;

    if (!user_id || !email) {
      console.log("❌ Missing user_id or email");
      return res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
    }

    console.log("   User ID:", user_id);
    console.log("   Email:", email);

    // Get admin user name from DB
    console.log("📊 Querying admin user from database...");
    const [userRows] = await pool.query<any[]>(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [user_id],
    );

    if (userRows.length === 0) {
      console.log("❌ Admin user not found in database");
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    const admin_name = `${userRows[0].first_name} ${userRows[0].last_name}`;
    console.log("✅ Admin user found:", admin_name);

    // Generate session code (fixed for test email, random otherwise)
    let session_code: number;
    if (email === "admin@beautyhospital.com") {
      session_code = 123456;
      console.log("🧪 Using test code:", session_code);
    } else {
      // Generate unique code
      let isUnique = false;
      do {
        session_code = Math.floor(100000 + Math.random() * 900000);
        const [existingCodes] = await pool.query<any[]>(
          "SELECT COUNT(*) as count FROM admin_sessions WHERE session_code = ?",
          [session_code],
        );
        isUnique = existingCodes[0].count === 0;
      } while (!isUnique);
      console.log("🔢 Generated unique code:", session_code);
    }

    // Store the code in admin sessions table
    console.log("💾 Inserting session code into database...");
    await pool.query(
      `INSERT INTO admin_sessions (user_id, session_code, is_active, expires_at) 
       VALUES (?, ?, 1, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE 
       session_code = VALUES(session_code), 
       is_active = 1,
       expires_at = VALUES(expires_at)`,
      [user_id, session_code],
    );
    console.log("✅ Session code saved");

    // Send email with verification code
    console.log("📧 Calling sendAdminVerificationEmail...");
    const emailSent = await sendAdminVerificationEmail(
      email,
      admin_name,
      session_code,
    );

    if (emailSent) {
      console.log("✅ Email sent successfully");
      res.json({
        success: true,
        message: "Verification code sent to your email",
        // Remove this in production - only for testing
        debug_code:
          process.env.NODE_ENV === "development" ? session_code : undefined,
      });
    } else {
      console.log("❌ Email sending failed");
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  } catch (error) {
    console.error("❌ Error in sendAdminCode endpoint:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/auth/verify-code
 * Verify the admin code and login
 */
const verifyAdminCode: RequestHandler = async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(400).json({
        success: false,
        message: "User ID and code are required",
      });
    }

    // Check if code is valid
    const [sessions] = await pool.query<any[]>(
      `SELECT * FROM admin_sessions 
       WHERE user_id = ? AND session_code = ? AND is_active = 1 AND expires_at > NOW()`,
      [user_id, code],
    );

    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code",
      });
    }

    // Get admin user info
    const [users] = await pool.query<any[]>(
      `SELECT id, email, first_name, last_name, phone, role, employee_id, specialization 
       FROM users WHERE id = ? AND role IN ('admin', 'general_admin', 'receptionist', 'doctor')`,
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    const user = users[0];

    // Update last login and clear the session
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [
      user_id,
    ]);

    await pool.query(
      `UPDATE admin_sessions SET is_active = 0 WHERE user_id = ?`,
      [user_id],
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        employee_id: user.employee_id,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    console.error("Error verifying admin code:", error);
    res.status(500).json({ success: false, message: "Failed to verify code" });
  }
};

/**
 * GET /api/admin/dashboard/metrics
 * Get dashboard metrics overview
 */
const getDashboardMetrics: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Default to current month if no dates provided
    const startDate =
      start_date ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const endDate = end_date || new Date().toISOString().split("T")[0];

    // Get total appointments
    const [appointmentStats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled
       FROM appointments
       WHERE DATE(scheduled_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get revenue stats
    const [revenueStats] = await pool.query<any[]>(
      `SELECT 
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_amount
       FROM payments
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get new patients count
    const [patientStats] = await pool.query<any[]>(
      `SELECT COUNT(*) as new_patients
       FROM patients
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get active contracts
    const [contractStats] = await pool.query<any[]>(
      `SELECT COUNT(*) as active_contracts
       FROM contracts
       WHERE status IN ('signed', 'pending_signature') AND DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get top services
    const [topServices] = await pool.query<any[]>(
      `SELECT s.name, s.category, COUNT(a.id) as bookings, SUM(p.amount) as revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id AND DATE(a.scheduled_at) BETWEEN ? AND ?
       LEFT JOIN payments p ON a.id = p.appointment_id AND p.payment_status = 'completed'
       GROUP BY s.id
       ORDER BY bookings DESC
       LIMIT 5`,
      [startDate, endDate],
    );

    // Get upcoming appointments for today
    const [upcomingToday] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE DATE(scheduled_at) = CURDATE() AND status IN ('scheduled', 'confirmed')`,
      [],
    );

    res.json({
      success: true,
      data: {
        period: { start_date: startDate, end_date: endDate },
        appointments: appointmentStats[0] || {
          total: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
          scheduled: 0,
        },
        revenue: {
          total_revenue: parseFloat(revenueStats[0]?.total_revenue || 0),
          total_refunds: parseFloat(revenueStats[0]?.total_refunds || 0),
          pending_amount: parseFloat(revenueStats[0]?.pending_amount || 0),
        },
        patients: patientStats[0] || { new_patients: 0 },
        contracts: contractStats[0] || { active_contracts: 0 },
        topServices: topServices || [],
        upcomingToday: upcomingToday[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/revenue-chart
 * Get revenue chart data
 */
const getRevenueChart: RequestHandler = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let dateFormat: string;
    let dateRange: string;

    switch (period) {
      case "week":
        dateFormat = "%Y-%m-%d";
        dateRange = "DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        break;
      case "year":
        dateFormat = "%Y-%m";
        dateRange = "DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
        break;
      default: // month
        dateFormat = "%Y-%m-%d";
        dateRange = "DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    }

    const [revenueData] = await pool.query<any[]>(
      `SELECT 
        DATE_FORMAT(created_at, ?) as date,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as revenue,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as transactions
       FROM payments
       WHERE created_at >= ${dateRange}
       GROUP BY DATE_FORMAT(created_at, ?)
       ORDER BY date ASC`,
      [dateFormat, dateFormat],
    );

    res.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/calendar
 * Get appointments for calendar
 */
const getCalendarAppointments: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.scheduled_at,
        DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as scheduled_date,
        TIME_FORMAT(a.scheduled_at, '%H:%i') as scheduled_time,
        a.duration_minutes,
        a.status,
        a.notes,
        a.check_in_at as checked_in_at,
        a.booking_source,
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        s.id as service_id,
        s.name as service_name,
        s.category as service_category,
        s.price as service_price
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE DATE(a.scheduled_at) BETWEEN ? AND ?
       ORDER BY a.scheduled_at ASC`,
      [start_date, end_date],
    );

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching calendar appointments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity feed
 */
const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Since we might not have audit_logs table, let's create activity from appointments
    const [activities] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.patient_id,
        'appointment_created' as action,
        'appointment' as entity_type,
        a.id as entity_id,
        CONCAT('New appointment created for ', p.first_name, ' ', p.last_name) as description,
        a.created_at
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [parseInt(limit as string)],
    );

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/patients
 * Get all patients with pagination and search
 */
const getAllAdminPatients: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      is_active,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR 
        phone LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (is_active !== undefined) {
      whereClause += " AND is_active = ?";
      queryParams.push(is_active);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM patients WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get patients
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        notes, is_active, is_email_verified, created_at, updated_at, last_login
       FROM patients
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/patients/:id
 * Get patient by ID with full details
 */
const getAdminPatientById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get patient details
    const [patients] = await pool.query<any[]>(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const patient = patients[0];

    // Get appointment history
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, 
              DATE(a.scheduled_at) as appointment_date,
              TIME(a.scheduled_at) as appointment_time,
              DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as appointment_date_formatted,
              TIME_FORMAT(a.scheduled_at, '%H:%i') as appointment_time_formatted,
              s.name as service_name, s.category, s.price
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        patient,
        appointments,
      },
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/patients/:id
 * Update patient information
 */
const updatePatient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined and null values
    const filteredData = Object.entries(updateData).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {} as any,
    );

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Build dynamic SET clause
    const setClause = Object.keys(filteredData)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(filteredData);

    const [result] = await pool.query<any>(
      `UPDATE patients SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Get updated patient
    const [updatedPatient] = await pool.query<any[]>(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: updatedPatient[0],
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/appointments
 * Get all appointments with filters
 */
const getAllAdminAppointments: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      service_id,
      patient_id,
      start_date,
      end_date,
      sort_by = "scheduled_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (status) {
      whereClause += " AND a.status = ?";
      queryParams.push(status);
    }

    if (service_id) {
      whereClause += " AND a.service_id = ?";
      queryParams.push(service_id);
    }

    if (patient_id) {
      whereClause += " AND a.patient_id = ?";
      queryParams.push(patient_id);
    }

    if (start_date) {
      whereClause += " AND DATE(a.scheduled_at) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND DATE(a.scheduled_at) <= ?";
      queryParams.push(end_date);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total 
       FROM appointments a
       WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get appointments with related data
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.*, 
        DATE(a.scheduled_at) as appointment_date,
        TIME(a.scheduled_at) as appointment_time,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.category as service_category,
        s.duration_minutes as service_duration,
        DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as appointment_date_formatted,
        TIME_FORMAT(a.scheduled_at, '%H:%i') as appointment_time_formatted
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching admin appointments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/appointments/:id/status
 * Update appointment status
 */
const updateAppointmentStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = [
      "scheduled",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Update appointment
    const updateFields: string[] = ["status = ?"];
    const updateValues: any[] = [status];

    if (notes !== undefined) {
      updateFields.push("notes = ?");
      updateValues.push(notes);
    }

    updateFields.push("updated_at = NOW()");

    const [result] = await pool.query<any>(
      `UPDATE appointments SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateValues, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Get updated appointment with related data
    const [updatedAppointment] = await pool.query<any[]>(
      `SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        s.name as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      data: updatedAppointment[0],
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/check-in
 * Check in a patient for their appointment
 */
/**
 * POST /api/admin/contracts/create
 * Create a contract for an appointment
 */
const createContract: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      service_id,
      total_amount,
      sessions_included,
      terms_and_conditions,
    } = req.body;

    if (!patient_id || !service_id || !total_amount || !sessions_included) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get patient and service info
    const [patients] = await pool.query<any[]>(
      "SELECT first_name, last_name, email FROM patients WHERE id = ?",
      [patient_id],
    );

    const [services] = await pool.query<any[]>(
      "SELECT name FROM services WHERE id = ?",
      [service_id],
    );

    if (patients.length === 0 || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient or service not found",
      });
    }

    const patient = patients[0];
    const service = services[0];
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Generate contract number
    const contractNumber = `CON-${Date.now()}-${patient_id}`;

    // Create contract in database
    const [result] = await pool.query<any>(
      `INSERT INTO contracts (
        patient_id, service_id, contract_number, status, total_amount,
        sessions_included, terms_and_conditions, created_by, created_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, 1, NOW())`,
      [
        patient_id,
        service_id,
        contractNumber,
        total_amount,
        sessions_included,
        terms_and_conditions || "Términos y condiciones estándar del servicio.",
      ],
    );

    const contractId = result.insertId;

    res.json({
      success: true,
      message: "Contract created successfully",
      data: {
        contract_id: contractId,
        contract_number: contractNumber,
        patient_name: patientName,
        patient_email: patient.email,
        service_name: service.name,
      },
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createContractAndOpenDocuSign: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      patient_name,
      patient_email,
      service_id,
      service_name,
      total_amount,
      sessions_included,
      return_url,
    } = req.body;

    if (!patient_id || !service_id || !total_amount || !sessions_included) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const contractNumber = `CON-${Date.now()}-${patient_id}`;

    const [result] = await pool.query<any>(
      `INSERT INTO contracts (
        patient_id, service_id, contract_number, status, total_amount,
        sessions_included, terms_and_conditions, created_by, created_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, 1, NOW())`,
      [
        patient_id,
        service_id,
        contractNumber,
        total_amount,
        sessions_included,
        "Contract created for DocuSign",
      ],
    );

    const contractId = result.insertId;
    const envelopeId = `ENV-${Date.now()}`;
    const configurationUrl = `https://demo.docusign.net/Signing/StartInSession.aspx?code=${envelopeId}&patient=${encodeURIComponent(patient_name)}&email=${encodeURIComponent(patient_email)}&service=${encodeURIComponent(service_name)}`;

    await pool.query(
      `UPDATE contracts 
       SET status = 'pending_signature',
           docusign_envelope_id = ?,
           docusign_status = 'sent',
           updated_at = NOW()
       WHERE id = ?`,
      [envelopeId, contractId],
    );

    res.json({
      success: true,
      message: "Contract created and DocuSign ready",
      data: {
        contract_id: contractId,
        contract_number: contractNumber,
        envelope_id: envelopeId,
        configuration_url: configurationUrl,
      },
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const openDocuSignForContract: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, patient_email, return_url } = req.body;

    const [contracts] = await pool.query<any[]>(
      `SELECT c.*, 
        p.first_name, p.last_name, p.email,
        s.name as service_name
      FROM contracts c
      JOIN patients p ON c.patient_id = p.id
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];
    const envelopeId = contract.docusign_envelope_id || `ENV-${Date.now()}`;
    const configurationUrl = `https://demo.docusign.net/Signing/StartInSession.aspx?code=${envelopeId}&patient=${encodeURIComponent(patient_name)}&email=${encodeURIComponent(patient_email)}`;

    if (!contract.docusign_envelope_id) {
      await pool.query(
        `UPDATE contracts 
         SET docusign_envelope_id = ?,
             docusign_status = 'sent',
             updated_at = NOW()
         WHERE id = ?`,
        [envelopeId, id],
      );
    }

    res.json({
      success: true,
      message: "DocuSign configuration URL generated",
      data: {
        envelope_id: envelopeId,
        configuration_url: configurationUrl,
      },
    });
  } catch (error) {
    console.error("Error opening DocuSign:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const uploadContractPDF: RequestHandler = async (req, res) => {
  try {
    const { patient_id, service_id, total_amount, sessions_included } =
      req.body;

    if (!patient_id || !service_id || !total_amount || !sessions_included) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const contractNumber = `CON-${Date.now()}-${patient_id}`;
    const pdfUrl = `/uploads/contracts/${contractNumber}.pdf`;

    const [result] = await pool.query<any>(
      `INSERT INTO contracts (
        patient_id, service_id, contract_number, status, total_amount,
        sessions_included, terms_and_conditions, pdf_url, created_by, created_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, 1, NOW())`,
      [
        patient_id,
        service_id,
        contractNumber,
        total_amount,
        sessions_included,
        "PDF Contract",
        pdfUrl,
      ],
    );

    const contractId = result.insertId;

    res.json({
      success: true,
      message: "Contract PDF uploaded successfully",
      data: {
        contract_id: contractId,
        contract_number: contractNumber,
        pdf_url: pdfUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading contract PDF:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const sendContractForSignature: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get contract details
    const [contracts] = await pool.query<any[]>(
      `SELECT c.*, 
        p.first_name, p.last_name, p.email,
        s.name as service_name
      FROM contracts c
      JOIN patients p ON c.patient_id = p.id
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];
    const patientName = `${contract.first_name} ${contract.last_name}`;

    // Note: DocuSign integration requires the docusign-esign package
    // For now, we'll simulate the process
    // To enable: npm install docusign-esign

    // Simulated DocuSign response
    const envelopeId = `ENV-${Date.now()}`;
    const signingUrl = `${process.env.APP_URL || "http://localhost:5000"}/sign/${envelopeId}`;

    // Update contract status
    await pool.query(
      `UPDATE contracts 
       SET status = 'pending_signature',
           docusign_envelope_id = ?,
           docusign_status = 'sent',
           updated_at = NOW()
       WHERE id = ?`,
      [envelopeId, id],
    );

    res.json({
      success: true,
      message: "Contract sent for signature",
      data: {
        envelope_id: envelopeId,
        signing_url: signingUrl,
      },
    });
  } catch (error) {
    console.error("Error sending contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/:id/status
 * Get contract and DocuSign status
 */
const getContractStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [contracts] = await pool.query<any[]>(
      `SELECT c.*, 
        p.first_name, p.last_name, p.email,
        s.name as service_name
      FROM contracts c
      JOIN patients p ON c.patient_id = p.id
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    res.json({
      success: true,
      data: contracts[0],
    });
  } catch (error) {
    console.error("Error getting contract status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/appointment/:appointmentId
 * Get contract for a specific appointment
 */
const getContractByAppointment: RequestHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, c.id as contract_id, c.status as contract_status,
        c.docusign_envelope_id, c.docusign_status, c.signed_at
      FROM appointments a
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.id = ?`,
      [appointmentId],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = appointments[0];

    if (!appointment.contract_id) {
      return res.json({
        success: true,
        data: null,
        message: "No contract associated with this appointment",
      });
    }

    res.json({
      success: true,
      data: {
        contract_id: appointment.contract_id,
        contract_status: appointment.contract_status,
        docusign_envelope_id: appointment.docusign_envelope_id,
        docusign_status: appointment.docusign_status,
        signed_at: appointment.signed_at,
      },
    });
  } catch (error) {
    console.error("Error getting contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/check-in
 * Check in a patient (requires signed contract)
 */
const checkInAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { skip_contract_check } = req.body;

    // Check if appointment exists and is scheduled
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, c.id as contract_id, c.status as contract_status,
        c.docusign_status
      FROM appointments a
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.id = ?`,
      [id],
    );

    if (appointments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot check in cancelled appointment",
      });
    }

    if (appointment.check_in_at) {
      return res.status(400).json({
        success: false,
        message: "Patient already checked in",
      });
    }

    // Check if contract is required and signed
    if (!skip_contract_check) {
      if (!appointment.contract_id) {
        return res.status(400).json({
          success: false,
          message: "Contract required for check-in",
          requires_contract: true,
        });
      }

      if (
        appointment.contract_status !== "signed" &&
        appointment.docusign_status !== "signed" &&
        appointment.docusign_status !== "completed"
      ) {
        return res.status(400).json({
          success: false,
          message: "Contract must be signed before check-in",
          requires_signature: true,
          contract_id: appointment.contract_id,
        });
      }
    }

    // Update appointment
    await pool.query(
      `UPDATE appointments 
       SET status = 'confirmed', 
           check_in_at = NOW(),
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Checked in at: ', NOW()), 
           updated_at = NOW()
       WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Patient checked in successfully",
    });
  } catch (error) {
    console.error("Error checking in appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/cancel
 * Cancel an appointment (admin)
 */
const cancelAdminAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Update appointment
    const [result] = await pool.query<any>(
      `UPDATE appointments 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Cancelled by admin: ', COALESCE(?, 'No reason provided')), 
           updated_at = NOW()
       WHERE id = ?`,
      [cancellation_reason, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/reschedule
 * Reschedule an appointment (admin)
 */
const rescheduleAdminAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, notes } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: "New appointment date and time are required",
      });
    }

    // Combine date and time into timestamp
    const newScheduledAt = `${appointment_date} ${appointment_time}:00`;

    // Check for conflicts
    const [conflicts] = await pool.query<any[]>(
      "SELECT id FROM appointments WHERE scheduled_at = ? AND status != 'cancelled' AND id != ?",
      [newScheduledAt, id],
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Update appointment
    const [result] = await pool.query<any>(
      `UPDATE appointments 
       SET scheduled_at = ?, 
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Rescheduled by admin: ', COALESCE(?, 'No reason provided')), 
           updated_at = NOW()
       WHERE id = ?`,
      [newScheduledAt, notes, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/payments
 * Get all payments with filters
 */
const getAllAdminPayments: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      payment_method,
      start_date,
      end_date,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (status) {
      whereClause += " AND p.payment_status = ?";
      queryParams.push(status);
    }

    if (payment_method) {
      whereClause += " AND p.payment_method = ?";
      queryParams.push(payment_method);
    }

    if (start_date && end_date) {
      whereClause += " AND DATE(p.created_at) BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM payments p WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get payments
    const [payments] = await pool.query<any[]>(
      `SELECT 
        p.*,
        pat.first_name as patient_first_name,
        pat.last_name as patient_last_name,
        pat.email as patient_email,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM payments p
       JOIN patients pat ON p.patient_id = pat.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN users u ON p.processed_by = u.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/payments/:id
 * Get payment by ID
 */
const getAdminPaymentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get appointment details as payment info
    const [payments] = await pool.query<any[]>(
      `SELECT 
        a.*,
        pat.first_name as patient_first_name,
        pat.last_name as patient_last_name,
        pat.email as patient_email,
        pat.phone as patient_phone,
        s.name as service_name,
        s.price as service_price
       FROM appointments a
       JOIN patients pat ON a.patient_id = pat.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id],
    );

    if (payments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.json({
      success: true,
      data: payments[0],
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/payments
 * Create a payment record
 */
const createPayment: RequestHandler = async (req, res) => {
  try {
    const { appointment_id, amount, payment_method, notes } = req.body;

    if (!appointment_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and amount are required",
      });
    }

    // For now, just update the appointment with payment info
    await pool.query(
      `UPDATE appointments 
       SET estimated_price = ?, 
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Payment recorded: ', ?, ' via ', COALESCE(?, 'unknown'), 
           CASE WHEN ? IS NOT NULL THEN CONCAT(' - ', ?) ELSE '' END),
           updated_at = NOW()
       WHERE id = ?`,
      [amount, amount, payment_method, notes, notes, appointment_id],
    );

    res.json({
      success: true,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/payments/:id/status
 * Update payment status
 */
const updatePaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Update appointment with payment status info
    await pool.query(
      `UPDATE appointments 
       SET notes = CONCAT(COALESCE(notes, ''), 
       CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
       'Payment status updated to: ', ?, 
       CASE WHEN ? IS NOT NULL THEN CONCAT(' - ', ?) ELSE '' END),
       updated_at = NOW()
       WHERE id = ?`,
      [status, notes, notes, id],
    );

    res.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/payments/stats
 * Get payment statistics
 */
const getPaymentStats: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = "";
    const params: any[] = [];

    if (start_date && end_date) {
      whereClause = "WHERE DATE(p.created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    const [stats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' OR p.payment_status = 'partially_refunded' THEN COALESCE(p.refund_amount, 0) ELSE 0 END), 0) as refunded_amount,
        COUNT(CASE WHEN p.refund_status = 'pending' THEN 1 END) as pending_refunds
       FROM payments p ${whereClause}`,
      params,
    );

    // Payment methods breakdown
    const [methodBreakdown] = await pool.query<any[]>(
      `SELECT 
        p.payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       ${whereClause}
       GROUP BY p.payment_method`,
      params,
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        payment_methods: methodBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices
 * Get all invoice requests with filters
 */
const getAllInvoiceRequests: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      startDate,
      endDate,
    } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        ir.invoice_number LIKE ? OR 
        ir.rfc LIKE ? OR 
        ir.business_name LIKE ? OR
        p.first_name LIKE ? OR 
        p.last_name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (status) {
      whereClause += " AND ir.status = ?";
      queryParams.push(status);
    }

    if (startDate) {
      whereClause += " AND DATE(ir.created_at) >= ?";
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += " AND DATE(ir.created_at) <= ?";
      queryParams.push(endDate);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total 
       FROM invoice_requests ir 
       WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get invoice requests with related data
    const [invoices] = await pool.query<any[]>(
      `SELECT 
        ir.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        pay.amount as payment_amount,
        pay.payment_method,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN appointments a ON ir.appointment_id = a.id
       INNER JOIN services s ON a.service_id = s.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       LEFT JOIN users u ON ir.processed_by = u.id
       WHERE ${whereClause}
       ORDER BY ir.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: {
        items: invoices.map((invoice) => ({
          ...invoice,
          payment_amount: parseFloat(invoice.payment_amount),
          fiscal_address: JSON.parse(invoice.fiscal_address),
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoice requests:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices/:id
 * Get a specific invoice request by ID
 */
const getInvoiceRequestById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoices] = await pool.query<any[]>(
      `SELECT 
        ir.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        s.description as service_description,
        pay.amount as payment_amount,
        pay.payment_method,
        pay.stripe_payment_id,
        pay.transaction_id,
        pay.processed_at as payment_date,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN appointments a ON ir.appointment_id = a.id
       INNER JOIN services s ON a.service_id = s.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       LEFT JOIN users u ON ir.processed_by = u.id
       WHERE ir.id = ?`,
      [id],
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice request not found",
      });
    }

    const invoice = {
      ...invoices[0],
      payment_amount: parseFloat(invoices[0].payment_amount),
      fiscal_address: JSON.parse(invoices[0].fiscal_address),
    };

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/invoices/:id
 * Update invoice request status, PDFs, or notes
 */
const updateInvoiceRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pdf_url, xml_url, notes, processed_by } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (pdf_url !== undefined) {
      updates.push("pdf_url = ?");
      values.push(pdf_url);
    }

    if (xml_url !== undefined) {
      updates.push("xml_url = ?");
      values.push(xml_url);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }

    if (processed_by) {
      updates.push("processed_by = ?");
      values.push(processed_by);
    }

    // If marking as completed or processing, set processed_at
    if (status === "completed" || status === "processing") {
      updates.push("processed_at = NOW()");
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updates provided",
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE invoice_requests 
       SET ${updates.join(", ")}
       WHERE id = ?`,
      values,
    );

    // Fetch updated invoice
    const [invoices] = await pool.query<any[]>(
      `SELECT ir.*, 
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       WHERE ir.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Invoice request updated successfully",
      data: {
        ...invoices[0],
        fiscal_address: JSON.parse(invoices[0].fiscal_address),
      },
    });
  } catch (error) {
    console.error("Error updating invoice request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices/stats
 * Get invoice statistics
 */
const getInvoiceStats: RequestHandler = async (req, res) => {
  try {
    const [stats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
       FROM invoice_requests`,
    );

    // Get recent requests
    const [recentRequests] = await pool.query<any[]>(
      `SELECT 
        ir.id,
        ir.invoice_number,
        ir.status,
        ir.created_at,
        p.first_name,
        p.last_name,
        pay.amount
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       ORDER BY ir.created_at DESC
       LIMIT 5`,
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        recent_requests: recentRequests.map((req) => ({
          ...req,
          amount: parseFloat(req.amount),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/coupons
 * Get all coupons
 */
const getAllCoupons: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", is_active } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (c.code LIKE ? OR c.description LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (is_active !== undefined) {
      whereClause += " AND c.is_active = ?";
      queryParams.push(is_active);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM coupons c WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get coupons with creator info
    const [coupons] = await pool.query<any[]>(
      `SELECT 
        c.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name
       FROM coupons c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: {
        items: coupons.map((coupon) => ({
          ...coupon,
          discount_value: parseFloat(coupon.discount_value),
          min_purchase_amount: coupon.min_purchase_amount
            ? parseFloat(coupon.min_purchase_amount)
            : null,
          max_discount_amount: coupon.max_discount_amount
            ? parseFloat(coupon.max_discount_amount)
            : null,
          applicable_services: coupon.applicable_services
            ? JSON.parse(coupon.applicable_services)
            : null,
          is_active: Boolean(coupon.is_active),
          creator_name:
            coupon.creator_first_name && coupon.creator_last_name
              ? `${coupon.creator_first_name} ${coupon.creator_last_name}`
              : null,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/coupons
 * Create coupon
 */
const createCoupon: RequestHandler = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      is_active = true,
      applicable_services,
      created_by, // Admin user ID
    } = req.body;

    // Validation
    if (
      !code ||
      !discount_type ||
      discount_value === undefined ||
      !created_by
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: code, discount_type, discount_value, created_by",
      });
    }

    if (!["percentage", "fixed_amount"].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be 'percentage' or 'fixed_amount'",
      });
    }

    if (
      discount_type === "percentage" &&
      (discount_value < 0 || discount_value > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    if (discount_value < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be positive",
      });
    }

    // Check if code already exists
    const [existingCoupon] = await pool.query<any[]>(
      "SELECT id FROM coupons WHERE code = ?",
      [code.toUpperCase()],
    );

    if (existingCoupon.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Create coupon
    const [result] = await pool.query<any>(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value,
        min_purchase_amount, max_discount_amount, usage_limit,
        per_user_limit, valid_from, valid_until, is_active,
        applicable_services, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        code.toUpperCase(),
        description || null,
        discount_type,
        discount_value,
        min_purchase_amount || null,
        max_discount_amount || null,
        usage_limit || null,
        per_user_limit || null,
        valid_from || new Date(),
        valid_until || null,
        is_active ? 1 : 0,
        applicable_services ? JSON.stringify(applicable_services) : null,
        created_by,
      ],
    );

    // Get created coupon
    const [newCoupon] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: {
        ...newCoupon[0],
        discount_value: parseFloat(newCoupon[0].discount_value),
        min_purchase_amount: newCoupon[0].min_purchase_amount
          ? parseFloat(newCoupon[0].min_purchase_amount)
          : null,
        max_discount_amount: newCoupon[0].max_discount_amount
          ? parseFloat(newCoupon[0].max_discount_amount)
          : null,
        applicable_services: newCoupon[0].applicable_services
          ? JSON.parse(newCoupon[0].applicable_services)
          : null,
        is_active: Boolean(newCoupon[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/coupons/:id
 * Update coupon
 */
const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      is_active,
      applicable_services,
    } = req.body;

    // Check if coupon exists
    const [existing] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Validate discount_type if provided
    if (
      discount_type &&
      !["percentage", "fixed_amount"].includes(discount_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be 'percentage' or 'fixed_amount'",
      });
    }

    // Validate percentage discount
    if (
      discount_type === "percentage" &&
      discount_value !== undefined &&
      (discount_value < 0 || discount_value > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    // Validate discount value
    if (discount_value !== undefined && discount_value < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be positive",
      });
    }

    // Check if new code conflicts with existing coupons
    if (code && code.toUpperCase() !== existing[0].code) {
      const [codeConflict] = await pool.query<any[]>(
        "SELECT id FROM coupons WHERE code = ? AND id != ?",
        [code.toUpperCase(), id],
      );

      if (codeConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (code !== undefined) {
      updates.push("code = ?");
      values.push(code.toUpperCase());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (discount_type !== undefined) {
      updates.push("discount_type = ?");
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push("discount_value = ?");
      values.push(discount_value);
    }
    if (min_purchase_amount !== undefined) {
      updates.push("min_purchase_amount = ?");
      values.push(min_purchase_amount);
    }
    if (max_discount_amount !== undefined) {
      updates.push("max_discount_amount = ?");
      values.push(max_discount_amount);
    }
    if (usage_limit !== undefined) {
      updates.push("usage_limit = ?");
      values.push(usage_limit);
    }
    if (per_user_limit !== undefined) {
      updates.push("per_user_limit = ?");
      values.push(per_user_limit);
    }
    if (valid_from !== undefined) {
      updates.push("valid_from = ?");
      values.push(valid_from);
    }
    if (valid_until !== undefined) {
      updates.push("valid_until = ?");
      values.push(valid_until);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (applicable_services !== undefined) {
      updates.push("applicable_services = ?");
      values.push(
        applicable_services ? JSON.stringify(applicable_services) : null,
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated coupon
    const [updatedCoupon] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: {
        ...updatedCoupon[0],
        discount_value: parseFloat(updatedCoupon[0].discount_value),
        min_purchase_amount: updatedCoupon[0].min_purchase_amount
          ? parseFloat(updatedCoupon[0].min_purchase_amount)
          : null,
        max_discount_amount: updatedCoupon[0].max_discount_amount
          ? parseFloat(updatedCoupon[0].max_discount_amount)
          : null,
        applicable_services: updatedCoupon[0].applicable_services
          ? JSON.parse(updatedCoupon[0].applicable_services)
          : null,
        is_active: Boolean(updatedCoupon[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/coupons/:id
 * Delete coupon
 */
const deleteCoupon: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const [existing] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Check if coupon has been used
    const [usageCheck] = await pool.query<any[]>(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?",
      [id],
    );

    if (usageCheck[0].count > 0) {
      // If coupon has been used, soft delete by deactivating it
      await pool.query(
        "UPDATE coupons SET is_active = 0, updated_at = NOW() WHERE id = ?",
        [id],
      );

      return res.json({
        success: true,
        message: "Coupon has been used and was deactivated instead of deleted",
      });
    }

    // Hard delete if never used
    await pool.query("DELETE FROM coupons WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/business-hours
 * Get admin business hours (same as regular but for admin panel)
 */
const getAdminBusinessHours: RequestHandler = async (req, res) => {
  try {
    const [hours] = await pool.query<any[]>(
      "SELECT * FROM business_hours ORDER BY day_of_week",
    );

    res.json({
      success: true,
      data: hours,
    });
  } catch (error) {
    console.error("Error fetching admin business hours:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/business-hours
 * Update business hours
 */
const updateBusinessHours: RequestHandler = async (req, res) => {
  try {
    const { hours } = req.body;

    if (!Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        message: "Hours array is required",
      });
    }

    // Update each day's hours
    for (const hour of hours) {
      await pool.query(
        `UPDATE business_hours 
         SET is_open = ?, open_time = ?, close_time = ?
         WHERE day_of_week = ?`,
        [hour.is_open, hour.open_time, hour.close_time, hour.day_of_week],
      );
    }

    res.json({
      success: true,
      message: "Business hours updated successfully",
    });
  } catch (error) {
    console.error("Error updating business hours:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings
 * Get all settings
 */
const getSettings: RequestHandler = async (req, res) => {
  try {
    const [settings] = await pool.query<any[]>(
      `SELECT * FROM settings ORDER BY category, setting_key`,
    );

    // Group by category
    const grouped = settings.reduce((acc: any, setting) => {
      const category = setting.category || "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/:key
 * Update a setting
 */
const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    await pool.query(
      `UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?`,
      [setting_value, key],
    );

    res.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/content-pages
 * Get all content pages
 */
const getContentPages: RequestHandler = async (req, res) => {
  try {
    const [pages] = await pool.query<any[]>(
      `SELECT p.*, 
              c.first_name as created_by_first_name,
              c.last_name as created_by_last_name,
              u.first_name as updated_by_first_name,
              u.last_name as updated_by_last_name
       FROM content_pages p
       LEFT JOIN users c ON p.created_by = c.id
       LEFT JOIN users u ON p.updated_by = u.id
       ORDER BY p.created_at DESC`,
    );

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Error fetching content pages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/content-pages
 * Create content page
 */
const createContentPage: RequestHandler = async (req, res) => {
  try {
    const { slug, title, content, is_published } = req.body;
    const userId = (req as any).adminUser?.id || null;

    const [result] = await pool.query<any>(
      `INSERT INTO content_pages (slug, title, content, is_published, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [slug, title, content, is_published ? 1 : 0, userId],
    );

    res.json({
      success: true,
      message: "Content page created successfully",
      page_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/content-pages/:id
 * Update content page
 */
const updateContentPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_published } = req.body;
    const userId = (req as any).adminUser?.id || null;

    await pool.query(
      `UPDATE content_pages SET
        title = ?,
        content = ?,
        is_published = ?,
        updated_by = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [title, content, is_published ? 1 : 0, userId, id],
    );

    res.json({
      success: true,
      message: "Content page updated successfully",
    });
  } catch (error) {
    console.error("Error updating content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/content-pages/:id
 * Delete content page
 */
const deleteContentPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>(
      "DELETE FROM content_pages WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Content page not found" });
    }

    res.json({
      success: true,
      message: "Content page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users
 * Get all admin users
 */
const getAdminUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, employee_id,
              specialization, is_active, is_email_verified, created_at, last_login
       FROM users
       WHERE role IN ('admin', 'general_admin', 'receptionist', 'doctor')
       ORDER BY created_at DESC`,
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users/:id
 * Get admin user by ID
 */
const getAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, employee_id,
              specialization, is_active, is_email_verified, created_at, last_login
       FROM users
       WHERE id = ?`,
      [id],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/users
 * Create admin user
 */
const createAdminUser: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      role,
      first_name,
      last_name,
      phone,
      employee_id,
      specialization,
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      });
    }

    // Check if email already exists
    const [existingUsers] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // For admin users, we set an empty password_hash as they use code-based authentication
    const [result] = await pool.query<any>(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, employee_id, specialization, is_active, created_at, updated_at)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [email, role, first_name, last_name, phone, employee_id, specialization],
    );

    res.json({
      success: true,
      message:
        "Admin user created successfully. They will receive login instructions via email.",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/admin/settings/users/:id
 * Update admin user
 */
const updateAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, employee_id, specialization, role } =
      req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (employee_id !== undefined) {
      updates.push("employee_id = ?");
      values.push(employee_id);
    }
    if (specialization !== undefined) {
      updates.push("specialization = ?");
      values.push(specialization);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const [result] = await pool.query<any>(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/admin/settings/users/:id/toggle-active
 * Toggle admin user active status
 */
const toggleAdminUserActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "User status toggled successfully",
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/users/:id
 * Delete admin user
 */
const deleteAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>("DELETE FROM users WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/admin/settings/users/:id/reset-access
 * Reset admin user access (send new login code)
 */
const resetAdminUserAccess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would generate and send a new access code
    res.json({
      success: true,
      message: "Access reset instructions have been sent to the user's email",
    });
  } catch (error) {
    console.error("Error resetting user access:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users/:id/activity
 * Get admin user activity
 */
const getAdminUserActivity: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get recent appointments created by this user
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, s.name as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.created_by = ?
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [id],
    );

    // Get recent medical records added by this user
    const [medicalRecords] = await pool.query<any[]>(
      `SELECT mr.*, p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.doctor_id = ?
       ORDER BY mr.created_at DESC
       LIMIT 10`,
      [id],
    );

    res.json({
      success: true,
      data: {
        appointments,
        medicalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/blocked-dates
 * Get admin blocked dates
 */
const getAdminBlockedDates: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 100, start_date, end_date } = req.query;

    let query = `
      SELECT bd.*, 
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM blocked_dates bd
      LEFT JOIN users u ON bd.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ` AND bd.end_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND bd.start_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY bd.start_date ASC`;
    query += ` LIMIT ? OFFSET ?`;
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const [dates] = await pool.query<any[]>(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM blocked_dates bd WHERE 1=1`;
    const countParams: any[] = [];
    if (start_date) {
      countQuery += ` AND bd.end_date >= ?`;
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND bd.start_date <= ?`;
      countParams.push(end_date);
    }

    const [countRows] = await pool.query<any[]>(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    res.json({
      success: true,
      data: {
        items: dates,
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching admin blocked dates:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/blocked-dates
 * Create blocked date
 */
const createBlockedDate: RequestHandler = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Get user ID from request (assuming it's set by auth middleware)
    const userId = (req as any).adminUser?.id || null;

    await pool.query(
      `INSERT INTO blocked_dates (start_date, end_date, start_time, end_time, all_day, reason, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        all_day ? 1 : 0,
        reason,
        notes,
        userId,
      ],
    );

    res.json({
      success: true,
      message: "Blocked date created successfully",
    });
  } catch (error) {
    console.error("Error creating blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/blocked-dates/:id
 * Update blocked date
 */
const updateBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const [result] = await pool.query<any>(
      `UPDATE blocked_dates 
       SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, all_day = ?, reason = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        all_day ? 1 : 0,
        reason,
        notes,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blocked date not found" });
    }

    res.json({
      success: true,
      message: "Blocked date updated successfully",
    });
  } catch (error) {
    console.error("Error updating blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/blocked-dates/:id
 * Delete blocked date
 */
const deleteBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>(
      "DELETE FROM blocked_dates WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blocked date not found" });
    }

    res.json({
      success: true,
      message: "Blocked date deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/appointments/book-with-payment
 * Create a new appointment with payment processing
 * This combines appointment creation, patient creation (if needed), and Stripe payment
 */
const bookAppointmentWithPayment: RequestHandler = async (req, res) => {
  try {
    console.log("📝 Book appointment with payment request:", {
      body: req.body,
    });

    const {
      patient_id,
      patient_info,
      service_id,
      scheduled_at,
      duration_minutes,
      notes,
      booked_for_self = true,
      selected_areas,
      accepted_terms = true, // Default to true since we don't have UI for this in simple version
      accepted_privacy = true, // Default to true since we don't have UI for this in simple version
      payment_amount,
      currency = "mxn",
    } = req.body;

    // Validate required fields
    if (!service_id || !scheduled_at || !payment_amount) {
      return res.status(400).json({
        success: false,
        error: "service_id, scheduled_at, and payment_amount are required",
      });
    }

    // Validate terms acceptance
    if (!accepted_terms || !accepted_privacy) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions and privacy policy",
      });
    }

    // Determine the patient_id for the appointment
    let finalPatientId: number;

    if (patient_id) {
      // Use provided patient_id
      finalPatientId = patient_id;
    } else if (patient_info) {
      // Create new patient record or reuse existing one
      const { first_name, last_name, email, phone, date_of_birth } =
        patient_info;

      if (!first_name || !last_name || !email || !phone) {
        return res.status(400).json({
          success: false,
          error:
            "Patient info must include first_name, last_name, email, and phone",
        });
      }

      // Check if patient with this email already exists
      const [existingPatients] = await pool.query<any[]>(
        "SELECT id FROM patients WHERE email = ?",
        [email],
      );

      if (existingPatients.length > 0) {
        // Patient already exists - use their existing ID
        finalPatientId = existingPatients[0].id;
        console.log(
          `♻️  Reusing existing patient with email ${email}, ID: ${finalPatientId}`,
        );
      } else {
        // Patient doesn't exist - create new patient record
        const [patientResult] = await pool.query<any>(
          `INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, role, is_active)
           VALUES (?, ?, ?, ?, ?, 'patient', 1)`,
          [first_name, last_name, email, phone, date_of_birth || null],
        );

        finalPatientId = patientResult.insertId;
        console.log(
          `✨ Created new patient with email ${email}, ID: ${finalPatientId}`,
        );
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Either patient_id or patient_info must be provided",
      });
    }

    console.log("💰 Creating appointment for patient ID:", finalPatientId);

    // Verify patient exists
    const [patientRows] = await pool.query<any[]>(
      "SELECT id, email, first_name, last_name FROM patients WHERE id = ?",
      [finalPatientId],
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    console.log("✅ Patient verified:", patientRows[0].email);

    // Get service details
    const [serviceRows] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ? AND is_active = 1",
      [service_id],
    );

    if (serviceRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    const service = serviceRows[0];
    const appointmentDuration = duration_minutes || service.duration_minutes;

    // Don't check for overlaps here - frontend already filters booked slots
    // Only check for overlaps in confirmPayment to handle race conditions

    // Create Stripe payment intent with all booking details in metadata
    // Don't create appointment yet - only create it after payment succeeds
    const amountInCents = Math.round(payment_amount * 100); // Convert to cents

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          patient_id: finalPatientId.toString(),
          service_id: service_id.toString(),
          scheduled_at: scheduled_at,
          duration_minutes: appointmentDuration.toString(),
          notes: notes || "",
          created_by: finalPatientId.toString(),
          booked_for_self: booked_for_self ? "1" : "0",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (stripeError: any) {
      console.error("Stripe payment intent creation failed:", stripeError);
      return res.status(500).json({
        success: false,
        error:
          "Failed to create payment intent. Please check Stripe configuration.",
        details: stripeError.message,
      });
    }

    // Don't create payment record yet - only create after payment is confirmed
    // This prevents pending payments cluttering the database

    res.json({
      success: true,
      message:
        "Payment intent created. Complete payment to confirm appointment.",
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: payment_amount,
        payment_intent_id: paymentIntent.id,
      },
    });
  } catch (error: any) {
    console.error("Error booking appointment with payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      message: "Internal server error",
    });
  }
};

/**
 * POST /api/appointments/confirm-payment
 * Confirm a Stripe payment and create the appointment
 */
const confirmPayment: RequestHandler = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: "payment_intent_id is required",
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment has not been completed",
      });
    }

    // Get booking details from metadata
    const {
      patient_id,
      service_id,
      scheduled_at,
      duration_minutes,
      notes,
      created_by,
      booked_for_self,
    } = paymentIntent.metadata;

    if (!patient_id || !service_id || !scheduled_at || !duration_minutes) {
      return res.status(400).json({
        success: false,
        error: "Missing booking information in payment metadata",
      });
    }

    // **CRITICAL: Re-check slot availability before creating appointment**
    // This prevents race conditions where payment was initiated but slot was taken during checkout
    const scheduledDate = new Date(scheduled_at);
    const scheduledEndTime = new Date(
      scheduledDate.getTime() + parseInt(duration_minutes) * 60000,
    );

    console.log("🔍 Checking slot availability:", {
      scheduled_at,
      scheduled_end: scheduledEndTime.toISOString(),
      duration_minutes,
    });

    const [overlapping] = await pool.query<any[]>(
      `SELECT id, scheduled_at, duration_minutes, status 
       FROM appointments 
       WHERE service_id = ?
       AND status IN ('confirmed', 'scheduled', 'in_progress')
       AND (
         (scheduled_at <= ? AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?) OR
         (scheduled_at < ? AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) >= ?) OR
         (scheduled_at >= ? AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) <= ?)
       )`,
      [
        service_id,
        scheduled_at,
        scheduled_at,
        scheduledEndTime.toISOString().slice(0, 19).replace("T", " "),
        scheduledEndTime.toISOString().slice(0, 19).replace("T", " "),
        scheduled_at,
        scheduledEndTime.toISOString().slice(0, 19).replace("T", " "),
      ],
    );

    if (overlapping.length > 0) {
      // Slot was taken by someone else - refund the payment
      console.error("❌ Time slot conflict during payment confirmation:", {
        requested_time: scheduled_at,
        overlapping_appointments: overlapping,
      });

      try {
        await stripe.refunds.create({
          payment_intent: payment_intent_id,
          reason: "requested_by_customer",
        });
        console.log(
          `💸 Refunded payment ${payment_intent_id} - slot no longer available`,
        );
      } catch (refundError) {
        console.error("Error creating refund:", refundError);
      }

      return res.status(409).json({
        success: false,
        error:
          "Lo sentimos, este horario ya fue reservado. Tu pago será reembolsado automáticamente.",
      });
    }

    // Create the appointment with confirmed status
    const [appointmentResult] = await pool.query<any>(
      `INSERT INTO appointments 
       (patient_id, service_id, scheduled_at, duration_minutes, notes, status, created_by, booked_for_self)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
      [
        patient_id,
        service_id,
        scheduled_at,
        duration_minutes,
        notes || null,
        created_by || patient_id,
        booked_for_self === "1" ? 1 : 0,
      ],
    );

    const appointmentId = appointmentResult.insertId;

    console.log("✅ Appointment created successfully:", appointmentId);

    // Create payment record now that payment is confirmed and appointment is created
    // Note: Both stripe_payment_id and stripe_payment_intent_id store the payment intent ID
    await pool.query(
      `INSERT INTO payments 
       (appointment_id, patient_id, amount, payment_method, payment_status, stripe_payment_id, stripe_payment_intent_id, processed_by, processed_at, created_at, updated_at)
       VALUES (?, ?, ?, 'stripe', 'completed', ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        appointmentId,
        patient_id,
        (paymentIntent.amount / 100).toFixed(2),
        payment_intent_id,
        payment_intent_id,
        created_by || patient_id,
      ],
    );

    console.log("💰 Payment record created for appointment:", appointmentId);

    // Fetch appointment details for email
    const [appointmentDetails] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.scheduled_at,
        a.duration_minutes,
        s.name as service_name,
        s.price as service_price,
        p.first_name,
        p.last_name,
        p.email
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [appointmentId],
    );

    // Send confirmation email
    if (appointmentDetails.length > 0) {
      const appointment = appointmentDetails[0];
      const patientName = `${appointment.first_name} ${appointment.last_name}`;
      const scheduledDate = new Date(appointment.scheduled_at);
      const appointmentDate = scheduledDate.toISOString().split("T")[0];
      const appointmentTime = scheduledDate
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);

      try {
        await sendAppointmentConfirmationEmail(appointment.email, patientName, {
          serviceName: appointment.service_name,
          date: appointmentDate,
          time: appointmentTime,
          duration: appointment.duration_minutes,
          amount: parseFloat(appointment.service_price),
        });
        console.log("📧 Confirmation email sent to:", appointment.email);
      } catch (emailError) {
        console.error(
          "⚠️ Failed to send confirmation email, but appointment was created:",
          emailError,
        );
        // Don't fail the request if email fails - appointment is already confirmed
      }
    }

    res.json({
      success: true,
      message: "Payment confirmed and appointment scheduled",
      data: {
        appointment_id: appointmentId,
        appointmentId: appointmentId,
        status: "confirmed",
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllServicesAdmin: RequestHandler = async (req, res) => {
  // Reuse the existing services handler but with admin privileges
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, description, category, price, duration_minutes, is_active, created_at, updated_at 
       FROM services ORDER BY category, name`,
    );

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
    console.error("Error fetching admin services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const createService: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration_minutes,
      is_active = true,
    } = req.body;

    // Validation
    if (!name || !category || price === undefined || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, category, price, duration_minutes",
      });
    }

    const validCategories = [
      "laser_hair_removal",
      "facial_treatment",
      "body_treatment",
      "consultation",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const [result] = await pool.query<any>(
      `INSERT INTO services (
        name, 
        description, 
        category, 
        price, 
        duration_minutes, 
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        description || null,
        category,
        price,
        duration_minutes,
        is_active ? 1 : 0,
      ],
    );

    const [newService] = await pool.query<any[]>(
      `SELECT * FROM services WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        ...newService[0],
        price: parseFloat(newService[0].price),
        duration_minutes: parseInt(newService[0].duration_minutes, 10),
        is_active: Boolean(newService[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const updateService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, duration_minutes, is_active } =
      req.body;

    // Check if service exists
    const [existing] = await pool.query<any[]>(
      `SELECT id FROM services WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "laser_hair_removal",
        "facial_treatment",
        "body_treatment",
        "consultation",
        "other",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      values.push(price);
    }
    if (duration_minutes !== undefined) {
      updates.push("duration_minutes = ?");
      values.push(duration_minutes);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE services SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated service
    const [updatedService] = await pool.query<any[]>(
      `SELECT * FROM services WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      data: {
        ...updatedService[0],
        price: parseFloat(updatedService[0].price),
        duration_minutes: parseInt(updatedService[0].duration_minutes, 10),
        is_active: Boolean(updatedService[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const deleteService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const [existing] = await pool.query<any[]>(
      `SELECT id FROM services WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check if service is being used in appointments
    const [appointments] = await pool.query<any[]>(
      `SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND status NOT IN ('cancelled', 'completed')`,
      [id],
    );

    if (appointments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete service with active appointments. Deactivate it instead.",
      });
    }

    // Soft delete by setting is_active to false
    await pool.query(
      `UPDATE services SET is_active = 0, updated_at = NOW() WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Service deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments/:id
 * Get a specific appointment by ID
 */
const getAppointmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await pool.query<any[]>(
      `SELECT 
         a.id, 
         a.scheduled_at,
         DATE(a.scheduled_at) as appointment_date,
         TIME(a.scheduled_at) as appointment_time,
         a.status, 
         a.duration_minutes,
         a.notes,
         a.created_at,
         s.name as service_name,
         s.duration_minutes as service_duration,
         p.first_name,
         p.last_name,
         p.email,
         p.phone
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = {
      ...appointments[0],
      duration_minutes: parseInt(appointments[0].duration_minutes, 10),
      service_duration: parseInt(appointments[0].service_duration, 10),
    };

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/appointments/:id
 * Update an appointment
 */
const updateAppointmentHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, scheduled_at, notes, status } =
      req.body;

    // Check if appointment exists
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    // Handle scheduling update
    if (scheduled_at) {
      updates.push("scheduled_at = ?");
      values.push(scheduled_at);
    } else if (appointment_date && appointment_time) {
      // Convert separate date/time to timestamp for backwards compatibility
      const scheduledTimestamp = `${appointment_date} ${appointment_time}:00`;
      updates.push("scheduled_at = ?");
      values.push(scheduledTimestamp);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({
      success: true,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * DELETE /api/appointments/:id
 * Cancel an appointment
 */
const cancelAppointmentHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query<any[]>(
      "SELECT id, status FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (existing[0].status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    await pool.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments/booked-slots
 * Get booked time slots for a specific date
 * This is used to show unavailable time slots in the appointment booking wizard
 */
const getBookedTimeSlots: RequestHandler = async (req, res) => {
  try {
    const { date, service_id } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "date parameter is required",
      });
    }

    // Build query to fetch appointments for the given date
    let query = `
      SELECT 
        a.id,
        a.scheduled_at,
        a.duration_minutes,
        s.duration_minutes as service_duration
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE DATE(a.scheduled_at) = ?
      AND a.status IN ('scheduled', 'confirmed')
    `;
    const params: any[] = [date];

    // Optionally filter by service_id
    if (service_id) {
      query += ` AND a.service_id = ?`;
      params.push(service_id);
    }

    query += ` ORDER BY a.scheduled_at`;

    const [rows] = await pool.query<any[]>(query, params);

    // Transform the results into time slots
    const bookedSlots = rows.map((row) => {
      const scheduledAt = new Date(row.scheduled_at);
      const hours = scheduledAt.getHours().toString().padStart(2, "0");
      const minutes = scheduledAt.getMinutes().toString().padStart(2, "0");
      const startTime = `${hours}:${minutes}`;

      // Use appointment duration or service duration
      const duration = row.duration_minutes || row.service_duration || 60;

      return {
        start_time: startTime,
        duration_minutes: duration,
        appointment_id: row.id,
      };
    });

    res.json({
      success: true,
      data: {
        date,
        service_id: service_id ? Number(service_id) : null,
        booked_slots: bookedSlots,
      },
    });
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch booked time slots",
    });
  }
};

/**
 * POST /api/auth/create-user
 * Create a new user (from passwordless auth)
 */
const createUser: RequestHandler = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, date_of_birth } = req.body;

    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      });
    }

    // Check if user already exists
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM patients WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new patient
    const [result] = await pool.query<any>(
      `INSERT INTO patients (email, first_name, last_name, phone, date_of_birth, role, created_at) 
       VALUES (?, ?, ?, ?, ?, 'patient', NOW())`,
      [email, first_name, last_name, phone, date_of_birth],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.insertId,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Helper function to verify patient session
 */
async function verifyPatientSession(patientId: number): Promise<boolean> {
  try {
    const [sessions] = await pool.query<any[]>(
      `SELECT id FROM users_sessions 
       WHERE patient_id = ? 
       AND user_session = 1 
       AND user_session_date_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [patientId],
    );
    return sessions.length > 0;
  } catch (error) {
    console.error("Error verifying session:", error);
    return false;
  }
}

/**
 * GET /api/patient/appointments
 * Get all appointments for the logged-in patient
 */
const getPatientAppointments: RequestHandler = async (req, res) => {
  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get all appointments for this patient (both as patient and created_by)
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.patient_id,
        a.service_id,
        a.status,
        a.scheduled_at,
        a.duration_minutes,
        a.notes,
        a.created_by,
        a.booked_for_self,
        a.created_at,
        a.updated_at,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.category as service_category,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        py.id as payment_id,
        py.amount as payment_amount,
        py.payment_status,
        py.payment_method
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN payments py ON py.appointment_id = a.id
      WHERE a.created_by = ? OR a.patient_id = ?
      ORDER BY a.scheduled_at DESC`,
      [patient_id, patient_id],
    );

    // Format appointments with categorization
    const now = new Date();
    const formattedAppointments = appointments.map((apt) => {
      const scheduledDate = new Date(apt.scheduled_at);
      const isPast = scheduledDate < now;
      const isUpcoming =
        scheduledDate >= now &&
        apt.status !== "cancelled" &&
        apt.status !== "completed";

      return {
        id: apt.id,
        patient_id: apt.patient_id,
        service: {
          id: apt.service_id,
          name: apt.service_name,
          description: apt.service_description,
          price: parseFloat(apt.service_price),
          category: apt.service_category,
        },
        status: apt.status,
        scheduled_at: apt.scheduled_at,
        duration_minutes: apt.duration_minutes,
        notes: apt.notes,
        booked_for_self: Boolean(apt.booked_for_self),
        patient: {
          first_name: apt.first_name,
          last_name: apt.last_name,
          email: apt.email,
          phone: apt.phone,
        },
        payment: apt.payment_id
          ? {
              id: apt.payment_id,
              amount: parseFloat(apt.payment_amount),
              status: apt.payment_status,
              method: apt.payment_method,
            }
          : null,
        is_past: isPast,
        is_upcoming: isUpcoming,
        can_cancel: isUpcoming,
        can_edit: isUpcoming && apt.status === "scheduled",
        created_at: apt.created_at,
        updated_at: apt.updated_at,
      };
    });

    res.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        upcoming: formattedAppointments.filter((a) => a.is_upcoming),
        past: formattedAppointments.filter((a) => a.is_past),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/patient/appointments/:id/cancel
 * Cancel an appointment with refund penalization logic
 */
const cancelPatientAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, cancellation_reason } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, p.amount, p.payment_status, p.id as payment_id
       FROM appointments a
       LEFT JOIN payments p ON p.appointment_id = a.id
       WHERE a.id = ? AND a.created_by = ?`,
      [id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to cancel it",
      });
    }

    const appointment = appointments[0];

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Check if appointment is in the past
    const scheduledDate = new Date(appointment.scheduled_at);
    const now = new Date();
    if (scheduledDate < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past appointments",
      });
    }

    // Calculate time difference (in hours)
    const hoursUntilAppointment =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine refund eligibility (>24 hours = full refund, <24 hours = no refund)
    const refundEligible = hoursUntilAppointment > 24;
    const refundAmount =
      refundEligible && appointment.amount ? parseFloat(appointment.amount) : 0;

    // Update appointment status
    await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), '\nCancelled by patient: ', COALESCE(?, 'No reason provided'), '\nCancellation time: ', NOW())
       WHERE id = ?`,
      [cancellation_reason, id],
    );

    // Handle refund if applicable
    let refundProcessed = false;
    if (
      refundEligible &&
      appointment.payment_id &&
      appointment.payment_status === "completed"
    ) {
      try {
        // Update payment status to refunded
        await pool.query(
          `UPDATE payments 
           SET payment_status = 'refunded', 
               notes = CONCAT(COALESCE(notes, ''), '\nRefund issued: Full refund due to cancellation >24hrs before appointment')
           WHERE id = ?`,
          [appointment.payment_id],
        );
        refundProcessed = true;
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        // Continue even if refund fails - appointment is still cancelled
      }
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        appointment_id: id,
        cancelled_at: new Date().toISOString(),
        refund_eligible: refundEligible,
        refund_amount: refundAmount,
        refund_processed: refundProcessed,
        hours_notice: Math.floor(hoursUntilAppointment),
        penalization_applied: !refundEligible,
        penalization_message: !refundEligible
          ? "No refund available - cancellation made less than 24 hours before appointment"
          : null,
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/patient/appointments/:id/reschedule
 * Reschedule an appointment to a new date/time
 */
const reschedulePatientAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, new_date, new_time } = req.body;

    if (!patient_id || !new_date || !new_time) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, new date, and new time are required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT * FROM appointments 
       WHERE id = ? AND created_by = ?`,
      [id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to reschedule it",
      });
    }

    const appointment = appointments[0];

    // Check if can be rescheduled
    if (
      appointment.status === "cancelled" ||
      appointment.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${appointment.status} appointments`,
      });
    }

    // Validate new date/time is in the future
    const newScheduledAt = `${new_date} ${new_time}:00`;
    const newDateTime = new Date(newScheduledAt);
    const now = new Date();

    if (newDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "New appointment time must be in the future",
      });
    }

    // Check if new time slot is available
    const [conflicts] = await pool.query<any[]>(
      `SELECT id FROM appointments 
       WHERE scheduled_at = ? 
       AND status IN ('scheduled', 'confirmed') 
       AND id != ?`,
      [newScheduledAt, id],
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "The selected time slot is not available",
      });
    }

    // Check if date/time is blocked
    const [blockedDates] = await pool.query<any[]>(
      `SELECT reason FROM blocked_dates
       WHERE ? BETWEEN start_date AND end_date
       AND (
         all_day = 1
         OR (
           all_day = 0
           AND ? >= start_time
           AND ? < end_time
         )
       )`,
      [new_date, new_time, new_time],
    );

    if (blockedDates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The selected time is not available. Reason: ${blockedDates[0].reason}`,
      });
    }

    // Update appointment
    const oldScheduledAt = appointment.scheduled_at;
    await pool.query(
      `UPDATE appointments 
       SET scheduled_at = ?, 
           notes = CONCAT(COALESCE(notes, ''), '\nRescheduled from ', ?, ' to ', ?, ' at ', NOW())
       WHERE id = ?`,
      [newScheduledAt, oldScheduledAt, newScheduledAt, id],
    );

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: {
        appointment_id: id,
        old_scheduled_at: oldScheduledAt,
        new_scheduled_at: newScheduledAt,
        rescheduled_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/patient/appointments/:id/request-invoice
 * Request invoice generation for an appointment
 */
const requestInvoice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, invoice_info } = req.body;

    if (!patient_id || !invoice_info) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and invoice information are required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment and payment details
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.*, 
        s.name as service_name, 
        s.price as service_price,
        p.id as payment_id,
        p.amount,
        p.payment_status,
        p.payment_method,
        p.transaction_id,
        pat.first_name,
        pat.last_name,
        pat.email,
        pat.phone
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN payments p ON p.appointment_id = a.id
       LEFT JOIN patients pat ON a.patient_id = pat.id
       WHERE a.id = ? AND a.created_by = ?`,
      [id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to request invoice",
      });
    }

    const appointment = appointments[0];

    // Check if payment exists and is completed
    if (!appointment.payment_id || appointment.payment_status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Invoice can only be generated for completed payments",
      });
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${id}`;

    // Insert invoice request into database
    const [result] = await pool.query(
      `INSERT INTO invoice_requests (
        appointment_id,
        patient_id,
        payment_id,
        invoice_number,
        rfc,
        business_name,
        cfdi_use,
        payment_method,
        payment_type,
        fiscal_address,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        patient_id,
        appointment.payment_id,
        invoiceNumber,
        invoice_info.rfc,
        invoice_info.businessName,
        invoice_info.cfdiUse,
        invoice_info.paymentMethod,
        invoice_info.paymentType,
        JSON.stringify(invoice_info.fiscalAddress),
      ],
    );

    res.json({
      success: true,
      message: "Invoice request received successfully",
      data: {
        invoice_request_id: (result as any).insertId,
        invoice_number: invoiceNumber,
        appointment_id: id,
        payment_id: appointment.payment_id,
        amount: parseFloat(appointment.amount),
        service_name: appointment.service_name,
        invoice_info: invoice_info,
        requested_at: new Date().toISOString(),
        status: "pending",
        // In production, this would be the PDF URL
        pdf_url: null,
        note: "Invoice generation is being processed. You will receive it via email shortly.",
      },
    });
  } catch (error) {
    console.error("Error requesting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/patient/profile
 * Update patient profile information
 */
const updatePatientProfile: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      state,
      zip_code,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (date_of_birth !== undefined) {
      updates.push("date_of_birth = ?");
      values.push(date_of_birth);
    }
    if (gender !== undefined) {
      updates.push("gender = ?");
      values.push(gender);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      values.push(address);
    }
    if (city !== undefined) {
      updates.push("city = ?");
      values.push(city);
    }
    if (state !== undefined) {
      updates.push("state = ?");
      values.push(state);
    }
    if (zip_code !== undefined) {
      updates.push("zip_code = ?");
      values.push(zip_code);
    }
    if (emergency_contact_name !== undefined) {
      updates.push("emergency_contact_name = ?");
      values.push(emergency_contact_name);
    }
    if (emergency_contact_phone !== undefined) {
      updates.push("emergency_contact_phone = ?");
      values.push(emergency_contact_phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add updated_at
    updates.push("updated_at = NOW()");
    values.push(patient_id);

    // Execute update
    await pool.query(
      `UPDATE patients SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated patient data
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        is_active, created_at, updated_at
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: patients[0],
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/patient/profile
 * Get patient profile information
 */
const getPatientProfile: RequestHandler = async (req, res) => {
  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get patient data
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        is_active, is_email_verified, last_login, created_at, updated_at
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patients[0],
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

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
        message: "All Beauty Luxury & Wellness API is running",
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

  // ==================== CONFIGURE API ROUTES ====================

  // Demo routes
  expressApp.get("/api/demo", handleDemo);

  // Services routes
  expressApp.get("/api/services", handleGetServices);
  expressApp.get("/api/services/:id", handleGetServiceById);

  // Auth routes
  expressApp.post("/api/auth/register", handleRegister);
  expressApp.post("/api/auth/login", handleLogin);

  // Passwordless Auth routes
  expressApp.post("/api/auth/check-user", checkUser);
  expressApp.post("/api/auth/send-code", sendCode);
  expressApp.post("/api/auth/verify-code", verifyCode);
  expressApp.post("/api/auth/create-user", createUser);

  // Appointment routes (specific routes first, then parameterized routes)
  expressApp.get("/api/appointments/booked-slots", getBookedTimeSlots);
  expressApp.post(
    "/api/appointments/book-with-payment",
    bookAppointmentWithPayment,
  );
  expressApp.post("/api/appointments/confirm-payment", confirmPayment);
  expressApp.post("/api/appointments", createAppointment);
  expressApp.get("/api/appointments", getAppointments);
  expressApp.get("/api/appointments/:id", getAppointmentById);
  expressApp.put("/api/appointments/:id", updateAppointmentHandler);
  expressApp.delete("/api/appointments/:id", cancelAppointmentHandler);

  // Business Hours routes
  expressApp.get("/api/business-hours", getBusinessHours);

  // Blocked Dates routes
  expressApp.get("/api/blocked-dates", getBlockedDates);
  expressApp.get("/api/blocked-dates/check", checkDateBlocked);

  // ==================== PATIENT ROUTES ====================
  // Patient Appointments
  expressApp.get("/api/patient/appointments", getPatientAppointments);
  expressApp.patch(
    "/api/patient/appointments/:id/cancel",
    cancelPatientAppointment,
  );
  expressApp.patch(
    "/api/patient/appointments/:id/reschedule",
    reschedulePatientAppointment,
  );
  expressApp.post(
    "/api/patient/appointments/:id/request-invoice",
    requestInvoice,
  );

  // Patient Profile
  expressApp.get("/api/patient/profile", getPatientProfile);
  expressApp.put("/api/patient/profile", updatePatientProfile);

  // ==================== ADMIN ROUTES ====================
  // Admin Auth
  expressApp.post("/api/admin/auth/check-user", checkAdminUser);
  expressApp.post("/api/admin/auth/send-code", sendAdminCode);
  expressApp.post("/api/admin/auth/verify-code", verifyAdminCode);

  // Admin Dashboard
  expressApp.get("/api/admin/dashboard/stats", getDashboardMetrics);
  expressApp.get("/api/admin/dashboard/metrics", getDashboardMetrics);
  expressApp.get("/api/admin/dashboard/revenue-chart", getRevenueChart);
  expressApp.get("/api/admin/dashboard/activity", getRecentActivity);
  expressApp.get("/api/admin/dashboard/calendar", getCalendarAppointments);

  // Admin Services
  expressApp.get("/api/admin/services", getAllServicesAdmin);
  expressApp.post("/api/admin/services", createService);
  expressApp.put("/api/admin/services/:id", updateService);
  expressApp.delete("/api/admin/services/:id", deleteService);

  // Admin Patient Management
  expressApp.get("/api/admin/patients", getAllAdminPatients);
  expressApp.get("/api/admin/patients/:id", getAdminPatientById);
  expressApp.patch("/api/admin/patients/:id", updatePatient);

  // Admin Appointment Management
  expressApp.get("/api/admin/appointments", getAllAdminAppointments);
  expressApp.patch(
    "/api/admin/appointments/:id/status",
    updateAppointmentStatus,
  );
  expressApp.post("/api/admin/appointments/:id/check-in", checkInAppointment);
  expressApp.post("/api/admin/appointments/:id/cancel", cancelAdminAppointment);
  expressApp.post(
    "/api/admin/appointments/:id/reschedule",
    rescheduleAdminAppointment,
  );

  // Admin Contract Management
  expressApp.post("/api/admin/contracts/create", createContract);
  expressApp.post(
    "/api/admin/contracts/create-and-configure",
    createContractAndOpenDocuSign,
  );
  expressApp.post(
    "/api/admin/contracts/:id/open-docusign",
    openDocuSignForContract,
  );
  expressApp.post(
    "/api/admin/contracts/:id/send-for-signature",
    sendContractForSignature,
  );
  expressApp.get("/api/admin/contracts/:id/status", getContractStatus);
  expressApp.get(
    "/api/admin/contracts/appointment/:appointmentId",
    getContractByAppointment,
  );

  // Admin Payment Management
  expressApp.get("/api/admin/payments/stats", getPaymentStats);
  expressApp.get("/api/admin/payments", getAllAdminPayments);
  expressApp.get("/api/admin/payments/:id", getAdminPaymentById);
  expressApp.post("/api/admin/payments", createPayment);
  expressApp.patch("/api/admin/payments/:id/status", updatePaymentStatus);

  // Admin Invoice Management
  expressApp.get("/api/admin/invoices/stats", getInvoiceStats);
  expressApp.get("/api/admin/invoices", getAllInvoiceRequests);
  expressApp.get("/api/admin/invoices/:id", getInvoiceRequestById);
  expressApp.patch("/api/admin/invoices/:id", updateInvoiceRequest);

  // Admin Settings Management
  expressApp.get("/api/admin/settings/coupons", getAllCoupons);
  expressApp.post("/api/admin/settings/coupons", createCoupon);
  expressApp.put("/api/admin/settings/coupons/:id", updateCoupon);
  expressApp.delete("/api/admin/settings/coupons/:id", deleteCoupon);
  expressApp.get("/api/admin/settings", getSettings);
  expressApp.put("/api/admin/settings/:key", updateSetting);
  expressApp.get("/api/admin/settings/content-pages", getContentPages);
  expressApp.post("/api/admin/settings/content-pages", createContentPage);
  expressApp.put("/api/admin/settings/content-pages/:id", updateContentPage);
  expressApp.delete("/api/admin/settings/content-pages/:id", deleteContentPage);
  expressApp.get("/api/admin/settings/users", getAdminUsers);
  expressApp.get("/api/admin/settings/users/:id", getAdminUser);
  expressApp.post("/api/admin/settings/users", createAdminUser);
  expressApp.put("/api/admin/settings/users/:id", updateAdminUser);
  expressApp.patch(
    "/api/admin/settings/users/:id/toggle-active",
    toggleAdminUserActive,
  );
  expressApp.delete("/api/admin/settings/users/:id", deleteAdminUser);
  expressApp.post(
    "/api/admin/settings/users/:id/reset-access",
    resetAdminUserAccess,
  );
  expressApp.get(
    "/api/admin/settings/users/:id/activity",
    getAdminUserActivity,
  );
  expressApp.get("/api/admin/settings/business-hours", getAdminBusinessHours);
  expressApp.post("/api/admin/settings/business-hours", updateBusinessHours);
  expressApp.get("/api/admin/blocked-dates", getAdminBlockedDates);
  expressApp.post("/api/admin/blocked-dates", createBlockedDate);
  expressApp.put("/api/admin/blocked-dates/:id", updateBlockedDate);
  expressApp.delete("/api/admin/blocked-dates/:id", deleteBlockedDate);

  // Payment Processing
  expressApp.post(
    "/api/appointments/book-with-payment",
    bookAppointmentWithPayment,
  );

  // 404 handler - only for API routes
  expressApp.use("/api", (_req, res, next) => {
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

// Export createServer for development use
export { createServer };

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
