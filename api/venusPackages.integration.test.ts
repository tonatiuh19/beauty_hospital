/**
 * October 2026 Venus catalog + booking / guarantee / check-in edge cases.
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
  signTestAdminAccessToken,
  uniqueTestEmail,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `venus-${Date.now()}`;
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

const PDF_ZONES = {
  bliss: [
    "Abdomen alto",
    "Abdomen bajo",
    "Cintura",
    "Espalda alta",
    "Espalda baja",
    "Muslo interno",
    "Muslo externo",
  ],
  legacyRf: [
    "Cara",
    "Cuello",
    "Escote",
    "Manos",
    "Pies",
    "Abdomen",
    "Cintura",
    "Espalda alta",
    "Espalda baja",
    "Muslo interno",
    "Muslo externo",
    "Glúteo",
    "Cadera",
    "Brazo",
    "Pantorrillas",
  ],
  legacyVaripulse: [
    "Brazo",
    "Abdomen alto",
    "Abdomen bajo",
    "Cintura",
    "Espalda alta",
    "Espalda baja",
    "Cadera",
    "Glúteo",
    "Muslo interno",
    "Muslo externo",
  ],
  velocityChicas: [
    "Media cara",
    "Bigote",
    "Patillas",
    "Orejas",
    "Cuello",
    "Nuca",
    "Pezón",
    "Entrepecho",
    "Manos",
    "Línea de abdomen",
    "Pies",
    "Línea interglútea",
    "Coxis",
  ],
  velocityMedianas: [
    "Cara completa",
    "Axilas",
    "Bikini",
    "Glúteos",
    "Medio brazo",
    "Medio abdomen",
    "Media pierna",
    "Media espalda",
  ],
  velocityGrandes: [
    "Brazo completo",
    "Pierna completa",
    "Espalda completa",
    "Abdomen completo",
    "Pecho completo",
  ],
};

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
const patientIds: number[] = [];

let staff = { id: 0, email: "", role: "general_admin" };
let blissId = 0;
let legacyRfId = 0;
let velocityId = 0;
let remainingPatientId = 0;
let remainingContractId = 0;

function labelsOf(service: { area_catalog?: Array<{ label: string }> }) {
  return (service.area_catalog || []).map((area) => area.label);
}

async function quote(body: Record<string, unknown>) {
  return request(app).post("/api/appointments/quote").send(body);
}

async function bookRemaining(body: Record<string, unknown>) {
  return request(app).post("/api/appointments/book-with-payment").send({
    accepted_terms: true,
    accepted_privacy: true,
    ...body,
  });
}

describe("Venus packages, quote, remaining sessions, guarantee, check-in", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    staff.email = uniqueTestEmail(RUN_ID, "ga");
    staff.id = await insertTestStaffUser(pool, {
      email: staff.email,
      role: "general_admin",
      lastName: RUN_ID,
    });
    userIds.push(staff.id);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, legal_template FROM services WHERE is_active = 1 AND legal_template IS NOT NULL`,
    );
    blissId = Number(
      rows.find((row) => row.legal_template === "bliss")?.id || 0,
    );
    legacyRfId = Number(
      rows.find(
        (row) =>
          row.legal_template === "legacy" &&
          String(row.name).includes("Radiofrecuencia"),
      )?.id || 0,
    );
    velocityId = Number(
      rows.find((row) => row.legal_template === "velocity")?.id || 0,
    );
    expect(blissId).toBeGreaterThan(0);
    expect(legacyRfId).toBeGreaterThan(0);
    expect(velocityId).toBeGreaterThan(0);

    remainingPatientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "remain"),
      firstName: "Remain",
      lastName: RUN_ID,
    });
    patientIds.push(remainingPatientId);

    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, contract_number, status, total_amount, sessions_included,
          terms_and_conditions, created_by)
       VALUES (?, ?, 'velocity', 'Bigote, Axilas', ?, 'pending_baseline', ?, 'signed', 26800, 10, 'test', ?)`,
      [
        remainingPatientId,
        velocityId,
        JSON.stringify([
          { id: "bigote", label: "Bigote", size: "chica", price: 11900 },
          { id: "axilas", label: "Axilas", size: "mediana", price: 14900 },
        ]),
        `CON-${RUN_ID}-remain`,
        staff.id,
      ],
    );
    remainingContractId = created.insertId;
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

  it("matches the official October 2026 PDF zone labels and prices", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    const services = res.body.data as Array<{
      name: string;
      price: number;
      package_sessions: number;
      legal_template: string | null;
      area_catalog?: Array<{ label: string; price?: number }>;
    }>;

    const bliss = services.find((s) => s.legal_template === "bliss");
    const legacyRf = services.find(
      (s) =>
        s.legal_template === "legacy" && s.name.includes("Radiofrecuencia"),
    );
    const legacyVp = services.find(
      (s) => s.legal_template === "legacy" && s.name.includes("Varipulse"),
    );
    const velChicas = services.find(
      (s) => s.legal_template === "velocity" && s.name.includes("Chicas"),
    );
    const velMedianas = services.find(
      (s) => s.legal_template === "velocity" && s.name.includes("Medianas"),
    );
    const velGrandes = services.find(
      (s) => s.legal_template === "velocity" && s.name.includes("Grandes"),
    );

    expect(bliss).toMatchObject({ price: 25000, package_sessions: 5 });
    expect(labelsOf(bliss!)).toEqual(PDF_ZONES.bliss);

    expect(legacyRf).toMatchObject({ price: 24900, package_sessions: 10 });
    expect(labelsOf(legacyRf!)).toEqual(PDF_ZONES.legacyRf);

    expect(legacyVp).toMatchObject({ price: 26900, package_sessions: 10 });
    expect(labelsOf(legacyVp!)).toEqual(PDF_ZONES.legacyVaripulse);

    expect(velChicas).toMatchObject({ price: 11900, package_sessions: 10 });
    expect(labelsOf(velChicas!)).toEqual(PDF_ZONES.velocityChicas);
    expect(velChicas!.area_catalog?.every((area) => area.price === 11900)).toBe(
      true,
    );

    expect(velMedianas).toMatchObject({ price: 14900, package_sessions: 10 });
    expect(labelsOf(velMedianas!)).toEqual(PDF_ZONES.velocityMedianas);
    expect(
      velMedianas!.area_catalog?.every((area) => area.price === 14900),
    ).toBe(true);

    expect(velGrandes).toMatchObject({ price: 17900, package_sessions: 10 });
    expect(labelsOf(velGrandes!)).toEqual(PDF_ZONES.velocityGrandes);
    expect(velGrandes!.area_catalog?.every((area) => area.price === 17900)).toBe(
      true,
    );
  });

  it("quotes mixed-size Velocity zones as 11900 + 14900 = 26800", async () => {
    const res = await quote({
      service_id: velocityId,
      selected_areas: ["bigote", "axilas"],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(26800);
    expect(res.body.data.catalog_amount).toBe(26800);
    expect(res.body.data.duration_minutes).toBe(60);
    expect(res.body.data.max_zones).toBe(4);
    expect(res.body.data.skip_payment).toBe(false);
  });

  it("dedupes a repeated Velocity zone so Bigote+Bigote stays 11900", async () => {
    const res = await quote({
      service_id: velocityId,
      selected_areas: ["bigote", "bigote"],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(11900);
    expect(res.body.data.zones).toHaveLength(1);
  });

  it("rejects Bliss or Legacy with a second zone", async () => {
    const bliss = await quote({
      service_id: blissId,
      selected_areas: ["abdomen_alto", "cintura"],
    });
    expect(bliss.status).toBe(400);
    expect(String(bliss.body.error || bliss.body.message)).toMatch(
      /sola zona|un área/i,
    );

    const legacy = await quote({
      service_id: legacyRfId,
      selected_areas: ["cara", "cuello"],
    });
    expect(legacy.status).toBe(400);
  });

  it("rejects an unknown catalog area", async () => {
    const res = await quote({
      service_id: velocityId,
      selected_areas: ["zona_inventada"],
    });
    expect(res.status).toBe(400);
    expect(String(res.body.error || res.body.message)).toMatch(
      /no corresponde|catálogo/i,
    );
  });

  it("skips payment for remaining matching Velocity zones", async () => {
    const preview = await quote({
      service_id: velocityId,
      selected_areas: ["bigote", "axilas"],
      patient_id: remainingPatientId,
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.skip_payment).toBe(true);
    expect(preview.body.data.amount).toBe(0);
    expect(preview.body.data.catalog_amount).toBe(26800);

    const booked = await bookRemaining({
      patient_id: remainingPatientId,
      service_id: velocityId,
      selected_areas: ["bigote", "axilas"],
      scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(booked.status).toBe(200);
    expect(booked.body.data.skip_payment).toBe(true);
    expect(booked.body.data.amount).toBe(0);
    expect(booked.body.data.appointment_id).toBeGreaterThan(0);
    expect(booked.body.data.contract_id).toBe(remainingContractId);
    expect(String(booked.body.data.message)).toMatch(/paquete/i);
  });

  it("does not block an off-interval Velocity date when sessions remain", async () => {
    const offCalendar = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    const booked = await bookRemaining({
      patient_id: remainingPatientId,
      service_id: velocityId,
      selected_areas: ["bigote"],
      scheduled_at: offCalendar.toISOString(),
    });
    expect(booked.status).toBe(200);
    expect(booked.body.data.skip_payment).toBe(true);
    expect(booked.body.data.amount).toBe(0);
  });

  it("does not skip payment when the new Velocity zone is not on the contract", async () => {
    const preview = await quote({
      service_id: velocityId,
      selected_areas: ["bikini"],
      patient_id: remainingPatientId,
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.skip_payment).toBe(false);
    expect(preview.body.data.amount).toBe(14900);

    const booked = await bookRemaining({
      patient_id: remainingPatientId,
      service_id: velocityId,
      selected_areas: ["bikini"],
      scheduled_at: new Date(
        Date.now() + 12 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      payment_amount: 1,
      patient_info: {
        first_name: "Newzone",
        last_name: RUN_ID,
        email: uniqueTestEmail(RUN_ID, "newzone"),
        phone: uniqueTestE164(`${RUN_ID}-newzone`),
      },
    });
    expect(booked.body.data?.skip_payment).not.toBe(true);
    if (booked.status === 200) {
      expect(booked.body.data.amount ?? booked.body.data.catalog_amount).toBe(
        14900,
      );
    }
  });

  it("books guarantee extras at $0 after paid sessions are exhausted", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "guarantee"),
      firstName: "Guarantee",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, extra_sessions_granted, contract_number, status,
          total_amount, sessions_included, terms_and_conditions, created_by)
       VALUES (?, ?, 'velocity', 'Axilas', ?, 'active', 0, ?, 'signed', 14900, 1, 'test', ?)`,
      [
        patientId,
        velocityId,
        JSON.stringify([
          { id: "axilas", label: "Axilas", size: "mediana", price: 14900 },
        ]),
        `CON-${RUN_ID}-gtee`,
        staff.id,
      ],
    );
    await insertTestAppointment(pool, {
      patientId,
      serviceId: velocityId,
      createdBy: null,
      contractId: created.insertId,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    const booked = await bookRemaining({
      patient_id: patientId,
      service_id: velocityId,
      selected_areas: ["axilas"],
      scheduled_at: new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
    expect(booked.status).toBe(200);
    expect(booked.body.data.skip_payment).toBe(true);
    expect(booked.body.data.amount).toBe(0);
    expect(booked.body.data.guarantee_status).toBe("active");
    expect(String(booked.body.data.message)).toMatch(/garantía/i);
  });

  it("does not grant extras when the Velocity guarantee is suspended", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "suspended"),
      firstName: "Suspended",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, extra_sessions_granted, contract_number, status,
          total_amount, sessions_included, terms_and_conditions, created_by)
       VALUES (?, ?, 'velocity', 'Axilas', ?, 'suspended', 0, ?, 'signed', 14900, 1, 'test', ?)`,
      [
        patientId,
        velocityId,
        JSON.stringify([
          { id: "axilas", label: "Axilas", size: "mediana", price: 14900 },
        ]),
        `CON-${RUN_ID}-susp`,
        staff.id,
      ],
    );
    await insertTestAppointment(pool, {
      patientId,
      serviceId: velocityId,
      createdBy: null,
      contractId: created.insertId,
    });

    const preview = await quote({
      service_id: velocityId,
      selected_areas: ["axilas"],
      patient_id: patientId,
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.skip_payment).toBe(false);
    expect(preview.body.data.amount).toBe(14900);
  });

  it("rejects measurements and guarantee evaluation on Bliss", async () => {
    const token = signTestAdminAccessToken(staff);
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "bliss-gtee"),
      firstName: "Blissg",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, contract_number,
          status, total_amount, sessions_included, terms_and_conditions, created_by)
       VALUES (?, ?, 'bliss', 'Abdomen alto', ?, 'signed', 25000, 5, 'test', ?)`,
      [patientId, blissId, `CON-${RUN_ID}-bliss`, staff.id],
    );

    const measure = await request(app)
      .post(`/api/admin/contracts/${created.insertId}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send({ zone_id: "abdomen_alto", baseline_count: 100 });
    expect(measure.status).toBe(400);
    expect(String(measure.body.message)).toMatch(/Velocity/i);

    const evaluate = await request(app)
      .post(`/api/admin/contracts/${created.insertId}/evaluate-guarantee`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(evaluate.status).toBe(400);
  });

  it("rejects zero or negative Velocity baseline hair counts", async () => {
    const token = signTestAdminAccessToken(staff);
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "counts"),
      firstName: "Counts",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const [created] = await pool.query<ResultSetHeader>(
      `INSERT INTO contracts
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, contract_number, status, total_amount, sessions_included,
          terms_and_conditions, created_by)
       VALUES (?, ?, 'velocity', 'Axilas', ?, 'pending_baseline', ?, 'signed', 14900, 10, 'test', ?)`,
      [
        patientId,
        velocityId,
        JSON.stringify([
          { id: "axilas", label: "Axilas", size: "mediana", price: 14900 },
        ]),
        `CON-${RUN_ID}-counts`,
        staff.id,
      ],
    );

    const zero = await request(app)
      .post(`/api/admin/contracts/${created.insertId}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send({ zone_id: "axilas", baseline_count: 0 });
    expect(zero.status).toBe(400);

    const negative = await request(app)
      .post(`/api/admin/contracts/${created.insertId}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send({ zone_id: "axilas", baseline_count: -4 });
    expect(negative.status).toBe(400);
  });

  it("returns official Velocity contract and consent wording on check-in validate", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "vel-checkin"),
      firstName: "Velcheck",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const token = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId,
      serviceId: velocityId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const res = await request(app).get(`/api/check-in/validate/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.consent.legal_template).toBe("velocity");
    expect(String(res.body.data.contract_terms)).toMatch(/90\s*%/);
    expect(String(res.body.data.contract_terms)).toMatch(/86035/);
    expect(String(res.body.data.consent.intro)).toMatch(/90\s*%|póliza/i);
    expect(res.body.data.consent.questions.length).toBeGreaterThan(0);
  });

  it("rejects Venus check-in without a complete consent", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "bliss-checkin"),
      firstName: "Blisscheck",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const token = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const missing = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
    });
    expect(missing.status).toBe(400);
    expect(String(missing.body.message)).toMatch(/consentimiento/i);

    const incomplete = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: { pregnancy: "no" },
      },
    });
    expect(incomplete.status).toBe(400);

    const validated = await request(app).get(`/api/check-in/validate/${token}`);
    const answers = Object.fromEntries(
      (validated.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );
    const complete = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
      },
    });
    expect(complete.status).toBe(200);
    expect(complete.body.success).toBe(true);

    const [consents] = await pool.query<RowDataPacket[]>(
      `SELECT status, data_health_consent FROM consents WHERE patient_id = ?`,
      [patientId],
    );
    expect(consents.length).toBe(1);
    expect(consents[0].status).toBe("pending_staff");
    expect(Number(consents[0].data_health_consent)).toBe(1);

    const expediente = await request(app)
      .get(`/api/admin/patients/${patientId}`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`);
    expect(expediente.status).toBe(200);
    expect(expediente.body.data.contracts.length).toBeGreaterThan(0);
    expect(expediente.body.data.consents).toHaveLength(1);
    expect(expediente.body.data.consents[0].legal_template).toBe("bliss");
    expect(expediente.body.data.consents[0].has_patient_signature).toBeTruthy();
    expect(expediente.body.data.consents[0].health_answers.pregnancy).toBe("no");
    expect(expediente.body.data.contracts[0].signature_data).toBeUndefined();
  });
});
