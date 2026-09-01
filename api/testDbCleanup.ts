/**
 * Shared cleanup for API integration tests that seed rows into the shared TiDB.
 *
 * Usage in every suite that inserts patients/staff:
 *
 *   afterAll(async () => {
 *     await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID, patientIds, userIds });
 *     await pool?.end();
 *   });
 *
 * Ops purge (leftover @example.test emails + related orphans):
 *   npm run test:cleanup-fixtures
 *   npm run test:cleanup-fixtures -- --dry-run
 *
 * Safe domain only: @example.test. Never match real customer emails.
 *
 * IMPORTANT: Always pass `{ runId: RUN_ID }` — never a bare string.
 */
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const TEST_EMAIL_SUFFIX = "@example.test";

/** Unique +1555… E.164 for parallel integration tests. */
export function uniqueTestE164(seed?: string): string {
  const buf = crypto
    .createHash("sha256")
    .update(seed ?? `${process.pid}-${Date.now()}-${Math.random()}`)
    .digest();
  const n = buf.readUInt32BE(0) % 10_000_000;
  return `+1555${String(n).padStart(7, "0")}`;
}

export function uniqueTestEmail(runId: string, label: string): string {
  return `bh-${label}-${runId}${TEST_EMAIL_SUFFIX}`;
}

/** TiDB-safe pool for integration tests (keepAlive + connect timeout). */
export function createIntegrationTestPool(): Pool {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === "false"
        ? undefined
        : { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    timezone: "+00:00",
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout: 60_000,
  });
}

function isRetriableDbError(err: unknown): boolean {
  const code = String((err as NodeJS.ErrnoException)?.code || "");
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNREFUSED"
  );
}

/** Retry transient TiDB connect/query flakes during parallel vitest runs. */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = opts?.attempts ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 1500;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriableDbError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  throw lastErr;
}

export type CleanupRunOpts = {
  runId: string;
  patientIds?: number[];
  userIds?: number[];
};

/**
 * Normalize cleanup args. Historically callers sometimes passed a bare RUN_ID
 * string; that used to silently become LIKE '%undefined%' and leave TiDB junk.
 */
export function resolveCleanupRunId(
  opts: string | { runId?: unknown } | null | undefined,
  label: string,
): string {
  if (typeof opts === "string") {
    if (!opts.trim()) {
      throw new Error(
        `[testDbCleanup] ${label}: empty runId string — refusing cleanup`,
      );
    }
    console.warn(
      `[testDbCleanup] ${label}: pass { runId: "…" }, not a bare string (compat path)`,
    );
    return opts;
  }
  const runId =
    opts && typeof opts === "object" ? String(opts.runId ?? "").trim() : "";
  if (!runId) {
    throw new Error(
      `[testDbCleanup] ${label}: expected { runId: string } (got ${JSON.stringify(opts)}). ` +
        `Bare/missing runId previously left integration fixtures in TiDB.`,
    );
  }
  return runId;
}

function positiveIds(ids?: number[]): number[] {
  return [...new Set((ids ?? []).map(Number).filter((id) => id > 0))];
}

async function queryIds(
  pool: Pool,
  sql: string,
  params: unknown[],
): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows.map((r) => Number(r.id)).filter((id) => id > 0);
}

async function deleteWhereIn(
  pool: Pool,
  table: string,
  column: string,
  ids: number[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const [r] = await pool.query<ResultSetHeader>(
    `DELETE FROM ${table} WHERE ${column} IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  return Number(r.affectedRows ?? 0);
}

export function requireIntegrationEnv(): void {
  if (!process.env.DB_HOST || !process.env.JWT_SECRET) {
    throw new Error("DB_HOST / JWT_SECRET required for API integration tests");
  }
}

export function signTestAdminAccessToken(user: {
  id: number;
  email: string;
  role: string;
}): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: "admin" },
    jwtSecret,
    { expiresIn: "1h" },
  );
}

export function signTestAdminRefreshToken(userId: number): string {
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!refreshSecret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: userId, type: "admin_refresh" }, refreshSecret, {
    expiresIn: "7d",
  });
}

export async function insertTestStaffUser(
  pool: Pool,
  opts: {
    email: string;
    role: "admin" | "general_admin" | "receptionist" | "doctor" | "pos";
    firstName?: string;
    lastName?: string;
    phone?: string;
  },
): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO users
       (email, password_hash, role, first_name, last_name, phone, is_active, is_email_verified)
     VALUES (?, '', ?, ?, ?, ?, 1, 1)`,
    [
      opts.email,
      opts.role,
      opts.firstName ?? "Test",
      opts.lastName ?? "Staff",
      opts.phone ?? uniqueTestE164(opts.email),
    ],
  );
  return r.insertId;
}

export async function insertTestPatient(
  pool: Pool,
  opts: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  },
): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO patients
       (first_name, last_name, email, phone, is_active, is_email_verified, role)
     VALUES (?, ?, ?, ?, 1, 1, 'patient')`,
    [
      opts.firstName ?? "Test",
      opts.lastName ?? "Patient",
      opts.email,
      opts.phone ?? uniqueTestE164(opts.email),
    ],
  );
  return r.insertId;
}

export async function insertPatientSession(
  pool: Pool,
  patientId: number,
): Promise<void> {
  const sessionCode = 100000 + Math.floor(Math.random() * 900000);
  await pool.query(
    `INSERT INTO users_sessions
       (patient_id, session_code, user_session, user_session_date_start)
     VALUES (?, ?, 1, NOW())`,
    [patientId, sessionCode],
  );
}

export async function insertTestAppointment(
  pool: Pool,
  opts: {
    patientId: number;
    serviceId?: number;
    scheduledAt?: Date;
    createdBy?: number | null;
    checkInToken?: string | null;
    checkInExpiresAt?: Date | null;
    contractId?: number | null;
    status?: string;
  },
): Promise<number> {
  const scheduledAt =
    opts.scheduledAt ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO appointments
       (patient_id, service_id, status, scheduled_at, duration_minutes,
        created_by, booking_source, check_in_token, check_in_token_expires_at, contract_id)
     VALUES (?, ?, ?, ?, 60, ?, 'online', ?, ?, ?)`,
    [
      opts.patientId,
      opts.serviceId ?? 3,
      opts.status ?? "scheduled",
      scheduledAt,
      opts.createdBy ?? null,
      opts.checkInToken ?? null,
      opts.checkInExpiresAt ?? null,
      opts.contractId ?? null,
    ],
  );
  return r.insertId;
}

async function collectPatientIds(
  pool: Pool,
  runId: string,
  extraIds?: number[],
): Promise<number[]> {
  const fromEmail = await queryIds(
    pool,
    `SELECT id FROM patients WHERE email LIKE ? AND email LIKE ?`,
    [`%${runId}%`, `%${TEST_EMAIL_SUFFIX}`],
  );
  return [...new Set([...positiveIds(extraIds), ...fromEmail])];
}

async function collectUserIds(
  pool: Pool,
  runId: string,
  extraIds?: number[],
): Promise<number[]> {
  const fromEmail = await queryIds(
    pool,
    `SELECT id FROM users WHERE email LIKE ? AND email LIKE ?`,
    [`%${runId}%`, `%${TEST_EMAIL_SUFFIX}`],
  );
  return [...new Set([...positiveIds(extraIds), ...fromEmail])];
}

async function deletePatientGraph(pool: Pool, patientIds: number[]): Promise<void> {
  if (patientIds.length === 0) return;
  const appointmentIds = await queryIds(
    pool,
    `SELECT id FROM appointments WHERE patient_id IN (${patientIds.map(() => "?").join(",")})`,
    patientIds,
  );

  await deleteWhereIn(pool, "contract_emails", "patient_id", patientIds);
  await deleteWhereIn(pool, "check_in_logs", "appointment_id", appointmentIds);
  await deleteWhereIn(pool, "invoice_requests", "patient_id", patientIds);
  await deleteWhereIn(pool, "notifications", "patient_id", patientIds);
  await deleteWhereIn(pool, "appointment_reminders", "appointment_id", appointmentIds);
  await deleteWhereIn(pool, "coupon_usage", "patient_id", patientIds);
  await deleteWhereIn(pool, "payments", "patient_id", patientIds);

  if (appointmentIds.length > 0) {
    await pool.query(
      `UPDATE appointments SET contract_id = NULL WHERE id IN (${appointmentIds.map(() => "?").join(",")})`,
      appointmentIds,
    );
  }
  await deleteWhereIn(pool, "medical_records", "patient_id", patientIds);
  await deleteWhereIn(pool, "contracts", "patient_id", patientIds);
  await deleteWhereIn(pool, "appointments", "patient_id", patientIds);
  await deleteWhereIn(pool, "users_sessions", "patient_id", patientIds);
  await deleteWhereIn(pool, "refresh_tokens", "patient_id", patientIds);
  await deleteWhereIn(pool, "audit_logs", "patient_id", patientIds);
  await deleteWhereIn(pool, "patients", "id", patientIds);
}

async function deleteStaffGraph(pool: Pool, userIds: number[]): Promise<void> {
  if (userIds.length === 0) return;
  await deleteWhereIn(pool, "admin_sessions", "user_id", userIds);
  await deleteWhereIn(pool, "users_sessions", "user_id", userIds);
  await deleteWhereIn(pool, "refresh_tokens", "user_id", userIds);
  await deleteWhereIn(pool, "audit_logs", "user_id", userIds);
  await deleteWhereIn(pool, "users", "id", userIds);
}

export async function cleanupIntegrationTestFixtures(
  pool: Pool,
  opts: string | CleanupRunOpts,
): Promise<void> {
  const runId = resolveCleanupRunId(opts, "cleanupIntegrationTestFixtures");
  const extraPatients =
    typeof opts === "object" && opts ? opts.patientIds : undefined;
  const extraUsers =
    typeof opts === "object" && opts ? opts.userIds : undefined;

  const patientIds = await collectPatientIds(pool, runId, extraPatients);
  const userIds = await collectUserIds(pool, runId, extraUsers);

  await deletePatientGraph(pool, patientIds);
  await deleteStaffGraph(pool, userIds);
}

export async function previewExampleTestFixtures(pool: Pool): Promise<{
  patients: number;
  users: number;
}> {
  const [patients] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM patients WHERE email LIKE ?`,
    [`%${TEST_EMAIL_SUFFIX}`],
  );
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM users WHERE email LIKE ?`,
    [`%${TEST_EMAIL_SUFFIX}`],
  );
  return {
    patients: Number(patients[0]?.c ?? 0),
    users: Number(users[0]?.c ?? 0),
  };
}

/** Ops purge: every leftover @example.test patient/staff row. */
export async function purgeAllExampleTestFixtures(pool: Pool): Promise<void> {
  const patientIds = await queryIds(
    pool,
    `SELECT id FROM patients WHERE email LIKE ?`,
    [`%${TEST_EMAIL_SUFFIX}`],
  );
  const userIds = await queryIds(
    pool,
    `SELECT id FROM users WHERE email LIKE ?`,
    [`%${TEST_EMAIL_SUFFIX}`],
  );
  await deletePatientGraph(pool, patientIds);
  await deleteStaffGraph(pool, userIds);
}
