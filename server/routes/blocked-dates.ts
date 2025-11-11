import { RequestHandler } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db/connection";
import type { BlockedDate, BlockedDateWithCreator } from "@shared/database";
import type {
  ApiResponse,
  CreateBlockedDateRequest,
  UpdateBlockedDateRequest,
  GetBlockedDatesRequest,
  PaginatedResponse,
} from "@shared/api";

/**
 * GET /api/blocked-dates
 * Get all blocked dates (public - needed for appointment calendar)
 */
export const getBlockedDates: RequestHandler = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      page = 1,
      pageSize = 100,
    } = req.query as GetBlockedDatesRequest;

    let query = `
      SELECT bd.*, 
             u.id as creator_id,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name,
             u.email as creator_email
      FROM blocked_dates bd
      LEFT JOIN users u ON bd.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by date range if provided
    if (start_date) {
      query += ` AND bd.end_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND bd.start_date <= ?`;
      params.push(end_date);
    }

    // Add ordering
    query += ` ORDER BY bd.start_date ASC`;

    // Add pagination
    const offset = (Number(page) - 1) * Number(pageSize);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    const [rows] = await db.query<RowDataPacket[]>(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM blocked_dates bd
      WHERE 1=1
    `;
    const countParams: any[] = [];
    if (start_date) {
      countQuery += ` AND bd.end_date >= ?`;
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND bd.start_date <= ?`;
      countParams.push(end_date);
    }

    const [countRows] = await db.query<RowDataPacket[]>(
      countQuery,
      countParams,
    );
    const total = countRows[0]?.total || 0;

    // Transform rows to include creator info
    const blockedDates: BlockedDateWithCreator[] = rows.map((row) => ({
      id: row.id,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      end_time: row.end_time,
      all_day: Boolean(row.all_day),
      reason: row.reason,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by_user: {
        id: row.creator_id,
        first_name: row.creator_first_name,
        last_name: row.creator_last_name,
        email: row.creator_email,
        role: row.creator_role,
        phone: row.creator_phone,
        is_active: row.creator_is_active,
        created_at: row.creator_created_at,
        updated_at: row.creator_updated_at,
        last_login: row.creator_last_login,
      },
    }));

    const response: ApiResponse<PaginatedResponse<BlockedDateWithCreator>> = {
      success: true,
      data: {
        items: blockedDates,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch blocked dates",
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/blocked-dates/check
 * Check if a specific date/time is blocked (public - needed for appointment validation)
 */
export const checkDateBlocked: RequestHandler = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date) {
      const response: ApiResponse = {
        success: false,
        error: "Date parameter is required",
      };
      return res.status(400).json(response);
    }

    let query: string;
    let params: any[];

    if (time) {
      // Check if specific date and time is blocked
      query = `
        SELECT COUNT(*) as count, start_time, end_time, all_day, reason
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
      params = [date, time, time];
    } else {
      // Check if entire date is blocked (for calendar display)
      query = `
        SELECT COUNT(*) as count
        FROM blocked_dates
        WHERE ? BETWEEN start_date AND end_date
      `;
      params = [date];
    }

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    const isBlocked = rows[0]?.count > 0;

    const response: ApiResponse<{
      blocked: boolean;
      reason?: string;
      start_time?: string;
      end_time?: string;
      all_day?: boolean;
    }> = {
      success: true,
      data: {
        blocked: isBlocked,
        ...(isBlocked &&
          time && {
            reason: rows[0]?.reason,
            start_time: rows[0]?.start_time,
            end_time: rows[0]?.end_time,
            all_day: Boolean(rows[0]?.all_day),
          }),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error checking blocked date:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to check blocked date",
    };
    res.status(500).json(response);
  }
};

/**
 * POST /api/blocked-dates
 * Create a new blocked date (admin only)
 */
export const createBlockedDate: RequestHandler = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
    } = req.body as CreateBlockedDateRequest;
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    // Validate required fields
    if (!start_date || !end_date) {
      const response: ApiResponse = {
        success: false,
        error: "start_date and end_date are required",
      };
      return res.status(400).json(response);
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      const response: ApiResponse = {
        success: false,
        error: "start_date must be before or equal to end_date",
      };
      return res.status(400).json(response);
    }

    // Validate time range if provided
    if (!all_day && start_time && end_time) {
      if (start_time >= end_time) {
        const response: ApiResponse = {
          success: false,
          error: "start_time must be before end_time",
        };
        return res.status(400).json(response);
      }
    }

    const isAllDay = all_day !== false; // Default to true if not specified

    const query = `
      INSERT INTO blocked_dates (start_date, end_date, start_time, end_time, all_day, reason, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      start_date,
      end_date,
      start_time || null,
      end_time || null,
      isAllDay,
      reason || null,
      notes || null,
      userId,
    ]);

    // Fetch the created blocked date
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM blocked_dates WHERE id = ?",
      [result.insertId],
    );

    const blockedDate: BlockedDate = rows[0] as BlockedDate;

    const response: ApiResponse<BlockedDate> = {
      success: true,
      data: blockedDate,
      message: "Blocked date created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating blocked date:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create blocked date",
    };
    res.status(500).json(response);
  }
};

/**
 * PUT /api/blocked-dates/:id
 * Update a blocked date (admin only)
 */
export const updateBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
    } = req.body as UpdateBlockedDateRequest;
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    // Check if blocked date exists
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT * FROM blocked_dates WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Blocked date not found",
      };
      return res.status(404).json(response);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (start_date !== undefined) {
      updates.push("start_date = ?");
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push("end_date = ?");
      params.push(end_date);
    }
    if (start_time !== undefined) {
      updates.push("start_time = ?");
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push("end_time = ?");
      params.push(end_time);
    }
    if (all_day !== undefined) {
      updates.push("all_day = ?");
      params.push(all_day);
    }
    if (reason !== undefined) {
      updates.push("reason = ?");
      params.push(reason);
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

    // Add id to params
    params.push(id);

    const query = `
      UPDATE blocked_dates
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await db.query(query, params);

    // Fetch updated blocked date
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM blocked_dates WHERE id = ?",
      [id],
    );

    const blockedDate: BlockedDate = rows[0] as BlockedDate;

    const response: ApiResponse<BlockedDate> = {
      success: true,
      data: blockedDate,
      message: "Blocked date updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating blocked date:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update blocked date",
    };
    res.status(500).json(response);
  }
};

/**
 * DELETE /api/blocked-dates/:id
 * Delete a blocked date (admin only)
 */
export const deleteBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "User not authenticated",
      };
      return res.status(401).json(response);
    }

    // Check if blocked date exists
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT * FROM blocked_dates WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: "Blocked date not found",
      };
      return res.status(404).json(response);
    }

    await db.query("DELETE FROM blocked_dates WHERE id = ?", [id]);

    const response: ApiResponse = {
      success: true,
      message: "Blocked date deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete blocked date",
    };
    res.status(500).json(response);
  }
};
