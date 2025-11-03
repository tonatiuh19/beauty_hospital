import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "beauty_hospital",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable SSL for production databases (recommended for Hostgator, etc.)
  ...(process.env.DB_SSL === "true" && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[],
): Promise<T | null> {
  try {
    const [rows] = await pool.execute(sql, params);
    const results = rows as T[];
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close all connections in the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log("Database connection pool closed");
}

export default pool;
