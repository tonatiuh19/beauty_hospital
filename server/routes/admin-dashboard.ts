import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Get dashboard metrics overview
 * GET /api/admin/dashboard/metrics
 */
export const getDashboardMetrics: RequestHandler = async (req, res) => {
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
    const [appointmentStats] = await pool.query<RowDataPacket[]>(
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
    const [revenueStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments
       FROM payments
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get new patients
    const [patientStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as new_patients
       FROM patients
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get active contracts
    const [contractStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as active_contracts
       FROM contracts
       WHERE status IN ('signed', 'pending_signature') AND DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get top services
    const [topServices] = await pool.query<RowDataPacket[]>(
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
    const [upcomingToday] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE DATE(scheduled_at) = CURDATE() AND status IN ('scheduled', 'confirmed')`,
      [],
    );

    res.json({
      success: true,
      data: {
        period: { start_date: startDate, end_date: endDate },
        appointments: appointmentStats[0],
        revenue: revenueStats[0],
        patients: patientStats[0],
        contracts: contractStats[0],
        topServices: topServices,
        upcomingToday: upcomingToday[0].count,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get revenue chart data
 * GET /api/admin/dashboard/revenue-chart
 */
export const getRevenueChart: RequestHandler = async (req, res) => {
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

    const [revenueData] = await pool.query<RowDataPacket[]>(
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
 * Get appointments for calendar
 * GET /api/admin/appointments/calendar
 */
export const getCalendarAppointments: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const [appointments] = await pool.query<RowDataPacket[]>(
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
        s.price as service_price,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       LEFT JOIN users u ON a.doctor_id = u.id
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
 * Get recent activity feed
 * GET /api/admin/dashboard/activity
 */
export const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const [activities] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, user_id, patient_id, action, entity_type, entity_id,
        ip_address, created_at
       FROM audit_logs
       ORDER BY created_at DESC
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
