import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  multipleStatements: true,
});

const sqlFile = path.resolve("server/db/migrations/010_delete_patient_11.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

// Split on semicolons, filter blanks and comments-only lines
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

let hasError = false;
for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, " ").trim().substring(0, 90);
  console.log("Running:", preview + (stmt.length > 90 ? "..." : ""));
  try {
    const [result] = await pool.query(stmt);
    console.log(`  OK — affected rows: ${result.affectedRows ?? "n/a"}`);
  } catch (e) {
    console.error("  ERROR:", e.message);
    hasError = true;
    break;
  }
}

// Verify patient is gone
const [rows] = await pool.query("SELECT id FROM patients WHERE id = 11");
if (rows.length === 0) {
  console.log("\n✅ Migration 010 applied — patient 11 deleted successfully.");
} else {
  console.error("\n❌ Patient 11 still exists — check errors above.");
}

await pool.end();
if (hasError) process.exit(1);
