/**
 * QR check-in updates the existing draft contract instead of inserting a duplicate.
 */
import "dotenv/config";
import crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertTestAppointment,
  insertTestPatient,
  insertTestStaffUser,
  requireIntegrationEnv,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `checkin-${Date.now()}`;
const TOKEN = crypto.randomBytes(24).toString("hex");
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

let pool: Pool;
let app: ReturnType<typeof createServer>;
const patientIds: number[] = [];
const userIds: number[] = [];

let patientId = 0;
let appointmentId = 0;
let contractId = 0;

describe("check-in contract link", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "checkin"),
      firstName: "Checkin",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);

    const staffId = await insertTestStaffUser(pool, {
      email: uniqueTestEmail(RUN_ID, "checkin-staff"),
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(staffId);

    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, contract_number, status, total_amount,
          sessions_included, terms_and_conditions, created_by)
       VALUES (?, 3, ?, 'draft', 1500.00, 1, 'Términos de prueba check-in', ?)`,
      [patientId, `CON-TEST-${RUN_ID}`, staffId],
    );
    contractId = created.insertId;

    appointmentId = await insertTestAppointment(pool, {
      patientId,
      createdBy: null,
      checkInToken: TOKEN,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      contractId,
    });
  }, 60_000);

  afterAll(async () => {
    try {
      if (pool) {
        await cleanupIntegrationTestFixtures(pool, {
          runId: RUN_ID,
          patientIds,
          userIds,
        });
      }
    } finally {
      await pool?.end();
    }
  });

  it("requires signature fields", async () => {
    const res = await request(app).post("/api/check-in/complete").send({
      token: TOKEN,
    });
    expect(res.status).toBe(400);
  });

  it("signs the existing draft contract and links it on the appointment", async () => {
    const [before] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM contracts WHERE patient_id = ?`,
      [patientId],
    );

    const res = await request(app).post("/api/check-in/complete").send({
      token: TOKEN,
      signature_data: SIGNATURE,
      terms_accepted: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointment_id).toBe(appointmentId);
    expect(res.body.data.contract_number).toBe(`CON-TEST-${RUN_ID}`);

    const [after] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM contracts WHERE patient_id = ?`,
      [patientId],
    );
    expect(Number(after[0].c)).toBe(Number(before[0].c));

    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT id, status, signed_at, signature_data FROM contracts WHERE id = ?`,
      [contractId],
    );
    expect(contracts[0].status).toBe("signed");
    expect(contracts[0].signed_at).toBeTruthy();
    expect(contracts[0].signature_data).toBe(SIGNATURE);

    const [appts] = await pool.query<RowDataPacket[]>(
      `SELECT contract_id, check_in_at, status FROM appointments WHERE id = ?`,
      [appointmentId],
    );
    expect(Number(appts[0].contract_id)).toBe(contractId);
    expect(appts[0].check_in_at).toBeTruthy();
    expect(appts[0].status).toBe("confirmed");
  });

  it("creates a signed contract without hardcoding deleted user 1", async () => {
    const token = crypto.randomBytes(24).toString("hex");
    const walkInId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "walkin-sign"),
      firstName: "Walkin",
      lastName: RUN_ID,
    });
    patientIds.push(walkInId);

    await insertTestAppointment(pool, {
      patientId: walkInId,
      createdBy: userIds[0],
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const res = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT created_by FROM contracts WHERE patient_id = ? ORDER BY id DESC LIMIT 1`,
      [walkInId],
    );
    expect(Number(contracts[0].created_by)).toBe(userIds[0]);
    expect(Number(contracts[0].created_by)).not.toBe(1);
  });

  it("rejects a second check-in for the same token", async () => {
    const res = await request(app).post("/api/check-in/complete").send({
      token: TOKEN,
      signature_data: SIGNATURE,
      terms_accepted: true,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ya fue registrada/i);
  });
});
