import { RequestHandler } from "express";
import pool from "../db/connection";
import { Service } from "@shared/database";
import { RowDataPacket } from "mysql2";

interface ServiceRow extends RowDataPacket, Service {}

/**
 * GET /api/services
 * Fetch all active services from the database
 */
export const handleGetServices: RequestHandler = async (req, res) => {
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
      WHERE is_active = 1 
      ORDER BY category, name`,
    );

    // Parse numeric fields since MySQL returns them as strings
    const services = rows.map((row) => ({
      ...row,
      price: parseFloat(row.price as any),
      duration_minutes: parseInt(row.duration_minutes as any, 10),
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
 * Fetch a single service by ID
 */
export const handleGetServiceById: RequestHandler = async (req, res) => {
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
      WHERE id = ? AND is_active = 1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Parse numeric fields since MySQL returns them as strings
    const service = {
      ...rows[0],
      price: parseFloat(rows[0].price as any),
      duration_minutes: parseInt(rows[0].duration_minutes as any, 10),
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
