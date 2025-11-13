import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Check in a patient for their appointment
 * POST /api/admin/appointments/:id/check-in
 */
export const checkInAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Check if appointment exists and is scheduled
    const [appointments] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    if (appointments.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      res
        .status(400)
        .json({
          success: false,
          message: "Cannot check in cancelled appointment",
        });
      return;
    }

    if (appointment.check_in_at) {
      res
        .status(400)
        .json({ success: false, message: "Patient already checked in" });
      return;
    }

    // Update appointment
    await pool.query(
      `UPDATE appointments 
       SET check_in_at = NOW(), check_in_by = ?, status = 'confirmed'
       WHERE id = ?`,
      [adminUser.id, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES (?, 'check_in', 'appointment', ?, ?)`,
      [adminUser.id, id, JSON.stringify({ checked_in_at: new Date() })],
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
 * Cancel an appointment (receptionist/admin)
 * POST /api/admin/appointments/:id/cancel
 */
export const cancelAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Check if appointment exists
    const [appointments] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    if (appointments.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      res
        .status(400)
        .json({ success: false, message: "Appointment already cancelled" });
      return;
    }

    if (appointment.status === "completed") {
      res
        .status(400)
        .json({
          success: false,
          message: "Cannot cancel completed appointment",
        });
      return;
    }

    // Update appointment
    await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancellation_reason = ?,
           cancelled_at = NOW(),
           cancelled_by = ?
       WHERE id = ?`,
      [cancellation_reason, adminUser.id, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES (?, 'cancel_appointment', 'appointment', ?, ?)`,
      [adminUser.id, id, JSON.stringify({ reason: cancellation_reason })],
    );

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
 * Reschedule an appointment
 * POST /api/admin/appointments/:id/reschedule
 */
export const rescheduleAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_date_time, notes } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!new_date_time) {
      res
        .status(400)
        .json({ success: false, message: "New date and time required" });
      return;
    }

    // Check if appointment exists
    const [appointments] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    if (appointments.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    const appointment = appointments[0];
    const oldDateTime = appointment.scheduled_at;

    // Update appointment
    await pool.query(
      `UPDATE appointments 
       SET scheduled_at = ?,
           notes = CONCAT(COALESCE(notes, ''), '\n[Rescheduled] ', ?),
           rescheduled_from = id,
           updated_at = NOW()
       WHERE id = ?`,
      [new_date_time, notes || `Rescheduled by ${adminUser.email}`, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, 'reschedule_appointment', 'appointment', ?, ?, ?)`,
      [
        adminUser.id,
        id,
        JSON.stringify({ scheduled_at: oldDateTime }),
        JSON.stringify({ scheduled_at: new_date_time, notes }),
      ],
    );

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
 * Create manual appointment (receptionist)
 * POST /api/admin/appointments/create
 */
export const createManualAppointment: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      service_id,
      scheduled_at,
      duration_minutes,
      doctor_id,
      notes,
      payment_method = "cash",
      amount_paid,
    } = req.body;

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!patient_id || !service_id || !scheduled_at) {
      res.status(400).json({
        success: false,
        message: "Patient, service, and scheduled time are required",
      });
      return;
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create appointment
      const [appointmentResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO appointments 
         (patient_id, service_id, doctor_id, scheduled_at, duration_minutes, 
          status, notes, created_by, booked_for_self, booking_source)
         VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, 0, 'receptionist')`,
        [
          patient_id,
          service_id,
          doctor_id || null,
          scheduled_at,
          duration_minutes,
          notes,
          adminUser.id,
        ],
      );

      const appointmentId = appointmentResult.insertId;

      // Create payment if amount provided
      if (amount_paid && amount_paid > 0) {
        await connection.query(
          `INSERT INTO payments 
           (appointment_id, patient_id, amount, payment_method, payment_status, 
            processed_by, processed_at)
           VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
          [
            appointmentId,
            patient_id,
            amount_paid,
            payment_method,
            adminUser.id,
          ],
        );
      }

      // Log the action
      await connection.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES (?, 'create_manual_appointment', 'appointment', ?, ?)`,
        [
          adminUser.id,
          appointmentId,
          JSON.stringify({
            patient_id,
            service_id,
            scheduled_at,
            payment_method,
            amount_paid,
          }),
        ],
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Appointment created successfully",
        appointment_id: appointmentId,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error creating manual appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update appointment status
 * PUT /api/admin/appointments/:id/status
 */
export const updateAppointmentStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validStatuses = [
      "scheduled",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }

    await pool.query(
      "UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES (?, 'update_appointment_status', 'appointment', ?, ?)`,
      [adminUser.id, id, JSON.stringify({ status })],
    );

    res.json({
      success: true,
      message: "Appointment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Send appointment reminder
 * POST /api/admin/appointments/:id/send-reminder
 */
export const sendAppointmentReminder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = "email" } = req.body; // email, whatsapp, or both
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Get appointment details
    const [appointments] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, p.email, p.phone, p.first_name, p.last_name, s.name as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id],
    );

    if (appointments.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    const appointment = appointments[0];

    // TODO: Implement actual email/WhatsApp sending logic
    // For now, just create notification records

    if (type === "email" || type === "both") {
      await pool.query(
        `INSERT INTO notifications 
         (patient_id, appointment_id, type, recipient, subject, message, status)
         VALUES (?, ?, 'email', ?, ?, ?, 'sent')`,
        [
          appointment.patient_id,
          id,
          appointment.email,
          "Appointment Reminder",
          `Reminder: Your appointment for ${appointment.service_name} is scheduled for ${appointment.scheduled_at}`,
        ],
      );
    }

    if (type === "whatsapp" || type === "both") {
      await pool.query(
        `INSERT INTO notifications 
         (patient_id, appointment_id, type, recipient, message, status)
         VALUES (?, ?, 'whatsapp', ?, ?, 'sent')`,
        [
          appointment.patient_id,
          id,
          appointment.phone,
          `Reminder: Your appointment for ${appointment.service_name} is scheduled for ${appointment.scheduled_at}`,
        ],
      );
    }

    // Update reminder_sent_at
    await pool.query(
      "UPDATE appointments SET reminder_sent_at = NOW() WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
