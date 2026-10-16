/**
 * Mock-data coverage for contract signing, QR check-in, staff consent,
 * admin desk check-in, expediente, and quote edges — no live Stripe.
 */
import "dotenv/config";
import crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertPatientSession,
  insertTestAppointment,
  insertTestPatient,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `mockflows-${Date.now()}`;
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
const patientIds: number[] = [];
let staff = { id: 0, email: "", role: "general_admin" };
let velocityId = 0;
let blissId = 0;

async function consentAnswers(token: string) {
  const validated = await request(app).get(`/api/check-in/validate/${token}`);
  expect(validated.status).toBe(200);
  return Object.fromEntries(
    (validated.body.data.consent.questions as Array<{ id: string }>).map(
      (question) => [question.id, "no"],
    ),
  );
}

describe("mock contract, check-in, and expediente flows", () => {
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
    const svc = await request(app).get("/api/services");
    const list = svc.body.data as Array<{
      id: number;
      legal_template?: string;
    }>;
    velocityId = Number(
      list.find((row) => row.legal_template === "velocity")?.id || 0,
    );
    blissId = Number(
      list.find((row) => row.legal_template === "bliss")?.id || 0,
    );
    expect(velocityId).toBeGreaterThan(0);
    expect(blissId).toBeGreaterThan(0);
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

  it("quotes 4 Velocity zones and rejects a fifth", async () => {
    const four = await request(app).post("/api/appointments/quote").send({
      service_id: velocityId,
      selected_areas: ["bigote", "axilas", "bikini", "nuca"],
    });
    expect(four.status).toBe(200);
    expect(four.body.data.catalog_amount).toBe(11900 + 14900 + 14900 + 11900);

    const five = await request(app).post("/api/appointments/quote").send({
      service_id: velocityId,
      selected_areas: ["bigote", "axilas", "bikini", "nuca", "manos"],
    });
    expect(five.status).toBe(400);
    expect(String(five.body.error || five.body.message)).toMatch(/4 zonas/i);
  });

  it("rejects expired QR tokens on validate and complete", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "expired"),
      firstName: "Expired",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const token = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() - 60_000),
    });

    const validated = await request(app).get(`/api/check-in/validate/${token}`);
    expect(validated.status).toBe(400);
    expect(String(validated.body.message)).toMatch(/expir/i);

    const complete = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
    });
    expect(complete.status).toBe(400);
    expect(String(complete.body.message)).toMatch(/expir/i);
  });

  it("rejects QR validate/complete and token generation for cancelled appointments", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "cancelled"),
      firstName: "Cancelled",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const token = crypto.randomBytes(24).toString("hex");
    const appointmentId = await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "cancelled",
    });

    const validated = await request(app).get(`/api/check-in/validate/${token}`);
    expect(validated.status).toBe(400);
    expect(String(validated.body.message)).toMatch(/cancelad/i);

    const complete = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: { pregnancy: "no" },
      },
    });
    expect(complete.status).toBe(400);

    const generated = await request(app)
      .post("/api/check-in/generate-token")
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({ appointment_id: appointmentId });
    expect(generated.status).toBe(400);
  });

  it("rejects unsigned terms and generate-token without a JWT", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "terms"),
      firstName: "Terms",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const token = crypto.randomBytes(24).toString("hex");
    const appointmentId = await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const unsigned = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: false,
    });
    expect(unsigned.status).toBe(400);

    const noAuth = await request(app)
      .post("/api/check-in/generate-token")
      .send({ appointment_id: appointmentId });
    expect(noAuth.status).toBe(401);
  });

  it("admin generates a QR token, patient signs Velocity, staff marks apto, expediente keeps both", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "full"),
      firstName: "Fullflow",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const appointmentId = await insertTestAppointment(pool, {
      patientId,
      serviceId: velocityId,
      createdBy: staff.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });
    await pool.query(
      `UPDATE appointments SET notes = ? WHERE id = ?`,
      ["Área: Bigote, Axilas", appointmentId],
    );

    const generated = await request(app)
      .post("/api/check-in/generate-token")
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({ appointment_id: appointmentId });
    expect(generated.status).toBe(200);
    const token = generated.body.data.token as string;
    expect(token).toBeTruthy();

    const answers = await consentAnswers(token);
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

    const [contracts] = await pool.query<RowDataPacket[]>(
      `SELECT status, legal_template, selected_zone, selected_zones, guarantee_status,
              sessions_completed, signature_data
         FROM contracts WHERE patient_id = ?`,
      [patientId],
    );
    expect(contracts).toHaveLength(1);
    expect(contracts[0].status).toBe("signed");
    expect(contracts[0].legal_template).toBe("velocity");
    expect(contracts[0].signature_data).toBe(SIGNATURE);
    expect(contracts[0].guarantee_status).toBe("pending_baseline");
    expect(Number(contracts[0].sessions_completed)).toBe(1);
    const rawZones = contracts[0].selected_zones;
    const zones =
      typeof rawZones === "string" ? JSON.parse(rawZones) : rawZones;
    expect(zones.map((z: { id: string }) => z.id)).toEqual(["bigote", "axilas"]);

    const [consents] = await pool.query<RowDataPacket[]>(
      `SELECT id, status FROM consents WHERE patient_id = ?`,
      [patientId],
    );
    expect(consents).toHaveLength(1);
    expect(consents[0].status).toBe("pending_staff");

    const receptionistEmail = uniqueTestEmail(RUN_ID, "rx");
    const receptionistId = await insertTestStaffUser(pool, {
      email: receptionistEmail,
      role: "receptionist",
      lastName: RUN_ID,
    });
    userIds.push(receptionistId);
    const forbidden = await request(app)
      .post(`/api/admin/consents/${consents[0].id}/complete`)
      .set(
        "Authorization",
        `Bearer ${signTestAdminAccessToken({
          id: receptionistId,
          email: receptionistEmail,
          role: "receptionist",
        })}`,
      )
      .send({ clinical_conclusion: "apto", signature: SIGNATURE });
    expect(forbidden.status).toBe(403);

    const missingStaff = await request(app)
      .post(`/api/admin/consents/${consents[0].id}/complete`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({ clinical_conclusion: "apto" });
    expect(missingStaff.status).toBe(400);

    const staffSign = await request(app)
      .post(`/api/admin/consents/${consents[0].id}/complete`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({
        clinical_conclusion: "apto",
        signature: SIGNATURE,
        clinical_notes: "Apto para tratamiento",
      });
    expect(staffSign.status).toBe(200);

    const expediente = await request(app)
      .get(`/api/admin/patients/${patientId}`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`);
    expect(expediente.status).toBe(200);
    expect(expediente.body.data.contracts).toHaveLength(1);
    expect(expediente.body.data.contracts[0].signature_data).toBeUndefined();
    expect(expediente.body.data.contracts[0].selected_zones).toHaveLength(2);
    expect(expediente.body.data.consents).toHaveLength(1);
    expect(expediente.body.data.consents[0].has_staff_signature).toBeTruthy();
    expect(expediente.body.data.consents[0].status).toBe("signed");

    await insertPatientSession(pool, patientId);
    const packages = await request(app)
      .get("/api/patient/packages")
      .query({ patient_id: patientId });
    expect(packages.status).toBe(200);
    expect(packages.body.data[0].remaining).toBeGreaterThanOrEqual(0);
    expect(packages.body.data[0].zones).toHaveLength(2);

    const regen = await request(app)
      .post("/api/check-in/generate-token")
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({ appointment_id: appointmentId });
    expect(regen.status).toBe(400);
  });

  it("admin desk check-in requires a signed contract and rejects cancelled", async () => {
    const patientId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "desk"),
      firstName: "Desk",
      lastName: RUN_ID,
    });
    patientIds.push(patientId);
    const openId = await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
    });
    const cancelledId = await insertTestAppointment(pool, {
      patientId,
      serviceId: blissId,
      createdBy: staff.id,
      status: "cancelled",
    });
    const token = signTestAdminAccessToken(staff);

    const missing = await request(app)
      .post(`/api/admin/appointments/${openId}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({ skip_contract_check: true });
    expect(missing.status).toBe(400);
    expect(missing.body.requires_contract).toBe(true);

    const cancelled = await request(app)
      .post(`/api/admin/appointments/${cancelledId}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(cancelled.status).toBe(400);

    const created = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: patientId,
        service_id: blissId,
        appointment_id: openId,
        total_amount: 25000,
        sessions_included: 5,
        selected_areas: ["abdomen_alto"],
        terms_and_conditions: "Términos mock Bliss",
      });
    expect(created.status).toBe(200);

    const unsigned = await request(app)
      .post(`/api/admin/appointments/${openId}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(unsigned.status).toBe(400);
    expect(unsigned.body.requires_signature).toBe(true);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT check_in_token FROM appointments WHERE id = ?`,
      [openId],
    );
    let qr = rows[0]?.check_in_token as string | null;
    if (!qr) {
      const generated = await request(app)
        .post("/api/check-in/generate-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ appointment_id: openId });
      expect(generated.status).toBe(200);
      qr = generated.body.data.token;
    }
    const answers = await consentAnswers(qr);
    const signed = await request(app).post("/api/check-in/complete").send({
      token: qr,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
      },
    });
    expect(signed.status).toBe(200);

    const idempotent = await request(app)
      .post(`/api/admin/appointments/${openId}/check-in`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(idempotent.status).toBe(200);
    expect(idempotent.body.already_checked_in).toBe(true);

    const emptyPatient = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "empty"),
      firstName: "Empty",
      lastName: RUN_ID,
    });
    patientIds.push(emptyPatient);
    const empty = await request(app)
      .get(`/api/admin/patients/${emptyPatient}`)
      .set("Authorization", `Bearer ${token}`);
    expect(empty.status).toBe(200);
    expect(empty.body.data.contracts).toEqual([]);
    expect(empty.body.data.consents).toEqual([]);
    expect(empty.body.data.medicalRecords).toEqual([]);
  });

  it("stamps official legal_template and zones on admin-created Venus contracts", async () => {
    const token = signTestAdminAccessToken(staff);
    const blissPatient = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "adm-bliss"),
      firstName: "Admbliss",
      lastName: RUN_ID,
    });
    patientIds.push(blissPatient);
    const blissDraft = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: blissPatient,
        service_id: blissId,
        selected_areas: ["abdomen_alto"],
      });
    expect(blissDraft.status).toBe(200);
    expect(blissDraft.body.data.legal_template).toBe("bliss");
    const [blissRows] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, sessions_included, total_amount, terms_and_conditions, guarantee_status
         FROM contracts WHERE id = ?`,
      [blissDraft.body.data.contract_id],
    );
    expect(blissRows[0].legal_template).toBe("bliss");
    expect(Number(blissRows[0].sessions_included)).toBe(5);
    expect(Number(blissRows[0].total_amount)).toBe(25000);
    expect(String(blissRows[0].terms_and_conditions)).toMatch(/Venus Bliss/i);
    expect(blissRows[0].guarantee_status).toBe("not_applicable");

    const velPatient = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "adm-vel"),
      firstName: "Admvel",
      lastName: RUN_ID,
    });
    patientIds.push(velPatient);
    const velDraft = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: velPatient,
        service_id: velocityId,
        selected_areas: ["bigote", "axilas"],
      });
    expect(velDraft.status).toBe(200);
    expect(velDraft.body.data.selected_zones).toHaveLength(2);
    const [velRows] = await pool.query<RowDataPacket[]>(
      `SELECT legal_template, selected_zone, selected_zones, guarantee_status, total_amount
         FROM contracts WHERE id = ?`,
      [velDraft.body.data.contract_id],
    );
    expect(velRows[0].legal_template).toBe("velocity");
    expect(velRows[0].guarantee_status).toBe("pending_baseline");
    expect(Number(velRows[0].total_amount)).toBe(26800);
    expect(String(velRows[0].selected_zone)).toMatch(/Bigote/i);

    const five = await request(app)
      .post("/api/admin/contracts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient_id: velPatient,
        service_id: velocityId,
        selected_areas: ["bigote", "axilas", "bikini", "nuca", "manos"],
      });
    expect(five.status).toBe(400);
  });

  it("requires a minors annex for Velocity under 18 and stores it on the expediente", async () => {
    const minorId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "minor"),
      firstName: "Minor",
      lastName: RUN_ID,
      dateOfBirth: "2015-01-15",
    });
    patientIds.push(minorId);
    const token = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId: minorId,
      serviceId: velocityId,
      createdBy: staff.id,
      checkInToken: token,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await pool.query(`UPDATE appointments SET notes = ? WHERE check_in_token = ?`, [
      "Área: Bigote",
      token,
    ]);

    const validated = await request(app).get(`/api/check-in/validate/${token}`);
    expect(validated.status).toBe(200);
    expect(validated.body.data.consent.requires_minors_annex).toBe(true);
    expect(validated.body.data.consent.patient_is_minor).toBe(true);
    const answers = Object.fromEntries(
      (validated.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );

    const missing = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
      },
    });
    expect(missing.status).toBe(400);
    expect(String(missing.body.message)).toMatch(/menores|tutor/i);

    const complete = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
        is_minor: true,
        guardian_name: "Tutor Mock",
        guardian_relationship: "madre",
        guardian_signature: SIGNATURE,
      },
    });
    expect(complete.status).toBe(200);

    const expediente = await request(app)
      .get(`/api/admin/patients/${minorId}`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`);
    expect(expediente.body.data.consents[0].is_minor).toBeTruthy();
    expect(expediente.body.data.consents[0].guardian_name).toBe("Tutor Mock");
    expect(expediente.body.data.consents[0].guardian_signature).toBeUndefined();
  });

  it("does not require a minors annex for Bliss and rejects an adult Velocity annex without tutor data", async () => {
    const blissMinor = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "bliss-minor"),
      firstName: "Blissmin",
      lastName: RUN_ID,
      dateOfBirth: "2014-06-01",
    });
    patientIds.push(blissMinor);
    const blissToken = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId: blissMinor,
      serviceId: blissId,
      createdBy: staff.id,
      checkInToken: blissToken,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const blissValidate = await request(app).get(
      `/api/check-in/validate/${blissToken}`,
    );
    expect(blissValidate.body.data.consent.requires_minors_annex).toBe(false);
    const blissAnswers = Object.fromEntries(
      (blissValidate.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );
    const blissComplete = await request(app).post("/api/check-in/complete").send({
      token: blissToken,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: blissAnswers,
      },
    });
    expect(blissComplete.status).toBe(200);

    const adultId = await insertTestPatient(pool, {
      email: uniqueTestEmail(RUN_ID, "adult-flag"),
      firstName: "Adultflag",
      lastName: RUN_ID,
      dateOfBirth: "1990-03-03",
    });
    patientIds.push(adultId);
    const adultToken = crypto.randomBytes(24).toString("hex");
    await insertTestAppointment(pool, {
      patientId: adultId,
      serviceId: velocityId,
      createdBy: staff.id,
      checkInToken: adultToken,
      checkInExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const adultValidate = await request(app).get(
      `/api/check-in/validate/${adultToken}`,
    );
    const adultAnswers = Object.fromEntries(
      (adultValidate.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );
    const flagged = await request(app).post("/api/check-in/complete").send({
      token: adultToken,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: adultAnswers,
        is_minor: true,
      },
    });
    expect(flagged.status).toBe(400);
  });
});
