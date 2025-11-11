import { RequestHandler } from "express";
import { ResultSetHeader } from "mysql2";
import db from "../db/connection";
import Stripe from "stripe";
import type {
  CreateAppointmentWithPaymentRequest,
  ApiResponse,
  StripePaymentResponse,
} from "@shared/api";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️  WARNING: STRIPE_SECRET_KEY is not configured. Payment processing will fail.",
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

/**
 * POST /api/appointments/book-with-payment
 * Create a new appointment with payment processing
 * This combines appointment creation, patient creation (if needed), and Stripe payment
 */
export const bookAppointmentWithPayment: RequestHandler = async (req, res) => {
  try {
    console.log("📝 Book appointment with payment request:", {
      body: req.body,
      userId: req.user?.id,
    });

    const {
      patient_id,
      service_id,
      scheduled_at,
      duration_minutes,
      notes,
      booked_for_self,
      selected_areas,
      accepted_terms,
      accepted_privacy,
      payment_amount,
      currency = "mxn",
    } = req.body as CreateAppointmentWithPaymentRequest;

    const userId = req.user?.id;

    if (!userId) {
      console.error("❌ No authenticated user");
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    // Validate required fields
    if (!service_id || !scheduled_at || !payment_amount) {
      const response: ApiResponse = {
        success: false,
        error: "service_id, scheduled_at, and payment_amount are required",
      };
      return res.status(400).json(response);
    }

    // Validate terms acceptance
    if (!accepted_terms || !accepted_privacy) {
      const response: ApiResponse = {
        success: false,
        error: "You must accept the terms and conditions and privacy policy",
      };
      return res.status(400).json(response);
    }

    // Use userId as patient_id if not provided (booking for self)
    const effectivePatientId = patient_id || userId;

    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // If no patient_id provided, find or create patient record for this user
      let finalPatientId = patient_id;

      if (!patient_id) {
        // Check if patient record exists for this user
        const [existingPatients] = await connection.query<any[]>(
          "SELECT id FROM patients WHERE user_id = ?",
          [userId],
        );

        if (existingPatients.length > 0) {
          finalPatientId = existingPatients[0].id;
          console.log("✅ Found existing patient record:", finalPatientId);
        } else {
          // Get user details to create patient record
          const [userRows] = await connection.query<any[]>(
            "SELECT first_name, last_name, email, phone FROM users WHERE id = ?",
            [userId],
          );

          if (userRows.length === 0) {
            await connection.rollback();
            connection.release();
            const response: ApiResponse = {
              success: false,
              error: "User not found",
            };
            return res.status(404).json(response);
          }

          const user = userRows[0];

          // Create patient record
          const [patientResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO patients 
            (user_id, first_name, last_name, email, phone, date_of_birth, is_active)
            VALUES (?, ?, ?, ?, ?, '1990-01-01', 1)`,
            [userId, user.first_name, user.last_name, user.email, user.phone],
          );

          finalPatientId = patientResult.insertId;
          console.log("✅ Created new patient record:", finalPatientId);
        }
      }

      // Get service details
      const [serviceRows] = await connection.query<any[]>(
        "SELECT * FROM services WHERE id = ? AND is_active = 1",
        [service_id],
      );

      if (serviceRows.length === 0) {
        await connection.rollback();
        const response: ApiResponse = {
          success: false,
          error: "Service not found",
        };
        return res.status(404).json(response);
      }

      const service = serviceRows[0];
      const appointmentDuration = duration_minutes || service.duration_minutes;

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment_amount * 100), // Convert to cents
        currency: currency,
        metadata: {
          user_id: userId.toString(),
          patient_id: finalPatientId.toString(),
          service_id: service_id.toString(),
          service_name: service.name,
          scheduled_at: scheduled_at,
          duration_minutes: appointmentDuration.toString(),
          notes: notes || "",
          booked_for_self: booked_for_self ? "true" : "false",
          selected_areas: selected_areas?.join(", ") || "",
        },
        description: `Appointment for ${service.name}`,
      });

      // Store payment intent temporarily (no appointment created yet)
      // Payment record will link to appointment after payment is confirmed
      const [paymentResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO payments 
        (appointment_id, patient_id, amount, payment_method, payment_status, stripe_payment_intent_id, processed_by)
        VALUES (NULL, ?, ?, 'stripe', 'pending', ?, ?)`,
        [finalPatientId, payment_amount, paymentIntent.id, userId],
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      const response: StripePaymentResponse = {
        clientSecret: paymentIntent.client_secret || "",
        paymentId: paymentResult.insertId,
        paymentIntentId: paymentIntent.id,
      };

      res.json({
        success: true,
        data: response,
        message:
          "Payment intent created. Complete payment to create appointment.",
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    console.error("Error creating appointment with payment:", error);
    const response: ApiResponse = {
      success: false,
      error: error.message || "Failed to create appointment",
    };
    res.status(500).json(response);
  }
};

/**
 * POST /api/appointments/confirm-payment
 * Confirm payment and create appointment
 */
export const confirmAppointmentPayment: RequestHandler = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    if (!payment_intent_id) {
      const response: ApiResponse = {
        success: false,
        error: "payment_intent_id is required",
      };
      return res.status(400).json(response);
    }

    // Verify payment with Stripe
    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      const response: ApiResponse = {
        success: false,
        error: "Payment not completed",
      };
      return res.status(400).json(response);
    }

    // Get payment metadata to create appointment
    const metadata = paymentIntent.metadata;
    const patientId = parseInt(metadata.patient_id);
    const serviceId = parseInt(metadata.service_id);
    const scheduledAt = metadata.scheduled_at;
    const durationMinutes = parseInt(metadata.duration_minutes);
    const notes = metadata.notes || null;
    const bookedForSelf = metadata.booked_for_self === "true";

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create appointment record with confirmed status
      const [appointmentResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO appointments 
        (patient_id, service_id, status, scheduled_at, duration_minutes, notes, booked_for_self, created_by)
        VALUES (?, ?, 'confirmed', ?, ?, ?, ?, ?)`,
        [
          patientId,
          serviceId,
          scheduledAt,
          durationMinutes,
          notes,
          bookedForSelf ? 1 : 0,
          userId,
        ],
      );

      const appointmentId = appointmentResult.insertId;

      // Update payment record with appointment_id and mark as completed
      await connection.query(
        `UPDATE payments 
         SET appointment_id = ?,
             payment_status = 'completed', 
             stripe_payment_id = ?,
             processed_at = NOW()
         WHERE stripe_payment_intent_id = ?`,
        [appointmentId, paymentIntent.id, payment_intent_id],
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      // TODO: Send confirmation email and WhatsApp notification

      const response: ApiResponse = {
        success: true,
        message: "Payment confirmed and appointment created",
        data: { appointmentId },
      };
      res.json(response);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    const response: ApiResponse = {
      success: false,
      error: error.message || "Failed to confirm payment",
    };
    res.status(500).json(response);
  }
};
