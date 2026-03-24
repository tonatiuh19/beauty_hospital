import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

const statements = [
  "ALTER TABLE appointments MODIFY COLUMN created_by INT(11) DEFAULT NULL COMMENT 'Admin/user ID who created the appointment, NULL for patient self-bookings'",
  "ALTER TABLE payments MODIFY COLUMN processed_by INT(11) DEFAULT NULL",
  "ALTER TABLE medical_records ADD COLUMN record_type ENUM('consultation','treatment','follow_up','diagnosis','prescription','lab_results') NOT NULL DEFAULT 'consultation' AFTER patient_id",
];

let hasError = false;
for (const stmt of statements) {
  console.log(
    "Running:",
    stmt.substring(0, 90) + (stmt.length > 90 ? "..." : ""),
  );
  try {
    await pool.query(stmt);
    console.log("  OK");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("  Already exists, skipping");
    } else {
      console.error("  ERROR:", e.message);
      hasError = true;
    }
  }
}

const [r1] = await pool.query(
  'SHOW COLUMNS FROM appointments WHERE Field = "created_by"',
);
console.log(
  "\nappointments.created_by => Null:",
  r1[0].Null,
  "| Default:",
  r1[0].Default,
);

const [r2] = await pool.query(
  'SHOW COLUMNS FROM payments WHERE Field = "processed_by"',
);
console.log(
  "payments.processed_by     => Null:",
  r2[0].Null,
  "| Default:",
  r2[0].Default,
);

await pool.end();
if (!hasError) console.log("\nMigration 008 applied successfully!");
else process.exit(1);
