/**
 * Patient appointment cancel ownership — HTTP integration tests.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertPatientSession,
  insertTestAppointment,
  insertTestPatient,
  requireIntegrationEnv,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `patcancel-${Date.now()}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const patientIds: number[] = [];

let ownerId = 0;
let otherId = 0;
let ownedAppointmentId = 0;
let otherAppointmentId = 0;
let pastAppointmentId = 0;

describe("patient cancel ownership", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    ownerId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "owner"),
      firstName: "Owner",
      lastName: RUN_ID,
    });
    otherId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "other"),
      firstName: "Other",
      lastName: RUN_ID,
    });
    patientIds.push(ownerId, otherId);

    await insertPatientSession(pool, ownerId);

    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    ownedAppointmentId = await insertTestAppointment(pool, {
      patientId: ownerId,
      createdBy: null,
      scheduledAt: future,
    });
    otherAppointmentId = await insertTestAppointment(pool, {
      patientId: otherId,
      createdBy: null,
      scheduledAt: future,
    });
    pastAppointmentId = await insertTestAppointment(pool, {
      patientId: ownerId,
      createdBy: null,
      scheduledAt: past,
    });
  }, 60_000);

  afterAll(async () => {
    try {
      if (pool) {
        await cleanupIntegrationTestFixtures(pool, {
          runId: RUN_ID,
          patientIds,
        });
      }
    } finally {
      await pool?.end();
    }
  });

  it("requires auth to list appointments", async () => {
    const res = await request(app)
      .get("/api/appointments")
      .query({ patientId: otherId });
    expect(res.status).toBe(401);
  });

  it("rejects cancel without a patient session", async () => {
    const res = await request(app)
      .patch(`/api/patient/appointments/${otherAppointmentId}/cancel`)
      .send({
        patient_id: otherId,
        cancellation_reason: "No session",
      });
    expect(res.status).toBe(401);
  });

  it("rejects cancel of another patient's appointment (created_by NULL)", async () => {
    const res = await request(app)
      .patch(`/api/patient/appointments/${otherAppointmentId}/cancel`)
      .send({
        patient_id: ownerId,
        cancellation_reason: "Not mine",
      });
    expect(res.status).toBe(404);
  });

  it("cancels a future self-booked appointment via PATCH", async () => {
    const res = await request(app)
      .patch(`/api/patient/appointments/${ownedAppointmentId}/cancel`)
      .send({
        patient_id: ownerId,
        cancellation_reason: "Cambio de planes",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointment_id).toBe(String(ownedAppointmentId));

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT status FROM appointments WHERE id = ?`,
      [ownedAppointmentId],
    );
    expect(rows[0]?.status).toBe("cancelled");
  });

  it("does not cancel past appointments", async () => {
    const res = await request(app)
      .patch(`/api/patient/appointments/${pastAppointmentId}/cancel`)
      .send({
        patient_id: ownerId,
        cancellation_reason: "Too late",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });
});
