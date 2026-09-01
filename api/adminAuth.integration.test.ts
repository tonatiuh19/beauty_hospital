/**
 * Admin JWT / RBAC / refresh — HTTP integration tests against createServer().
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool } from "mysql2/promise";
import { createServer } from "./index";
import {
  cleanupIntegrationTestFixtures,
  createIntegrationTestPool,
  insertTestStaffUser,
  requireIntegrationEnv,
  signTestAdminAccessToken,
  signTestAdminRefreshToken,
  uniqueTestEmail,
} from "./testDbCleanup";

const RUN_ID = `adminauth-${Date.now()}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];

let generalAdmin = { id: 0, email: "", role: "general_admin" };
let receptionist = { id: 0, email: "", role: "receptionist" };
let doctor = { id: 0, email: "", role: "doctor" };

describe("admin JWT, RBAC, and refresh", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    generalAdmin.email = uniqueTestEmail(RUN_ID, "gadmin");
    receptionist.email = uniqueTestEmail(RUN_ID, "recep");
    doctor.email = uniqueTestEmail(RUN_ID, "doctor");

    generalAdmin.id = await insertTestStaffUser(pool, {
      email: generalAdmin.email,
      role: "general_admin",
      lastName: RUN_ID,
    });
    receptionist.id = await insertTestStaffUser(pool, {
      email: receptionist.email,
      role: "receptionist",
      lastName: RUN_ID,
    });
    doctor.id = await insertTestStaffUser(pool, {
      email: doctor.email,
      role: "doctor",
      lastName: RUN_ID,
    });
    userIds.push(generalAdmin.id, receptionist.id, doctor.id);
  }, 60_000);

  afterAll(async () => {
    try {
      if (pool) {
        await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID, userIds });
      }
    } finally {
      await pool?.end();
    }
  });

  it("rejects admin routes without a Bearer token", async () => {
    const res = await request(app).get("/api/admin/payments");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects an invalid access token", async () => {
    const res = await request(app)
      .get("/api/admin/payments")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("lets a general_admin read payments", async () => {
    const token = signTestAdminAccessToken(generalAdmin);
    const res = await request(app)
      .get("/api/admin/payments")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("blocks a receptionist from dashboard metrics (403)", async () => {
    const token = signTestAdminAccessToken(receptionist);
    const res = await request(app)
      .get("/api/admin/dashboard/metrics")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/permiso/i);
  });

  it("allows a receptionist to read the calendar", async () => {
    const token = signTestAdminAccessToken(receptionist);
    const res = await request(app)
      .get("/api/admin/dashboard/calendar")
      .query({ start_date: "2026-01-01", end_date: "2026-12-31" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("blocks a doctor from payments (finance RBAC)", async () => {
    const token = signTestAdminAccessToken(doctor);
    const res = await request(app)
      .get("/api/admin/payments")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("refreshes an access token and accepts the new one", async () => {
    const refreshToken = signTestAdminRefreshToken(generalAdmin.id);
    const refreshRes = await request(app)
      .post("/api/admin/auth/refresh")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.accessToken).toBeTruthy();
    expect(refreshRes.body.user.email).toBe(generalAdmin.email);

    const retry = await request(app)
      .get("/api/admin/payments")
      .set("Authorization", `Bearer ${refreshRes.body.accessToken}`);
    expect(retry.status).toBe(200);
  });

  it("rejects refresh without a token", async () => {
    const res = await request(app).post("/api/admin/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("rejects refresh for an inactive staff user", async () => {
    await pool.query(`UPDATE users SET is_active = 0 WHERE id = ?`, [
      doctor.id,
    ]);
    const refreshToken = signTestAdminRefreshToken(doctor.id);
    const res = await request(app)
      .post("/api/admin/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(401);
    await pool.query(`UPDATE users SET is_active = 1 WHERE id = ?`, [
      doctor.id,
    ]);
  });
});
