/**
 * Admin patient create + manual appointment with a new walk-in patient.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `adminpat-${Date.now()}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
const patientIds: number[] = [];

let staff = { id: 0, email: "", role: "general_admin" };

describe("admin patients and manual appointments", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    staff.email = uniqueTestEmail(RUN_ID, "staff");
    staff.id = await insertTestStaffUser(pool, {
      email: staff.email,
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(staff.id);
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

  it("lists public blocked dates without a 500", async () => {
    const res = await request(app)
      .get("/api/blocked-dates")
      .query({ start_date: "2026-08-01", end_date: "2026-12-31" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data?.items)).toBe(true);
  });

  it("creates a patient from the admin panel", async () => {
    const email = uniqueTestEmail(RUN_ID, "walkin");
    const token = signTestAdminAccessToken(staff);
    const res = await request(app)
      .post("/api/admin/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        first_name: "Nueva",
        last_name: RUN_ID,
        email,
        phone: "5511112222",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    patientIds.push(res.body.data.id);

    const dup = await request(app)
      .post("/api/admin/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        first_name: "Nueva",
        last_name: RUN_ID,
        email,
        phone: "5511112222",
      });
    expect(dup.status).toBe(409);
  });

  it("creates a manual appointment by inserting a new patient", async () => {
    const email = uniqueTestEmail(RUN_ID, "manual");
    const token = signTestAdminAccessToken(staff);
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-09-15",
        scheduled_time: "10:00",
        payment_amount: 0,
        payment_method: "cash",
        notes: "walk-in test",
        new_patient: {
          first_name: "Cita",
          last_name: RUN_ID,
          email,
          phone: "5522223333",
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient_id).toBeTruthy();
    patientIds.push(res.body.data.patient_id);
  });

  it("records a walk-in payment and maps card to credit_card", async () => {
    const email = uniqueTestEmail(RUN_ID, "pay");
    const token = signTestAdminAccessToken(staff);
    const patientRes = await request(app)
      .post("/api/admin/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        first_name: "Pago",
        last_name: RUN_ID,
        email,
        phone: "5533334444",
      });
    expect(patientRes.status).toBe(201);
    const patientId = patientRes.body.data.id;
    patientIds.push(patientId);

    const payRes = await request(app)
      .post("/api/admin/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        amount: 250,
        payment_method: "card",
        notes: "manual flow audit",
      });
    expect(payRes.status).toBe(201);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.data.payment_method).toBe("credit_card");
    expect(Number(payRes.body.data.amount)).toBe(250);
  });

  it("creates a paid manual appointment with card without a SQL enum error", async () => {
    const email = uniqueTestEmail(RUN_ID, "paid-card");
    const token = signTestAdminAccessToken(staff);
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-09-16",
        scheduled_time: "14:30",
        payment_amount: 100,
        payment_method: "card",
        new_patient: {
          first_name: "Tarjeta",
          last_name: RUN_ID,
          email,
          phone: "5544445555",
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.patient_id).toBeTruthy();
    patientIds.push(res.body.data.patient_id);
  });

  it("creates a draft contract with the JWT admin as created_by", async () => {
    const email = uniqueTestEmail(RUN_ID, "contract");
    const token = signTestAdminAccessToken(staff);
    const patientRes = await request(app)
      .post("/api/admin/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        first_name: "Contrato",
        last_name: RUN_ID,
        email,
        phone: "5555556666",
      });
    expect(patientRes.status).toBe(201);
    const patientId = patientRes.body.data.id;
    patientIds.push(patientId);

    const res = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        service_id: 3,
        total_amount: 1500,
        sessions_included: 1,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contract_id).toBeTruthy();

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT created_by FROM contracts WHERE id = ?",
      [res.body.data.contract_id],
    );
    expect(Number(rows[0].created_by)).toBe(staff.id);
  });

  it("creates a coupon from the JWT instead of a body created_by", async () => {
    const token = signTestAdminAccessToken(staff);
    const code = `BH${RUN_ID.slice(-8)}`.toUpperCase();
    const res = await request(app)
      .post("/api/admin/settings/coupons")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code,
        description: "manual flow audit",
        discount_type: "percentage",
        discount_value: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.created_by)).toBe(staff.id);
    await pool.query("DELETE FROM coupons WHERE code = ?", [code]);
  });

  it("creates a content page with the JWT admin as created_by", async () => {
    const token = signTestAdminAccessToken(staff);
    const slug = `audit-${RUN_ID}`.slice(0, 90);
    const res = await request(app)
      .post("/api/admin/settings/content-pages")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug,
        title: "Audit page",
        content: "<p>Manual flow audit</p>",
        is_published: false,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.page_id).toBeTruthy();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT created_by FROM content_pages WHERE id = ?",
      [res.body.page_id],
    );
    expect(Number(rows[0].created_by)).toBe(staff.id);
    await pool.query("DELETE FROM content_pages WHERE id = ?", [
      res.body.page_id,
    ]);
  });

  it("rejects manual appointment without patient or new_patient", async () => {
    const token = signTestAdminAccessToken(staff);
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-09-15",
        scheduled_time: "11:00",
      });
    expect(res.status).toBe(400);
  });
});
