import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Get all payments with filters
 * GET /api/admin/payments
 */
export const getAllPayments: RequestHandler = async (req, res) => {
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
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM payments p WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get payments
    const [payments] = await pool.query<RowDataPacket[]>(
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
 * Process refund (requires general admin approval)
 * POST /api/admin/payments/:id/refund
 */
export const processRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, refund_reason, auto_approve = false } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Get payment details
    const [payments] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM payments WHERE id = ?",
      [id],
    );

    if (payments.length === 0) {
      res.status(404).json({ success: false, message: "Payment not found" });
      return;
    }

    const payment = payments[0];

    if (payment.payment_status === "refunded") {
      res
        .status(400)
        .json({ success: false, message: "Payment already refunded" });
      return;
    }

    if (payment.payment_status !== "completed") {
      res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded",
      });
      return;
    }

    if (parseFloat(refund_amount) > parseFloat(payment.amount)) {
      res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed payment amount",
      });
      return;
    }

    // Check if user is general admin or if auto-approve is disabled
    const requiresApproval =
      adminUser.role !== "general_admin" &&
      adminUser.role !== "admin" &&
      !auto_approve;

    if (requiresApproval) {
      // Update payment with refund request
      await pool.query(
        `UPDATE payments SET
          refund_amount = ?,
          refund_reason = ?,
          refunded_by = ?,
          payment_status = 'pending'
         WHERE id = ?`,
        [refund_amount, refund_reason, adminUser.id, id],
      );

      res.json({
        success: true,
        message: "Refund request submitted for approval",
        requires_approval: true,
      });
    } else {
      // Process refund immediately
      await pool.query(
        `UPDATE payments SET
          refund_amount = ?,
          refund_reason = ?,
          refunded_by = ?,
          refunded_at = NOW(),
          refund_approved_by = ?,
          refund_approved_at = NOW(),
          payment_status = 'refunded'
         WHERE id = ?`,
        [refund_amount, refund_reason, adminUser.id, adminUser.id, id],
      );

      // Log the action
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES (?, 'process_refund', 'payment', ?, ?)`,
        [adminUser.id, id, JSON.stringify({ refund_amount, refund_reason })],
      );

      res.json({
        success: true,
        message: "Refund processed successfully",
        requires_approval: false,
      });
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Approve refund (general admin only)
 * POST /api/admin/payments/:id/approve-refund
 */
export const approveRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can approve refunds
    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only general administrators can approve refunds",
      });
      return;
    }

    // Update payment
    await pool.query(
      `UPDATE payments SET
        refunded_at = NOW(),
        refund_approved_by = ?,
        refund_approved_at = NOW(),
        payment_status = 'refunded'
       WHERE id = ? AND payment_status = 'pending'`,
      [adminUser.id, id],
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'approve_refund', 'payment', ?)`,
      [adminUser.id, id],
    );

    res.json({
      success: true,
      message: "Refund approved successfully",
    });
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get payment statistics
 * GET /api/admin/payments/stats
 */
export const getPaymentStats: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = "";
    const params: any[] = [];

    if (start_date && end_date) {
      whereClause = "WHERE DATE(p.created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    console.log(
      "Fetching payment stats with whereClause:",
      whereClause,
      "params:",
      params,
    );

    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' OR p.payment_status = 'partially_refunded' THEN COALESCE(p.refund_amount, 0) ELSE 0 END), 0) as refunded_amount,
        COUNT(CASE WHEN p.refund_status = 'pending' THEN 1 END) as pending_refunds
       FROM payments p ${whereClause}`,
      params,
    );

    console.log("Stats query result:", stats);

    // Payment methods breakdown
    const [methodBreakdown] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       ${whereClause}
       GROUP BY p.payment_method`,
      params,
    );

    console.log("Method breakdown result:", methodBreakdown);

    const response = {
      success: true,
      data: {
        ...stats[0],
        payment_methods: methodBreakdown,
      },
    };

    console.log("Sending response:", response);

    res.json(response);
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
