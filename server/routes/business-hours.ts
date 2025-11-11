import { RequestHandler } from "express";
import { RowDataPacket } from "mysql2";
import db from "../db/connection";
import type { BusinessHours } from "@shared/database";
import type { ApiResponse } from "@shared/api";

/**
 * GET /api/business-hours
 * Get all business hours (public - needed for appointment calendar)
 */
export const getBusinessHours: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT * FROM business_hours
      ORDER BY day_of_week ASC
    `;

    const [rows] = await db.query<RowDataPacket[]>(query);

    const businessHours: BusinessHours[] = rows.map((row) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      is_open: Boolean(row.is_open),
      open_time: row.open_time,
      close_time: row.close_time,
      break_start: row.break_start || null,
      break_end: row.break_end || null,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const response: ApiResponse<BusinessHours[]> = {
      success: true,
      data: businessHours,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching business hours:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch business hours",
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/business-hours/day/:dayOfWeek
 * Get business hours for a specific day of week
 */
export const getBusinessHoursByDay: RequestHandler = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const day = parseInt(dayOfWeek, 10);

    if (isNaN(day) || day < 0 || day > 6) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Invalid day of week. Must be 0-6 (0=Sunday, 6=Saturday)",
      };
      return res.status(400).json(response);
    }

    const query = `
      SELECT * FROM business_hours
      WHERE day_of_week = ?
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [day]);

    if (rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Business hours not found for this day",
      };
      return res.status(404).json(response);
    }

    const row = rows[0];
    const businessHours: BusinessHours = {
      id: row.id,
      day_of_week: row.day_of_week,
      is_open: Boolean(row.is_open),
      open_time: row.open_time,
      close_time: row.close_time,
      break_start: row.break_start || null,
      break_end: row.break_end || null,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const response: ApiResponse<BusinessHours> = {
      success: true,
      data: businessHours,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching business hours:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch business hours",
    };
    res.status(500).json(response);
  }
};
