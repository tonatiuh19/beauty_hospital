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
  insertTestAppointment,
  insertTestPatient,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `adminpat-${Date.now()}`;
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
const blockedDateIds: number[] = [];

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
        if (blockedDateIds.length) {
          await pool.query(
            `DELETE FROM blocked_dates WHERE id IN (${blockedDateIds.map(() => "?").join(",")})`,
            blockedDateIds,
          );
        }
        await pool.query("DELETE FROM blocked_dates WHERE reason LIKE ?", [
          `%${RUN_ID}%`,
        ]);
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

  it("persists patient notes on PATCH", async () => {
    const email = uniqueTestEmail(RUN_ID, "notes");
    const token = signTestAdminAccessToken(staff);
    const created = await request(app)
      .post("/api/admin/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        first_name: "Notas",
        last_name: RUN_ID,
        email,
        phone: "5566667777",
      });
    expect(created.status).toBe(201);
    const patientId = created.body.data.id;
    patientIds.push(patientId);

    const patch = await request(app)
      .patch(`/api/admin/patients/${patientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notes: "Alergia a lidocaína" });
    expect(patch.status).toBe(200);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT notes FROM patients WHERE id = ?",
      [patientId],
    );
    expect(rows[0].notes).toBe("Alergia a lidocaína");
  });

  it("rejects an unknown payment method instead of storing cash", async () => {
    const token = signTestAdminAccessToken(staff);
    const res = await request(app)
      .post("/api/admin/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientIds[0],
        amount: 100,
        payment_method: "bogus",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/método de pago/i);
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

  it("rejects Venus manual appointments without a catalog zone", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-bliss-zone");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150002,
        scheduled_date: "2026-10-20",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        new_patient: {
          first_name: "Sinzona",
          last_name: RUN_ID,
          email,
          phone: "5566667777",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zona/i);
    const [orphans] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM patients WHERE email = ?",
      [email],
    );
    expect(orphans).toHaveLength(0);
  });

  it("rejects Velocity manual appointments with more than 4 zones", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-vel-5");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150005,
        scheduled_date: "2026-10-21",
        scheduled_time: "09:30",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["bigote", "patillas", "axilas", "bikini", "gluteos"],
        new_patient: {
          first_name: "Cincoz",
          last_name: RUN_ID,
          email,
          phone: "5577778888",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/4 zonas/i);
  });

  it("records catalog Bliss price, official draft contract, and JWT created_by", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-bliss");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150002,
        scheduled_date: "2026-10-22",
        scheduled_time: "11:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["abdomen_alto"],
        created_by: 999999,
        notes: "recepción walk-in",
        new_patient: {
          first_name: "Manbliss",
          last_name: RUN_ID,
          email,
          phone: "5588889999",
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.contract_id).toBeTruthy();
    expect(res.body.data.skip_payment).toBe(false);
    expect(Number(res.body.data.catalog_amount)).toBe(25000);
    patientIds.push(res.body.data.patient_id);

    const [apts] = await pool.query<RowDataPacket[]>(
      `SELECT created_by, contract_id, notes, duration_minutes
         FROM appointments WHERE id = ?`,
      [res.body.data.id],
    );
    expect(apts[0].created_by).toBe(staff.id);
    expect(apts[0].contract_id).toBe(res.body.data.contract_id);
    expect(String(apts[0].notes)).toMatch(/Área: Abdomen alto/);
    expect(Number(apts[0].duration_minutes)).toBe(60);

    const [pays] = await pool.query<RowDataPacket[]>(
      `SELECT amount FROM payments WHERE appointment_id = ?`,
      [res.body.data.id],
    );
    expect(Number(pays[0].amount)).toBe(25000);

    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, sessions_included, total_amount, terms_and_conditions,
              guarantee_status, selected_zone, created_by
         FROM contracts WHERE id = ?`,
      [res.body.data.contract_id],
    );
    expect(contracts[0].legal_template).toBe("bliss");
    expect(Number(contracts[0].sessions_included)).toBe(5);
    expect(Number(contracts[0].total_amount)).toBe(25000);
    expect(String(contracts[0].terms_and_conditions)).toMatch(/Venus Bliss/i);
    expect(contracts[0].guarantee_status).toBe("not_applicable");
    expect(contracts[0].selected_zone).toBe("Abdomen alto");
    expect(contracts[0].created_by).toBe(staff.id);
  });

  it("creates a Venus draft contract without collecting payment", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-later");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150002,
        scheduled_date: "2026-10-24",
        scheduled_time: "12:00",
        payment_amount: 0,
        payment_method: "cash",
        selected_areas: ["cintura"],
        new_patient: {
          first_name: "Manlater",
          last_name: RUN_ID,
          email,
          phone: "5510102020",
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.contract_id).toBeTruthy();
    expect(res.body.data.skip_payment).toBe(false);
    expect(Number(res.body.data.catalog_amount)).toBe(25000);
    patientIds.push(res.body.data.patient_id);
    const [pays] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM payments WHERE appointment_id = ?`,
      [res.body.data.id],
    );
    expect(pays).toHaveLength(0);
  });

  it("prices mixed Velocity zones from catalog, then skips remaining sessions", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-vel");
    const first = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150005,
        scheduled_date: "2026-10-23",
        scheduled_time: "10:00",
        payment_amount: 1,
        payment_method: "card",
        selected_areas: ["bigote", "axilas"],
        new_patient: {
          first_name: "Manvel",
          last_name: RUN_ID,
          email,
          phone: "5599990000",
        },
      });
    expect(first.status).toBe(201);
    expect(first.body.data.skip_payment).toBe(false);
    expect(Number(first.body.data.catalog_amount)).toBe(26800);
    expect(Number(first.body.data.duration_minutes)).toBe(60);
    const patientId = first.body.data.patient_id;
    const contractId = first.body.data.contract_id;
    patientIds.push(patientId);

    const [pays] = await pool.query<RowDataPacket[]>(
      `SELECT amount, payment_method FROM payments WHERE appointment_id = ?`,
      [first.body.data.id],
    );
    expect(Number(pays[0].amount)).toBe(26800);
    expect(pays[0].payment_method).toBe("credit_card");

    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, sessions_included, total_amount, terms_and_conditions,
              guarantee_status, selected_zones
         FROM contracts WHERE id = ?`,
      [contractId],
    );
    expect(contracts[0].legal_template).toBe("velocity");
    expect(Number(contracts[0].sessions_included)).toBe(10);
    expect(Number(contracts[0].total_amount)).toBe(26800);
    expect(contracts[0].guarantee_status).toBe("pending_baseline");
    expect(String(contracts[0].terms_and_conditions)).toMatch(/Póliza de garantía/i);
    const rawZones = contracts[0].selected_zones;
    const zones =
      typeof rawZones === "string" ? JSON.parse(rawZones || "[]") : rawZones;
    expect(Array.isArray(zones)).toBe(true);
    expect(zones).toHaveLength(2);

    const [apts] = await pool.query<RowDataPacket[]>(
      `SELECT notes, duration_minutes FROM appointments WHERE id = ?`,
      [first.body.data.id],
    );
    expect(String(apts[0].notes)).toMatch(/Área: Bigote, Axilas/);
    expect(Number(apts[0].duration_minutes)).toBe(60);

    const second = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        service_id: 150005,
        scheduled_date: "2026-11-20",
        scheduled_time: "10:00",
        payment_amount: 26800,
        payment_method: "cash",
        selected_areas: ["bigote", "axilas"],
      });
    expect(second.status).toBe(201);
    expect(second.body.data.skip_payment).toBe(true);
    expect(second.body.data.contract_id).toBe(contractId);

    const [secondPays] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM payments WHERE appointment_id = ?`,
      [second.body.data.id],
    );
    expect(secondPays).toHaveLength(0);
  });

  it("records catalog Legacy RF price for a single official zone", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-legacy");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150003,
        scheduled_date: "2026-10-25",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["cara"],
        new_patient: {
          first_name: "Manleg",
          last_name: RUN_ID,
          email,
          phone: "5520203030",
        },
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.catalog_amount)).toBe(24900);
    patientIds.push(res.body.data.patient_id);
    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, sessions_included, total_amount, terms_and_conditions
         FROM contracts WHERE id = ?`,
      [res.body.data.contract_id],
    );
    expect(contracts[0].legal_template).toBe("legacy");
    expect(Number(contracts[0].sessions_included)).toBe(10);
    expect(Number(contracts[0].total_amount)).toBe(24900);
    expect(String(contracts[0].terms_and_conditions)).toMatch(/Legacy|radiofrecuencia/i);
  });

  it("does not skip payment when the Velocity zone is not on the contract", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-mismatch");
    const first = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150005,
        scheduled_date: "2026-10-26",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["bigote", "axilas"],
        new_patient: {
          first_name: "Mismatch",
          last_name: RUN_ID,
          email,
          phone: "5530304040",
        },
      });
    expect(first.status).toBe(201);
    patientIds.push(first.body.data.patient_id);
    const second = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: first.body.data.patient_id,
        service_id: 150005,
        scheduled_date: "2026-10-27",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["bikini"],
      });
    expect(second.status).toBe(201);
    expect(second.body.data.skip_payment).toBe(false);
    expect(second.body.data.contract_id).not.toBe(first.body.data.contract_id);
    expect(Number(second.body.data.catalog_amount)).toBe(14900);
    const [pays] = await pool.query<RowDataPacket[]>(
      `SELECT amount FROM payments WHERE appointment_id = ?`,
      [second.body.data.id],
    );
    expect(Number(pays[0].amount)).toBe(14900);
  });

  it("skips manual payment when the Velocity 90% guarantee is active", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-guar");
    const first = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150005,
        scheduled_date: "2026-10-28",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["axilas"],
        new_patient: {
          first_name: "Guarante",
          last_name: RUN_ID,
          email,
          phone: "5540405050",
        },
      });
    expect(first.status).toBe(201);
    patientIds.push(first.body.data.patient_id);
    await pool.query(
      `UPDATE contracts
          SET sessions_included = 1, extra_sessions_granted = 0, guarantee_status = 'active'
        WHERE id = ?`,
      [first.body.data.contract_id],
    );
    const second = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: first.body.data.patient_id,
        service_id: 150005,
        scheduled_date: "2026-10-29",
        scheduled_time: "09:00",
        payment_amount: 14900,
        payment_method: "cash",
        selected_areas: ["axilas"],
      });
    expect(second.status).toBe(201);
    expect(second.body.data.skip_payment).toBe(true);
    expect(second.body.data.contract_id).toBe(first.body.data.contract_id);
    const [pays] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM payments WHERE appointment_id = ?`,
      [second.body.data.id],
    );
    expect(pays).toHaveLength(0);
  });

  it("reuses the manual draft for QR check-in and keeps it on the expediente", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-checkin");
    const created = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150005,
        scheduled_date: "2026-10-30",
        scheduled_time: "11:00",
        payment_amount: 0,
        payment_method: "cash",
        selected_areas: ["bigote", "axilas"],
        new_patient: {
          first_name: "Mancheck",
          last_name: RUN_ID,
          email,
          phone: "5550506060",
        },
      });
    expect(created.status).toBe(201);
    const appointmentId = created.body.data.id;
    const contractId = created.body.data.contract_id;
    const patientId = created.body.data.patient_id;
    patientIds.push(patientId);

    const linked = await request(app)
      .get(`/api/admin/contracts/appointment/${appointmentId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(linked.status).toBe(200);
    expect(linked.body.data.contract_id).toBe(contractId);
    expect(linked.body.data.contract_status).toBe("draft");

    const calendar = await request(app)
      .get("/api/admin/dashboard/calendar")
      .query({ start_date: "2026-10-30", end_date: "2026-10-30" })
      .set("Authorization", `Bearer ${token}`);
    expect(calendar.status).toBe(200);
    const event = (calendar.body.data || []).find(
      (row: { id: number }) => row.id === appointmentId,
    );
    expect(event?.contract_id).toBe(contractId);
    expect(event?.contract_number).toBeTruthy();
    expect(event?.contract_status).toBe("draft");

    const unsignedDesk = await request(app)
      .post(`/api/admin/appointments/${appointmentId}/check-in`)
      .set("Authorization", `Bearer ${token}`);
    expect(unsignedDesk.status).toBe(400);
    expect(unsignedDesk.body.requires_signature).toBe(true);

    const reuse = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        service_id: 150005,
        appointment_id: appointmentId,
        total_amount: 1,
      });
    expect(reuse.status).toBe(200);
    expect(reuse.body.data.contract_id).toBe(contractId);
    expect(reuse.body.data.reused).toBe(true);
    const [count] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM contracts WHERE patient_id = ?",
      [patientId],
    );
    expect(Number(count[0].c)).toBe(1);

    const generated = await request(app)
      .post("/api/check-in/generate-token")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointment_id: appointmentId });
    expect(generated.status).toBe(200);
    const checkToken = generated.body.data.token as string;
    const validated = await request(app).get(`/api/check-in/validate/${checkToken}`);
    expect(validated.status).toBe(200);
    const answers = Object.fromEntries(
      (validated.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );
    const complete = await request(app).post("/api/check-in/complete").send({
      token: checkToken,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
      },
    });
    expect(complete.status).toBe(200);

    const expediente = await request(app)
      .get(`/api/admin/patients/${patientId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(expediente.status).toBe(200);
    expect(expediente.body.data.contracts).toHaveLength(1);
    expect(expediente.body.data.contracts[0].id).toBe(contractId);
    expect(expediente.body.data.consents).toHaveLength(1);
  });

  it("rejects a manual appointment on a blocked date and on an occupied slot", async () => {
    const token = signTestAdminAccessToken(staff);
    const [blocked] = await pool.query<any>(
      `INSERT INTO blocked_dates
         (start_date, end_date, all_day, reason, notes, created_by)
       VALUES ('2026-12-15', '2026-12-15', 1, ?, 'manual slot audit', ?)`,
      [`Cerrado prueba ${RUN_ID}`, staff.id],
    );
    blockedDateIds.push(blocked.insertId);

    const blockedRes = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-12-15",
        scheduled_time: "10:00",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Blocked",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-blocked"),
          phone: "5560607070",
        },
      });
    expect(blockedRes.status).toBe(400);
    expect(blockedRes.body.reason).toBe("blocked_date");
    expect(String(blockedRes.body.message)).toMatch(/Cerrado prueba/i);

    const first = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-11-18",
        scheduled_time: "15:00",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Slotone",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-slot1"),
          phone: "5570708080",
        },
      });
    expect(first.status).toBe(201);
    patientIds.push(first.body.data.patient_id);

    const conflict = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-11-18",
        scheduled_time: "15:00",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Slottwo",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-slot2"),
          phone: "5580809090",
        },
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.reason).toBe("slot_conflict");
  });

  it("reads only the Área line when receptionist notes follow the zones", async () => {
    const token = signTestAdminAccessToken(staff);
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "man-notes"),
      firstName: "Noteline",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const appointmentId = await insertTestAppointment(pool, {
      patientId,
      serviceId: 150002,
      createdBy: staff.id,
      scheduledAt: new Date("2026-11-19T16:00:00Z"),
    });
    await pool.query(`UPDATE appointments SET notes = ? WHERE id = ?`, [
      "Área: Abdomen alto\nLlegó 10 minutos tarde",
      appointmentId,
    ]);

    const created = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        service_id: 150002,
        appointment_id: appointmentId,
      });
    expect(created.status).toBe(200);
    expect(created.body.data.reused).not.toBe(true);
    expect(created.body.data.selected_zone).toBe("Abdomen alto");
    expect(created.body.data.selected_zones).toHaveLength(1);
    expect(created.body.data.selected_zones[0].id).toBe("abdomen_alto");
  });

  it("records catalog Legacy Varipulse price for a single official zone", async () => {
    const token = signTestAdminAccessToken(staff);
    const email = uniqueTestEmail(RUN_ID, "man-vari");
    const res = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 150004,
        scheduled_date: "2026-10-31",
        scheduled_time: "09:00",
        payment_amount: 1,
        payment_method: "cash",
        selected_areas: ["brazo"],
        new_patient: {
          first_name: "Manvari",
          last_name: RUN_ID,
          email,
          phone: "5590901010",
        },
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.catalog_amount)).toBe(26900);
    patientIds.push(res.body.data.patient_id);
    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, sessions_included, total_amount, terms_and_conditions, selected_zone
         FROM contracts WHERE id = ?`,
      [res.body.data.contract_id],
    );
    expect(contracts[0].legal_template).toBe("legacy");
    expect(Number(contracts[0].sessions_included)).toBe(10);
    expect(Number(contracts[0].total_amount)).toBe(26900);
    expect(contracts[0].selected_zone).toBe("Brazo");
    expect(String(contracts[0].terms_and_conditions)).toMatch(/Venus Legacy/i);
  });

  it("rejects a 10:30 booking that overlaps a 10:00 sixty-minute visit", async () => {
    const token = signTestAdminAccessToken(staff);
    const first = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-11-21",
        scheduled_time: "10:00",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Overlap1",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-ov1"),
          phone: "5512121313",
        },
      });
    expect(first.status).toBe(201);
    patientIds.push(first.body.data.patient_id);

    const mid = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-11-21",
        scheduled_time: "10:30",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Overlap2",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-ov2"),
          phone: "5513131414",
        },
      });
    expect(mid.status).toBe(409);
    expect(mid.body.reason).toBe("slot_conflict");

    const after = await request(app)
      .post("/api/admin/appointments/manual")
      .set("Authorization", `Bearer ${token}`)
      .send({
        service_id: 3,
        scheduled_date: "2026-11-21",
        scheduled_time: "11:00",
        payment_amount: 0,
        payment_method: "cash",
        new_patient: {
          first_name: "Overlap3",
          last_name: RUN_ID,
          email: uniqueTestEmail(RUN_ID, "man-ov3"),
          phone: "5514141515",
        },
      });
    expect(after.status).toBe(201);
    patientIds.push(after.body.data.patient_id);
  });

  it("lets only one of two concurrent same-slot creates succeed", async () => {
    const token = signTestAdminAccessToken(staff);
    const [first, second] = await Promise.all([
      request(app)
        .post("/api/admin/appointments/manual")
        .set("Authorization", `Bearer ${token}`)
        .send({
          service_id: 3,
          scheduled_date: "2026-11-22",
          scheduled_time: "11:00",
          payment_amount: 0,
          payment_method: "cash",
          new_patient: {
            first_name: "Raceone",
            last_name: RUN_ID,
            email: uniqueTestEmail(RUN_ID, "man-race1"),
            phone: "5515151616",
          },
        }),
      request(app)
        .post("/api/admin/appointments/manual")
        .set("Authorization", `Bearer ${token}`)
        .send({
          service_id: 3,
          scheduled_date: "2026-11-22",
          scheduled_time: "11:00",
          payment_amount: 0,
          payment_method: "cash",
          new_patient: {
            first_name: "Racetwo",
            last_name: RUN_ID,
            email: uniqueTestEmail(RUN_ID, "man-race2"),
            phone: "5516161717",
          },
        }),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
    const winner = first.status === 201 ? first : second;
    const loser = first.status === 409 ? first : second;
    patientIds.push(winner.body.data.patient_id);
    expect(loser.body.reason).toBe("slot_conflict");
  });
});
