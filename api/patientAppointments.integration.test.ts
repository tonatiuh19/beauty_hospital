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

  it("allows reschedule of a confirmed upcoming appointment", async () => {
    const confirmedId = await insertTestAppointment(pool, {
      patientId: ownerId,
      createdBy: null,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "confirmed",
    });
    const res = await request(app)
      .get("/api/patient/appointments")
      .query({ patient_id: ownerId });
    expect(res.status).toBe(200);
    const found = res.body.data.appointments.find(
      (a: { id: number }) => Number(a.id) === confirmedId,
    );
    expect(found?.can_edit).toBe(true);
  });

  it("lists a booking paid for someone else under the booker", async () => {
    const giftedId = await insertTestAppointment(pool, {
      patientId: otherId,
      createdBy: null,
      bookedByPatientId: ownerId,
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: "confirmed",
    });
    const res = await request(app)
      .get("/api/patient/appointments")
      .query({ patient_id: ownerId });
    expect(res.status).toBe(200);
    const ids = res.body.data.appointments.map((a: { id: number }) =>
      Number(a.id),
    );
    expect(ids).toContain(giftedId);
  });

  it("cancels with less than 24h notice without a refund", async () => {
    const soonId = await insertTestAppointment(pool, {
      patientId: ownerId,
      createdBy: null,
      scheduledAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
    });
    await pool.query(
      `INSERT INTO payments
         (appointment_id, patient_id, amount, payment_method, payment_status)
       VALUES (?, ?, 1500.00, 'cash', 'completed')`,
      [soonId, ownerId],
    );
    const res = await request(app)
      .patch(`/api/patient/appointments/${soonId}/cancel`)
      .send({
        patient_id: ownerId,
        cancellation_reason: "Menos de 24h",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.refund_eligible).toBe(false);
    expect(res.body.data.penalization_applied).toBe(true);
    expect(res.body.data.refund_processed).toBe(false);
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
