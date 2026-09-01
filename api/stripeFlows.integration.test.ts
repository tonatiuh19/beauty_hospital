/**
 * Stripe webhook signature + confirm-payment validation.
 * Does not create live charges.
 */
import "dotenv/config";
import { describe, expect, it } from "vitest";
import request from "supertest";
import Stripe from "stripe";
import { createServer } from "./index";

const app = createServer();

describe("stripe booking and webhook", () => {
  it("rejects confirm-payment without a payment_intent_id", async () => {
    const res = await request(app).post("/api/appointments/confirm-payment").send({});
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  it("rejects a webhook without a Stripe signature", async () => {
    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("Content-Type", "application/json")
      .send({ type: "payment_intent.succeeded" });
    expect([400, 500]).toContain(res.status);
  });

  it("rejects a webhook with an invalid signature", async () => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return;
    }
    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=deadbeef")
      .send(JSON.stringify({ type: "payment_intent.succeeded" }));
    expect(res.status).toBe(400);
  });

  it("accepts a signed webhook that has no booking metadata", async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
      apiVersion: "2025-02-24.acacia",
    });
    const payload = JSON.stringify({
      id: "evt_test_stripe_audit",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_no_metadata",
          object: "payment_intent",
          status: "succeeded",
          amount: 150000,
          currency: "mxn",
          metadata: {},
        },
      },
    });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", header)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
