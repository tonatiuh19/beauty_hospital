import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Get all patients with pagination and search
 * GET /api/admin/patients
 */
export const getAllPatients: RequestHandler = async (req, res) => {
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
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM patients WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get patients
    const [patients] = await pool.query<RowDataPacket[]>(
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
 * Get patient by ID with full details
 * GET /api/admin/patients/:id
 */
export const getPatientById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get patient details
    const [patients] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );

    if (patients.length === 0) {
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    const patient = patients[0];

    // Get appointment history
    const [appointments] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, 
              DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as scheduled_date,
              TIME_FORMAT(a.scheduled_at, '%H:%i') as scheduled_time,
              s.name as service_name, s.category, s.price,
              u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [id],
    );

    // Get payment history
    const [payments] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, 
              DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as appointment_date, 
              s.name as service_name
       FROM payments p
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC`,
      [id],
    );

    // Get medical records
    const [medicalRecords] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM medical_records m
       JOIN users u ON m.doctor_id = u.id
       WHERE m.patient_id = ?
       ORDER BY m.created_at DESC`,
      [id],
    );

    // Get contracts
    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, s.name as service_name
       FROM contracts c
       JOIN services s ON c.service_id = s.id
       WHERE c.patient_id = ?
       ORDER BY c.created_at DESC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        patient,
        appointments,
        payments,
        medicalRecords,
        contracts,
      },
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update patient information
 * PUT /api/admin/patients/:id
 */
export const updatePatient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
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
      notes,
    } = req.body;

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Check if patient exists
    const [patients] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM patients WHERE id = ?",
      [id],
    );

    if (patients.length === 0) {
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    const oldData = patients[0];

    // Update patient
    await pool.query(
      `UPDATE patients SET
        first_name = ?,
        last_name = ?,
        phone = ?,
        date_of_birth = ?,
        gender = ?,
        address = ?,
        city = ?,
        state = ?,
        zip_code = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        notes = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
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
        notes,
        id,
      ],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, 'update_patient', 'patient', ?, ?, ?)`,
      [adminUser.id, id, JSON.stringify(oldData), JSON.stringify(req.body)],
    );

    res.json({
      success: true,
      message: "Patient updated successfully",
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Deactivate/Activate patient
 * PUT /api/admin/patients/:id/toggle-active
 */
export const togglePatientActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Get current status
    const [patients] = await pool.query<RowDataPacket[]>(
      "SELECT is_active FROM patients WHERE id = ?",
      [id],
    );

    if (patients.length === 0) {
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    const newStatus = patients[0].is_active === 1 ? 0 : 1;

    // Update status
    await pool.query(
      "UPDATE patients SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES (?, 'toggle_patient_active', 'patient', ?, ?)`,
      [adminUser.id, id, JSON.stringify({ is_active: newStatus })],
    );

    res.json({
      success: true,
      message: `Patient ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling patient status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get patient statistics
 * GET /api/admin/patients/:id/stats
 */
export const getPatientStats: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Total appointments
    const [appointmentStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
       FROM appointments
       WHERE patient_id = ?`,
      [id],
    );

    // Total payments
    const [paymentStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunded,
        COUNT(*) as total_transactions
       FROM payments
       WHERE patient_id = ?`,
      [id],
    );

    // Active contracts
    const [contractStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as active_contracts
       FROM contracts
       WHERE patient_id = ? AND status IN ('signed', 'pending_signature')`,
      [id],
    );

    res.json({
      success: true,
      data: {
        appointments: appointmentStats[0],
        payments: paymentStats[0],
        contracts: contractStats[0],
      },
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Add medical record for patient (doctors only)
 * POST /api/admin/patients/:id/medical-records
 */
export const addMedicalRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_id,
      diagnosis,
      treatment,
      notes,
      allergies,
      medications,
      medical_history,
    } = req.body;

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only doctors can add medical records
    if (
      adminUser.role !== "doctor" &&
      adminUser.role !== "general_admin" &&
      adminUser.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Only doctors can add medical records",
      });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO medical_records 
       (patient_id, doctor_id, appointment_id, diagnosis, treatment, notes, 
        allergies, medications, medical_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        adminUser.id,
        appointment_id || null,
        diagnosis,
        treatment,
        notes,
        allergies,
        medications,
        medical_history,
      ],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES (?, 'add_medical_record', 'medical_record', ?, ?)`,
      [adminUser.id, result.insertId, JSON.stringify(req.body)],
    );

    res.json({
      success: true,
      message: "Medical record added successfully",
      record_id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
