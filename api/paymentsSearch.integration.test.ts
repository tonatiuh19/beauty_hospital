/**
 * Admin payments search — HTTP integration tests.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, ResultSetHeader } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertTestPatient,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `paysearch-${Date.now()}`;
const SEARCH_NAME = `Pay${RUN_ID}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const patientIds: number[] = [];
const userIds: number[] = [];

let admin = { id: 0, email: "", role: "general_admin" };
let patientId = 0;
let paymentId = 0;

describe("admin payments search", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    admin.email = uniqueTestEmail(RUN_ID, "payadmin");
    admin.id = await insertTestStaffUser(pool, {
      email: admin.email,
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(admin.id);

    patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "paypat"),
      firstName: "Pago",
      lastName: SEARCH_NAME,
    });
    patientIds.push(patientId);

    const [pay] = await pool.query<ResultSetHeader>(
      `INSERT INTO payments
         (patient_id, amount, payment_method, payment_status)
       VALUES (?, 1500.00, 'cash', 'completed')`,
      [patientId],
    );
    paymentId = pay.insertId;
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

  it("finds a payment by patient last name", async () => {
    const token = signTestAdminAccessToken(admin);
    const res = await request(app)
      .get("/api/admin/payments")
      .query({ search: SEARCH_NAME })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = (res.body.data as Array<{ id: number }>).map((p) =>
      Number(p.id),
    );
    expect(ids).toContain(paymentId);
    expect(
      (res.body.data as Array<{ patient_last_name: string }>).every((p) =>
        String(p.patient_last_name).includes(SEARCH_NAME),
      ),
    ).toBe(true);
  });

  it("finds a payment by email fragment", async () => {
    const token = signTestAdminAccessToken(admin);
    const res = await request(app)
      .get("/api/admin/payments")
      .query({ search: `paypat-${RUN_ID}` })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: number }>).map((p) =>
      Number(p.id),
    );
    expect(ids).toContain(paymentId);
  });

  it("does not return the fixture for an unrelated search", async () => {
    const token = signTestAdminAccessToken(admin);
    const res = await request(app)
      .get("/api/admin/payments")
      .query({ search: `no-such-patient-${RUN_ID}` })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: number }>).map((p) =>
      Number(p.id),
    );
    expect(ids).not.toContain(paymentId);
  });
});
