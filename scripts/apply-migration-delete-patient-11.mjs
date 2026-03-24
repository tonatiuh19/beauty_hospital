import "dotenv/config";
import mysql from "mysql2/promise";

const PATIENT_ID = 11;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
});

// Deletion order respects FK constraints:
// leaf records first → appointments/contracts last → patient row last
const statements = [
  // Session tokens
  `DELETE FROM users_sessions WHERE patient_id = ${PATIENT_ID}`,
  `DELETE FROM refresh_tokens WHERE patient_id = ${PATIENT_ID}`,

  // Audit & notifications
  `DELETE FROM audit_logs WHERE patient_id = ${PATIENT_ID}`,
  `DELETE FROM notifications WHERE patient_id = ${PATIENT_ID}`,

  // Coupon usage & invoices
  `DELETE FROM coupon_usage WHERE patient_id = ${PATIENT_ID}`,
  `DELETE FROM invoice_requests WHERE patient_id = ${PATIENT_ID}`,

  // Medical media (child of medical_records)
  `DELETE mm FROM medical_media mm
   INNER JOIN medical_records mr ON mm.medical_record_id = mr.id
   WHERE mr.patient_id = ${PATIENT_ID}`,

  // Medical records
  `DELETE FROM medical_records WHERE patient_id = ${PATIENT_ID}`,

  // Check-in logs and appointment reminders (children of appointments)
  `DELETE cl FROM check_in_logs cl
   INNER JOIN appointments a ON cl.appointment_id = a.id
   WHERE a.patient_id = ${PATIENT_ID}`,

  `DELETE ar FROM appointment_reminders ar
   INNER JOIN appointments a ON ar.appointment_id = a.id
   WHERE a.patient_id = ${PATIENT_ID}`,

  // Null out appointments.contract_id before deleting contracts (FK constraint)
  `UPDATE appointments SET contract_id = NULL WHERE patient_id = ${PATIENT_ID}`,

  // Payments
  `DELETE FROM payments WHERE patient_id = ${PATIENT_ID}`,

  // Appointments
  `DELETE FROM appointments WHERE patient_id = ${PATIENT_ID}`,

  // Contract emails and contracts
  `DELETE FROM contract_emails WHERE patient_id = ${PATIENT_ID}`,
  `DELETE FROM contracts WHERE patient_id = ${PATIENT_ID}`,

  // Finally, delete the patient record itself
  `DELETE FROM patients WHERE id = ${PATIENT_ID}`,
];

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
    break; // stop on first error to avoid cascading issues
  }
}

// Verify patient is gone
const [rows] = await pool.query(
  `SELECT id FROM patients WHERE id = ${PATIENT_ID}`,
);
if (rows.length === 0) {
  console.log(`\n✅ Patient ${PATIENT_ID} successfully deleted.`);
} else {
  console.error(
    `\n❌ Patient ${PATIENT_ID} still exists — check errors above.`,
  );
}

await pool.end();
if (hasError) process.exit(1);
