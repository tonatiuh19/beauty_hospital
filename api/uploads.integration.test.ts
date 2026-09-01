/**
 * Admin uploads + service image_url persistence.
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

const RUN_ID = `uploads-${Date.now()}`;

let pool: Pool;
let app: ReturnType<typeof createServer>;
const userIds: number[] = [];
let admin = { id: 0, email: "", role: "general_admin" };
let receptionist = { id: 0, email: "", role: "receptionist" };

describe("admin uploads and service image_url", () => {
  beforeAll(async () => {
    requireIntegrationEnv();
    pool = createIntegrationTestPool();
    app = createServer();

    admin.email = uniqueTestEmail(RUN_ID, "upadmin");
    receptionist.email = uniqueTestEmail(RUN_ID, "uprecep");
    admin.id = await insertTestStaffUser(pool, {
      email: admin.email,
      role: "general_admin",
      lastName: RUN_ID,
    });
    receptionist.id = await insertTestStaffUser(pool, {
      email: receptionist.email,
      role: "receptionist",
      lastName: RUN_ID,
    });
    userIds.push(admin.id, receptionist.id);
  }, 60_000);

  afterAll(async () => {
    try {
      if (pool) {
        await pool.query(`DELETE FROM services WHERE name LIKE ?`, [
          `%${RUN_ID}%`,
        ]);
        await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID, userIds });
      }
    } finally {
      await pool?.end();
    }
  });

  it("rejects uploads without a token", async () => {
    const res = await request(app).post("/api/admin/uploads").send({
      filename: "x.png",
      content_type: "image/png",
      data_base64: "aaaa",
    });
    expect(res.status).toBe(401);
  });

  it("lets a receptionist reach the upload handler", async () => {
    const token = signTestAdminAccessToken(receptionist);
    const res = await request(app)
      .post("/api/admin/uploads")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect([400, 503]).toContain(res.status);
  });

  it("persists image_url on create/update service", async () => {
    const token = signTestAdminAccessToken(admin);
    const create = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `Blob Service ${RUN_ID}`,
        description: "Integration fixture",
        category: "other",
        price: 100,
        duration_minutes: 30,
        image_url: "/assets/services/02.jpg",
      });

    expect(create.status).toBe(201);
    const id = Number(create.body.data.id);
    expect(create.body.data.image_url).toBe("/assets/services/02.jpg");

    const update = await request(app)
      .put(`/api/admin/services/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ image_url: "/assets/services/03.jpg" });
    expect(update.status).toBe(200);
    expect(update.body.data.image_url).toBe("/assets/services/03.jpg");

    await pool.query(`DELETE FROM services WHERE id = ?`, [id]);
  });

  it("rejects a non-http image_url", async () => {
    const token = signTestAdminAccessToken(admin);
    const res = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `Bad Image ${RUN_ID}`,
        category: "other",
        price: 10,
        duration_minutes: 15,
        image_url: "javascript:alert(1)",
      });
    expect(res.status).toBe(400);

    const leftover = await pool.query<RowDataPacket[]>(
      `SELECT id FROM services WHERE name = ?`,
      [`Bad Image ${RUN_ID}`],
    );
    expect(leftover[0].length).toBe(0);
  });
});
