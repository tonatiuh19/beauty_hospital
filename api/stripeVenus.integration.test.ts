/**
 * Live Stripe test-mode charge for mixed-size Velocity, then expediente.
 */
import "dotenv/config";
import crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import Stripe from "stripe";
import type { Pool } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  uniqueTestEmail,
  uniqueTestE164,
} from "./testDbCleanup";

const RUN_ID = `stripe-venus-${Date.now()}`;
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
const patientIds: number[] = [];
let staff = { id: 0, email: "", role: "general_admin" };
let velocityId = 0;

describe("Stripe Velocity charge and expediente", () => {
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
    velocityId = Number(
      (svc.body.data || []).find((row: { legal_template?: string }) => row.legal_template === "velocity")
        ?.id || 0,
    );
    expect(velocityId).toBeGreaterThan(0);
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

  it("charges 26800 MXN for Bigote+Axilas, fulfills, and stores contract + consent", async () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return;
    }
    const email = uniqueTestEmail(RUN_ID, "paid");
    const quote = await request(app).post("/api/appointments/quote").send({
      service_id: velocityId,
      selected_areas: ["bigote", "axilas"],
    });
    expect(quote.status).toBe(200);
    expect(quote.body.data.catalog_amount).toBe(26800);

    const booked = await request(app)
      .post("/api/appointments/book-with-payment")
      .send({
        service_id: velocityId,
        scheduled_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        selected_areas: ["bigote", "axilas"],
        accepted_terms: true,
        accepted_privacy: true,
        payment_amount: 1,
        patient_info: {
          first_name: "Stripe",
          last_name: RUN_ID,
          email,
          phone: uniqueTestE164(`${RUN_ID}-paid`),
        },
      });
    expect(booked.status).toBe(200);
    expect(booked.body.data.skip_payment).not.toBe(true);
    expect(booked.body.data.amount).toBe(26800);
    const paymentIntentId = booked.body.data.payment_intent_id as string;
    expect(paymentIntentId).toMatch(/^pi_/);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
      return_url: "http://localhost:8080/appointment/success",
    });
    expect(["succeeded", "requires_capture"]).toContain(confirmed.status);
    expect(confirmed.amount).toBe(2680000);

    const fulfill = await request(app)
      .post("/api/appointments/confirm-payment")
      .send({ payment_intent_id: paymentIntentId });
    expect(fulfill.status).toBe(200);
    const appointmentId = fulfill.body.data.appointment_id;
    expect(appointmentId).toBeGreaterThan(0);

    const [patients] = await pool.query<any[]>(
      `SELECT id FROM patients WHERE email = ? LIMIT 1`,
      [email],
    );
    const patientId = Number(patients[0].id);
    patientIds.push(patientId);

    const [appts] = await pool.query<any[]>(
      `SELECT check_in_token FROM appointments WHERE id = ?`,
      [appointmentId],
    );
    let token = appts[0]?.check_in_token as string | null;
    if (!token) {
      token = crypto.randomBytes(24).toString("hex");
      await pool.query(
        `UPDATE appointments
            SET check_in_token = ?, check_in_token_expires_at = ?
          WHERE id = ?`,
        [token, new Date(Date.now() + 24 * 60 * 60 * 1000), appointmentId],
      );
    }

    const validated = await request(app).get(`/api/check-in/validate/${token}`);
    expect(validated.status).toBe(200);
    const answers = Object.fromEntries(
      (validated.body.data.consent.questions as Array<{ id: string }>).map(
        (question) => [question.id, "no"],
      ),
    );
    const checkIn = await request(app).post("/api/check-in/complete").send({
      token,
      signature_data: SIGNATURE,
      terms_accepted: true,
      consent: {
        signature: SIGNATURE,
        data_health_consent: true,
        health_answers: answers,
      },
    });
    expect(checkIn.status).toBe(200);

    const expediente = await request(app)
      .get(`/api/admin/patients/${patientId}`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`);
    expect(expediente.status).toBe(200);
    expect(expediente.body.data.payments.length).toBeGreaterThan(0);
    expect(Number(expediente.body.data.payments[0].amount)).toBe(26800);
    expect(expediente.body.data.contracts.length).toBeGreaterThan(0);
    expect(expediente.body.data.contracts[0].legal_template).toBe("velocity");
    expect(expediente.body.data.consents).toHaveLength(1);
    expect(expediente.body.data.consents[0].legal_template).toBe("velocity");

    const paymentId = expediente.body.data.payments[0].id;
    const refundReq = await request(app)
      .post(`/api/admin/payments/${paymentId}/refund`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({ amount: 26800, reason: "Auditoria Stripe Velocity" });
    expect(refundReq.status).toBe(200);

    const approve = await request(app)
      .post(`/api/admin/payments/${paymentId}/approve-refund`)
      .set("Authorization", `Bearer ${signTestAdminAccessToken(staff)}`)
      .send({});
    expect(approve.status).toBe(200);

    const afterRefund = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = afterRefund.latest_charge as Stripe.Charge;
    expect(charge.refunded).toBe(true);
    expect(charge.amount_refunded).toBe(2680000);
  }, 120_000);
});
