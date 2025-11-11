import { RequestHandler } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db/connection";
import type { Appointment, AppointmentWithDetails } from "@shared/database";
import type { ApiResponse, PaginatedResponse } from "@shared/api";

/**
 * Helper function to check if a date/time is blocked
 */
async function isDateTimeBlocked(
  date: string,
  time: string,
): Promise<{ blocked: boolean; reason?: string }> {
  const query = `
    SELECT COUNT(*) as count, reason
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

  const [rows] = await db.query<RowDataPacket[]>(query, [date, time, time]);
  const isBlocked = rows[0]?.count > 0;

  return {
    blocked: isBlocked,
    reason: isBlocked ? rows[0]?.reason : undefined,
  };
}

/**
 * POST /api/appointments
 * Create a new appointment (authenticated users only)
 */
export const createAppointment: RequestHandler = async (req, res) => {
  try {
    const { patient_id, service_id, scheduled_at, duration_minutes, notes } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    // Validate required fields
    if (!patient_id || !service_id || !scheduled_at) {
      const response: ApiResponse = {
        success: false,
        error: "patient_id, service_id, and scheduled_at are required",
      };
      return res.status(400).json(response);
    }

    // Extract date and time from scheduled_at for validation
    const scheduledDate = new Date(scheduled_at);
    const appointmentDate = scheduledDate.toISOString().split("T")[0];
    const appointmentTime = scheduledDate.toTimeString().split(" ")[0]; // HH:MM:SS

    // Check if the date/time is blocked
    const { blocked, reason } = await isDateTimeBlocked(
      appointmentDate,
      appointmentTime,
    );
    if (blocked) {
      const response: ApiResponse = {
        success: false,
        error: reason
          ? `The selected time is not available. Reason: ${reason}`
          : "The selected date/time is not available. Please choose another time.",
      };
      return res.status(400).json(response);
    }

    // Verify patient exists
    const [patientRows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM patients WHERE id = ?",
      [patient_id],
    );

    if (patientRows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Patient not found",
      };
      return res.status(404).json(response);
    }

    // Verify service exists
    const [serviceRows] = await db.query<RowDataPacket[]>(
      "SELECT id, duration_minutes FROM services WHERE id = ? AND is_active = 1",
      [service_id],
    );

    if (serviceRows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Service not found or is inactive",
      };
      return res.status(404).json(response);
    }

    // Use service duration if not provided
    const finalDuration = duration_minutes || serviceRows[0].duration_minutes;

    const query = `
      INSERT INTO appointments 
      (patient_id, service_id, scheduled_at, duration_minutes, notes, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      patient_id,
      service_id,
      scheduled_at,
      finalDuration,
      notes || null,
      userId,
    ]);

    // Fetch the created appointment with details
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.price as service_price,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ?`,
      [result.insertId],
    );

    const appointment = rows[0];

    const response: ApiResponse<Appointment> = {
      success: true,
      data: appointment as Appointment,
      message: "Appointment created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating appointment:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create appointment",
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/appointments
 * Get all appointments (with optional filters)
 */
export const getAppointments: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      status,
      date_from,
      date_to,
      page = 1,
      pageSize = 20,
    } = req.query;

    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.price as service_price,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (patient_id) {
      query += ` AND a.patient_id = ?`;
      params.push(patient_id);
    }
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    if (date_from) {
      query += ` AND DATE(a.scheduled_at) >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND DATE(a.scheduled_at) <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY a.scheduled_at DESC`;

    // Add pagination
    const offset = (Number(page) - 1) * Number(pageSize);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    const [rows] = await db.query<RowDataPacket[]>(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM appointments a WHERE 1=1`;
    const countParams: any[] = [];

    if (patient_id) {
      countQuery += ` AND a.patient_id = ?`;
      countParams.push(patient_id);
    }
    if (status) {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    }
    if (date_from) {
      countQuery += ` AND DATE(a.scheduled_at) >= ?`;
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ` AND DATE(a.scheduled_at) <= ?`;
      countParams.push(date_to);
    }

    const [countRows] = await db.query<RowDataPacket[]>(
      countQuery,
      countParams,
    );
    const total = countRows[0]?.total || 0;

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        items: rows,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch appointments",
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
export const getAppointmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.price as service_price,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Appointment not found",
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: rows[0],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch appointment",
    };
    res.status(500).json(response);
  }
};

/**
 * PUT /api/appointments/:id
 * Update appointment
 */
export const updateAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at, status, doctor_id, notes } = req.body;

    // Check if appointment exists
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Appointment not found",
      };
      return res.status(404).json(response);
    }

    // If updating scheduled_at, check if the new date/time is blocked
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      const appointmentDate = scheduledDate.toISOString().split("T")[0];
      const appointmentTime = scheduledDate.toTimeString().split(" ")[0];

      const { blocked, reason } = await isDateTimeBlocked(
        appointmentDate,
        appointmentTime,
      );
      if (blocked) {
        const response: ApiResponse = {
          success: false,
          error: reason
            ? `The selected time is not available. Reason: ${reason}`
            : "The selected date/time is not available. Please choose another time.",
        };
        return res.status(400).json(response);
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (scheduled_at !== undefined) {
      updates.push("scheduled_at = ?");
      params.push(scheduled_at);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }
    if (doctor_id !== undefined) {
      updates.push("doctor_id = ?");
      params.push(doctor_id);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes);
    }

    if (updates.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "No fields to update",
      };
      return res.status(400).json(response);
    }

    params.push(id);

    const query = `
      UPDATE appointments
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await db.query(query, params);

    // Fetch updated appointment
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    const response: ApiResponse<Appointment> = {
      success: true,
      data: rows[0] as Appointment,
      message: "Appointment updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating appointment:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update appointment",
    };
    res.status(500).json(response);
  }
};

/**
 * DELETE /api/appointments/:id
 * Cancel appointment (soft delete by setting status to cancelled)
 */
export const cancelAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Appointment not found",
      };
      return res.status(404).json(response);
    }

    await db.query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
      [id],
    );

    const response: ApiResponse = {
      success: true,
      message: "Appointment cancelled successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to cancel appointment",
    };
    res.status(500).json(response);
  }
};
