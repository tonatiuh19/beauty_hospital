import { RequestHandler } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Get all coupons
 * GET /api/admin/settings/coupons
 */
export const getAllCoupons: RequestHandler = async (req, res) => {
  try {
    const [coupons] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.last_name 
       FROM coupons c
       JOIN users u ON c.created_by = u.id
       ORDER BY c.created_at DESC`,
    );

    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create coupon
 * POST /api/admin/settings/coupons
 */
export const createCoupon: RequestHandler = async (req, res) => {
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
      applicable_services,
    } = req.body;

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO coupons 
       (code, description, discount_type, discount_value, min_purchase_amount,
        max_discount_amount, usage_limit, per_user_limit, valid_from, valid_until,
        applicable_services, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        applicable_services ? JSON.stringify(applicable_services) : null,
        adminUser.id,
      ],
    );

    res.json({
      success: true,
      message: "Coupon created successfully",
      coupon_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update coupon
 * PUT /api/admin/settings/coupons/:id
 */
export const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, ...updateData } = req.body;

    await pool.query(
      `UPDATE coupons SET
        description = ?,
        discount_value = ?,
        min_purchase_amount = ?,
        max_discount_amount = ?,
        usage_limit = ?,
        per_user_limit = ?,
        valid_from = ?,
        valid_until = ?,
        is_active = ?
       WHERE id = ?`,
      [
        updateData.description,
        updateData.discount_value,
        updateData.min_purchase_amount,
        updateData.max_discount_amount,
        updateData.usage_limit,
        updateData.per_user_limit,
        updateData.valid_from,
        updateData.valid_until,
        is_active !== undefined ? is_active : 1,
        id,
      ],
    );

    res.json({
      success: true,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get system settings
 * GET /api/admin/settings
 */
export const getSettings: RequestHandler = async (req, res) => {
  try {
    const [settings] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM settings ORDER BY category, setting_key",
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
 * Update setting
 * PUT /api/admin/settings/:key
 */
export const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
      [value, adminUser.id, key],
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
 * Get content pages
 * GET /api/admin/settings/content-pages
 */
export const getContentPages: RequestHandler = async (req, res) => {
  try {
    const [pages] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, 
              c.first_name as created_by_first_name,
              c.last_name as created_by_last_name,
              u.first_name as updated_by_first_name,
              u.last_name as updated_by_last_name
       FROM content_pages p
       JOIN users c ON p.created_by = c.id
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
 * Update content page
 * PUT /api/admin/settings/content-pages/:id
 */
export const updateContentPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, meta_description, is_published } = req.body;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE content_pages SET
        title = ?,
        content = ?,
        meta_description = ?,
        is_published = ?,
        updated_by = ?
       WHERE id = ?`,
      [title, content, meta_description, is_published, adminUser.id, id],
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
 * Get all admin users
 * GET /api/admin/settings/users
 */
export const getAdminUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await pool.query<RowDataPacket[]>(
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
 * Create admin user
 * POST /api/admin/settings/users
 */
export const createAdminUser: RequestHandler = async (req, res) => {
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

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can create users
    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only general administrators can create users",
      });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users 
       (email, role, first_name, last_name, phone, employee_id, specialization, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
      [email, role, first_name, last_name, phone, employee_id, specialization],
    );

    res.json({
      success: true,
      message: "Admin user created successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get admin user details
 * GET /api/admin/settings/users/:id
 */
export const getAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only administrators can view user details",
      });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, role, first_name, last_name, phone, date_of_birth, 
              gender, employee_id, specialization, profile_picture_url, 
              is_active, created_at, last_login
       FROM users 
       WHERE id = ? AND role IN ('admin', 'general_admin', 'receptionist', 'doctor')`,
      [id],
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Admin user not found" });
      return;
    }

    // Get activity stats
    const [activityStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COUNT(*) FROM appointments WHERE created_by = ?) as appointments_created,
        (SELECT COUNT(*) FROM medical_records WHERE doctor_id = ?) as medical_records_added
       FROM dual`,
      [id, id],
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        activity: activityStats[0],
      },
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update admin user
 * PUT /api/admin/settings/users/:id
 */
export const updateAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, employee_id, specialization, role } =
      req.body;

    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can update other users
    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      // Users can update their own profile (except role)
      if (parseInt(id) !== adminUser.id) {
        res.status(403).json({
          success: false,
          message: "Only administrators can update other users",
        });
        return;
      }
    }

    // Check if user exists
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
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
    if (employee_id !== undefined) {
      updates.push("employee_id = ?");
      values.push(employee_id);
    }
    if (specialization !== undefined) {
      updates.push("specialization = ?");
      values.push(specialization);
    }

    // Only admins can change roles
    if (
      role !== undefined &&
      (adminUser.role === "general_admin" || adminUser.role === "admin")
    ) {
      // Prevent changing own role
      if (parseInt(id) === adminUser.id) {
        res.status(400).json({
          success: false,
          message: "Cannot change your own role",
        });
        return;
      }
      updates.push("role = ?");
      values.push(role);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields to update",
      });
      return;
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Toggle admin user active status
 * PATCH /api/admin/settings/users/:id/toggle-active
 */
export const toggleAdminUserActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can toggle user status
    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only general administrators can toggle user status",
      });
      return;
    }

    // Don't allow deactivating self
    if (parseInt(id) === adminUser.id) {
      res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT is_active FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const newStatus = users[0].is_active === 1 ? 0 : 1;

    await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [
      newStatus,
      id,
    ]);

    res.json({
      success: true,
      message: `User ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete admin user
 * DELETE /api/admin/settings/users/:id
 */
export const deleteAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can delete users
    if (adminUser.role !== "general_admin") {
      res.status(403).json({
        success: false,
        message: "Only general administrators can delete users",
      });
      return;
    }

    // Don't allow deleting self
    if (parseInt(id) === adminUser.id) {
      res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
      return;
    }

    // Check if user exists
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Soft delete by setting is_active = 0 and adding _deleted suffix to email
    await pool.query(
      `UPDATE users 
       SET is_active = 0, 
           email = CONCAT(email, '_deleted_', UNIX_TIMESTAMP())
       WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Reset admin user password/send new verification code
 * POST /api/admin/settings/users/:id/reset-access
 */
export const resetAdminUserAccess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Only general admin can reset access
    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only administrators can reset user access",
      });
      return;
    }

    // Get user details
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, first_name, last_name FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = users[0];

    // Invalidate existing sessions
    await pool.query("DELETE FROM admin_sessions WHERE user_id = ?", [id]);

    // In a real implementation, you would send a password reset email here
    // For now, we'll just return success
    // You can integrate with the same email verification system

    res.json({
      success: true,
      message: "User access reset successfully. User must login again.",
      email: user.email,
    });
  } catch (error) {
    console.error("Error resetting user access:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get admin user activity log
 * GET /api/admin/settings/users/:id/activity
 */
export const getAdminUserActivity: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const adminUser = req.adminUser;

    if (!adminUser) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (adminUser.role !== "general_admin" && adminUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only administrators can view activity logs",
      });
      return;
    }

    const limitNum = parseInt(limit as string);
    const offset = (parseInt(page as string) - 1) * limitNum;

    // Get recent appointments created
    const [appointments] = await pool.query<RowDataPacket[]>(
      `SELECT 
        'appointment_created' as activity_type,
        a.id as reference_id,
        CONCAT(u.first_name, ' ', u.last_name) as patient_name,
        s.name as service_name,
        a.created_at as timestamp
       FROM appointments a
       JOIN users u ON a.patient_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.created_by = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, limitNum, offset],
    );

    // Get medical records added (if doctor)
    const [medicalRecords] = await pool.query<RowDataPacket[]>(
      `SELECT 
        'medical_record_added' as activity_type,
        mr.id as reference_id,
        CONCAT(u.first_name, ' ', u.last_name) as patient_name,
        mr.record_type,
        mr.created_at as timestamp
       FROM medical_records mr
       JOIN users u ON mr.patient_id = u.id
       WHERE mr.doctor_id = ?
       ORDER BY mr.created_at DESC
       LIMIT ?`,
      [id, 20],
    );

    // Combine and sort by timestamp
    const activities = [...appointments, ...medicalRecords]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limitNum);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
