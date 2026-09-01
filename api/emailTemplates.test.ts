/**
 * Email HTML must stay emoji-free and the brand logo must be readable for CID / /api/brand/logo.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createServer } from "./index";

const API_SRC = readFileSync(
  path.join(process.cwd(), "api/index.ts"),
  "utf8",
);

function extractEmailBodies(src: string): string[] {
  const bodies: string[] = [];
  const re = /(?:const emailBody|const textBody)\s*=\s*([`'])([\s\S]*?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    bodies.push(match[2]);
  }
  return bodies;
}

const EMOJI_ENTITY = /&#(9888|128274|10003|10005|8635|8595|9679|128\d{3});/;
const EMOJI_UNICODE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/u;

describe("email templates", () => {
  it("extracts every email body from the API monolith", () => {
    expect(extractEmailBodies(API_SRC).length).toBeGreaterThanOrEqual(7);
  });

  it("does not use emoji characters or emoji HTML entities in email bodies", () => {
    const bodies = extractEmailBodies(API_SRC);
    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).not.toMatch(EMOJI_ENTITY);
      expect(body).not.toMatch(EMOJI_UNICODE);
    }
  });

  it("embeds the logo via CID so inboxes do not fetch the SPA HTML fallback", () => {
    const htmlBodies = extractEmailBodies(API_SRC).filter((b) =>
      b.includes("<!DOCTYPE html>"),
    );
    expect(htmlBodies.length).toBeGreaterThanOrEqual(7);
    for (const body of htmlBodies) {
      expect(body).toContain("emailLogoImg()");
    }
  });

  it("serves the brand logo as image/png", async () => {
    const res = await request(createServer()).get("/api/brand/logo");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/png/);
    expect(res.body.length).toBeGreaterThan(1000);
  });
});
