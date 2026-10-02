/**
 * Edge-case coverage for public content, RBAC cancel, and contract filters.
 */
import "dotenv/config";
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
  signTestAdminAccessToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `platform-${Date.now()}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
const patientIds: number[] = [];

let doctor = { id: 0, email: "", role: "doctor" };
let appointmentId = 0;

describe("platform edge flows", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    doctor.email = uniqueTestEmail(RUN_ID, "doc");
    doctor.id = await insertTestStaffUser(pool, {
      email: doctor.email,
      role: "doctor",
      lastName: RUN_ID,
    });
    userIds.push(doctor.id);

    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "pat"),
      firstName: "Edge",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);

    appointmentId = await insertTestAppointment(pool, {
      patientId,
      createdBy: null,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
  }, 60_000);

  afterAll(async () => {
    try {
      if (pool) {
        await cleanupIntegrationTestFixtures(pool, {
          runId: RUN_ID,
          userIds,
          patientIds,
        });
      }
    } finally {
      await pool?.end();
    }
  });

  it("serves published legal content without auth", async () => {
    const res = await request(app).get("/api/content/terms-and-conditions");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe("terms-and-conditions");
    expect(res.body.data.title).toBeTruthy();
  });

  it("returns 404 for an unpublished or missing content slug", async () => {
    const res = await request(app).get("/api/content/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("forbids a doctor from cancelling a calendar appointment", async () => {
    const token = signTestAdminAccessToken(doctor);
    const res = await request(app)
      .post(`/api/admin/appointments/${appointmentId}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "doctor should not cancel" });
    expect(res.status).toBe(403);
  });

  it("filters contracts by real DB status values", async () => {
    const staffEmail = uniqueTestEmail(RUN_ID, "ga");
    const staffId = await insertTestStaffUser(pool, {
      email: staffEmail,
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(staffId);
    const token = signTestAdminAccessToken({
      id: staffId,
      email: staffEmail,
      role: "general_admin",
    });
    const res = await request(app)
      .get("/api/admin/contracts")
      .query({ status: "signed" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const statuses = (res.body.data.contracts as Array<{ status: string }>).map(
      (c) => c.status,
    );
    expect(statuses.every((s) => s === "signed")).toBe(true);
  });

  it("rejects a Stripe refund when the row has no PaymentIntent or charge", async () => {
    const staffEmail = uniqueTestEmail(RUN_ID, "refund-ga");
    const staffId = await insertTestStaffUser(pool, {
      email: staffEmail,
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(staffId);
    const token = signTestAdminAccessToken({
      id: staffId,
      email: staffEmail,
      role: "general_admin",
    });

    const [inserted] = await pool.query<ResultSetHeader>(
      `INSERT INTO payments
         (patient_id, amount, payment_method, payment_status, refund_status, refund_amount)
       VALUES (?, 1500.00, 'stripe', 'completed', 'pending', 1500.00)`,
      [patientIds[0]],
    );
    const paymentId = inserted.insertId;

    const requestRes = await request(app)
      .post(`/api/admin/payments/${paymentId}/refund`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1500, reason: "sin PI" });
    expect(requestRes.status).toBe(400);
    expect(requestRes.body.message).toMatch(/PaymentIntent|Stripe/i);

    const approveRes = await request(app)
      .post(`/api/admin/payments/${paymentId}/approve-refund`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(approveRes.status).toBe(400);
    expect(approveRes.body.message).toMatch(/PaymentIntent|Stripe/i);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT payment_status, refund_status FROM payments WHERE id = ?",
      [paymentId],
    );
    expect(rows[0].payment_status).toBe("completed");
    expect(rows[0].refund_status).toBe("pending");
  });
});
