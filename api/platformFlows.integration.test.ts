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
  uniqueTestE164,
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

  it("lists Venus packages with one-area catalogs and full package prices", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    const list = res.body.data as Array<{
      name: string;
      price: number;
      package_sessions: number;
      legal_template: string;
      area_catalog: Array<{ id: string; price?: number }>;
    }>;
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((s) => Array.isArray(s.area_catalog) && s.area_catalog.length > 0)).toBe(true);
    expect(list.every((s) => s.package_sessions >= 5)).toBe(true);
    expect(list.some((s) => s.name.includes("Bliss") && s.price === 25000)).toBe(true);
    const velocity = list.filter((s) => s.legal_template === "velocity");
    expect(velocity.length).toBeGreaterThan(0);
    expect(
      velocity.every((s) => s.area_catalog.every((area) => Number(area.price) > 0)),
    ).toBe(true);
  });

  it("rejects a Velocity booking with more than four zones", async () => {
    const [svc] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM services WHERE is_active = 1 AND legal_template = 'velocity' LIMIT 1`,
    );
    expect(svc.length).toBeGreaterThan(0);
    const res = await request(app)
      .post("/api/appointments/book-with-payment")
      .send({
        service_id: svc[0].id,
        scheduled_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        selected_areas: [
          "bigote",
          "axilas",
          "bikini",
          "brazo_completo",
          "pecho_completo",
        ],
        payment_amount: 11900,
        accepted_terms: true,
        accepted_privacy: true,
        patient_info: {
          first_name: "Vel",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "vel5"),
          phone: uniqueTestE164(RUN_ID),
        },
      });
    expect(res.status).toBe(400);
    expect(String(res.body.error || res.body.message)).toMatch(/4 zonas|zona/i);
  });

  it("evaluates the Velocity 90% guarantee from hair counts", async () => {
    const staffEmail = uniqueTestEmail(RUN_ID, "vel-ga");
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
    const [svc] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM services WHERE is_active = 1 AND legal_template = 'velocity' LIMIT 1`,
    );
    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, contract_number, status, total_amount, sessions_included,
          terms_and_conditions, created_by)
       VALUES (?, ?, 'velocity', 'Axilas', ?, 'pending_baseline', ?, 'signed', 14900, 10, 'test', ?)`,
      [
        patientIds[0],
        svc[0].id,
        JSON.stringify([{ id: "axilas", label: "Axilas", size: "mediana", price: 14900 }]),
        `CON-${RUN_ID}-vel`,
        staffId,
      ],
    );
    const contractId = created.insertId;

    const emptyEval = await request(app)
      .post(`/api/admin/contracts/${contractId}/evaluate-guarantee`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(emptyEval.status).toBe(400);

    const save = await request(app)
      .post(`/api/admin/contracts/${contractId}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        zone_id: "axilas",
        zone_label: "Axilas",
        baseline_count: 100,
        final_count: 20,
      });
    expect(save.status).toBe(200);

    const evalRes = await request(app)
      .post(`/api/admin/contracts/${contractId}/evaluate-guarantee`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(evalRes.status).toBe(200);
    expect(evalRes.body.data.guarantee_status).toBe("active");

    await request(app)
      .post(`/api/admin/contracts/${contractId}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        zone_id: "axilas",
        final_count: 8,
      });
    const metRes = await request(app)
      .post(`/api/admin/contracts/${contractId}/evaluate-guarantee`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(metRes.status).toBe(200);
    expect(metRes.body.data.guarantee_status).toBe("met");
  });

  it("rejects a Venus booking without exactly one catalog area", async () => {
    const [svc] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM services WHERE is_active = 1 AND legal_template IS NOT NULL LIMIT 1`,
    );
    expect(svc.length).toBeGreaterThan(0);
    const res = await request(app)
      .post("/api/appointments/book-with-payment")
      .send({
        service_id: svc[0].id,
        scheduled_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        selected_areas: [],
        payment_amount: 25000,
        accepted_terms: true,
        accepted_privacy: true,
        patient_info: {
          first_name: "Area",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "area"),
          phone: uniqueTestE164(RUN_ID),
        },
      });
    expect(res.status).toBe(400);
    expect(String(res.body.error || res.body.message)).toMatch(/zona|área/i);
  });
});
