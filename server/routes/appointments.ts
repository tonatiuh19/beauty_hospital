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
 * Create a new appointment (authenticated patients only)
 * Supports creating new patient records when booking for another person
 */
export const createAppointment: RequestHandler = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      patient_id,
      patient_info,
      service_id,
      scheduled_at,
      duration_minutes,
      notes,
      booked_for_self,
      selected_areas,
    } = req.body;
    const loggedInPatientId = req.user?.id;

    if (!loggedInPatientId) {
      const response: ApiResponse = {
        success: false,
        error: "Patient not authenticated",
      };
      return res.status(401).json(response);
    }

    await connection.beginTransaction();

    // Validate required fields
    if (!service_id || !scheduled_at) {
      const response: ApiResponse = {
        success: false,
        error: "service_id and scheduled_at are required",
      };
      await connection.rollback();
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
      await connection.rollback();
      return res.status(400).json(response);
    }

    // Determine the patient_id for the appointment
    let appointmentPatientId: number;

    if (booked_for_self) {
      // Appointment is for the logged-in patient
      appointmentPatientId = loggedInPatientId;
    } else {
      // Appointment is for another person
      if (patient_id) {
        // Use existing patient_id if provided
        appointmentPatientId = patient_id;
      } else if (patient_info) {
        // Create new patient record
        const { first_name, last_name, email, phone, date_of_birth } =
          patient_info;

        if (!first_name || !last_name || !email || !phone) {
          const response: ApiResponse = {
            success: false,
            error:
              "Patient info must include first_name, last_name, email, and phone",
          };
          await connection.rollback();
          return res.status(400).json(response);
        }

        // Check if patient with this email already exists
        const [existingPatients] = await connection.query<RowDataPacket[]>(
          "SELECT id FROM patients WHERE email = ?",
          [email],
        );

        if (existingPatients.length > 0) {
          // Patient already exists - use their existing ID
          // This avoids creating duplicate patient records
          appointmentPatientId = existingPatients[0].id;
        } else {
          // Patient doesn't exist - create new patient record
          // They can sign up later to claim and authenticate their account
          const [patientResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, role, is_active)
             VALUES (?, ?, ?, ?, ?, 'patient', 1)`,
            [first_name, last_name, email, phone, date_of_birth || null],
          );

          appointmentPatientId = patientResult.insertId;
        }
      } else {
        const response: ApiResponse = {
          success: false,
          error:
            "Either patient_id or patient_info must be provided when not booking for self",
        };
        await connection.rollback();
        return res.status(400).json(response);
      }
    }

    // Verify patient exists
    const [patientRows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM patients WHERE id = ?",
      [appointmentPatientId],
    );

    if (patientRows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Patient not found",
      };
      await connection.rollback();
      return res.status(404).json(response);
    }

    // Verify service exists
    const [serviceRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, duration_minutes FROM services WHERE id = ? AND is_active = 1",
      [service_id],
    );

    if (serviceRows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Service not found or is inactive",
      };
      await connection.rollback();
      return res.status(404).json(response);
    }

    // Use service duration if not provided
    const finalDuration = duration_minutes || serviceRows[0].duration_minutes;

    // Serialize selected_areas to JSON string if provided
    const areasJson = selected_areas ? JSON.stringify(selected_areas) : null;

    // Create notes with selected areas if provided
    let finalNotes = notes || "";
    if (selected_areas && selected_areas.length > 0) {
      finalNotes = `${finalNotes}\nÁreas seleccionadas: ${selected_areas.join(", ")}`;
    }

    const query = `
      INSERT INTO appointments 
      (patient_id, service_id, scheduled_at, duration_minutes, notes, booked_for_self, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `;

    const [result] = await connection.query<ResultSetHeader>(query, [
      appointmentPatientId,
      service_id,
      scheduled_at,
      finalDuration,
      finalNotes.trim() || null,
      booked_for_self ? 1 : 0,
      loggedInPatientId, // created_by is the logged-in patient
    ]);

    // Fetch the created appointment with details
    const [rows] = await connection.query<RowDataPacket[]>(
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

    await connection.commit();

    const appointment = rows[0];

    const response: ApiResponse<Appointment> = {
      success: true,
      data: appointment as Appointment,
      message: "Appointment created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    console.error("Error creating appointment:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create appointment",
    };
    res.status(500).json(response);
  } finally {
    connection.release();
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

/**
 * GET /api/appointments/booked-slots
 * Get booked time slots for a specific date and service (public endpoint - no auth required)
 * This is used to show unavailable time slots in the appointment booking wizard
 */
export const getBookedTimeSlots: RequestHandler = async (req, res) => {
  try {
    const { date, service_id } = req.query;

    if (!date) {
      const response: ApiResponse = {
        success: false,
        error: "date parameter is required",
      };
      return res.status(400).json(response);
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

    const [rows] = await db.query<RowDataPacket[]>(query, params);

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

    const response: ApiResponse = {
      success: true,
      data: {
        date,
        service_id: service_id ? Number(service_id) : null,
        booked_slots: bookedSlots,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch booked time slots",
    };
    res.status(500).json(response);
  }
};
