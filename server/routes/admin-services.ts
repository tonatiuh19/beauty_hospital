import { RequestHandler } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../db/connection";
import { Service } from "@shared/database";

interface ServiceRow extends RowDataPacket, Service {}

/**
 * GET /api/admin/services
 * Get all services (including inactive ones) - Admin only
 */
export const getAllServices: RequestHandler = async (req, res) => {
  try {
    const [rows] = await pool.query<ServiceRow[]>(
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
      ORDER BY category, name`,
    );

    const services = rows.map((row) => ({
      ...row,
      price: parseFloat(row.price as any),
      duration_minutes: parseInt(row.duration_minutes as any, 10),
      is_active: Boolean(row.is_active),
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
 * GET /api/admin/services/:id
 * Get a single service by ID - Admin only
 */
export const getServiceById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<ServiceRow[]>(
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
      WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = {
      ...rows[0],
      price: parseFloat(rows[0].price as any),
      duration_minutes: parseInt(rows[0].duration_minutes as any, 10),
      is_active: Boolean(rows[0].is_active),
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
 * POST /api/admin/services
 * Create a new service - Admin only
 */
export const createService: RequestHandler = async (req, res) => {
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

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO services (
        name, 
        description, 
        category, 
        price, 
        duration_minutes, 
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        category,
        price,
        duration_minutes,
        is_active ? 1 : 0,
      ],
    );

    const [newService] = await pool.query<ServiceRow[]>(
      `SELECT * FROM services WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        ...newService[0],
        price: parseFloat(newService[0].price as any),
        duration_minutes: parseInt(newService[0].duration_minutes as any, 10),
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

/**
 * PUT /api/admin/services/:id
 * Update an existing service - Admin only
 */
export const updateService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, duration_minutes, is_active } =
      req.body;

    // Check if service exists
    const [existing] = await pool.query<ServiceRow[]>(
      `SELECT id FROM services WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Validation
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

    await pool.query(
      `UPDATE services SET 
        name = ?, 
        description = ?, 
        category = ?, 
        price = ?, 
        duration_minutes = ?, 
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        description || null,
        category,
        price,
        duration_minutes,
        is_active ? 1 : 0,
        id,
      ],
    );

    const [updatedService] = await pool.query<ServiceRow[]>(
      `SELECT * FROM services WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      data: {
        ...updatedService[0],
        price: parseFloat(updatedService[0].price as any),
        duration_minutes: parseInt(
          updatedService[0].duration_minutes as any,
          10,
        ),
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

/**
 * DELETE /api/admin/services/:id
 * Delete a service - Admin only
 * Note: This performs a soft delete by setting is_active = 0
 */
export const deleteService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const [existing] = await pool.query<ServiceRow[]>(
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
    const [appointments] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM appointments WHERE service_id = ?`,
      [id],
    );

    if (appointments[0].count > 0) {
      // Soft delete - mark as inactive instead of deleting
      await pool.query(
        `UPDATE services SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id],
      );

      return res.json({
        success: true,
        message: "Service deactivated (has existing appointments)",
      });
    }

    // Hard delete if no appointments
    await pool.query(`DELETE FROM services WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Service deleted successfully",
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
