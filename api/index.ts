import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import type { RequestHandler } from "express";
import type { DemoResponse } from "../shared/api";
import { Resend } from "resend";
import Stripe from "stripe";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";

// Database connection (TiDB Cloud requires TLS)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "4000"),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  connectTimeout: 20_000,
  timezone: "+00:00",
  ssl:
    process.env.DB_SSL === "false"
      ? undefined
      : { minVersion: "TLSv1.2" },
});

const FROM_EMAIL =
  process.env.SMTP_FROM ||
  "All Beauty Luxury & Wellness <no-reply@disruptinglabs.com>";

let emailClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  emailClient = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("⚠️  RESEND_API_KEY not set — emails will be logged, not sent");
}

type SendEmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  contentId?: string;
};

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: SendEmailAttachment[];
};

const EMAIL_LOGO_CID = "brand-logo";
let brandLogoBuffer: Buffer | null | undefined;

function loadBrandLogo(): Buffer | null {
  if (brandLogoBuffer !== undefined) return brandLogoBuffer;
  const candidates = [
    path.join(process.cwd(), "public/assets/logo-header.png"),
    path.join(process.cwd(), "assets/logo-header.png"),
    path.join(process.cwd(), "dist/spa/assets/logo-header.png"),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        brandLogoBuffer = fs.readFileSync(filePath);
        return brandLogoBuffer;
      }
    } catch {
      // try the next candidate
    }
  }
  brandLogoBuffer = null;
  return null;
}

function emailLogoAttachment(): SendEmailAttachment | null {
  const content = loadBrandLogo();
  if (!content) return null;
  return {
    filename: "logo-header.png",
    content,
    contentType: "image/png",
    contentId: EMAIL_LOGO_CID,
  };
}

function emailLogoImg(): string {
  const src = loadBrandLogo() ? `cid:${EMAIL_LOGO_CID}` : brandLogoUrl();
  return `<img src="${src}" alt="All Beauty Luxury &amp; Wellness" width="220" style="height:52px;width:auto;max-width:220px;display:inline-block;border:0;outline:none;text-decoration:none;" />`;
}

async function sendEmail(opts: SendEmailOptions) {
  const attachments = [...(opts.attachments || [])];
  if (opts.html.includes(`cid:${EMAIL_LOGO_CID}`)) {
    const logo = emailLogoAttachment();
    if (logo && !attachments.some((a) => a.contentId === EMAIL_LOGO_CID)) {
      attachments.unshift(logo);
    }
  }

  if (!emailClient || process.env.VITEST === "true") {
    console.log("[email:dry-run]", opts.to, opts.subject);
    return { id: "dry-run" };
  }
  const { data, error } = await emailClient.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: attachments.length
      ? attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          contentId: a.contentId,
        }))
      : undefined,
  });
  if (error) throw new Error(error.message);
  console.log("[email:sent]", opts.to, opts.subject, data?.id || "(no-id)");
  return { id: data?.id };
}

type AdminJwtPayload = {
  id: number;
  email: string;
  role: string;
  type: "admin";
};

function getAdminFromRequest(req: express.Request): AdminJwtPayload | null {
  return ((req as express.Request & { admin?: AdminJwtPayload }).admin ??
    null) as AdminJwtPayload | null;
}

function missingAdminActorResponse(res: express.Response) {
  return res.status(400).json({
    success: false,
    message: "No se pudo identificar al administrador",
  });
}

async function resolveStaffCreatedBy(
  preferredId?: number | null,
): Promise<number | null> {
  if (preferredId) {
    const [rows] = await pool.query<any[]>(
      "SELECT id FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [preferredId],
    );
    if (rows.length) return Number(rows[0].id);
  }
  const [fallback] = await pool.query<any[]>(
    `SELECT id FROM users
     WHERE role IN ('general_admin', 'admin') AND is_active = 1
     ORDER BY id ASC LIMIT 1`,
  );
  return fallback[0]?.id ? Number(fallback[0].id) : null;
}

function tryGetAdminFromHeader(req: express.Request): AdminJwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    const decoded = jwt.verify(
      authHeader.substring(7),
      jwtSecret,
    ) as AdminJwtPayload;
    if (decoded.type !== "admin" || !decoded.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

const STAFF_LOGIN_ROLES_SQL =
  "'admin', 'general_admin', 'receptionist', 'doctor', 'pos'";
const STAFF_CAN_CANCEL_ROLES = new Set([
  "admin",
  "general_admin",
  "receptionist",
  "pos",
]);

const CLINIC_TIMEZONE =
  process.env.CLINIC_TIMEZONE || "America/Mexico_City";

function clinicDateYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function publicAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "https://allbeautyweb.com"
  ).replace(/\/$/, "");
}

function brandLogoUrl(): string {
  return process.env.BRAND_LOGO_URL || `${publicAppUrl()}/api/brand/logo`;
}

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const UPLOAD_FOLDERS = new Set([
  "services",
  "contracts",
  "invoices",
  "brand",
  "media",
  "uploads",
]);

function sanitizeUploadName(name: string): string {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function isAllowedAssetUrl(url: string): boolean {
  if (!url) return true;
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith("/assets/") ||
    url.startsWith("/uploads/")
  );
}

function clinicMonthStartYmd(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}-01`;
}

const DASHBOARD_ROLES = ["admin", "general_admin"];
const CALENDAR_ROLES = ["admin", "general_admin", "receptionist", "pos"];
const PATIENT_ROLES = [
  "admin",
  "general_admin",
  "receptionist",
  "pos",
  "doctor",
];
const FINANCE_ROLES = ["admin", "general_admin", "receptionist", "pos"];
const MEDICAL_ROLES = ["general_admin", "doctor"];
const OPS_ROLES = ["admin", "general_admin"];
const SETTINGS_ROLES = ["general_admin"];

const ADMIN_ROLE_RULES: Array<{
  test: (path: string, method: string) => boolean;
  roles: string[];
}> = [
  { test: (p) => p.startsWith("/dashboard/calendar"), roles: CALENDAR_ROLES },
  { test: (p) => p.startsWith("/dashboard"), roles: DASHBOARD_ROLES },
  { test: (p) => p.startsWith("/appointments"), roles: CALENDAR_ROLES },
  { test: (p) => p.startsWith("/patients"), roles: PATIENT_ROLES },
  { test: (p) => p.startsWith("/contracts"), roles: FINANCE_ROLES },
  { test: (p) => p.startsWith("/consents"), roles: MEDICAL_ROLES },
  { test: (p) => p.startsWith("/payments"), roles: FINANCE_ROLES },
  { test: (p) => p.startsWith("/invoices"), roles: FINANCE_ROLES },
  { test: (p) => p.startsWith("/medical-records"), roles: MEDICAL_ROLES },
  { test: (p) => p.startsWith("/uploads"), roles: FINANCE_ROLES },
  { test: (p) => p.startsWith("/services"), roles: OPS_ROLES },
  { test: (p) => p.startsWith("/blocked-dates"), roles: OPS_ROLES },
  { test: (p) => p.startsWith("/users"), roles: SETTINGS_ROLES },
  {
    test: (p, method) =>
      p.startsWith("/settings/default-contract-terms") && method === "GET",
    roles: FINANCE_ROLES,
  },
  { test: (p) => p.startsWith("/settings"), roles: SETTINGS_ROLES },
];

function requireRoles(roles: string[]): RequestHandler {
  return (req, res, next) => {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para esta acción",
      });
    }
    next();
  };
}

const authorizeAdmin: RequestHandler = (req, res, next) => {
  if (req.path.startsWith("/auth/")) return next();
  const rule = ADMIN_ROLE_RULES.find((r) =>
    r.test(req.path, req.method.toUpperCase()),
  );
  if (!rule) {
    return requireRoles(["admin", "general_admin"])(req, res, next);
  }
  return requireRoles(rule.roles)(req, res, next);
};

function signAdminTokens(user: { id: number; email: string; role: string }) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const accessExpires = (process.env.JWT_EXPIRES_IN ||
    "24h") as jwt.SignOptions["expiresIn"];
  const refreshExpires = (process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d") as jwt.SignOptions["expiresIn"];
  const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: "admin" },
    jwtSecret,
    { expiresIn: accessExpires },
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: "admin_refresh" },
    refreshSecret,
    { expiresIn: refreshExpires },
  );
  return { accessToken, refreshToken };
}

const authenticateAdmin: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res
      .status(500)
      .json({ success: false, message: "Server configuration error" });
  }
  try {
    const decoded = jwt.verify(
      authHeader.substring(7),
      jwtSecret,
    ) as AdminJwtPayload;
    if (decoded.type !== "admin" || !decoded.id) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }
    (req as express.Request & { admin?: AdminJwtPayload }).admin = decoded;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️  WARNING: STRIPE_SECRET_KEY is not configured. Payment processing will fail.",
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Get or create a Stripe Customer for a patient.
 * If the stored customer ID is invalid (e.g. created with different Stripe keys — test vs live),
 * a new customer is created and the DB record is updated automatically.
 */
async function getOrCreateStripeCustomer(
  patientId: number,
  email: string,
  firstName: string,
  lastName: string,
  existingCustomerId?: string | null,
): Promise<string> {
  console.log(
    `[getOrCreateStripeCustomer] patient_id=${patientId} email=${email} existingCustomerId=${existingCustomerId ?? "NULL"}`,
  );

  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!(customer as any).deleted) {
        console.log(
          `[getOrCreateStripeCustomer] ✅ Reusing existing Stripe customer ${existingCustomerId} for patient ${patientId}`,
        );
        // Upgrade any payment methods saved before allow_redisplay was set correctly.
        // Methods saved with allow_redisplay:"unspecified" are hidden by PaymentElement;
        // updating them to "limited" makes them appear for future bookings.
        // NOTE: must use stripe.customers.listPaymentMethods (not stripe.paymentMethods.list)
        // because the latter is for Treasury flows and won't return customer-attached methods.
        try {
          const existingPMs =
            await stripe.customers.listPaymentMethods(existingCustomerId);
          console.log(
            `[getOrCreateStripeCustomer] 💳 Customer ${existingCustomerId} has ${existingPMs.data.length} attached payment method(s):`,
            existingPMs.data.map((pm) => ({
              id: pm.id,
              type: pm.type,
              brand: (pm as any).card?.brand,
              last4: (pm as any).card?.last4,
              allow_redisplay: pm.allow_redisplay,
            })),
          );
          for (const pm of existingPMs.data) {
            if (
              pm.allow_redisplay !== "limited" &&
              pm.allow_redisplay !== "always"
            ) {
              await stripe.paymentMethods.update(pm.id, {
                allow_redisplay: "limited",
              });
              console.log(
                `[getOrCreateStripeCustomer] 🔧 Fixed allow_redisplay for ${pm.id} (${(pm as any).card?.brand} ****${(pm as any).card?.last4}): ${pm.allow_redisplay} → limited`,
              );
            }
          }
        } catch (pmErr: any) {
          console.warn(
            `[getOrCreateStripeCustomer] ⚠️  Could not list/update payment methods allow_redisplay:`,
            pmErr.message,
          );
        }
        return existingCustomerId;
      }
      console.log(
        `[getOrCreateStripeCustomer] ⚠️  Customer ${existingCustomerId} exists but is marked DELETED — will create new`,
      );
    } catch (err: any) {
      // Customer not found — possibly created with different Stripe keys (test vs live)
      console.log(
        `[getOrCreateStripeCustomer] ⚠️  Stripe customer ${existingCustomerId} not found in current environment (${err.message}), creating new one`,
      );
    }
  } else {
    console.log(
      `[getOrCreateStripeCustomer] ℹ️  No existing stripe_customer_id in DB for patient ${patientId} — will create new Stripe customer`,
    );
  }

  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
    metadata: { patient_id: patientId.toString() },
  });

  console.log(
    `[getOrCreateStripeCustomer] 🆕 Created Stripe customer ${customer.id} for patient ${patientId}`,
  );

  const [updateResult] = await pool.query<any>(
    "UPDATE patients SET stripe_customer_id = ? WHERE id = ?",
    [customer.id, patientId],
  );
  console.log(
    `[getOrCreateStripeCustomer] 💾 DB UPDATE stripe_customer_id → ${customer.id}, affectedRows=${updateResult.affectedRows}`,
  );

  console.log(
    `✨ Created Stripe customer ${customer.id} for patient ${patientId}`,
  );
  return customer.id;
}

type FulfillPaymentResult =
  | { ok: true; appointmentId: number; alreadyFulfilled: boolean }
  | { ok: false; status: number; error: string };

function resolveStripeRefundRef(payment: {
  stripe_payment_intent_id?: string | null;
  stripe_payment_id?: string | null;
}): { paymentIntentId?: string; chargeId?: string } | null {
  const pi = String(payment.stripe_payment_intent_id || "").trim();
  const sid = String(payment.stripe_payment_id || "").trim();
  if (pi.startsWith("pi_")) return { paymentIntentId: pi };
  if (sid.startsWith("pi_")) return { paymentIntentId: sid };
  if (sid.startsWith("ch_")) return { chargeId: sid };
  return null;
}

type LegalTemplateKey = "bliss" | "legacy" | "velocity";
type ServiceAreaOption = {
  id: string;
  label: string;
  size?: string;
  price?: number;
};

const VELOCITY_MAX_ZONES = 4;
const VELOCITY_INTERVALS_WEEKS = [4, 6, 8, 10, 12, 14, 16, 18, 20];

const CLINIC_LEGAL = {
  name: "ALLBEAUTY LUXURY AND WELLNESS",
  short: "ALL BEAUTY",
  rfc: "ALA260322VA5",
  address:
    "Prol. de Paseo Tabasco, número 1405, local 121, segundo nivel, C. C. Galerías Tabasco 2000, colonia Tabasco 2000, Villahermosa, Centro, Tabasco, C.P. 86035",
  phone: "9931871054",
  email: "allbeauty@allbeautyweb.com",
};

const CONSENT_QUESTIONS: Record<
  LegalTemplateKey,
  Array<{ id: string; label: string }>
> = {
  bliss: [
    { id: "pregnancy", label: "Embarazo, lactancia o planes de embarazo" },
    { id: "wound", label: "Herida, infección o alteración de cicatrización en la zona" },
    { id: "hernia", label: "Hernia abdominal no reparada" },
    { id: "immune", label: "Inmunodeficiencia o uso de inmunosupresores" },
    { id: "coag", label: "Trastorno de coagulación o antecedentes de queloides" },
    { id: "neuropathy", label: "Neuropatía, diabetes o sensibilidad cutánea alterada" },
    { id: "photosens", label: "Fotosensibilidad o medicamentos fotosensibilizantes" },
    { id: "tan", label: "Bronceado reciente o exposición intensa al sol" },
    { id: "meds", label: "Anticoagulantes, antiagregantes, antiinflamatorios u otros fármacos" },
    { id: "cancer", label: "Melanoma, carcinoma cutáneo u otros antecedentes de cáncer" },
    { id: "implant", label: "Marcapasos, dispositivos electrónicos o implantes en la zona" },
    { id: "surgery", label: "Cirugía reciente, otros tratamientos o alergias" },
  ],
  legacy: [
    { id: "pregnancy", label: "Embarazo o tratamiento de fecundación in vitro" },
    { id: "pacemaker", label: "Marcapasos o desfibrilador implantado" },
    { id: "metal", label: "Implantes metálicos en la zona salvo dentales" },
    { id: "silicone", label: "Silicona inyectada o implantada en la zona" },
    { id: "infection", label: "Inflamación, infección o lesión activa en la zona" },
    { id: "cancer", label: "Cáncer actual o antecedente de cáncer" },
    { id: "neuro", label: "Enfermedad neurológica degenerativa o activada por calor" },
    { id: "thyroid", label: "Tiroides no controlada, várices o enfermedad autoinmune cutánea" },
    { id: "lactation", label: "Lactancia, trombosis, trastornos de coagulación o diabetes" },
    { id: "meds", label: "Medicamentos anticoagulantes, alergias o tratamientos recientes" },
  ],
  velocity: [
    { id: "pregnancy", label: "Embarazo, lactancia o planes de embarazo" },
    { id: "tan", label: "Bronceado reciente o exposición intensa al sol" },
    { id: "photosens", label: "Fotosensibilidad o medicamentos fotosensibilizantes" },
    { id: "wound", label: "Herida, infección o lesión activa en la zona" },
    { id: "cancer", label: "Cáncer cutáneo u otros antecedentes de cáncer" },
    { id: "pigment", label: "Alteraciones de pigmentación o tendencia a queloides" },
    { id: "herpes", label: "Herpes recurrente en la zona" },
    { id: "meds", label: "Anticoagulantes, isotretinoína u otros fármacos relevantes" },
    { id: "tattoos", label: "Tatuajes, maquillaje permanente o implantes en la zona" },
    { id: "allergy", label: "Alergias o tratamientos recientes en la piel" },
  ],
};

function isConsentComplete(
  legalKey: LegalTemplateKey,
  consent: unknown,
): boolean {
  if (!consent || typeof consent !== "object") return false;
  const payload = consent as {
    signature?: string;
    data_health_consent?: boolean;
    health_answers?: Record<string, unknown>;
  };
  if (!payload.signature || !payload.data_health_consent) return false;
  const answers = payload.health_answers;
  if (!answers || typeof answers !== "object") return false;
  return CONSENT_QUESTIONS[legalKey].every((question) => {
    const value = String(answers[question.id] ?? "")
      .trim()
      .toLowerCase();
    return value === "si" || value === "no";
  });
}

function isPatientMinor(dateOfBirth: unknown): boolean {
  if (!dateOfBirth) return false;
  const born = new Date(String(dateOfBirth));
  if (Number.isNaN(born.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDelta = today.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age < 18;
}

function consentAnnexPayload(consent: unknown): {
  is_minor: boolean;
  guardian_name: string;
  guardian_relationship: string;
  guardian_signature: string;
} {
  const payload = consent && typeof consent === "object" ? (consent as Record<string, unknown>) : {};
  return {
    is_minor: Boolean(payload.is_minor),
    guardian_name: String(payload.guardian_name || "").trim(),
    guardian_relationship: String(payload.guardian_relationship || "").trim(),
    guardian_signature: String(payload.guardian_signature || "").trim(),
  };
}

function isMinorsAnnexRequired(
  legalKey: LegalTemplateKey | null,
  dateOfBirth: unknown,
  consent: unknown,
): boolean {
  if (!legalKey || legalKey === "bliss") return false;
  return isPatientMinor(dateOfBirth) || consentAnnexPayload(consent).is_minor;
}

function isMinorsAnnexComplete(consent: unknown): boolean {
  const annex = consentAnnexPayload(consent);
  return Boolean(
    annex.guardian_name &&
      annex.guardian_relationship &&
      annex.guardian_signature,
  );
}

function parseAreaCatalog(raw: unknown): ServiceAreaOption[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        id: String(item?.id || "").trim(),
        label: String(item?.label || "").trim(),
        size: item?.size ? String(item.size).trim() : undefined,
        price:
          item?.price != null && Number.isFinite(Number(item.price))
            ? Number(item.price)
            : undefined,
      }))
      .filter((item) => item.id && item.label);
  } catch {
    return [];
  }
}

function parseSelectedZones(raw: unknown): ServiceAreaOption[] {
  return parseAreaCatalog(raw);
}

async function resolveCheckInSelectedZones(
  legalKey: LegalTemplateKey | null,
  zoneLabel: string,
): Promise<ServiceAreaOption[]> {
  if (legalKey !== "velocity" || !zoneLabel.trim()) return [];
  const catalog = await loadVelocityAreaCatalog();
  const labels = zoneLabel
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!labels.length) return [];
  const pick = resolveSelectedZones(
    { legal_template: "velocity", area_catalog: catalog },
    labels,
    catalog,
  );
  return pick.ok ? pick.zones : [];
}

async function loadVelocityAreaCatalog(): Promise<ServiceAreaOption[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT area_catalog FROM services
     WHERE legal_template = 'velocity' AND is_active = 1`,
  );
  const byId = new Map<string, ServiceAreaOption>();
  for (const row of rows) {
    for (const area of parseAreaCatalog(row.area_catalog)) {
      byId.set(area.id, area);
    }
  }
  return [...byId.values()];
}

function computePackageDuration(
  legalTemplate: string | null | undefined,
  baseMinutes: number,
  zoneCount: number,
): number {
  if (legalTemplate !== "velocity" || zoneCount <= 1) return baseMinutes;
  return baseMinutes + 15 * (zoneCount - 1);
}

function suggestedVelocityNextDate(
  lastScheduledAt: Date,
  reservedCount: number,
): string | null {
  const idx = reservedCount - 1;
  if (idx < 0 || idx >= VELOCITY_INTERVALS_WEEKS.length) return null;
  const next = new Date(lastScheduledAt.getTime());
  next.setDate(next.getDate() + VELOCITY_INTERVALS_WEEKS[idx] * 7);
  return next.toISOString().slice(0, 10);
}

function zoneIdsOf(zones: ServiceAreaOption[]): string[] {
  return zones.map((zone) => zone.id);
}

function zonesAreSubset(
  selected: ServiceAreaOption[],
  contracted: ServiceAreaOption[],
): boolean {
  if (selected.length === 0 || contracted.length === 0) return false;
  const allowed = new Set(zoneIdsOf(contracted));
  return selected.every((zone) => allowed.has(zone.id));
}

function mapServiceRow(row: any) {
  return {
    ...row,
    price: parseFloat(row.price),
    duration_minutes: parseInt(row.duration_minutes, 10),
    package_sessions: parseInt(row.package_sessions || "1", 10) || 1,
    legal_template: row.legal_template || null,
    area_catalog: parseAreaCatalog(row.area_catalog),
    is_active: Boolean(row.is_active),
  };
}

type ZonePick =
  | {
      ok: true;
      zones: ServiceAreaOption[];
      zoneId: string;
      zoneLabel: string;
      totalPrice: number;
    }
  | { ok: false; error: string };

function resolveSelectedZones(
  service: {
    legal_template?: string | null;
    price?: number;
    area_catalog?: ServiceAreaOption[];
  },
  selectedAreas: unknown,
  velocityCatalog: ServiceAreaOption[] = [],
): ZonePick {
  const isVelocity = service.legal_template === "velocity";
  const catalog = isVelocity
    ? velocityCatalog.length
      ? velocityCatalog
      : service.area_catalog || []
    : service.area_catalog || [];
  if (catalog.length === 0) {
    const raw = Array.isArray(selectedAreas) ? String(selectedAreas[0] || "") : "";
    return {
      ok: true,
      zones: raw ? [{ id: raw, label: raw }] : [],
      zoneId: raw,
      zoneLabel: raw,
      totalPrice: Number(service.price || 0),
    };
  }
  if (!Array.isArray(selectedAreas) || selectedAreas.length === 0) {
    return {
      ok: false,
      error: isVelocity
        ? "Selecciona de 1 a 4 zonas del catálogo Velocity."
        : "Este paquete incluye una sola zona. Selecciona un área.",
    };
  }
  if (!isVelocity && selectedAreas.length !== 1) {
    return {
      ok: false,
      error: "Este paquete incluye una sola zona. Selecciona un área.",
    };
  }
  if (isVelocity && selectedAreas.length > VELOCITY_MAX_ZONES) {
    return {
      ok: false,
      error: "El contrato Velocity permite hasta 4 zonas en el mismo paquete.",
    };
  }
  const unique = [...new Set(selectedAreas.map((item) => String(item || "").trim()))].filter(
    Boolean,
  );
  const zones: ServiceAreaOption[] = [];
  for (const chosen of unique) {
    const match = catalog.find(
      (area) => area.id === chosen || area.label === chosen,
    );
    if (!match) {
      return {
        ok: false,
        error: "El área seleccionada no corresponde al catálogo de este paquete.",
      };
    }
    zones.push(match);
  }
  const totalPrice = isVelocity
    ? zones.reduce((sum, zone) => sum + Number(zone.price || 0), 0)
    : Number(service.price || 0);
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return { ok: false, error: "El paquete no tiene un precio válido." };
  }
  return {
    ok: true,
    zones,
    zoneId: zones.map((zone) => zone.id).join(","),
    zoneLabel: zones.map((zone) => zone.label).join(", "),
    totalPrice,
  };
}

function fillLegalPlaceholders(
  text: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    if (value === null || value === undefined || value === "") return "______________";
    return String(value);
  });
}

function defaultContractTemplate(key: LegalTemplateKey): string {
  if (key === "velocity") {
    return `
ALL BEAUTY LUXURY & WELLNESS
Contrato de depilación láser
Paquete de 10 sesiones por zona con garantía de sesiones adicionales sin costo. Este documento comprende la carátula comercial, las condiciones del servicio y la póliza de garantía. El consentimiento informado se firma por separado.

Datos de las partes
Folio: {{folio}}    Lugar y fecha: Villahermosa, Tabasco, {{sign_date}}
Razón social: ${CLINIC_LEGAL.name}
Nombre comercial: ALL BEAUTY LUXURY & WELLNESS
RFC: ${CLINIC_LEGAL.rfc}
Domicilio: ${CLINIC_LEGAL.address}
Teléfono para citas y reclamaciones: ${CLINIC_LEGAL.phone}
Correo: ${CLINIC_LEGAL.email}
Cliente y beneficiario del tratamiento: {{patient_name}}
Fecha de nacimiento: {{date_of_birth}}    Teléfono: {{phone}}
Correo: {{email}}

Zonas incluidas en el paquete (10 sesiones cada una)
{{zone}}
Cada sesión comprende una aplicación en cada zona contratada que resulte apta para tratar ese día. El registro indicará las zonas realmente atendidas; una zona omitida no se descontará como realizada.

Precio total del paquete con impuestos y cargos incluidos: {{price}} MXN
Anticipo, saldo y medio de pago se documentan en el expediente y en los comprobantes. No se recaban números completos de tarjeta, CVV ni fecha de vencimiento. Este contrato no autoriza domiciliaciones ni cargos recurrentes.

1. Objeto y valoración inicial
El proveedor prestará 10 sesiones de depilación láser por cada zona de la carátula, sujetas a valoración de aptitud y al protocolo del equipo Venus Velocity, de Venus Concept. Cargo del personal responsable de valorar y realizar el tratamiento: Enfermera especializada. Se documentarán vello, piel, antecedentes y resultado viable antes de iniciar; no se tratará si existe contraindicación. El expediente identificará a la profesional que intervenga en cada atención.

2. Programación y continuidad
Calendario base del tratamiento: sesión 1 al inicio; intervalos entre sesiones 1–2, 2–3, 3–4, 4–5, 5–6, 6–7, 7–8, 8–9 y 9–10 de 4, 6, 8, 10, 12, 14, 16, 18 y 20 semanas, respectivamente. La sesión 10 corresponde a la semana 108 desde el inicio, si no hay ajustes.
El responsable técnico validará y, si es necesario, ajustará el calendario por zona, protocolo, seguridad y respuesta, documentándolo con el cliente. Las pausas clínicas, por embarazo, fuerza mayor o causas del proveedor no cancelan sesiones ni garantía. El paquete no caduca por este calendario.
Avisar cambios de cita con 24 horas. Una falta no cuenta como sesión realizada. La inasistencia sin aviso durante tres meses se atenderá conforme a las cláusulas 5 y 9. No se prevén penalizaciones económicas por cita.

3. Precio y pagos
El precio y calendario serán los de la carátula. Se entregará comprobante de cada pago y factura cuando corresponda. No habrá incrementos, zonas adicionales ni cargos nuevos sin acuerdo expreso. Un atraso se notificará por escrito antes de acordar una pausa; no elimina las sesiones pagadas ni los derechos legales del cliente.

4. Cuidados y seguridad
El cliente informará medicamentos, cambios de salud y reacciones relevantes, y seguirá las indicaciones individualizadas entregadas por escrito. El proveedor utilizará personal capacitado, protección ocular apropiada, parámetros documentados y medidas de higiene. Ante una reacción adversa suspenderá la aplicación, documentará lo ocurrido y facilitará evaluación y atención oportunas según la gravedad.

5. Cancelación y terminación
La cancelación voluntaria por motivos personales del cliente no dará lugar a devolución, salvo los supuestos legalmente exigibles. El cliente podrá comunicar su decisión por los canales de la carátula y no estará obligado a recibir aplicaciones. Esta política no excluye devoluciones, bonificaciones u otros derechos por incumplimiento del proveedor ni por otras causas previstas en la ley.
Tres meses calendario de inasistencia sin aviso, contados desde una cita confirmada incumplida sin reprogramación, darán lugar al procedimiento de suspensión de sesiones adicionales gratuitas de la cláusula 9. No se cuentan desde la última sesión ni incluyen intervalos programados, pausas autorizadas, causas clínicas justificadas o atribuibles al proveedor.

6. Documentos y controversias
Se entregarán copias del contrato, póliza, consentimiento y cuidados. Las modificaciones requieren acuerdo escrito. El cliente conserva sus derechos ante PROFECO y autoridades competentes. El consentimiento no exime de responsabilidad por servicios defectuosos.

Póliza de garantía de depilación láser
7. Resultado cubierto y medición
Resultado ofrecido por zona contratada: reducción del vello del 90 al 95 %. El mínimo garantizado es del 90 %; el 95 % es el extremo superior del objetivo. Alcanzar el 90 % cumple la garantía.
La garantía se refiere al resultado medible pactado, no a ausencia absoluta de todo vello de por vida. La respuesta puede variar y puede requerirse mantenimiento posterior.
Medición: conteo inicial y final en áreas fijas de referencia por zona, con crecimiento y condiciones comparables documentadas. Reducción = (conteo inicial − conteo final) / conteo inicial × 100. Si el conteo inicial es cero, se requerirá otro método previamente acordado. No se utilizará solamente la ausencia inmediata de vello tras el rasurado para acreditar el resultado.

8. Sesiones adicionales sin costo
Si al completar las 10 sesiones una zona cubierta no alcanza una reducción mínima del 90 %, ALL BEAUTY proporcionará las sesiones adicionales necesarias sin costo hasta alcanzar ese mínimo. No habrá un límite de sesiones ni un plazo fijo para alcanzar el resultado, y no se exigirán compras adicionales. Los intervalos se determinarán clínicamente y cada aplicación deberá ser segura y apropiada.
La obligación continuará hasta acreditar el mínimo por zona, mediante mediciones entregadas por escrito. Cumplido el mínimo, no se incluye mantenimiento gratuito indefinido; subsisten la garantía legal aplicable de al menos 90 días desde la prestación del servicio y los derechos por incumplimientos. Una pausa por seguridad no extingue la obligación. No se cubren zonas nuevas.

9. Solicitud y resolución
Solicitar la garantía por los canales de la carátula, identificando nombre, folio y zona. ALL BEAUTY entregará acuse y propondrá valoración dentro de 10 días hábiles. Entregará calendario gratuito o motivos y evidencia de rechazo por escrito. Si continuar está contraindicado o no resuelve el incumplimiento, se acordará una solución sin excluir remedios legales.
Cumplidos los tres meses de la cláusula 5, se notificará al cliente la cita incumplida y el periodo transcurrido, con 15 días naturales desde la recepción para justificar o reprogramar. Sin respuesta, se suspenden las sesiones adicionales gratuitas hasta nueva valoración y acuerdo escrito de continuidad, sin extinguir el resultado garantizado ni las sesiones pagadas. Una falta aislada o cambio hormonal no cancelan la garantía.

Cliente: {{patient_name}}    Firma: ______________    Fecha: {{sign_date}}
Por ${CLINIC_LEGAL.name}: ______________    Fecha: {{sign_date}}
`.trim();
  }

  if (key === "bliss") {
    return `
Contrato de prestación de servicios Venus Bliss
Paquete estético no invasivo sujeto a valoración individual. El contrato regula servicios y pagos; el consentimiento informado y la valoración se completan antes de la primera sesión en un documento independiente.

Prestador: ${CLINIC_LEGAL.name}, RFC ${CLINIC_LEGAL.rfc}, en adelante ALL BEAUTY.
Domicilio: ${CLINIC_LEGAL.address}.
Cliente: {{patient_name}}
Fecha de nacimiento: {{date_of_birth}}
Teléfono y correo: {{phone}} / {{email}}
Folio: {{folio}}
Lugar y fecha de firma: Villahermosa, Tabasco, {{sign_date}}

1. Servicio contratado
ALL BEAUTY prestará únicamente las modalidades y sesiones descritas, previa valoración y consentimiento, por personal capacitado conforme al manual vigente. Este formato corresponde a Venus Bliss; no incorpora estimulación muscular de Venus Bliss MAX.
Nombre del paquete: {{package_name}}
Zona: {{zone}}
Sesiones incluidas: {{sessions}}
Modalidad (láser de diodo, aplicador MP2 o ambas) se documenta en la valoración clínica. La distribución de sesiones láser y MP2, cuando ambas se contraten, se registra en el expediente.

2. Finalidad y límites
El láser busca tratar grasa subcutánea localizada; MP2 busca mejorar la apariencia de celulitis y el contorno según la indicación autorizada. No son tratamientos para bajar de peso ni sustituyen atención médica. No se garantiza una reducción de kilos, centímetros, eliminación total de celulitis ni un resultado permanente. La respuesta puede ser limitada o no visible; esta condición no elimina la obligación de prestar correctamente lo contratado.

3. Precio total y pagos
Precio total del paquete en pesos mexicanos, incluidos impuestos y cargos aplicables: {{price}}. El precio corresponde al paquete completo, sin tarifa de venta por zona.
Anticipo, saldo y forma de pago se documentan en el expediente y en los comprobantes. ALL BEAUTY entregará comprobante de pago y factura cuando corresponda. No se aplicarán cargos ni intereses que no se hayan pactado válidamente.
Ante un pago vencido, ALL BEAUTY notificará el saldo y podrá suspender nuevas citas hasta su regularización, sin pérdida automática de pagos ni sesiones pendientes.

4. Vigencia y citas
Teléfono: {{clinic_phone}}. Correo: {{clinic_email}}.
Anticipación para reprogramar sin cargo: preferentemente 24 horas y como mínimo 4 horas antes de la cita.
Tolerancia de llegada: 10 minutos para recibir la sesión completa.
Las modalidades pueden requerir calendarios distintos; no se repetirá el láser con la frecuencia de MP2 por el solo hecho de formar parte del mismo paquete.
Si el cliente avisa con esa anticipación, podrá reprogramar dentro de la vigencia. Si supera la tolerancia, la sesión solo se realizará si puede completarse de forma segura; de lo contrario se reprogramará. En esta versión no hay penalización económica por inasistencia ni se descuenta como realizada una sesión no aplicada.
Si ALL BEAUTY cancela o no dispone del equipo, ofrecerá una nueva fecha y ampliará la vigencia, sin cargo.

5. Seguimiento de resultados
Se documentarán las sesiones, molestias y evolución. La revisión de resultados se realizará en el momento indicado para cada modalidad y no obliga a adquirir sesiones adicionales. El mantenimiento o procedimientos complementarios solo se incluyen si se pactan expresamente.

6. Cancelación y terminación
Por cambio de opinión o abandono voluntario del cliente, ALL BEAUTY no ofrece devoluciones comerciales, siempre que pueda prestar el paquete pactado. Esta política queda sujeta a los derechos irrenunciables del consumidor.
La insatisfacción con un resultado individual, por sí sola, no constituye incumplimiento cuando el servicio se prestó correctamente. Si ALL BEAUTY incumple o no puede completar el paquete por causa imputable al prestador, se reconocerán los remedios legales. La firma no libera al prestador por negligencia ni mala aplicación.
Si se detecta una contraindicación antes de iniciar, no se aplicará el tratamiento y se devolverá el importe del paquete no prestado. Si surge después, se suspenderá y se valorará una pausa o terminación con liquidación de lo pendiente.
Cuando proceda liquidar sesiones pendientes, todas las sesiones tendrán el mismo valor económico: el precio total del paquete dividido entre el número total de sesiones contratadas.

7. Interrupción de tres meses
Después de tres meses consecutivos sin asistencia ni aviso desde la última sesión, el seguimiento se suspenderá y se requerirá nueva valoración para retomar. No implica pérdida automática de pagos o sesiones. ALL BEAUTY no ofrece garantía de resultados estéticos para Venus Bliss.

8. Suspensión por seguridad
El cliente puede pedir detener la sesión o retirar su consentimiento en cualquier momento. ALL BEAUTY suspenderá ante dolor excesivo, lesión, cambios de salud o cualquier condición que requiera evaluación.

9. Obligaciones de ALL BEAUTY
Valorar antecedentes y aptitud para cada modalidad; explicar beneficios, riesgos y alternativas; aplicar con personal capacitado y equipo en condiciones adecuadas; documentar cada sesión e incidente; entregar cuidados individualizados y un medio de contacto para seguimiento.

10. Obligaciones del cliente
Informar con veracidad sobre salud, medicamentos, embarazo, implantes y tratamientos previos, y seguir las indicaciones. Los datos de salud e imágenes de seguimiento se tratan conforme al aviso de privacidad. La autorización de publicidad es independiente y opcional.

11. Controversias
Las partes procurarán resolver por escrito, sin impedir acudir a PROFECO. Se aplica la legislación mexicana sin renuncia a derechos irrenunciables.

Cliente: {{patient_name}}    Firma: ______________    Fecha: {{sign_date}}
Por ${CLINIC_LEGAL.name}: ______________    Fecha: {{sign_date}}
`.trim();
  }

  return `
Contrato de prestación de servicios Venus Legacy
Paquete de tratamiento estético no invasivo sujeto a valoración individual. Este contrato establece los servicios, pagos y condiciones de atención. El consentimiento informado se firma por separado en el anexo antes de la primera sesión.

Prestador: ${CLINIC_LEGAL.name}, RFC ${CLINIC_LEGAL.rfc}, en adelante ALL BEAUTY.
Domicilio: ${CLINIC_LEGAL.address}.
Cliente: {{patient_name}}
Fecha de nacimiento: {{date_of_birth}}
Teléfono: {{phone}}    Correo: {{email}}
Folio: {{folio}}
Lugar y fecha de firma: Villahermosa, Tabasco, {{sign_date}}

1. Objeto del contrato
ALL BEAUTY prestará al cliente el paquete Venus Legacy descrito, sujeto a valoración de aptitud, consentimiento informado y aplicación por personal capacitado conforme al manual vigente del equipo. No incluye procedimientos distintos, productos ni mantenimiento salvo que se indiquen expresamente.
Nombre del paquete: {{package_name}}
Zona o área incluida: {{zone}}
Número total de sesiones: {{sessions}}

2. Alcance de los resultados
El tratamiento tiene finalidad estética. No constituye un programa de pérdida de peso ni sustituye atención médica. La respuesta es individual y puede ser limitada o no visible. No se promete una cantidad de centímetros, kilos, eliminación total de celulitis ni un resultado permanente. Esto no limita la obligación de prestar correctamente el servicio ni el cumplimiento de ofertas expresamente pactadas.

3. Precio total y forma de pago
Precio total del paquete en pesos mexicanos, incluidos impuestos y cargos aplicables: {{price}}.
El precio corresponde al paquete completo; no se establece una tarifa de venta por zona.
ALL BEAUTY entregará comprobante de pago y factura cuando corresponda. No cobrará conceptos adicionales sin informar el importe y obtener aceptación previa.
Si existe un pago vencido, ALL BEAUTY notificará el saldo y podrá suspender la programación de nuevas sesiones hasta regularizarlo. Esta suspensión no implica pérdida automática de pagos o sesiones.

4. Vigencia y citas
Teléfono: {{clinic_phone}}. Correo: {{clinic_email}}.
Anticipación para reprogramar sin cargo: preferentemente 24 horas.
Tolerancia de llegada: 10 minutos.
Si el cliente avisa dentro del plazo acordado, podrá reprogramar sin cargo dentro de la vigencia. Si llega tarde, la sesión solo se realizará si puede completarse de forma segura; de lo contrario se reprogramará.
En esta versión no se establece cargo por cancelación tardía, inasistencia o retraso, ni se descuenta como realizada una sesión que no fue aplicada.
Si ALL BEAUTY cancela una cita o no dispone del equipo, ofrecerá una nueva fecha y ampliará la vigencia por el tiempo necesario, sin cargo.

5. Cancelación y terminación
Por cambio de opinión o abandono voluntario del cliente, ALL BEAUTY no ofrece devoluciones comerciales, siempre que permanezca en condiciones de prestar el paquete pactado. Esta política queda sujeta a los derechos irrenunciables del consumidor.
Si ALL BEAUTY incumple o no puede completar el paquete por causa imputable al prestador, se reconocerán los remedios legales. Si se detecta una contraindicación antes de iniciar, no se aplicará el tratamiento y se devolverá el importe del paquete no prestado.
Para liquidar sesiones pendientes se dividirá el precio total entre el número total de sesiones contratadas.

6. Interrupción de tres meses
Después de tres meses consecutivos sin asistencia ni aviso desde la última sesión, el seguimiento se suspende y se requiere nueva valoración. No implica pérdida automática de pagos o sesiones.

7. Seguridad
El cliente puede pedir detener la sesión o retirar su consentimiento. ALL BEAUTY suspenderá ante dolor excesivo, lesión o cambios de salud.

8. Obligaciones
ALL BEAUTY valorará antecedentes, explicará riesgos y alternativas, aplicará con personal capacitado y documentará cada sesión. El cliente informará con veracidad sobre salud, medicamentos, embarazo, implantes y tratamientos previos, y seguirá las indicaciones. En menores se requiere autorización de madre, padre o tutor y valoración clínica.
Los datos de salud e imágenes de seguimiento se tratan conforme al aviso de privacidad. La autorización de publicidad es independiente y opcional.

9. Controversias
Las partes procurarán resolver por escrito, sin impedir acudir a PROFECO. Se aplica la legislación mexicana sin renuncia a derechos irrenunciables.

Cliente: {{patient_name}}    Firma: ______________    Fecha: {{sign_date}}
Por ${CLINIC_LEGAL.name}: ______________    Fecha: {{sign_date}}
`.trim();
}

function defaultConsentIntro(key: LegalTemplateKey): string {
  if (key === "bliss") {
    return "Consentimiento informado Venus Bliss. Anexo independiente. Autoriza solo las modalidades y zonas descritas. El láser utiliza energía y enfriamiento de contacto para tratar grasa subcutánea localizada. MP2 combina radiofrecuencia, campos electromagnéticos pulsados y succión para celulitis y contorno. Puedo sentir calor, hormigueo, succión, enrojecimiento, moretones; también se han descrito ampollas, cambios de pigmentación e, excepcionalmente, necrosis. No hay garantía de resultados específicos. Puedo retirar el consentimiento. Los datos de salud se tratan conforme al aviso de privacidad; las fotografías de seguimiento son opcionales y no autorizan publicidad.";
  }
  if (key === "velocity") {
    return "Consentimiento informado de depilación láser Venus Velocity, de Venus Concept. Cargo de quien informa: Enfermera especializada. Se me explicó la reducción del vello mediante láser, la necesidad de varias sesiones y la variabilidad de respuesta. No se asegura ausencia del 100 % de vello para siempre; el resultado garantizado es el de la póliza (reducción mínima del 90 % por zona). Puedo optar por rasurado, otros métodos o no realizar el tratamiento. Riesgos: molestias, enrojecimiento e inflamación transitorios, quemaduras, ampollas, cambios de pigmentación, infección y cicatrices. La protección ocular es necesaria. Informé embarazo o lactancia, enfermedades y lesiones de piel, tratamientos y medicamentos, bronceado o exposición solar reciente, reacciones previas y cambios hormonales. No suspenderé medicamentos por mi cuenta. Autorizo voluntariamente el tratamiento de las zonas acordadas y puedo retirar mi consentimiento. Las fotografías son solo para expediente y medición, sin difusión pública; si no autorizo, se acordará una medición alternativa.";
  }
  return "Consentimiento informado Venus Legacy. Anexo independiente. Autoriza solo las zonas descritas. Venus Legacy usa radiofrecuencia multipolar y campos electromagnéticos; algunos aplicadores incorporan succión. Puedo sentir calor y succión; son posibles enrojecimiento, moretones, ampollas, quemaduras y cambios de pigmentación. No hay garantía de resultados estéticos. Puedo retirar el consentimiento. En menores se requiere autorización de madre, padre o tutor y valoración clínica. Los datos de salud y fotografías de seguimiento se tratan conforme al aviso de privacidad; la publicidad requiere autorización separada.";
}

function isLegalTemplate(value: unknown): value is LegalTemplateKey {
  return value === "bliss" || value === "legacy" || value === "velocity";
}

async function findOpenPackageContract(
  patientId: number,
  service: { id: number; legal_template?: string | null },
  selectedZones: ServiceAreaOption[],
): Promise<{
  id: number;
  remaining: number;
  sessions_included: number;
  sessions_completed: number;
  selected_zone: string | null;
  selected_zones: ServiceAreaOption[];
  legal_template: string | null;
  guarantee_status: string;
  extra_sessions_granted: number;
  suggested_next_date: string | null;
} | null> {
  const isVelocity = service.legal_template === "velocity";
  const [rows] = await pool.query<any[]>(
    `SELECT c.id, c.sessions_included, c.sessions_completed, c.selected_zone, c.selected_zones,
            c.legal_template, c.guarantee_status, c.extra_sessions_granted,
            (SELECT COUNT(*) FROM appointments a
              WHERE a.contract_id = c.id AND a.status NOT IN ('cancelled')) AS reserved,
            (SELECT MAX(a.scheduled_at) FROM appointments a
              WHERE a.contract_id = c.id AND a.status NOT IN ('cancelled')) AS last_scheduled
     FROM contracts c
     WHERE c.patient_id = ?
       AND c.status IN ('draft', 'pending_signature', 'signed')
       AND ${isVelocity ? "c.legal_template = 'velocity'" : "c.service_id = ?"}
     ORDER BY c.id DESC`,
    isVelocity ? [patientId] : [patientId, service.id],
  );
  for (const row of rows) {
    const contractedZones = parseSelectedZones(row.selected_zones);
    if (isVelocity && selectedZones.length) {
      const matchesContract =
        contractedZones.length > 0
          ? zonesAreSubset(selectedZones, contractedZones)
          : !row.selected_zone ||
            selectedZones.some(
              (zone) =>
                zone.label === row.selected_zone || zone.id === row.selected_zone,
            );
      if (!matchesContract) continue;
    }
    const reserved = Number(row.reserved || 0);
    const extras = Number(row.extra_sessions_granted || 0);
    let remaining = Number(row.sessions_included) + extras - reserved;
    if (row.guarantee_status === "active") {
      remaining = Math.max(remaining, 1);
    }
    if (remaining <= 0) continue;
    const lastScheduled = row.last_scheduled ? new Date(row.last_scheduled) : null;
    return {
      id: Number(row.id),
      remaining,
      sessions_included: Number(row.sessions_included),
      sessions_completed: Number(row.sessions_completed || 0),
      selected_zone: row.selected_zone || null,
      selected_zones: contractedZones,
      legal_template: row.legal_template || null,
      guarantee_status: row.guarantee_status || "not_applicable",
      extra_sessions_granted: extras,
      suggested_next_date:
        isVelocity && lastScheduled && !Number.isNaN(lastScheduled.getTime())
          ? suggestedVelocityNextDate(lastScheduled, reserved)
          : null,
    };
  }
  return null;
}

async function buildFilledContractTerms(opts: {
  legalTemplate: LegalTemplateKey | null;
  patientName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  packageName: string;
  zone: string;
  sessions: number;
  price: number;
  folio?: string | null;
}): Promise<string> {
  const key = opts.legalTemplate;
  const source = key
    ? defaultContractTemplate(key)
    : defaultContractTemplate("legacy");
  return fillLegalPlaceholders(source, {
    patient_name: opts.patientName,
    email: opts.email,
    phone: opts.phone,
    date_of_birth: opts.dateOfBirth,
    package_name: opts.packageName,
    zone: opts.zone,
    sessions: opts.sessions,
    price: `$${Number(opts.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    folio: opts.folio,
    sign_date: new Date().toISOString().slice(0, 10),
    clinic_phone: CLINIC_LEGAL.phone,
    clinic_email: CLINIC_LEGAL.email,
  });
}

async function issueStripeRefund(opts: {
  paymentIntentId?: string;
  chargeId?: string;
  amountCents?: number;
  reason?: string;
}): Promise<void> {
  const target = opts.paymentIntentId
    ? { payment_intent: opts.paymentIntentId }
    : opts.chargeId
      ? { charge: opts.chargeId }
      : null;
  if (!target) {
    throw new Error("Missing Stripe refund target");
  }
  await stripe.refunds.create(
    {
      ...target,
      ...(opts.amountCents ? { amount: opts.amountCents } : {}),
      reason: "requested_by_customer",
      metadata: { reason: (opts.reason || "").slice(0, 500) },
    },
    {
      idempotencyKey: `refund-${opts.paymentIntentId || opts.chargeId}-${opts.amountCents ?? "full"}`,
    },
  );
}

async function markPaymentRefundedInDb(opts: {
  paymentId: number;
  refundAmount: number;
  reason?: string;
  refundedBy?: number | null;
  approvedBy?: number | null;
}): Promise<void> {
  await pool.query(
    `UPDATE payments
     SET payment_status = IF(? < amount, 'partially_refunded', 'refunded'),
         refund_amount = ?,
         refund_reason = COALESCE(?, refund_reason),
         refunded_at = NOW(),
         refund_status = 'approved',
         refunded_by = COALESCE(?, refunded_by),
         refund_approved_by = COALESCE(?, refund_approved_by),
         refund_approved_at = NOW(),
         updated_at = NOW()
     WHERE id = ?`,
    [
      opts.refundAmount,
      opts.refundAmount,
      opts.reason || null,
      opts.refundedBy ?? null,
      opts.approvedBy ?? null,
      opts.paymentId,
    ],
  );
}

async function fulfillSucceededPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): Promise<FulfillPaymentResult> {
  if (paymentIntent.status !== "succeeded") {
    return {
      ok: false,
      status: 400,
      error: "Payment has not been completed",
    };
  }

  const [existing] = await pool.query<any[]>(
    `SELECT appointment_id FROM payments
     WHERE stripe_payment_intent_id = ? AND appointment_id IS NOT NULL
     LIMIT 1`,
    [paymentIntent.id],
  );
  if (existing.length > 0) {
    return {
      ok: true,
      appointmentId: Number(existing[0].appointment_id),
      alreadyFulfilled: true,
    };
  }

  const {
    patient_id,
    service_id,
    scheduled_at,
    duration_minutes,
    notes,
    booked_for_self,
    booked_by_patient_id,
    selected_zone,
    selected_zones,
    legal_template,
    package_sessions,
  } = paymentIntent.metadata || {};

  if (!patient_id || !service_id || !scheduled_at || !duration_minutes) {
    return {
      ok: false,
      status: 400,
      error: "Missing booking information in payment metadata",
    };
  }

  const scheduledDate = new Date(scheduled_at);
  const scheduledEndTime = new Date(
    scheduledDate.getTime() + parseInt(duration_minutes) * 60000,
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  const scheduledEndStr = `${scheduledEndTime.getFullYear()}-${pad(scheduledEndTime.getMonth() + 1)}-${pad(scheduledEndTime.getDate())} ${pad(scheduledEndTime.getHours())}:${pad(scheduledEndTime.getMinutes())}:${pad(scheduledEndTime.getSeconds())}`;
  const scheduledAtStr = scheduled_at.replace("T", " ");

  const [overlapping] = await pool.query<any[]>(
    `SELECT id, scheduled_at, duration_minutes, status
     FROM appointments
     WHERE service_id = ?
       AND status IN ('confirmed', 'scheduled', 'in_progress')
       AND scheduled_at < ?
       AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?`,
    [service_id, scheduledEndStr, scheduledAtStr],
  );

  if (overlapping.length > 0) {
    try {
      await issueStripeRefund({
        paymentIntentId: paymentIntent.id,
        reason: "slot_conflict",
      });
    } catch (refundError) {
      console.error("[fulfill] Refund after slot conflict failed:", refundError);
    }
    return {
      ok: false,
      status: 409,
      error:
        "Lo sentimos, este horario ya fue reservado. Tu pago será reembolsado automáticamente.",
    };
  }

  const [appointmentResult] = await pool.query<any>(
    `INSERT INTO appointments
       (patient_id, service_id, scheduled_at, duration_minutes, notes, status, created_by, booked_for_self, booked_by_patient_id)
     VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
    [
      patient_id,
      service_id,
      scheduled_at,
      duration_minutes,
      notes || null,
      null,
      booked_for_self === "1" ? 1 : 0,
      booked_by_patient_id ? Number(booked_by_patient_id) : null,
    ],
  );
  const appointmentId = appointmentResult.insertId;

  try {
    await pool.query(
      `INSERT INTO payments
         (appointment_id, patient_id, amount, payment_method, payment_status,
          stripe_payment_id, stripe_payment_intent_id, processed_by, processed_at, created_at, updated_at)
       VALUES (?, ?, ?, 'stripe', 'completed', ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        appointmentId,
        patient_id,
        (paymentIntent.amount / 100).toFixed(2),
        paymentIntent.id,
        paymentIntent.id,
        null,
      ],
    );
  } catch (insertErr) {
    if (isMysqlDuplicate(insertErr)) {
      const [again] = await pool.query<any[]>(
        `SELECT appointment_id FROM payments WHERE stripe_payment_intent_id = ? LIMIT 1`,
        [paymentIntent.id],
      );
      if (again.length > 0) {
        return {
          ok: true,
          appointmentId: Number(again[0].appointment_id),
          alreadyFulfilled: true,
        };
      }
    }
    throw insertErr;
  }

  try {
    const pmId =
      typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id;
    if (pmId) {
      await stripe.paymentMethods.update(pmId, {
        allow_redisplay: "limited",
      });
    }
  } catch (pmErr: any) {
    console.warn(
      "[fulfill] Could not update payment method allow_redisplay:",
      pmErr.message,
    );
  }

  try {
    const [svcRows] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ? LIMIT 1",
      [service_id],
    );
    const [patRows] = await pool.query<any[]>(
      "SELECT first_name, last_name, email, phone, date_of_birth FROM patients WHERE id = ? LIMIT 1",
      [patient_id],
    );
    if (svcRows.length && patRows.length) {
      const svc = mapServiceRow(svcRows[0]);
      const pat = patRows[0];
      const sessions = Number(package_sessions || svc.package_sessions || 1);
      const zone = String(selected_zone || "").trim();
      const zones = parseSelectedZones(selected_zones);
      const templateKey = isLegalTemplate(legal_template || svc.legal_template)
        ? ((legal_template || svc.legal_template) as LegalTemplateKey)
        : null;
      const folio = `CON-${Date.now()}-${patient_id}`;
      const terms = await buildFilledContractTerms({
        legalTemplate: templateKey,
        patientName: `${pat.first_name} ${pat.last_name}`.trim(),
        email: pat.email,
        phone: pat.phone,
        dateOfBirth: pat.date_of_birth
          ? String(pat.date_of_birth).slice(0, 10)
          : null,
        packageName: svc.name,
        zone,
        sessions,
        price: Number(paymentIntent.amount) / 100,
        folio,
      });
      const createdBy = await resolveStaffCreatedBy(null);
      if (createdBy) {
        const [created] = await pool.query<any>(
          `INSERT INTO contracts
             (patient_id, service_id, legal_template, selected_zone, selected_zones,
              guarantee_status, contract_number, status,
              total_amount, sessions_included, terms_and_conditions, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_signature', ?, ?, ?, ?)`,
          [
            patient_id,
            service_id,
            templateKey,
            zone || null,
            zones.length ? JSON.stringify(zones) : null,
            templateKey === "velocity" ? "pending_baseline" : "not_applicable",
            folio,
            (Number(paymentIntent.amount) / 100).toFixed(2),
            sessions,
            terms,
            createdBy,
          ],
        );
        await pool.query(
          "UPDATE appointments SET contract_id = ? WHERE id = ?",
          [created.insertId, appointmentId],
        );
      }
    }
  } catch (contractErr) {
    console.error("[fulfill] Package contract creation failed:", contractErr);
  }

  const [appointmentDetails] = await pool.query<any[]>(
    `SELECT
        a.id, a.scheduled_at, a.duration_minutes,
        s.name as service_name, s.price as service_price,
        p.first_name, p.last_name, p.email
     FROM appointments a
     JOIN services s ON a.service_id = s.id
     JOIN patients p ON a.patient_id = p.id
     WHERE a.id = ?`,
    [appointmentId],
  );

  if (appointmentDetails.length > 0) {
    const appointment = appointmentDetails[0];
    const patientName = `${appointment.first_name} ${appointment.last_name}`;
    const scheduled = new Date(appointment.scheduled_at);
    const appointmentDate = scheduled.toISOString().split("T")[0];
    const appointmentTime = scheduled.toTimeString().split(" ")[0].substring(0, 5);
    sendAppointmentConfirmationEmail(appointment.email, patientName, {
      serviceName: appointment.service_name,
      date: appointmentDate,
      time: appointmentTime,
      duration: appointment.duration_minutes,
      amount: parseFloat(appointment.service_price),
    }).catch((emailError) =>
      console.error(
        "Failed to send confirmation email, but appointment was created:",
        emailError,
      ),
    );
  }

  return { ok: true, appointmentId, alreadyFulfilled: false };
}

// ==================== INLINE ROUTE HANDLERS ====================

/**
 * Demo endpoint handler
 * GET /api/demo
 */
const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};

/**
 * GET /api/services
 * Fetch all active services from the database
 */
const handleGetServices: RequestHandler = async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT
        id,
        name,
        description,
        image_url,
        category,
        price,
        duration_minutes,
        package_sessions,
        legal_template,
        area_catalog,
        is_active,
        created_at,
        updated_at
      FROM services
      WHERE is_active = 1
      ORDER BY category, name`,
    );

    const services = rows.map(mapServiceRow);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/services/:id
 * Fetch a specific service by ID
 */
const handleGetServiceById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<any[]>(
      `SELECT
        id,
        name,
        description,
        image_url,
        category,
        price,
        duration_minutes,
        package_sessions,
        legal_template,
        area_catalog,
        is_active,
        created_at,
        updated_at
      FROM services
      WHERE id = ? AND is_active = 1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = mapServiceRow(rows[0]);

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, phone, firstName, lastName } = req.body;

    // Validation
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query<any[]>(
      "SELECT id FROM patients WHERE email = ? OR phone = ?",
      [email, phone],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Create new user
    const [result] = await pool.query<any>(
      "INSERT INTO patients (email, phone, first_name, last_name, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, phone, firstName, lastName],
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: result.insertId,
        email,
        phone,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/auth/login
 * Login user (passwordless)
 */
const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    // Find user
    const [users] = await pool.query<any[]>(
      "SELECT id, email, phone, first_name, last_name FROM patients WHERE email = ? OR phone = ?",
      [email, phone],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // In a real implementation, you would:
    // 1. Generate and send OTP
    // 2. Store OTP temporarily
    // 3. Return success message

    res.json({
      success: true,
      message: "Login initiated. Check your phone for OTP.",
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/appointments
 * Create a new appointment
 */
const createAppointment: RequestHandler = async (req, res) => {
  try {
    const { patientId, serviceId, appointmentDate, appointmentTime, notes } =
      req.body;

    // Validation
    if (!patientId || !serviceId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, service ID, date, and time are required",
      });
    }

    // Check if service exists
    const [services] = await pool.query<any[]>(
      "SELECT id, name, price, duration_minutes FROM services WHERE id = ? AND is_active = 1",
      [serviceId],
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = services[0];

    // Combine date and time into a timestamp
    const scheduledAt = `${appointmentDate} ${appointmentTime}:00`;

    // Check if time slot is available
    const [conflicts] = await pool.query<any[]>(
      "SELECT id FROM appointments WHERE scheduled_at = ? AND status != 'cancelled'",
      [scheduledAt],
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Time slot is already booked",
      });
    }

    // Create appointment
    const [result] = await pool.query<any>(
      `INSERT INTO appointments 
       (patient_id, service_id, scheduled_at, duration_minutes,
        status, notes, created_by, booked_for_self) 
       VALUES (?, ?, ?, ?, 'scheduled', ?, ?, 1)`,
      [
        patientId,
        serviceId,
        scheduledAt,
        service.duration_minutes,
        notes || null,
        null, // created_by is NULL for patient self-bookings (FK references users.id not patients.id)
      ],
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        id: result.insertId,
        patientId,
        serviceId,
        serviceName: service.name,
        scheduled_at: scheduledAt,
        appointmentDate, // Keep for backwards compatibility
        appointmentTime, // Keep for backwards compatibility
        duration_minutes: service.duration_minutes,
        status: "scheduled",
        notes,
      },
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments
 * Get appointments for a user
 */
const getAppointments: RequestHandler = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const staff = tryGetAdminFromHeader(req);
    if (!staff) {
      const allowed = await verifyPatientSession(Number(patientId));
      if (!allowed) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
    }

    const [appointments] = await pool.query<any[]>(
      `SELECT 
         a.id, 
         a.scheduled_at,
         DATE(a.scheduled_at) as appointment_date,
         TIME(a.scheduled_at) as appointment_time,
         a.status, 
         a.duration_minutes,
         a.notes,
         s.name as service_name,
         s.duration_minutes as service_duration
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [patientId],
    );

    res.json({
      success: true,
      data: appointments.map((apt) => ({
        ...apt,
        duration_minutes: parseInt(apt.duration_minutes, 10),
        service_duration: parseInt(apt.service_duration, 10),
      })),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/auth/check-user
 * Check if a patient exists by email
 */
const checkUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients WHERE email = ?`,
      [email],
    );

    if (rows.length > 0) {
      res.json({ success: true, exists: true, patient: rows[0] });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    console.error("Error checking patient:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/auth/send-code
 * Send verification code to patient's email
 */
const sendCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendCode endpoint called");
    console.log("   Request body:", req.body);

    const { patient_id, email } = req.body;

    if (!patient_id || !email) {
      console.log("❌ Missing patient_id or email");
      return res.status(400).json({
        success: false,
        message: "Patient ID and email are required",
      });
    }

    console.log("   Patient ID:", patient_id);
    console.log("   Email:", email);

    // Get patient name from DB
    console.log("📊 Querying patient from database...");
    const [patientRows] = await pool.query<any[]>(
      "SELECT first_name, last_name FROM patients WHERE id = ?",
      [patient_id],
    );

    if (patientRows.length === 0) {
      console.log("❌ Patient not found in database");
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const patient_name = `${patientRows[0].first_name} ${patientRows[0].last_name}`;
    console.log("✅ Patient found:", patient_name);

    // Delete old session codes for this patient
    console.log("🗑️  Deleting old session codes...");
    await pool.query("DELETE FROM users_sessions WHERE patient_id = ?", [
      patient_id,
    ]);

    // Generate session code (fixed for test email, random otherwise)
    let session_code: number;
    if (email === "test@beautyhospital.com") {
      session_code = 123456;
      console.log("🧪 Using test code:", session_code);
    } else {
      // Generate unique code
      let isUnique = false;
      do {
        session_code = Math.floor(100000 + Math.random() * 900000);
        const [existingCodes] = await pool.query<any[]>(
          "SELECT COUNT(*) as count FROM users_sessions WHERE session_code = ?",
          [session_code],
        );
        isUnique = existingCodes[0].count === 0;
      } while (!isUnique);
      console.log("🔢 Generated unique code:", session_code);
    }

    // Insert new session code
    console.log("💾 Inserting session code into database...");
    const date_start = new Date();
    await pool.query(
      `INSERT INTO users_sessions (patient_id, session_code, user_session, user_session_date_start)
       VALUES (?, ?, 0, ?)`,
      [patient_id, session_code, date_start],
    );
    console.log("✅ Session code saved");

    // Send email with verification code
    console.log("📧 Calling sendVerificationEmail...");
    const emailSent = await sendVerificationEmail(
      email,
      patient_name,
      session_code,
    );

    if (emailSent) {
      console.log("✅ Email sent successfully");
      res.json({
        success: true,
        message: "Verification code sent",
        // Remove this in production - only for testing
        debug_code:
          process.env.NODE_ENV === "development" ? session_code : undefined,
      });
    } else {
      console.log("❌ Email sending failed");
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  } catch (error) {
    console.error("❌ Error in sendCode endpoint:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/auth/verify-code
 * Verify the code and login the user
 */
const verifyCode: RequestHandler = async (req, res) => {
  try {
    const { patient_id, code } = req.body;

    if (!patient_id || !code) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and code are required",
      });
    }

    const [sessions] = await pool.query<any[]>(
      `SELECT id, patient_id, session_code, user_session, user_session_date_start
       FROM users_sessions
       WHERE patient_id = ? AND session_code = ?
         AND user_session_date_start > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [patient_id, code],
    );

    console.log("🔍 Verify Code Debug:");
    console.log("   Looking for patient_id:", patient_id, "code:", code);
    console.log("   Found sessions:", sessions.length);
    if (sessions.length > 0) {
      console.log("   Session data:", sessions[0]);
    }

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid code - no matching session found",
      });
    }

    // Mark session as active
    await pool.query(
      "UPDATE users_sessions SET user_session = 1 WHERE id = ?",
      [sessions[0].id],
    );

    // Update last login and mark email as verified
    await pool.query(
      "UPDATE patients SET last_login = NOW(), is_email_verified = 1 WHERE id = ?",
      [patient_id],
    );

    // Get updated patient data
    const [patients] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, date_of_birth, created_at, last_login
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patient = patients[0];

    res.json({
      success: true,
      patient: {
        id: patient.id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        role: patient.role,
        is_active: patient.is_active,
        is_email_verified: patient.is_email_verified,
        date_of_birth: patient.date_of_birth,
        created_at: patient.created_at,
        last_login: patient.last_login,
      },
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ success: false, message: "Failed to verify code" });
  }
};

/**
 * Helper function to send verification email
 */
async function sendVerificationEmail(
  email: string,
  userName: string,
  code: number,
): Promise<boolean> {
  try {
    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codigo de Verificacion - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band -->
        <tr>
          <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 60%,#B8903D 100%);padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.25);border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:18px;line-height:64px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">OTP</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Codigo de Verificacion</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">Verifica tu identidad para continuar</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Hola <strong>${userName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#4B4B4B;line-height:1.7;">
              Tu codigo de verificacion para <strong>All Beauty Luxury &amp; Wellness</strong> es:
            </p>

            <!-- Code Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#F5F0E8;border:2px solid #C9A159;border-radius:12px;padding:24px;text-align:center;">
                  <span style="font-size:48px;font-weight:700;letter-spacing:12px;color:#C9A159;font-family:Georgia,serif;">${code}</span>
                </td>
              </tr>
            </table>

            <!-- Expiry Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#FFF8EC;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#7A5C1E;line-height:1.6;">
                    <strong>Importante:</strong> Este codigo expirara en <strong>10 minutos</strong>. Si no solicitaste este codigo, puedes ignorar este mensaje.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
            <p style="margin:0;font-size:12px;color:#666666;">Este es un correo automatico, por favor no respondas directamente a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail({
      to: email,
      subject: `${code} es tu código de verificación de All Beauty Luxury & Wellness`,
      html: emailBody,
    });
    console.log("✅ Verification email sent:", result.id);

    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    return false;
  }
}

/**
 * Helper function to send appointment confirmation email
 */
async function sendAppointmentConfirmationEmail(
  email: string,
  patientName: string,
  appointmentDetails: {
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
  },
): Promise<boolean> {
  try {
    console.log("🔍 Sending appointment confirmation email to:", email);

    // Format date and time for display
    const appointmentDate = new Date(appointmentDetails.date);
    const formattedDate = appointmentDate.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Confirmada - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band -->
        <tr>
          <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 60%,#B8903D 100%);padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:13px;line-height:64px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">OK</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Cita Confirmada</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">Tu pago ha sido procesado exitosamente</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Hola <strong>${patientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#4B4B4B;line-height:1.7;">
              Nos complace confirmar que tu cita ha sido agendada exitosamente en <strong>All Beauty Luxury &amp; Wellness</strong>. Tu pago ha sido procesado y tu reserva esta confirmada.
            </p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #EDE8DF;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#FAF7F2;padding:14px 20px;border-bottom:1px solid #EDE8DF;">
                <span style="font-size:13px;font-weight:700;color:#C9A159;letter-spacing:1px;text-transform:uppercase;">Detalles de tu Cita</span>
              </td></tr>
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Servicio</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.serviceName}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Fecha</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${formattedDate}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Hora</td>
                      <td style="font-size:14px;color:#C9A159;font-weight:700;text-align:right;">${appointmentDetails.time}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Duracion</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.duration} minutos</td>
                    </tr></table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            <!-- Amount -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 100%);border-radius:12px;padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1.5px;text-transform:uppercase;">Monto Pagado</p>
                  <p style="margin:0;font-size:36px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">$${appointmentDetails.amount.toFixed(2)} <span style="font-size:18px;">MXN</span></p>
                </td>
              </tr>
            </table>

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#FAF7F2;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7A5C1E;">Informacion Importante</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; <strong>Por favor llega 10 minutos antes</strong> de tu cita para completar el registro.</p>
                  <p style="margin:0;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; Si necesitas cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.</p>
                </td>
              </tr>
            </table>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#F8F8F8;border-radius:10px;padding:20px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A1A;">Necesitas ayuda?</p>
                  <p style="margin:0 0 4px;font-size:14px;color:#4B4B4B;">Telefono: <strong style="color:#C9A159;">+52 1234567890</strong></p>
                  <p style="margin:0;font-size:14px;color:#4B4B4B;">Email: <strong style="color:#C9A159;">info@allbeautyluxury.mx</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
            <p style="margin:0;font-size:12px;color:#666666;">Este es un correo automatico, por favor no respondas directamente a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail({
      to: email,
      subject: "Confirmacion de Cita - All Beauty Luxury & Wellness",
      html: emailBody,
    });
    console.log("Confirmation email sent:", result.id);
    console.log("   Patient name:", patientName);
    console.log("   Service:", appointmentDetails.serviceName);
    console.log("   Date:", appointmentDetails.date);
    console.log("   Time:", appointmentDetails.time);

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    return false;
  }
}

/**
 * Helper function to send appointment cancellation notification email
 */
async function sendAppointmentCancellationEmail(
  email: string,
  patientName: string,
  appointmentDetails: {
    serviceName: string;
    date: string;
    time: string;
    reason?: string;
  },
): Promise<boolean> {
  try {
    const formattedDate = new Date(appointmentDetails.date).toLocaleDateString(
      "es-MX",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    );

    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancelacion de Cita - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band (red for cancellation) -->
        <tr>
          <td style="background:linear-gradient(135deg,#DC2626 0%,#EF4444 60%,#C01C1C 100%);padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:13px;line-height:64px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">NO</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Cita Cancelada</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">Tu cita ha sido cancelada</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Hola <strong>${patientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#4B4B4B;line-height:1.7;">
              Te informamos que tu cita en <strong>All Beauty Luxury &amp; Wellness</strong> ha sido cancelada. A continuacion encontraras los detalles de la cita cancelada.
            </p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #EDE8DF;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#FEF2F2;padding:14px 20px;border-bottom:1px solid #FECACA;">
                <span style="font-size:13px;font-weight:700;color:#DC2626;letter-spacing:1px;text-transform:uppercase;">Cita Cancelada</span>
              </td></tr>
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Servicio</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.serviceName}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Fecha</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${formattedDate}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Hora</td>
                      <td style="font-size:14px;color:#DC2626;font-weight:700;text-align:right;">${appointmentDetails.time}</td>
                    </tr></table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            ${
              appointmentDetails.reason
                ? `<!-- Reason Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;padding:18px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#DC2626;letter-spacing:0.5px;text-transform:uppercase;">Motivo de Cancelacion</p>
                  <p style="margin:0;font-size:14px;color:#7F1D1D;line-height:1.6;">${appointmentDetails.reason}</p>
                </td>
              </tr>
            </table>`
                : ""
            }

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#FAF7F2;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7A5C1E;">Deseas reagendar?</p>
                  <p style="margin:0;font-size:14px;color:#5A4A2E;line-height:1.6;">Si deseas agendar una nueva cita, puedes hacerlo a traves de nuestro sitio web o contactandonos directamente.</p>
                </td>
              </tr>
            </table>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#F8F8F8;border-radius:10px;padding:20px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A1A;">Contactanos</p>
                  <p style="margin:0 0 4px;font-size:14px;color:#4B4B4B;">Telefono: <strong style="color:#C9A159;">+52 1234567890</strong></p>
                  <p style="margin:0;font-size:14px;color:#4B4B4B;">Email: <strong style="color:#C9A159;">info@allbeautyluxury.mx</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
            <p style="margin:0;font-size:12px;color:#666666;">Este es un correo automatico, por favor no respondas directamente a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail({
      to: email,
      subject: "Cancelacion de Cita - All Beauty Luxury & Wellness",
      html: emailBody,
    });

    console.log("Cancellation email sent to:", email, "| id:", result.id);
    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}

/**
 * Helper function to send appointment reschedule notification email
 */
async function sendAppointmentRescheduleEmail(
  email: string,
  patientName: string,
  appointmentDetails: {
    serviceName: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    notes?: string;
  },
): Promise<boolean> {
  try {
    const formattedOldDate = new Date(
      appointmentDetails.oldDate,
    ).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedNewDate = new Date(
      appointmentDetails.newDate,
    ).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Reprogramada - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band -->
        <tr>
          <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 60%,#B8903D 100%);padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:12px;line-height:64px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">NUEVA</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Cita Reprogramada</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">Tu cita ha sido actualizada — toma nota de la nueva fecha</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Hola <strong>${patientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#4B4B4B;line-height:1.7;">
              Te informamos que tu cita en <strong>All Beauty Luxury &amp; Wellness</strong> ha sido reprogramada. Por favor toma nota de la nueva fecha y hora.
            </p>

            <!-- Old Date Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #FECACA;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#FEF2F2;padding:12px 20px;border-bottom:1px solid #FECACA;">
                <span style="font-size:12px;font-weight:700;color:#DC2626;letter-spacing:1px;text-transform:uppercase;">Fecha Anterior (Cancelada)</span>
              </td></tr>
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:12px 0;border-bottom:1px solid #F5CBCB;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Servicio</td>
                      <td style="font-size:14px;color:#B91C1C;font-weight:600;text-align:right;text-decoration:line-through;">${appointmentDetails.serviceName}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:12px 0;border-bottom:1px solid #F5CBCB;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Fecha</td>
                      <td style="font-size:14px;color:#B91C1C;font-weight:600;text-align:right;text-decoration:line-through;">${formattedOldDate}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Hora</td>
                      <td style="font-size:14px;color:#B91C1C;font-weight:600;text-align:right;text-decoration:line-through;">${appointmentDetails.oldTime}</td>
                    </tr></table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            <!-- Arrow -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr><td style="text-align:center;padding:4px 0;">
                <span style="font-size:12px;font-weight:700;color:#C9A159;letter-spacing:2px;text-transform:uppercase;">Nueva fecha</span>
              </td></tr>
            </table>

            <!-- New Date Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #BBF7D0;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#F0FDF4;padding:12px 20px;border-bottom:1px solid #BBF7D0;">
                <span style="font-size:12px;font-weight:700;color:#16A34A;letter-spacing:1px;text-transform:uppercase;">Nueva Fecha Confirmada</span>
              </td></tr>
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:12px 0;border-bottom:1px solid #D1FAE5;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Servicio</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.serviceName}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:12px 0;border-bottom:1px solid #D1FAE5;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Fecha</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${formattedNewDate}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;">Hora</td>
                      <td style="font-size:14px;color:#16A34A;font-weight:700;text-align:right;">${appointmentDetails.newTime}</td>
                    </tr></table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#FAF7F2;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7A5C1E;">Informacion Importante</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; <strong>Por favor llega 10 minutos antes</strong> de tu nueva cita para completar el registro.</p>
                  <p style="margin:0;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; Si necesitas volver a cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.</p>
                </td>
              </tr>
            </table>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#F8F8F8;border-radius:10px;padding:20px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A1A;">Necesitas ayuda?</p>
                  <p style="margin:0 0 4px;font-size:14px;color:#4B4B4B;">Telefono: <strong style="color:#C9A159;">+52 1234567890</strong></p>
                  <p style="margin:0;font-size:14px;color:#4B4B4B;">Email: <strong style="color:#C9A159;">info@allbeautyluxury.mx</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
            <p style="margin:0;font-size:12px;color:#666666;">Este es un correo automatico, por favor no respondas directamente a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail({
      to: email,
      subject: "Cita Reprogramada - All Beauty Luxury & Wellness",
      html: emailBody,
    });

    console.log("Reschedule email sent to:", email, "| id:", result.id);
    return true;
  } catch (error) {
    console.error("Error sending reschedule email:", error);
    return false;
  }
}

/**
 * Helper function to send manual appointment booked notification email
 */
async function sendManualAppointmentEmail(
  email: string,
  patientName: string,
  appointmentDetails: {
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
    paymentMethod: string;
  },
): Promise<boolean> {
  try {
    const formattedDate = new Date(appointmentDetails.date).toLocaleDateString(
      "es-MX",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    );
    const paymentMethodLabels: Record<string, string> = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
    };
    const paymentLabel =
      paymentMethodLabels[appointmentDetails.paymentMethod] ||
      appointmentDetails.paymentMethod;

    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Agendada - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band -->
        <tr>
          <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 60%,#B8903D 100%);padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:13px;line-height:64px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">OK</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Cita Agendada</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);">Tu cita ha sido registrada exitosamente</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Hola <strong>${patientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#4B4B4B;line-height:1.7;">
              Nos complace confirmar que tu cita en <strong>All Beauty Luxury &amp; Wellness</strong> ha sido agendada. A continuacion encontraras los detalles de tu cita.
            </p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #EDE8DF;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#FAF7F2;padding:14px 20px;border-bottom:1px solid #EDE8DF;">
                <span style="font-size:13px;font-weight:700;color:#C9A159;letter-spacing:1px;text-transform:uppercase;">Detalles de tu Cita</span>
              </td></tr>
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Servicio</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.serviceName}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Fecha</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${formattedDate}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Hora</td>
                      <td style="font-size:14px;color:#C9A159;font-weight:700;text-align:right;">${appointmentDetails.time}</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;border-bottom:1px solid #F0EBE3;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Duracion</td>
                      <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;">${appointmentDetails.duration} minutos</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:14px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:14px;color:#6B7280;font-weight:600;">Metodo de Pago</td>
                      <td style="font-size:14px;color:#C9A159;font-weight:700;text-align:right;">${paymentLabel}</td>
                    </tr></table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            ${
              appointmentDetails.amount > 0
                ? `<!-- Amount -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 100%);border-radius:12px;padding:24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1.5px;text-transform:uppercase;">Monto</p>
                  <p style="margin:0;font-size:36px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">$${appointmentDetails.amount.toFixed(2)} <span style="font-size:18px;">MXN</span></p>
                </td>
              </tr>
            </table>`
                : ""
            }

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#FAF7F2;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#7A5C1E;">Informacion Importante</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; <strong>Por favor llega 10 minutos antes</strong> de tu cita para completar el registro.</p>
                  <p style="margin:0;font-size:14px;color:#5A4A2E;line-height:1.6;">&#8226; Si necesitas cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.</p>
                </td>
              </tr>
            </table>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#F8F8F8;border-radius:10px;padding:20px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A1A;">Necesitas ayuda?</p>
                  <p style="margin:0 0 4px;font-size:14px;color:#4B4B4B;">Telefono: <strong style="color:#C9A159;">+52 1234567890</strong></p>
                  <p style="margin:0;font-size:14px;color:#4B4B4B;">Email: <strong style="color:#C9A159;">info@allbeautyluxury.mx</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
            <p style="margin:0;font-size:12px;color:#666666;">Este es un correo automatico, por favor no respondas directamente a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail({
      to: email,
      subject: "Confirmacion de Cita - All Beauty Luxury & Wellness",
      html: emailBody,
    });

    console.log(
      "Manual appointment email sent to:",
      email,
      "| id:",
      result.id,
    );
    return true;
  } catch (error) {
    console.error("Error sending manual appointment email:", error);
    return false;
  }
}

/**
 * Helper function to send admin verification email
 */
async function sendAdminVerificationEmail(
  email: string,
  adminName: string,
  code: number,
): Promise<boolean> {
  try {
    const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Administrativo - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1A1A1A;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);">

        <!-- Logo Header -->
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;border-bottom:1px solid #2A2A2A;">
            ${emailLogoImg()}
          </td>
        </tr>

        <!-- Hero Band (dark gold for admin) -->
        <tr>
          <td style="background:linear-gradient(135deg,#111111 0%,#1E1A0E 50%,#111111 100%);padding:36px 40px;text-align:center;border-bottom:1px solid #C9A15933;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr><td style="width:64px;height:64px;background-color:#C9A15920;border:2px solid #C9A15966;border-radius:50%;text-align:center;vertical-align:middle;">
                <span style="font-size:12px;line-height:60px;color:#C9A159;font-weight:700;letter-spacing:1px;">ADMIN</span>
              </td></tr>
            </table>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#C9A159;letter-spacing:2px;text-transform:uppercase;">Acceso Administrativo</h1>
            <p style="margin:0;font-size:14px;color:#888888;letter-spacing:0.5px;">Panel de Control — All Beauty Luxury &amp; Wellness</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#E0E0E0;">Hola <strong style="color:#FFFFFF;">${adminName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#9A9A9A;line-height:1.7;">
              Se ha solicitado acceso al panel administrativo. Utiliza el siguiente codigo para verificar tu identidad.
            </p>

            <!-- Code Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#111111;border:2px solid #C9A159;border-radius:12px;padding:28px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#C9A159;letter-spacing:3px;text-transform:uppercase;">Codigo de Verificacion</p>
                  <span style="font-size:52px;font-weight:700;letter-spacing:14px;color:#C9A159;font-family:Georgia,serif;">${code}</span>
                </td>
              </tr>
            </table>

            <!-- Warning Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#1F1200;border-left:4px solid #C9A159;border-radius:0 8px 8px 0;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#C9A159;letter-spacing:0.5px;">IMPORTANTE</p>
                  <p style="margin:0 0 4px;font-size:14px;color:#A89060;line-height:1.6;">Este codigo expirara en <strong style="color:#E8C580;">10 minutos</strong>.</p>
                  <p style="margin:0;font-size:14px;color:#A89060;line-height:1.6;">Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0D0D0D;padding:24px 40px;text-align:center;border-top:1px solid #2A2A2A;">
            <p style="margin:0 0 6px;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS — PANEL ADMINISTRATIVO</p>
            <p style="margin:0;font-size:12px;color:#555555;">Este es un mensaje automatico del sistema — No responder</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textBody = `
ACCESO ADMINISTRATIVO - ALL BEAUTY LUXURY & WELLNESS

Hola ${adminName},

Se ha solicitado acceso al panel administrativo de All Beauty Luxury & Wellness.

Tu codigo de verificacion es: ${code}

IMPORTANTE: Este codigo expirara en 10 minutos

Si no solicitaste este acceso, contacta inmediatamente al administrador del sistema.

---
All Beauty Luxury & Wellness - Panel Administrativo
Este es un mensaje automatico del sistema - No responder
    `;

    const result = await sendEmail({
      to: email,
      subject: `${code} - Codigo de acceso administrativo All Beauty Luxury & Wellness`,
      text: textBody.trim(),
      html: emailBody,
    });
    console.log("✅ Admin email sent:", result.id);

    return true;
  } catch (error) {
    console.error("❌ Error sending admin email:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    return false;
  }
}

/**
 * GET /api/business-hours
 * Get business hours
 */
const getBusinessHours: RequestHandler = async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, day_of_week, is_open, open_time, close_time, break_start, break_end, notes, created_at, updated_at 
       FROM business_hours 
       ORDER BY day_of_week ASC`,
    );

    const businessHours = rows.map((row) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      is_open: Boolean(row.is_open),
      open_time: row.open_time,
      close_time: row.close_time,
      break_start: row.break_start || null,
      break_end: row.break_end || null,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json({
      success: true,
      data: businessHours,
    });
  } catch (error) {
    console.error("Error fetching business hours:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch business hours",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const getBusinessHoursByDay: RequestHandler = async (req, res) => {
  try {
    const dayOfWeek = parseInt(String(req.params.day), 10);
    if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: "day must be an integer from 0 (Sunday) to 6 (Saturday)",
      });
    }
    const [rows] = await pool.query<any[]>(
      `SELECT id, day_of_week, is_open, open_time, close_time, break_start, break_end, notes, created_at, updated_at
       FROM business_hours WHERE day_of_week = ? LIMIT 1`,
      [dayOfWeek],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Business hours not found for this day",
      });
    }
    const row = rows[0];
    res.json({
      success: true,
      data: {
        ...row,
        is_open: Boolean(row.is_open),
        break_start: row.break_start || null,
        break_end: row.break_end || null,
      },
    });
  } catch (error) {
    console.error("Error fetching business hours by day:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch business hours",
    });
  }
};

function isMysqlDuplicate(error: unknown): boolean {
  const err = error as { errno?: number; code?: string };
  return err.errno === 1062 || err.code === "ER_DUP_ENTRY";
}

function normalizeClockTime(raw: unknown): string {
  const match = String(raw || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return "09:00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}:${match[3] || "00"}`;
}

function extractAreaNoteLine(notes: unknown): string {
  const match = String(notes || "").match(/Área:\s*([^\n\r]+)/);
  return match?.[1]?.trim() || "";
}

function parseAreasFromNotes(notes: unknown): string[] {
  const line = extractAreaNoteLine(notes);
  if (!line) return [];
  return line
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function findBlockedSlotReason(
  date: string,
  time: string,
): Promise<string | null> {
  const clock = normalizeClockTime(time).slice(0, 8);
  const [rows] = await pool.query<any[]>(
    `SELECT reason FROM blocked_dates
     WHERE ? BETWEEN start_date AND end_date
       AND (
         all_day = 1
         OR (
           all_day = 0
           AND ? >= start_time
           AND ? < end_time
         )
       )
     LIMIT 1`,
    [date, clock, clock],
  );
  return rows[0]?.reason ? String(rows[0].reason) : rows.length ? "Fecha bloqueada" : null;
}

class SlotConflictError extends Error {
  status = 409;
  reason = "slot_conflict";
  constructor(message = "Este horario se cruza con otra cita") {
    super(message);
    this.name = "SlotConflictError";
  }
}

async function findOverlappingAppointment(
  conn: { query: typeof pool.query },
  scheduledAt: string,
  durationMinutes: number,
  excludeId?: number,
): Promise<number | null> {
  const minutes = Math.max(1, Number(durationMinutes) || 60);
  const [conflicts] = await conn.query<any[]>(
    `SELECT id FROM appointments
     WHERE status IN ('scheduled', 'confirmed', 'in_progress')
       AND scheduled_at < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?
       ${excludeId ? "AND id != ?" : ""}
     LIMIT 1`,
    excludeId
      ? [scheduledAt, minutes, scheduledAt, excludeId]
      : [scheduledAt, minutes, scheduledAt],
  );
  return conflicts[0]?.id ? Number(conflicts[0].id) : null;
}

async function withScheduleDayLock<T>(
  date: string,
  fn: (conn: Awaited<ReturnType<typeof pool.getConnection>>) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO schedule_day_locks (lock_date) VALUES (?)
       ON DUPLICATE KEY UPDATE lock_date = lock_date`,
      [date],
    );
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      /* already rolled back */
    }
    throw error;
  } finally {
    conn.release();
  }
}

function normalizePaymentMethod(raw: unknown): string | null {
  const value = String(raw ?? "cash")
    .toLowerCase()
    .trim();
  if (!value || value === "cash") return "cash";
  if (value === "card" || value === "credit" || value === "credit_card") {
    return "credit_card";
  }
  if (value === "debit" || value === "debit_card") return "debit_card";
  if (value === "transfer") return "transfer";
  if (value === "stripe") return "stripe";
  return null;
}

async function insertPatientRow(fields: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
}): Promise<{
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}> {
  const first_name = String(fields.first_name || "").trim();
  const last_name = String(fields.last_name || "").trim();
  const email = String(fields.email || "")
    .trim()
    .toLowerCase();
  const phone = fields.phone ? String(fields.phone).trim() : null;
  if (!first_name || !last_name || !email) {
    const err = new Error("first_name, last_name and email are required");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  const [result] = await pool.query<any>(
    `INSERT INTO patients (email, first_name, last_name, phone, role, is_active, created_at)
     VALUES (?, ?, ?, ?, 'patient', 1, NOW())`,
    [email, first_name, last_name, phone],
  );
  return { id: result.insertId, first_name, last_name, email, phone };
}

/**
 * GET /api/blocked-dates
 * Get blocked dates
 */
const getBlockedDates: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date, page = 1, pageSize = 100 } = req.query;
    const rangeStart = start_date
      ? String(start_date).slice(0, 10)
      : clinicDateYmd();
    const filters = ["bd.end_date >= ?"];
    const params: any[] = [rangeStart];

    if (end_date) {
      filters.push("bd.start_date <= ?");
      params.push(String(end_date).slice(0, 10));
    }

    const where = filters.join(" AND ");
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM blocked_dates bd WHERE ${where}`,
      params,
    );
    const total = Number(countResult[0]?.total || 0);

    const limit = Math.min(Math.max(Number(pageSize) || 100, 1), 500);
    const pageNum = Math.max(Number(page) || 1, 1);
    const offset = (pageNum - 1) * limit;

    const [rows] = await pool.query<any[]>(
      `SELECT bd.id, bd.start_date, bd.end_date, bd.start_time, bd.end_time,
              bd.all_day, bd.reason, bd.notes, bd.created_by, bd.created_at, bd.updated_at,
              u.id as creator_id,
              u.first_name as creator_first_name,
              u.last_name as creator_last_name,
              u.email as creator_email
       FROM blocked_dates bd
       LEFT JOIN users u ON bd.created_by = u.id
       WHERE ${where}
       ORDER BY bd.start_date ASC, bd.start_time ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const blockedDates = rows.map((row) => ({
      id: row.id,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      end_time: row.end_time,
      all_day: Boolean(row.all_day),
      reason: row.reason,
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: row.creator_id
        ? {
            id: row.creator_id,
            first_name: row.creator_first_name,
            last_name: row.creator_last_name,
            email: row.creator_email,
          }
        : null,
    }));

    res.json({
      success: true,
      data: {
        items: blockedDates,
        total,
        page: pageNum,
        pageSize: limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blocked dates",
    });
  }
};

/**
 * GET /api/blocked-dates/check
 * Check if a specific date/time is blocked
 */
const checkDateBlocked: RequestHandler = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    let query: string;
    let params: any[];

    if (time) {
      // Check if specific date and time is blocked
      query = `
        SELECT COUNT(*) as count, start_time, end_time, all_day, reason
        FROM blocked_dates
        WHERE ? BETWEEN start_date AND end_date
        AND (
          all_day = 1
          OR (
            all_day = 0
            AND ? >= start_time
            AND ? < end_time
          )
        )
      `;
      params = [date, time, time];
    } else {
      // Check if entire date is blocked (for calendar display)
      query = `
        SELECT COUNT(*) as count
        FROM blocked_dates
        WHERE ? BETWEEN start_date AND end_date
      `;
      params = [date];
    }

    const [rows] = await pool.query<any[]>(query, params);
    const isBlocked = rows[0]?.count > 0;

    res.json({
      success: true,
      data: {
        blocked: isBlocked,
        ...(isBlocked &&
          time && {
            reason: rows[0]?.reason,
            start_time: rows[0]?.start_time,
            end_time: rows[0]?.end_time,
            all_day: Boolean(rows[0]?.all_day),
          }),
      },
    });
  } catch (error) {
    console.error("Error checking blocked date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check blocked date",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/admin/auth/check-user
 * Check if an admin user exists by email
 */
const checkAdminUser: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, is_active, is_email_verified, 
              employee_id, specialization, profile_picture_url, created_at, last_login
       FROM users
       WHERE email = ? AND role IN (${STAFF_LOGIN_ROLES_SQL})`,
      [email],
    );

    if (rows.length > 0) {
      if (rows[0].is_active === 0) {
        return res.status(403).json({
          success: false,
          message: "This account has been deactivated",
        });
      }
      res.json({ success: true, exists: true, user: rows[0] });
    } else {
      res.json({
        success: true,
        exists: false,
        message: "No admin account found with this email",
      });
    }
  } catch (error) {
    console.error("Error checking admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/auth/send-code
 * Send verification code to admin user's email
 */
const sendAdminCode: RequestHandler = async (req, res) => {
  try {
    console.log("🔵 sendAdminCode endpoint called");
    console.log("   Request body:", req.body);

    const { user_id, email } = req.body;

    if (!user_id || !email) {
      console.log("❌ Missing user_id or email");
      return res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
    }

    console.log("   User ID:", user_id);
    console.log("   Email:", email);

    // Get admin user name from DB
    console.log("📊 Querying admin user from database...");
    const [userRows] = await pool.query<any[]>(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [user_id],
    );

    if (userRows.length === 0) {
      console.log("❌ Admin user not found in database");
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    const admin_name = `${userRows[0].first_name} ${userRows[0].last_name}`;
    console.log("✅ Admin user found:", admin_name);

    let session_code: number;
    let isUnique = false;
    do {
      session_code = Math.floor(100000 + Math.random() * 900000);
      const [existingCodes] = await pool.query<any[]>(
        "SELECT COUNT(*) as count FROM admin_sessions WHERE session_code = ?",
        [session_code],
      );
      isUnique = existingCodes[0].count === 0;
    } while (!isUnique);
    console.log("🔢 Generated unique code:", session_code);

    // Store the code in admin sessions table
    console.log("💾 Inserting session code into database...");
    await pool.query(
      `INSERT INTO admin_sessions (user_id, session_code, is_active, expires_at) 
       VALUES (?, ?, 1, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE 
       session_code = VALUES(session_code), 
       is_active = 1,
       expires_at = VALUES(expires_at)`,
      [user_id, session_code],
    );
    console.log("✅ Session code saved");

    // Send email with verification code
    console.log("📧 Calling sendAdminVerificationEmail...");
    const emailSent = await sendAdminVerificationEmail(
      email,
      admin_name,
      session_code,
    );

    if (emailSent) {
      console.log("✅ Email sent successfully");
      res.json({
        success: true,
        message: "Verification code sent to your email",
        // Remove this in production - only for testing
        debug_code:
          process.env.NODE_ENV === "development" ? session_code : undefined,
      });
    } else {
      console.log("❌ Email sending failed");
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  } catch (error) {
    console.error("❌ Error in sendAdminCode endpoint:", error);
    if (error instanceof Error) {
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/auth/verify-code
 * Verify the admin code and login
 */
const verifyAdminCode: RequestHandler = async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(400).json({
        success: false,
        message: "User ID and code are required",
      });
    }

    // Check if code is valid
    const [sessions] = await pool.query<any[]>(
      `SELECT * FROM admin_sessions 
       WHERE user_id = ? AND session_code = ? AND is_active = 1 AND expires_at > NOW()`,
      [user_id, code],
    );

    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code",
      });
    }

    // Get admin user info
    const [users] = await pool.query<any[]>(
      `SELECT id, email, first_name, last_name, phone, role, employee_id, specialization 
       FROM users WHERE id = ? AND role IN (${STAFF_LOGIN_ROLES_SQL})`,
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    const user = users[0];

    // Update last login and clear the session
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [
      user_id,
    ]);

    await pool.query(
      `UPDATE admin_sessions SET is_active = 0 WHERE user_id = ?`,
      [user_id],
    );

    const { accessToken, refreshToken } = signAdminTokens(user);

    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        employee_id: user.employee_id,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    console.error("Error verifying admin code:", error);
    res.status(500).json({ success: false, message: "Failed to verify code" });
  }
};

const refreshAdminToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }
    let decoded: { id?: number; type?: string };
    try {
      decoded = jwt.verify(refreshToken, refreshSecret) as {
        id?: number;
        type?: string;
      };
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
    if (decoded.type !== "admin_refresh" || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Admin refresh token required",
      });
    }
    const [users] = await pool.query<any[]>(
      `SELECT id, email, first_name, last_name, phone, role, employee_id, specialization, is_active
       FROM users WHERE id = ? AND role IN (${STAFF_LOGIN_ROLES_SQL})`,
      [decoded.id],
    );
    if (users.length === 0 || users[0].is_active === 0) {
      return res.status(401).json({
        success: false,
        message: "Admin user not found or inactive",
      });
    }
    const user = users[0];
    const tokens = signAdminTokens(user);
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        employee_id: user.employee_id,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    console.error("Error refreshing admin token:", error);
    res.status(500).json({ success: false, message: "Failed to refresh token" });
  }
};

/**
 * GET /api/admin/dashboard/metrics
 * Get dashboard metrics overview
 */
const getDashboardMetrics: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate =
      (typeof start_date === "string" && start_date) || clinicMonthStartYmd();
    const endDate =
      (typeof end_date === "string" && end_date) || clinicDateYmd();

    // Get total appointments
    const [appointmentStats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled
       FROM appointments
       WHERE DATE(scheduled_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get revenue stats
    const [revenueStats] = await pool.query<any[]>(
      `SELECT 
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_amount
       FROM payments
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get new patients count
    const [patientStats] = await pool.query<any[]>(
      `SELECT COUNT(*) as new_patients
       FROM patients
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get active contracts
    const [contractStats] = await pool.query<any[]>(
      `SELECT COUNT(*) as active_contracts
       FROM contracts
       WHERE status IN ('signed', 'pending_signature') AND DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Get top services
    const [topServices] = await pool.query<any[]>(
      `SELECT s.name, s.category, COUNT(a.id) as bookings, SUM(p.amount) as revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id AND DATE(a.scheduled_at) BETWEEN ? AND ?
       LEFT JOIN payments p ON a.id = p.appointment_id AND p.payment_status = 'completed'
       GROUP BY s.id
       ORDER BY bookings DESC
       LIMIT 5`,
      [startDate, endDate],
    );

    // Get upcoming appointments for today
    const [upcomingToday] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE DATE(scheduled_at) = ? AND status IN ('scheduled', 'confirmed')`,
      [clinicDateYmd()],
    );

    res.json({
      success: true,
      data: {
        period: { start_date: startDate, end_date: endDate },
        appointments: appointmentStats[0] || {
          total: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
          scheduled: 0,
        },
        revenue: {
          total_revenue: parseFloat(revenueStats[0]?.total_revenue || 0),
          total_refunds: parseFloat(revenueStats[0]?.total_refunds || 0),
          pending_amount: parseFloat(revenueStats[0]?.pending_amount || 0),
        },
        patients: patientStats[0] || { new_patients: 0 },
        contracts: contractStats[0] || { active_contracts: 0 },
        topServices: topServices || [],
        upcomingToday: upcomingToday[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/revenue-chart
 * Get revenue chart data
 */
const getRevenueChart: RequestHandler = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let dateFormat: string;
    let dateRange: string;

    switch (period) {
      case "week":
        dateFormat = "%Y-%m-%d";
        dateRange = "DATE_SUB(?, INTERVAL 7 DAY)";
        break;
      case "year":
        dateFormat = "%Y-%m";
        dateRange = "DATE_SUB(?, INTERVAL 12 MONTH)";
        break;
      default: // month
        dateFormat = "%Y-%m-%d";
        dateRange = "DATE_SUB(?, INTERVAL 30 DAY)";
    }

    const clinicToday = clinicDateYmd();
    const [revenueData] = await pool.query<any[]>(
      `SELECT 
        DATE_FORMAT(created_at, ?) as date,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as revenue,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as transactions
       FROM payments
       WHERE created_at >= ${dateRange}
       GROUP BY DATE_FORMAT(created_at, ?)
       ORDER BY date ASC`,
      [dateFormat, clinicToday, dateFormat],
    );

    res.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/calendar
 * Get appointments for calendar
 */
const getCalendarAppointments: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.scheduled_at,
        DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as scheduled_date,
        TIME_FORMAT(a.scheduled_at, '%H:%i') as scheduled_time,
        a.duration_minutes,
        a.status,
        a.notes,
        a.check_in_at as checked_in_at,
        a.booking_source,
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        s.id as service_id,
        s.name as service_name,
        s.category as service_category,
        s.price as service_price,
        a.contract_id,
        c.contract_number,
        c.status as contract_status
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       LEFT JOIN contracts c ON c.id = a.contract_id
       WHERE DATE(a.scheduled_at) BETWEEN ? AND ?
       ORDER BY a.scheduled_at ASC`,
      [start_date, end_date],
    );

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching calendar appointments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity feed
 */
const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 50);
    const take = Math.max(limit, 8);

    const [appointments] = await pool.query<any[]>(
      `SELECT a.id as entity_id, a.patient_id, a.created_at,
              'appointment_created' as action, 'appointment' as entity_type,
              CONCAT('Cita creada para ', p.first_name, ' ', p.last_name) as description
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [take],
    );
    const [payments] = await pool.query<any[]>(
      `SELECT pay.id as entity_id, pay.patient_id, pay.created_at,
              'payment_recorded' as action, 'payment' as entity_type,
              CONCAT('Pago ', pay.payment_status, ' de $', pay.amount) as description
       FROM payments pay
       ORDER BY pay.created_at DESC
       LIMIT ?`,
      [take],
    );
    const [contracts] = await pool.query<any[]>(
      `SELECT c.id as entity_id, c.patient_id, c.created_at,
              'contract_updated' as action, 'contract' as entity_type,
              CONCAT('Contrato ', c.contract_number, ' (', c.status, ')') as description
       FROM contracts c
       ORDER BY c.updated_at DESC
       LIMIT ?`,
      [take],
    );

    const activities = [...appointments, ...payments, ...contracts]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/patients
 * Get all patients with pagination and search
 */
const getAllAdminPatients: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      is_active,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR 
        phone LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (is_active !== undefined) {
      whereClause += " AND is_active = ?";
      queryParams.push(is_active);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM patients WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get patients
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        notes, is_active, is_email_verified, created_at, updated_at, last_login
       FROM patients
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/patients/:id
 * Get patient by ID with full details
 */
const getAdminPatientById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get patient details
    const [patients] = await pool.query<any[]>(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const patient = patients[0];

    // Get appointment history
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, 
              DATE(a.scheduled_at) as appointment_date,
              TIME(a.scheduled_at) as appointment_time,
              DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as appointment_date_formatted,
              TIME_FORMAT(a.scheduled_at, '%H:%i') as appointment_time_formatted,
              s.name as service_name, s.category, s.price
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [id],
    );

    // Get payments
    const [payments] = await pool.query<any[]>(
      `SELECT p.*, s.name as service_name
       FROM payments p
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC`,
      [id],
    );

    // Get medical records
    const [medicalRecords] = await pool.query<any[]>(
      `SELECT mr.*, CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       LEFT JOIN users u ON mr.doctor_id = u.id
       WHERE mr.patient_id = ?
       ORDER BY mr.visit_date DESC`,
      [id],
    );

    // Legal history for the expediente — omit signature blobs
    const [contracts] = await pool.query<any[]>(
      `SELECT c.id, c.patient_id, c.service_id, c.legal_template, c.selected_zone,
              c.selected_zones, c.guarantee_status, c.extra_sessions_granted,
              c.contract_number, c.status, c.total_amount, c.sessions_included,
              c.sessions_completed, c.signed_at, c.created_at,
              s.name as service_name
       FROM contracts c
       LEFT JOIN services s ON c.service_id = s.id
       WHERE c.patient_id = ?
       ORDER BY c.created_at DESC`,
      [id],
    );
    const [consents] = await pool.query<any[]>(
      `SELECT c.id, c.patient_id, c.contract_id, c.appointment_id, c.service_id,
              c.legal_template, c.status, c.zone, c.health_answers,
              c.data_health_consent, c.photos_followup, c.clinical_conclusion,
              c.clinical_notes, c.patient_signed_at, c.staff_signed_at, c.created_at,
              c.is_minor, c.guardian_name, c.guardian_relationship,
              (c.patient_signature IS NOT NULL AND c.patient_signature <> '') AS has_patient_signature,
              (c.staff_signature IS NOT NULL AND c.staff_signature <> '') AS has_staff_signature,
              s.name AS service_name,
              ct.contract_number
       FROM consents c
       LEFT JOIN services s ON c.service_id = s.id
       LEFT JOIN contracts ct ON c.contract_id = ct.id
       WHERE c.patient_id = ?
       ORDER BY c.created_at DESC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        patient,
        appointments,
        payments,
        medicalRecords,
        contracts: contracts.map((row) => ({
          ...row,
          selected_zones: parseSelectedZones(row.selected_zones),
        })),
        consents: consents.map((row) => ({
          ...row,
          health_answers:
            typeof row.health_answers === "string"
              ? (() => {
                  try {
                    return JSON.parse(row.health_answers || "{}");
                  } catch {
                    return {};
                  }
                })()
              : row.health_answers,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/patients/:id
 * Update patient information
 */
const updatePatient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Whitelist allowed columns to prevent SQL injection
    const ALLOWED_PATIENT_COLUMNS = new Set([
      "first_name",
      "last_name",
      "email",
      "phone",
      "date_of_birth",
      "gender",
      "address",
      "city",
      "state",
      "zip_code",
      "emergency_contact_name",
      "emergency_contact_phone",
      "notes",
      "is_active",
    ]);

    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (
        ALLOWED_PATIENT_COLUMNS.has(key) &&
        value !== undefined &&
        value !== null
      ) {
        filteredData[key] = value;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Build dynamic SET clause with whitelisted columns
    const setClause = Object.keys(filteredData)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(filteredData);

    const [result] = await pool.query<any>(
      `UPDATE patients SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Get updated patient
    const [updatedPatient] = await pool.query<any[]>(
      `SELECT * FROM patients WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: updatedPatient[0],
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/patients/:id/toggle-active
 * Toggle a patient's is_active status
 */
const togglePatientActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query<any[]>(
      "SELECT id, is_active FROM patients WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.query(
      "UPDATE patients SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id],
    );

    res.json({
      success: true,
      message: `Patient ${newStatus ? "activated" : "deactivated"} successfully`,
      data: { is_active: Boolean(newStatus) },
    });
  } catch (error) {
    console.error("Error toggling patient status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/patients/:id/medical-records
 * Add a simplified medical record for a patient from the patient management panel
 */
const addPatientMedicalRecord: RequestHandler = async (req, res) => {
  try {
    const { id: patient_id } = req.params;
    const {
      record_type = "consultation",
      notes,
      attachments,
      doctor_id,
    } = req.body;

    if (!notes) {
      return res
        .status(400)
        .json({ success: false, message: "Notes are required" });
    }

    // Resolve doctor_id: use provided value or fall back to request user
    const resolvedDoctorId = doctor_id || getAdminFromRequest(req)?.id;
    if (!resolvedDoctorId) {
      return res
        .status(400)
        .json({ success: false, message: "doctor_id is required" });
    }

    const [patientCheck] = await pool.query<any[]>(
      "SELECT id FROM patients WHERE id = ?",
      [patient_id],
    );
    if (patientCheck.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const [result] = await pool.query<any>(
      `INSERT INTO medical_records
         (patient_id, record_type, doctor_id, visit_date, diagnosis, notes, created_at, updated_at)
       VALUES (?, ?, ?, CURDATE(), ?, ?, NOW(), NOW())`,
      [
        patient_id,
        record_type,
        resolvedDoctorId,
        record_type, // store record_type also as diagnosis label
        notes || null,
      ],
    );

    const [created] = await pool.query<any[]>(
      `SELECT mr.*, CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       LEFT JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Medical record added successfully",
      data: created[0],
    });
  } catch (error) {
    console.error("Error adding patient medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/medical-records
 * Get all medical records
 */
const getAllMedicalRecords: RequestHandler = async (req, res) => {
  console.log("[getAllMedicalRecords] Handler called");
  try {
    const { patient_id, doctor_id } = req.query;

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (patient_id) {
      whereClause += " AND mr.patient_id = ?";
      queryParams.push(patient_id);
    }

    if (doctor_id) {
      whereClause += " AND mr.doctor_id = ?";
      queryParams.push(doctor_id);
    }

    const [records] = await pool.query<any[]>(
      `SELECT 
        mr.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       WHERE ${whereClause}
       ORDER BY mr.visit_date DESC, mr.created_at DESC`,
      queryParams,
    );

    // Transform to include patient object
    const transformedRecords = records.map((record) => ({
      id: record.id,
      patient_id: record.patient_id,
      doctor_id: record.doctor_id,
      visit_date: record.visit_date,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes,
      prescriptions: record.prescriptions,
      files: record.files ? JSON.parse(record.files) : [],
      created_at: record.created_at,
      updated_at: record.updated_at,
      patient: {
        id: record.patient_id,
        first_name: record.patient_first_name,
        last_name: record.patient_last_name,
        email: record.patient_email,
        phone: record.patient_phone,
      },
      doctor_name: record.doctor_name,
    }));

    res.json({
      success: true,
      data: transformedRecords,
    });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/medical-records/:id
 * Get a specific medical record by ID
 */
const getMedicalRecordById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.query<any[]>(
      `SELECT 
        mr.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [id],
    );

    if (records.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found" });
    }

    const record = records[0];
    const transformedRecord = {
      id: record.id,
      patient_id: record.patient_id,
      doctor_id: record.doctor_id,
      visit_date: record.visit_date,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes,
      prescriptions: record.prescriptions,
      files: record.files ? JSON.parse(record.files) : [],
      created_at: record.created_at,
      updated_at: record.updated_at,
      patient: {
        id: record.patient_id,
        first_name: record.patient_first_name,
        last_name: record.patient_last_name,
        email: record.patient_email,
      },
      doctor_name: record.doctor_name,
    };

    res.json({
      success: true,
      data: transformedRecord,
    });
  } catch (error) {
    console.error("Error fetching medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/medical-records
 * Create a new medical record
 */
const createMedicalRecord: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      visit_date,
      diagnosis,
      treatment,
      notes,
      prescriptions,
    } = req.body;

    const doctor_id = getAdminFromRequest(req)?.id || req.body.doctor_id;

    if (!patient_id || !visit_date || !diagnosis || !treatment) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: patient_id, visit_date, diagnosis, treatment",
      });
    }

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        message: "doctor_id is required",
      });
    }

    const [result] = await pool.query<any>(
      `INSERT INTO medical_records 
        (patient_id, doctor_id, appointment_id, visit_date, diagnosis, treatment, notes, prescriptions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        patient_id,
        doctor_id,
        appointment_id || null,
        visit_date,
        diagnosis,
        treatment,
        notes || null,
        prescriptions || null,
      ],
    );

    // Fetch the created record
    const [createdRecord] = await pool.query<any[]>(
      `SELECT 
        mr.*,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: createdRecord[0],
    });
  } catch (error) {
    console.error("Error creating medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/medical-records/:id
 * Update a medical record
 */
const updateMedicalRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patient_id,
      appointment_id,
      visit_date,
      diagnosis,
      treatment,
      notes,
      prescriptions,
    } = req.body;

    // Check if record exists
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM medical_records WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found" });
    }

    const [result] = await pool.query<any>(
      `UPDATE medical_records 
       SET patient_id = ?, appointment_id = ?, visit_date = ?, diagnosis = ?, treatment = ?, 
           notes = ?, prescriptions = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        patient_id,
        appointment_id || null,
        visit_date,
        diagnosis,
        treatment,
        notes || null,
        prescriptions || null,
        id,
      ],
    );

    // Fetch updated record
    const [updatedRecord] = await pool.query<any[]>(
      `SELECT 
        mr.*,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name
       FROM medical_records mr
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Medical record updated successfully",
      data: updatedRecord[0],
    });
  } catch (error) {
    console.error("Error updating medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/medical-records/:id
 * Delete a medical record
 */
const deleteMedicalRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>(
      "DELETE FROM medical_records WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found" });
    }

    res.json({
      success: true,
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/appointments
 * Get all appointments with filters
 */
const getAllAdminAppointments: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      service_id,
      patient_id,
      start_date,
      end_date,
      sort_by = "scheduled_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (status) {
      whereClause += " AND a.status = ?";
      queryParams.push(status);
    }

    if (service_id) {
      whereClause += " AND a.service_id = ?";
      queryParams.push(service_id);
    }

    if (patient_id) {
      whereClause += " AND a.patient_id = ?";
      queryParams.push(patient_id);
    }

    if (start_date) {
      whereClause += " AND DATE(a.scheduled_at) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += " AND DATE(a.scheduled_at) <= ?";
      queryParams.push(end_date);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total 
       FROM appointments a
       WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get appointments with related data
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.*, 
        DATE(a.scheduled_at) as appointment_date,
        TIME(a.scheduled_at) as appointment_time,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.category as service_category,
        s.duration_minutes as service_duration,
        DATE_FORMAT(a.scheduled_at, '%Y-%m-%d') as appointment_date_formatted,
        TIME_FORMAT(a.scheduled_at, '%H:%i') as appointment_time_formatted
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE ${whereClause}
       ORDER BY ${sort_by} ${sort_order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching admin appointments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/appointments/:id/status
 * Update appointment status
 */
const updateAppointmentStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = [
      "scheduled",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Update appointment
    const updateFields: string[] = ["status = ?"];
    const updateValues: any[] = [status];

    if (notes !== undefined) {
      updateFields.push("notes = ?");
      updateValues.push(notes);
    }

    updateFields.push("updated_at = NOW()");

    const [result] = await pool.query<any>(
      `UPDATE appointments SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateValues, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Get updated appointment with related data
    const [updatedAppointment] = await pool.query<any[]>(
      `SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        s.name as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      data: updatedAppointment[0],
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts
 * Get all contracts with filtering and pagination
 */
const getAllContracts: RequestHandler = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push(
        "(CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR s.name LIKE ? OR c.contract_number LIKE ?)",
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== "all") {
      whereConditions.push("c.status = ?");
      params.push(status);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get contracts
    const [contracts] = await pool.query<any[]>(
      `SELECT 
        c.id,
        c.contract_number,
        c.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email,
        c.service_id,
        s.name as service_name,
        c.total_amount,
        c.sessions_included as total_sessions,
        c.sessions_completed as completed_sessions,
        (c.sessions_included - c.sessions_completed) as remaining_sessions,
        c.total_amount as amount_paid,
        0 as amount_pending,
        c.status,
        c.signed_at,
        c.pdf_url as contract_file_url,
        c.signature_data as signature_url,
        c.created_at as start_date,
        c.created_at,
        c.updated_at
       FROM contracts c
       JOIN patients p ON c.patient_id = p.id
       JOIN services s ON c.service_id = s.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset],
    );

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total
       FROM contracts c
       JOIN patients p ON c.patient_id = p.id
       JOIN services s ON c.service_id = s.id
       ${whereClause}`,
      params,
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / Number(limit));

    const mappedContracts = contracts.map((contract) => ({
      ...contract,
      end_date: contract.end_date ?? null,
    }));

    res.json({
      success: true,
      data: {
        contracts: mappedContracts,
        total,
        page: Number(page),
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/stats
 * Get contract statistics
 */
const getContractStats: RequestHandler = async (req, res) => {
  try {
    const [stats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total_contracts,
        SUM(CASE WHEN c.status = 'signed' THEN 1 ELSE 0 END) as active_contracts,
        SUM(CASE WHEN c.sessions_completed >= c.sessions_included THEN 1 ELSE 0 END) as completed_contracts,
        COALESCE(SUM(c.total_amount), 0) as total_revenue,
        0 as pending_revenue
       FROM contracts c`,
    );

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching contract stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/:id
 * Get detailed contract information with sessions
 */
const getContractDetails: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get contract details
    const [contracts] = await pool.query<any[]>(
      `SELECT 
        c.id,
        c.contract_number,
        c.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email,
        c.service_id,
        s.name as service_name,
        c.total_amount,
        c.sessions_included as total_sessions,
        c.sessions_completed as completed_sessions,
        (c.sessions_included + c.extra_sessions_granted - c.sessions_completed) as remaining_sessions,
        c.total_amount as amount_paid,
        0 as amount_pending,
        c.status,
        c.legal_template,
        c.selected_zone,
        c.selected_zones,
        c.guarantee_status,
        c.guarantee_evaluated_at,
        c.extra_sessions_granted,
        c.terms_and_conditions,
        c.signed_terms,
        c.signed_at,
        c.pdf_url as contract_file_url,
        c.signature_data as signature_url,
        c.created_at as start_date,
        c.created_at,
        c.updated_at
       FROM contracts c
       JOIN patients p ON c.patient_id = p.id
       JOIN services s ON c.service_id = s.id
       WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    // Map status
    contract.status = contract.status === "signed" ? "active" : "pending";

    // Get appointments linked to this contract (without window function for compatibility)
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id as appointment_id,
        a.scheduled_at,
        a.status,
        a.check_in_at as completed_at,
        a.notes
       FROM appointments a
       WHERE a.contract_id = ?
       ORDER BY a.scheduled_at ASC`,
      [id],
    );

    // Add session numbers manually
    const sessions = appointments.map((apt, index) => ({
      id: apt.appointment_id,
      contract_id: Number(id),
      appointment_id: apt.appointment_id,
      session_number: index + 1,
      completed_at: apt.completed_at,
      notes: apt.notes,
    }));

    const [consentRows] = await pool.query<any[]>(
      `SELECT id, status, zone, health_answers, clinical_conclusion, clinical_notes,
              patient_signed_at, staff_signed_at, legal_template,
              is_minor, guardian_name, guardian_relationship
       FROM consents WHERE contract_id = ? ORDER BY id DESC LIMIT 1`,
      [id],
    );
    const [measurementRows] = await pool.query<any[]>(
      `SELECT id, zone_id, zone_label, baseline_count, baseline_at, final_count,
              final_at, reduction_pct, met_90, notes, recorded_by, updated_at
       FROM contract_zone_measurements WHERE contract_id = ? ORDER BY id ASC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        contract: {
          ...contract,
          selected_zones: parseSelectedZones(contract.selected_zones),
        },
        sessions,
        consent: consentRows[0] || null,
        measurements: measurementRows,
      },
    });
  } catch (error) {
    console.error("Error fetching contract details:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error,
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/admin/settings/default-contract-terms
 * Get the system-wide default contract terms
 */
const getDefaultContractTerms: RequestHandler = async (req, res) => {
  try {
    const [settings] = await pool.query<any[]>(
      `SELECT setting_value, updated_at 
       FROM system_settings 
       WHERE setting_key = 'default_contract_terms'`,
    );

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Default contract terms not found",
      });
    }

    res.json({
      success: true,
      data: {
        terms: settings[0].setting_value,
        updated_at: settings[0].updated_at,
      },
    });
  } catch (error) {
    console.error("Error fetching default contract terms:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching default contract terms",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/admin/settings/default-contract-terms
 * Update the system-wide default contract terms
 */
const updateDefaultContractTerms: RequestHandler = async (req, res) => {
  try {
    const { terms } = req.body;
    const admin_id = getAdminFromRequest(req)?.id || null;

    if (!terms) {
      return res.status(400).json({
        success: false,
        message: "terms is required",
      });
    }

    // Update default terms in system_settings
    await pool.query(
      `UPDATE system_settings 
       SET setting_value = ?,
           updated_by = ?,
           updated_at = NOW()
       WHERE setting_key = 'default_contract_terms'`,
      [terms, admin_id],
    );

    // Fetch updated settings
    const [settings] = await pool.query<any[]>(
      `SELECT setting_value, updated_at 
       FROM system_settings 
       WHERE setting_key = 'default_contract_terms'`,
    );

    res.json({
      success: true,
      message: "Default contract terms updated successfully",
      data: {
        terms: settings[0].setting_value,
        updated_at: settings[0].updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating default contract terms:", error);
    res.status(500).json({
      success: false,
      message: "Error updating default contract terms",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/admin/contracts/:id/download
 * Download the signed PDF (regenerate from stored signature)
 */
const downloadContractPDF: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get contract details with patient and service info
    const [contracts] = await pool.query<any[]>(
      `SELECT c.*,
              COALESCE(c.signed_terms, c.terms_and_conditions) as contract_terms,
              CONCAT(p.first_name, ' ', p.last_name) as patient_name,
              p.email as patient_email,
              p.phone as patient_phone,
              s.name as service_name
       FROM contracts c
       JOIN patients p ON c.patient_id = p.id
       JOIN services s ON c.service_id = s.id
       WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    if (!contract.signature_data && !contract.signature_canvas_data) {
      return res.status(400).json({
        success: false,
        message: "Contract does not have signature data",
      });
    }

    // Generate PDF from contract data
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("All Beauty Luxury & Wellness", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.text("Contrato de Servicio", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Patient Information
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("INFORMACIÓN DEL PACIENTE", margin, yPosition);
    yPosition += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Nombre: ${contract.patient_name}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${contract.patient_email}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Teléfono: ${contract.patient_phone || "N/A"}`, margin, yPosition);
    yPosition += 10;

    // Service Information
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("INFORMACIÓN DEL SERVICIO", margin, yPosition);
    yPosition += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Servicio: ${contract.service_name}`, margin, yPosition);
    yPosition += 6;
    pdf.text(
      `Precio: $${contract.total_amount.toLocaleString("es-MX")}`,
      margin,
      yPosition,
    );
    yPosition += 6;
    pdf.text(
      `Número de Contrato: ${contract.contract_number}`,
      margin,
      yPosition,
    );
    yPosition += 10;

    // Contract Terms
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("TÉRMINOS Y CONDICIONES", margin, yPosition);
    yPosition += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const terms = (
      contract.contract_terms ||
      contract.terms_and_conditions ||
      ""
    ).split("\n");
    const maxWidth = pageWidth - margin * 2;

    for (const line of terms) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      const splitLines = pdf.splitTextToSize(line || " ", maxWidth);
      for (const splitLine of splitLines) {
        pdf.text(splitLine, margin, yPosition);
        yPosition += 5;
      }
    }

    // Signature section
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("FIRMA DEL PACIENTE", margin, yPosition);
    yPosition += 10;

    // Add signature image
    try {
      const signatureData =
        contract.signature_canvas_data || contract.signature_data;
      if (signatureData) {
        pdf.addImage(signatureData, "PNG", margin, yPosition, 60, 22.5);
        yPosition += 28;
      }
    } catch (err) {
      console.error("Error adding signature to PDF:", err);
      yPosition += 28;
    }

    // Date and time of signature
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    if (contract.signed_at) {
      pdf.text(
        `Fecha y hora de firma: ${new Date(contract.signed_at).toLocaleString("es-MX")}`,
        margin,
        yPosition,
      );
    }

    // Add page numbers to all pages
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    // Convert to buffer and send
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contrato-${contract.contract_number || id}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading contract PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading contract PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const downloadPatientContractPDF: RequestHandler = async (req, res, next) => {
  const patient_id = Number(req.query.patient_id);
  if (!patient_id) {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }
  const isAuthenticated = await verifyPatientSession(patient_id);
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - please login again",
    });
  }
  const [rows] = await pool.query<any[]>(
    `SELECT id FROM contracts WHERE id = ? AND patient_id = ?`,
    [req.params.id, patient_id],
  );
  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Contract not found",
    });
  }
  return downloadContractPDF(req, res, next);
};

/**
 * POST /api/admin/appointments/:id/check-in
 * Check in a patient for their appointment
 */
/**
 * POST /api/admin/contracts/create
 * Create a contract for an appointment
 */
const createContract: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      service_id,
      total_amount,
      sessions_included,
      terms_and_conditions,
      selected_areas,
    } = req.body;

    if (!patient_id || !service_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const [patients] = await pool.query<any[]>(
      "SELECT first_name, last_name, email, phone, date_of_birth FROM patients WHERE id = ?",
      [patient_id],
    );

    const [services] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ?",
      [service_id],
    );

    if (patients.length === 0 || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient or service not found",
      });
    }

    const patient = patients[0];
    const service = mapServiceRow(services[0]);
    const patientName = `${patient.first_name} ${patient.last_name}`;
    const appointmentId = req.body.appointment_id;
    if (appointmentId) {
      const [linked] = await pool.query<any[]>(
        `SELECT a.contract_id, a.patient_id, a.notes, c.contract_number, c.status,
                c.legal_template, c.selected_zone, c.selected_zones
           FROM appointments a
           LEFT JOIN contracts c ON c.id = a.contract_id
          WHERE a.id = ?`,
        [appointmentId],
      );
      if (
        linked[0]?.contract_id &&
        Number(linked[0].patient_id) !== Number(patient_id)
      ) {
        return res.status(400).json({
          success: false,
          message: "La cita no pertenece a este paciente",
        });
      }
      if (linked[0]?.contract_id) {
        return res.json({
          success: true,
          message: "Contract already linked to this appointment",
          data: {
            contract_id: linked[0].contract_id,
            contract_number: linked[0].contract_number,
            patient_name: patientName,
            patient_email: patient.email,
            service_name: service.name,
            legal_template: linked[0].legal_template || service.legal_template,
            selected_zone: linked[0].selected_zone || null,
            selected_zones: parseSelectedZones(linked[0].selected_zones),
            reused: true,
          },
        });
      }
    }

    const velocityCatalog =
      service.legal_template === "velocity"
        ? await loadVelocityAreaCatalog()
        : [];
    let areas = Array.isArray(selected_areas) ? selected_areas : [];
    if ((!areas.length || areas.length === 0) && appointmentId) {
      const [aptRows] = await pool.query<any[]>(
        "SELECT notes FROM appointments WHERE id = ?",
        [appointmentId],
      );
      areas = parseAreasFromNotes(aptRows[0]?.notes);
    }
    const hasAreas = areas.length > 0;
    const zonePick = hasAreas
      ? resolveSelectedZones(service, areas, velocityCatalog)
      : {
          ok: true as const,
          zones: [] as ServiceAreaOption[],
          zoneLabel: "",
          totalPrice: Number(service.price || 0),
        };
    if (zonePick.ok === false) {
      return res.status(400).json({
        success: false,
        message: zonePick.error,
      });
    }
    if (
      appointmentId &&
      isLegalTemplate(service.legal_template) &&
      (service.area_catalog || []).length > 0 &&
      zonePick.zones.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          service.legal_template === "velocity"
            ? "Selecciona de 1 a 4 zonas del catálogo Velocity."
            : "Este paquete incluye una sola zona. Selecciona un área.",
      });
    }

    const sessions = Number(sessions_included || service.package_sessions || 1);
    const amount = Number(
      total_amount ||
        (zonePick.zones.length ? zonePick.totalPrice : service.price) ||
        0,
    );
    if (!Number.isFinite(sessions) || sessions <= 0 || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Monto y sesiones del paquete son requeridos",
      });
    }

    const legalKey = isLegalTemplate(service.legal_template)
      ? service.legal_template
      : null;
    const zoneLabel = zonePick.zoneLabel;
    const selectedZonesJson =
      zonePick.zones.length > 0 ? JSON.stringify(zonePick.zones) : null;
    const contractNumber = `CON-${Date.now()}-${patient_id}`;
    const createdBy = getAdminFromRequest(req)?.id;
    if (!createdBy) return missingAdminActorResponse(res);
    const incomingTerms = String(terms_and_conditions || "").trim();
    const useOfficial =
      Boolean(legalKey) &&
      (!incomingTerms || /TÉRMINOS Y CONDICIONES DEL SERVICIO/.test(incomingTerms));
    const contractTerms = useOfficial
      ? await buildFilledContractTerms({
          legalTemplate: legalKey,
          patientName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.date_of_birth
            ? String(patient.date_of_birth).slice(0, 10)
            : null,
          packageName: service.name,
          zone: zoneLabel,
          sessions,
          price: amount,
          folio: contractNumber,
        })
      : incomingTerms || "Términos y condiciones estándar del servicio.";

    const [result] = await pool.query<any>(
      `INSERT INTO contracts (
        patient_id, service_id, legal_template, selected_zone, selected_zones,
        guarantee_status, contract_number, status, total_amount,
        sessions_included, terms_and_conditions, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW())`,
      [
        patient_id,
        service_id,
        legalKey,
        zoneLabel || null,
        selectedZonesJson,
        legalKey === "velocity" ? "pending_baseline" : "not_applicable",
        contractNumber,
        amount,
        sessions,
        contractTerms,
        createdBy,
      ],
    );

    const contractId = result.insertId;

    if (appointmentId) {
      await pool.query(
        `UPDATE appointments SET contract_id = ? WHERE id = ?`,
        [contractId, appointmentId],
      );
    } else {
      await pool.query(
        `UPDATE appointments
         SET contract_id = ?
         WHERE patient_id = ?
           AND service_id = ?
           AND status IN ('scheduled', 'confirmed')
           AND contract_id IS NULL`,
        [contractId, patient_id, service_id],
      );
    }

    res.json({
      success: true,
      message: "Contract created successfully",
      data: {
        contract_id: contractId,
        contract_number: contractNumber,
        patient_name: patientName,
        patient_email: patient.email,
        service_name: service.name,
        legal_template: legalKey,
        selected_zone: zoneLabel || null,
        selected_zones: zonePick.zones,
      },
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const uploadContractPDF: RequestHandler = async (req, res) => {
  try {
    const { patient_id, service_id, total_amount, sessions_included } =
      req.body;

    if (!patient_id || !service_id || !total_amount || !sessions_included) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const contractNumber = `CON-${Date.now()}-${patient_id}`;
    const pdfUrl = `/uploads/contracts/${contractNumber}.pdf`;
    const createdBy = getAdminFromRequest(req)?.id;
    if (!createdBy) return missingAdminActorResponse(res);

    const [result] = await pool.query<any>(
      `INSERT INTO contracts (
        patient_id, service_id, contract_number, status, total_amount,
        sessions_included, terms_and_conditions, pdf_url, created_by, created_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, NOW())`,
      [
        patient_id,
        service_id,
        contractNumber,
        total_amount,
        sessions_included,
        "PDF Contract",
        pdfUrl,
        createdBy,
      ],
    );

    const contractId = result.insertId;

    res.json({
      success: true,
      message: "Contract PDF uploaded successfully",
      data: {
        contract_id: contractId,
        contract_number: contractNumber,
        pdf_url: pdfUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading contract PDF:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const sendContractForSignature: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get contract details
    const [contracts] = await pool.query<any[]>(
      `SELECT c.*, 
        p.first_name, p.last_name, p.email,
        s.name as service_name
      FROM contracts c
      JOIN patients p ON c.patient_id = p.id
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    await pool.query(
      `UPDATE contracts 
       SET status = 'pending_signature',
           updated_at = NOW()
       WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Contract ready for in-app signature",
      data: {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        status: "pending_signature",
      },
    });
  } catch (error) {
    console.error("Error sending contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateContractTermsHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const customTerms =
      req.body.custom_terms || req.body.terms_and_conditions;
    if (!customTerms || typeof customTerms !== "string") {
      return res.status(400).json({
        success: false,
        message: "custom_terms is required",
      });
    }
    const [contracts] = await pool.query<any[]>(
      `SELECT id, status FROM contracts WHERE id = ?`,
      [id],
    );
    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }
    if (!["draft", "pending_signature"].includes(contracts[0].status)) {
      return res.status(400).json({
        success: false,
        message: "Only draft or pending contracts can update terms",
      });
    }
    await pool.query(
      `UPDATE contracts SET terms_and_conditions = ?, updated_at = NOW() WHERE id = ?`,
      [customTerms, id],
    );
    res.json({
      success: true,
      data: {
        id: Number(id),
        custom_terms: customTerms,
        terms_and_conditions: customTerms,
      },
    });
  } catch (error) {
    console.error("Error updating contract terms:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/:id/status
 * Get contract signature status (in-app canvas)
 */
const getContractStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [contracts] = await pool.query<any[]>(
      `SELECT c.id, c.contract_number, c.status, c.signed_at,
        p.first_name, p.last_name, p.email,
        s.name as service_name
      FROM contracts c
      JOIN patients p ON c.patient_id = p.id
      JOIN services s ON c.service_id = s.id
      WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    res.json({
      success: true,
      data: contracts[0],
    });
  } catch (error) {
    console.error("Error getting contract status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/contracts/appointment/:appointmentId
 * Get contract for a specific appointment
 */
const getContractByAppointment: RequestHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, c.id as contract_id, c.status as contract_status,
        c.signed_at, c.contract_number
      FROM appointments a
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.id = ?`,
      [appointmentId],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = appointments[0];

    if (!appointment.contract_id) {
      return res.json({
        success: true,
        data: null,
        message: "No contract associated with this appointment",
      });
    }

    res.json({
      success: true,
      data: {
        contract_id: appointment.contract_id,
        contract_number: appointment.contract_number,
        contract_status: appointment.contract_status,
        signed_at: appointment.signed_at,
      },
    });
  } catch (error) {
    console.error("Error getting contract:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/manual
 * Create a manual appointment from the admin panel
 */
const createAdminPatient: RequestHandler = async (req, res) => {
  try {
    const patient = await insertPatientRow(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 400) {
      return res.status(400).json({
        success: false,
        message: "Nombre, apellido y correo son requeridos",
      });
    }
    if (isMysqlDuplicate(error)) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un paciente con ese correo",
      });
    }
    console.error("Error creating admin patient:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const createManualAppointment: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      new_patient,
      service_id,
      scheduled_date,
      scheduled_time,
      notes,
      payment_amount,
      payment_method,
      selected_areas,
    } = req.body;

    const adminId = (req as express.Request & { admin?: AdminJwtPayload }).admin
      ?.id;
    const createdBy = adminId;

    if (!service_id || !scheduled_date || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "service_id, scheduled_date and scheduled_time are required",
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un administrador autenticado",
      });
    }

    const [serviceRows] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ?",
      [service_id],
    );
    if (serviceRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }
    const service = mapServiceRow(serviceRows[0]);
    const velocityCatalog =
      service.legal_template === "velocity"
        ? await loadVelocityAreaCatalog()
        : [];
    const zonePick = resolveSelectedZones(
      service,
      selected_areas,
      velocityCatalog,
    );
    if (zonePick.ok === false) {
      return res.status(400).json({
        success: false,
        message: zonePick.error,
      });
    }

    const paymentMethod = normalizePaymentMethod(payment_method);
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Método de pago inválido",
      });
    }

    let resolvedPatientId = patient_id ? Number(patient_id) : 0;
    if (!resolvedPatientId && new_patient) {
      const email = String(new_patient.email || "")
        .trim()
        .toLowerCase();
      if (email) {
        const [existing] = await pool.query<any[]>(
          "SELECT id FROM patients WHERE email = ?",
          [email],
        );
        if (existing.length > 0) {
          resolvedPatientId = existing[0].id;
        }
      }
      if (!resolvedPatientId) {
        try {
          const created = await insertPatientRow(new_patient);
          resolvedPatientId = created.id;
        } catch (error) {
          const status = (error as Error & { status?: number }).status;
          if (status === 400) {
            return res.status(400).json({
              success: false,
              message:
                "Para un paciente nuevo se requieren nombre, apellido y correo",
            });
          }
          if (isMysqlDuplicate(error)) {
            return res.status(409).json({
              success: false,
              message: "Ya existe un paciente con ese correo",
            });
          }
          throw error;
        }
      }
    }

    if (!resolvedPatientId) {
      return res.status(400).json({
        success: false,
        message:
          "Selecciona un paciente existente o captura los datos de un paciente nuevo",
      });
    }

    const [patients] = await pool.query<any[]>(
      `SELECT id, first_name, last_name, email, phone, date_of_birth
       FROM patients WHERE id = ?`,
      [resolvedPatientId],
    );
    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }
    const patient = patients[0];

    const scheduledAt = `${scheduled_date} ${normalizeClockTime(scheduled_time)}`;
    const blockedReason = await findBlockedSlotReason(
      scheduled_date,
      scheduled_time,
    );
    if (blockedReason) {
      return res.status(400).json({
        success: false,
        message: `El horario no está disponible. Motivo: ${blockedReason}`,
        reason: "blocked_date",
      });
    }
    const durationMinutes = computePackageDuration(
      service.legal_template,
      service.duration_minutes,
      zonePick.zones.length,
    );
    const catalogAmount = zonePick.zones.length
      ? zonePick.totalPrice
      : Number(service.price || 0);
    const openPackage = await findOpenPackageContract(
      resolvedPatientId,
      service,
      zonePick.zones,
    );
    const skipPayment = Boolean(openPackage && openPackage.remaining > 0);
    const areaNote = zonePick.zoneLabel ? `Área: ${zonePick.zoneLabel}` : "";
    const combinedNotes =
      [areaNote, notes].filter((part) => String(part || "").trim()).join("\n") ||
      null;

    let appointmentId: number;
    try {
      appointmentId = await withScheduleDayLock(
        scheduled_date,
        async (conn) => {
          const overlapId = await findOverlappingAppointment(
            conn,
            scheduledAt,
            durationMinutes,
          );
          if (overlapId) {
            throw new SlotConflictError();
          }
          const [created] = await conn.query<any>(
            `INSERT INTO appointments
             (patient_id, service_id, scheduled_at, duration_minutes, status, notes, created_by, booked_for_self, booking_source)
             VALUES (?, ?, ?, ?, 'scheduled', ?, ?, 1, 'receptionist')`,
            [
              resolvedPatientId,
              service_id,
              scheduledAt,
              durationMinutes,
              combinedNotes,
              createdBy,
            ],
          );
          return Number(created.insertId);
        },
      );
    } catch (error) {
      if (error instanceof SlotConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
          reason: error.reason,
        });
      }
      throw error;
    }
    let contractId = openPackage?.id || null;
    if (!contractId && service.legal_template) {
      const legalKey = isLegalTemplate(service.legal_template)
        ? service.legal_template
        : null;
      const contractNumber = `CON-${Date.now()}-${resolvedPatientId}`;
      const terms = await buildFilledContractTerms({
        legalTemplate: legalKey,
        patientName: `${patient.first_name} ${patient.last_name}`.trim(),
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth
          ? String(patient.date_of_birth).slice(0, 10)
          : null,
        packageName: service.name,
        zone: zonePick.zoneLabel,
        sessions: service.package_sessions || 1,
        price: catalogAmount,
        folio: contractNumber,
      });
      const [created] = await pool.query<any>(
        `INSERT INTO contracts (
          patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, contract_number, status, total_amount,
          sessions_included, terms_and_conditions, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW())`,
        [
          resolvedPatientId,
          service.id,
          legalKey,
          zonePick.zoneLabel || null,
          zonePick.zones.length ? JSON.stringify(zonePick.zones) : null,
          legalKey === "velocity" ? "pending_baseline" : "not_applicable",
          contractNumber,
          catalogAmount,
          service.package_sessions || 1,
          terms,
          createdBy,
        ],
      );
      contractId = created.insertId;
    }
    if (contractId) {
      await pool.query(
        `UPDATE appointments SET contract_id = ? WHERE id = ?`,
        [contractId, appointmentId],
      );
    }

    let recordedAmount = 0;
    if (!skipPayment && payment_amount && parseFloat(payment_amount) > 0) {
      recordedAmount = service.legal_template
        ? catalogAmount
        : parseFloat(payment_amount);
      if (service.legal_template && parseFloat(payment_amount) !== catalogAmount) {
        console.warn(
          `[manual-appointment] Client amount ${payment_amount} ignored; recording catalog price ${catalogAmount}`,
        );
      }
      await pool.query<any>(
        `INSERT INTO payments
         (appointment_id, patient_id, amount, payment_method, payment_status, processed_by, processed_at)
         VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
        [
          appointmentId,
          resolvedPatientId,
          recordedAmount,
          paymentMethod,
          createdBy,
        ],
      );
    }

    sendManualAppointmentEmail(patient.email, `${patient.first_name} ${patient.last_name}`.trim(), {
      serviceName: service.name || "",
      date: scheduled_date,
      time: scheduled_time,
      duration: durationMinutes,
      amount: skipPayment ? 0 : recordedAmount,
      paymentMethod,
    }).catch((err) =>
      console.error("Failed to send manual appointment email:", err),
    );

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        id: appointmentId,
        patient_id: resolvedPatientId,
        contract_id: contractId,
        skip_payment: skipPayment,
        catalog_amount: catalogAmount,
        duration_minutes: durationMinutes,
      },
    });
  } catch (error) {
    console.error("Error creating manual appointment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/check-in
 * Check in a patient (requires signed contract)
 */
const checkInAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists and is scheduled
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, c.id as contract_id, c.status as contract_status
      FROM appointments a
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.id = ?`,
      [id],
    );

    if (appointments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot check in cancelled appointment",
      });
    }

    if (appointment.check_in_at) {
      return res.json({
        success: true,
        message: "Patient already checked in",
        already_checked_in: true,
      });
    }

    if (!appointment.contract_id) {
      return res.status(400).json({
        success: false,
        message: "Contract required for check-in",
        requires_contract: true,
      });
    }

    if (appointment.contract_status !== "signed") {
      return res.status(400).json({
        success: false,
        message: "Contract must be signed before check-in",
        requires_signature: true,
        contract_id: appointment.contract_id,
      });
    }

    // Update appointment - don't update updated_at to preserve scheduled_at
    await pool.query(
      `UPDATE appointments 
       SET status = 'confirmed', 
           check_in_at = NOW(),
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Checked in at: ', NOW())
       WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Patient checked in successfully",
    });
  } catch (error) {
    console.error("Error checking in appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/cancel
 * Cancel an appointment (admin)
 */
const cancelAdminAppointment: RequestHandler = async (req, res) => {
  try {
    // ── Role check: only 'admin' (super admin) may cancel ──────────────────────
    const caller = getAdminFromRequest(req);
    if (!caller) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!STAFF_CAN_CANCEL_ROLES.has(caller.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para cancelar citas",
      });
    }

    const { id } = req.params;
    const { cancellation_reason, refund } = req.body;

    // Fetch appointment details + Stripe payment info for email & refund
    const [appointmentRows] = await pool.query<any[]>(
      `SELECT a.scheduled_at, s.name AS service_name,
              p.email AS patient_email,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              pay.stripe_payment_intent_id, pay.amount AS paid_amount, pay.id AS payment_id
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN payments pay ON a.id = pay.appointment_id
         AND pay.payment_status = 'completed'
         AND pay.stripe_payment_intent_id IS NOT NULL
       WHERE a.id = ?
       ORDER BY pay.id DESC
       LIMIT 1`,
      [id],
    );

    if (appointmentRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appt = appointmentRows[0];
    const scheduledDate = new Date(appt.scheduled_at);
    const dateStr = scheduledDate.toISOString().split("T")[0];
    const timeStr = scheduledDate.toTimeString().slice(0, 5);

    // Issue Stripe refund if requested
    let refundIssued = false;
    if (refund === true && appt.stripe_payment_intent_id) {
      try {
        await issueStripeRefund({
          paymentIntentId: appt.stripe_payment_intent_id,
          reason: cancellation_reason || "Cancelled by admin",
        });
        refundIssued = true;
        await markPaymentRefundedInDb({
          paymentId: appt.payment_id,
          refundAmount: Number(appt.paid_amount),
          reason: cancellation_reason || "Cancelled by admin",
          approvedBy: caller.id,
        });
      } catch (stripeErr: any) {
        console.error("[cancel] Stripe refund failed:", stripeErr.message);
        return res.status(502).json({
          success: false,
          message: `No se pudo procesar el reembolso: ${stripeErr.message}`,
        });
      }
    }

    // Update appointment status
    const [result] = await pool.query<any>(
      `UPDATE appointments 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), 
           CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
           'Cancelled by admin: ', COALESCE(?, 'No reason provided')), 
           updated_at = NOW()
       WHERE id = ?`,
      [cancellation_reason, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Send cancellation email (non-blocking)
    sendAppointmentCancellationEmail(appt.patient_email, appt.patient_name, {
      serviceName: appt.service_name,
      date: dateStr,
      time: timeStr,
      reason: cancellation_reason || undefined,
    }).catch((err) => console.error("Failed to send cancellation email:", err));

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      refund_issued: refundIssued,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/appointments/:id/payment-info
 * Returns Stripe payment info for the appointment (used to show refund option on cancel)
 */
const getAppointmentPaymentInfo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<any[]>(
      `SELECT pay.stripe_payment_intent_id, pay.amount, pay.payment_status
       FROM payments pay
       WHERE pay.appointment_id = ?
         AND pay.payment_status = 'completed'
         AND pay.stripe_payment_intent_id IS NOT NULL
       ORDER BY pay.id DESC
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) {
      return res.json({ success: true, has_stripe_payment: false });
    }
    return res.json({
      success: true,
      has_stripe_payment: true,
      amount: rows[0].amount,
    });
  } catch (error) {
    console.error("Error fetching payment info:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/appointments/:id/reschedule
 * Reschedule an appointment (admin)
 */
const rescheduleAdminAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, notes } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: "New appointment date and time are required",
      });
    }

    // Fetch appointment details for email notification
    const [appointmentRows] = await pool.query<any[]>(
      `SELECT a.scheduled_at, a.duration_minutes, s.name AS service_name,
              p.email AS patient_email,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [id],
    );

    if (appointmentRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appt = appointmentRows[0];
    const oldScheduledDate = new Date(appt.scheduled_at);
    const oldDateStr = oldScheduledDate.toISOString().split("T")[0];
    const oldTimeStr = oldScheduledDate.toTimeString().slice(0, 5);

    const newScheduledAt = `${appointment_date} ${normalizeClockTime(appointment_time)}`;
    const durationMinutes = Number(appt.duration_minutes || 60);
    try {
      await withScheduleDayLock(appointment_date, async (conn) => {
        const overlapId = await findOverlappingAppointment(
          conn,
          newScheduledAt,
          durationMinutes,
          Number(id),
        );
        if (overlapId) {
          throw new SlotConflictError("Time slot is already booked");
        }
        const [result] = await conn.query<any>(
          `UPDATE appointments 
           SET scheduled_at = ?, 
               notes = CONCAT(COALESCE(notes, ''), 
               CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, 
               'Rescheduled by admin: ', COALESCE(?, 'No reason provided')), 
               updated_at = NOW()
           WHERE id = ?`,
          [newScheduledAt, notes, id],
        );
        if (result.affectedRows === 0) {
          const missing = new Error("Appointment not found");
          (missing as Error & { status?: number }).status = 404;
          throw missing;
        }
      });
    } catch (error) {
      if (error instanceof SlotConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
          reason: error.reason,
        });
      }
      if ((error as Error & { status?: number }).status === 404) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }
      throw error;
    }

    // Send reschedule email (non-blocking)
    sendAppointmentRescheduleEmail(appt.patient_email, appt.patient_name, {
      serviceName: appt.service_name,
      oldDate: oldDateStr,
      oldTime: oldTimeStr,
      newDate: appointment_date,
      newTime: appointment_time,
      notes: notes || undefined,
    }).catch((err) => console.error("Failed to send reschedule email:", err));

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/check-in/generate-token
 * Generate a QR check-in token for an appointment (admin only)
 */
const generateCheckInToken: RequestHandler = async (req, res) => {
  console.log("[CHECK-IN] Generate token request:", req.body);
  try {
    const { appointment_id } = req.body;

    if (!appointment_id) {
      console.log("[CHECK-IN] Missing appointment_id");
      return res.status(400).json({
        success: false,
        message: "appointment_id es requerido",
      });
    }

    // Verify appointment exists and is not already checked in
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, p.email as patient_email, 
       CONCAT(p.first_name, ' ', p.last_name) as patient_name 
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       WHERE a.id = ?`,
      [appointment_id],
    );

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      });
    }

    const appointment = appointments[0];

    if (appointment.check_in_at) {
      return res.status(400).json({
        success: false,
        message: "Esta cita ya fue registrada",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "No se puede generar check-in para una cita cancelada",
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update appointment with token
    await pool.query(
      `UPDATE appointments 
       SET check_in_token = ?, 
           check_in_token_expires_at = ? 
       WHERE id = ?`,
      [token, expiresAt, appointment_id],
    );

    // Log token generation
    await pool.query(
      `INSERT INTO check_in_logs 
       (appointment_id, check_in_token, action, metadata) 
       VALUES (?, ?, 'token_generated', ?)`,
      [appointment_id, token, JSON.stringify({ expires_at: expiresAt })],
    );

    // Generate QR code URL
    const checkInUrl = `${process.env.FRONTEND_URL || "https://allbeautyweb.com"}/check-in?token=${token}`;

    res.json({
      success: true,
      message: "Token de check-in generado exitosamente",
      data: {
        token,
        check_in_url: checkInUrl,
        expires_at: expiresAt,
      },
    });
  } catch (error) {
    console.error("Error generating check-in token:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar token de check-in",
    });
  }
};

/**
 * GET /api/check-in/validate/:token
 * Validate check-in token and get appointment data (public)
 */
const validateCheckInToken: RequestHandler = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token inválido",
      });
    }

    // Get appointment by token
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.patient_id,
        a.service_id,
        a.scheduled_at,
        a.duration_minutes,
        a.status,
        a.notes,
        a.check_in_at,
        a.check_in_token_expires_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as service_name,
        s.price as service_price,
        s.package_sessions,
        s.legal_template as service_legal_template,
        p.date_of_birth,
        DATE(a.scheduled_at) as scheduled_date,
        TIME(a.scheduled_at) as scheduled_time,
        c.id as contract_id,
        c.contract_number,
        c.selected_zone,
        c.legal_template as contract_legal_template,
        c.terms_and_conditions as contract_terms_custom
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       JOIN services s ON a.service_id = s.id
       LEFT JOIN contracts c ON c.id = a.contract_id
       WHERE a.check_in_token = ?`,
      [token],
    );

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "No se puede hacer check-in de una cita cancelada",
      });
    }

    // Check if token expired
    if (
      appointment.check_in_token_expires_at &&
      new Date(appointment.check_in_token_expires_at) < new Date()
    ) {
      await pool.query(
        `INSERT INTO check_in_logs 
         (appointment_id, check_in_token, action, ip_address) 
         VALUES (?, ?, 'token_expired', ?)`,
        [appointment.id, token, req.ip],
      );

      return res.status(400).json({
        success: false,
        message: "El token ha expirado. Por favor, solicite uno nuevo.",
      });
    }

    // Log QR scan
    await pool.query(
      `INSERT INTO check_in_logs 
       (appointment_id, check_in_token, action, ip_address, user_agent) 
       VALUES (?, ?, 'qr_scanned', ?, ?)`,
      [appointment.id, token, req.ip, req.headers["user-agent"]],
    );

    const legalKey = isLegalTemplate(
      appointment.contract_legal_template || appointment.service_legal_template,
    )
      ? ((appointment.contract_legal_template ||
          appointment.service_legal_template) as LegalTemplateKey)
      : null;
    const zoneFromNotes = extractAreaNoteLine(appointment.notes);
    const zone =
      appointment.selected_zone || zoneFromNotes || "";
    const contractTerms =
      appointment.contract_terms_custom ||
      (await buildFilledContractTerms({
        legalTemplate: legalKey,
        patientName: appointment.patient_name,
        email: appointment.patient_email,
        phone: appointment.patient_phone,
        dateOfBirth: appointment.date_of_birth
          ? String(appointment.date_of_birth).slice(0, 10)
          : null,
        packageName: appointment.service_name,
        zone,
        sessions: Number(appointment.package_sessions || 1),
        price: Number(appointment.service_price || 0),
        folio: appointment.contract_number,
      }));

    res.json({
      success: true,
      data: {
        appointment,
        contract_terms: contractTerms,
        consent: legalKey
          ? {
              legal_template: legalKey,
              intro: defaultConsentIntro(legalKey),
              questions: CONSENT_QUESTIONS[legalKey],
              zone,
              requires_minors_annex: legalKey !== "bliss",
              patient_is_minor: isPatientMinor(appointment.date_of_birth),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error validating check-in token:", error);
    res.status(500).json({
      success: false,
      message: "Error al validar token",
    });
  }
};

/**
 * POST /api/check-in/complete
 * Complete check-in with signature (public)
 */
const completeCheckIn: RequestHandler = async (req, res) => {
  try {
    const {
      token,
      signature_data,
      terms_accepted,
      pdf_base64,
      consent,
    } = req.body;

    if (!token || !signature_data || !terms_accepted) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    // Get appointment
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email,
        s.name as service_name,
        s.price as service_price,
        s.package_sessions,
        s.legal_template as service_legal_template,
        p.phone as patient_phone,
        p.date_of_birth,
        a.notes,
        c.id as existing_contract_id,
        c.contract_number as existing_contract_number,
        c.selected_zone,
        c.legal_template as contract_legal_template,
        c.terms_and_conditions as existing_terms
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       JOIN services s ON a.service_id = s.id
       LEFT JOIN contracts c ON a.contract_id = c.id
       WHERE a.check_in_token = ?`,
      [token],
    );

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido",
      });
    }

    const appointment = appointments[0];

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "No se puede hacer check-in de una cita cancelada",
      });
    }

    if (
      appointment.check_in_token_expires_at &&
      new Date(appointment.check_in_token_expires_at) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "El código de check-in ha expirado",
      });
    }

    // Check if already checked in
    if (appointment.check_in_at) {
      return res.status(400).json({
        success: false,
        message: "Esta cita ya fue registrada",
      });
    }

    const now = new Date();
    const contractNumber =
      appointment.existing_contract_number ||
      `CON-${Date.now()}-${appointment.patient_id}`;

    const legalKey = isLegalTemplate(
      appointment.contract_legal_template || appointment.service_legal_template,
    )
      ? ((appointment.contract_legal_template ||
          appointment.service_legal_template) as LegalTemplateKey)
      : null;
    const zone =
      appointment.selected_zone || extractAreaNoteLine(appointment.notes);
    const packageSessions = Number(appointment.package_sessions || 1);
    const contractTerms =
      appointment.existing_terms ||
      (await buildFilledContractTerms({
        legalTemplate: legalKey,
        patientName: appointment.patient_name,
        email: appointment.patient_email,
        phone: appointment.patient_phone,
        dateOfBirth: appointment.date_of_birth
          ? String(appointment.date_of_birth).slice(0, 10)
          : null,
        packageName: appointment.service_name,
        zone,
        sessions: packageSessions,
        price: Number(appointment.service_price || 0),
        folio: appointment.existing_contract_number,
      }));

    if (legalKey && !isConsentComplete(legalKey, consent)) {
      return res.status(400).json({
        success: false,
        message:
          "Este servicio requiere consentimiento informado: responde el cuestionario, acepta el aviso de salud y firma.",
      });
    }
    const annexRequired = isMinorsAnnexRequired(
      legalKey,
      appointment.date_of_birth,
      consent,
    );
    if (annexRequired && !isMinorsAnnexComplete(consent)) {
      return res.status(400).json({
        success: false,
        message:
          "Anexo de menores: indica que el paciente es menor y captura nombre, parentesco y firma del tutor.",
      });
    }

    // Convert base64 PDF to Buffer for email attachment
    let pdfBuffer: Buffer | null = null;
    if (pdf_base64) {
      try {
        // Remove data URL prefix if present (dataurlstring format)
        const base64Data = pdf_base64.replace(/^data:.*?;base64,/, "");
        pdfBuffer = Buffer.from(base64Data, "base64");
      } catch (err) {
        console.error("Error converting PDF base64 to buffer:", err);
      }
    }

    const selectedZones = await resolveCheckInSelectedZones(legalKey, zone);
    const selectedZonesJson =
      selectedZones.length > 0 ? JSON.stringify(selectedZones) : null;
    const guaranteeStatus =
      legalKey === "velocity" ? "pending_baseline" : "not_applicable";

    let contractId = appointment.existing_contract_id as number | null;
    if (contractId) {
      await pool.query(
        `UPDATE contracts
         SET status = 'signed',
             signature_data = ?,
             signed_terms = COALESCE(signed_terms, ?),
             signed_at = ?,
             signed_by = NULL,
             signature_canvas_data = ?,
             signature_ip_address = ?,
             signature_user_agent = ?,
             selected_zones = COALESCE(selected_zones, ?),
             legal_template = COALESCE(legal_template, ?),
             selected_zone = COALESCE(selected_zone, ?),
             guarantee_status = CASE
               WHEN ? = 'velocity' AND (guarantee_status IS NULL OR guarantee_status = 'not_applicable')
               THEN 'pending_baseline'
               ELSE guarantee_status
             END
         WHERE id = ?`,
        [
          signature_data,
          contractTerms,
          now,
          signature_data,
          req.ip,
          req.headers["user-agent"] || null,
          selectedZonesJson,
          legalKey,
          zone || null,
          legalKey,
          contractId,
        ],
      );
    } else {
      const createdBy = await resolveStaffCreatedBy(appointment.created_by);
      if (!createdBy) {
        return res.status(500).json({
          success: false,
          message: "No hay un administrador activo para registrar el contrato",
        });
      }
      const [created] = await pool.query<any>(
        `INSERT INTO contracts 
         (patient_id, service_id, legal_template, selected_zone, selected_zones,
          guarantee_status, contract_number, status, total_amount, 
          sessions_included, terms_and_conditions, signed_terms, signature_data, signed_at, 
          signed_by, created_by, pdf_url, signature_canvas_data, signature_ip_address, signature_user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'signed', ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?)`,
        [
          appointment.patient_id,
          appointment.service_id,
          legalKey,
          zone || null,
          selectedZonesJson,
          guaranteeStatus,
          contractNumber,
          appointment.service_price,
          packageSessions,
          contractTerms,
          contractTerms,
          signature_data,
          now,
          createdBy,
          signature_data,
          req.ip,
          req.headers["user-agent"] || null,
        ],
      );
      contractId = created.insertId;
    }

    await pool.query(
      `UPDATE appointments 
       SET check_in_at = ?,
           signature_data_url = ?,
           signed_contract_pdf_url = NULL,
           contract_signed_at = ?,
           signature_ip_address = ?,
           status = 'confirmed',
           contract_id = ?
       WHERE id = ?`,
      [now, signature_data, now, req.ip, contractId, appointment.id],
    );

    if (contractId) {
      await pool.query(
        `UPDATE contracts
         SET sessions_completed = LEAST(sessions_included, sessions_completed + 1),
             legal_template = COALESCE(legal_template, ?),
             selected_zone = COALESCE(selected_zone, ?),
             updated_at = NOW()
         WHERE id = ?`,
        [legalKey, zone || null, contractId],
      );
    }

    if (legalKey && consent?.signature) {
      const annex = consentAnnexPayload(consent);
      const persistMinor = annexRequired || annex.is_minor;
      const snapshot = [
        defaultConsentIntro(legalKey),
        `Zona: ${zone}`,
        JSON.stringify(consent.health_answers || {}),
        persistMinor
          ? `Anexo menores: ${annex.guardian_name} (${annex.guardian_relationship})`
          : "",
      ].join("\n");
      await pool.query(
        `INSERT INTO consents
           (patient_id, contract_id, appointment_id, service_id, legal_template, status, zone,
            health_answers, data_health_consent, photos_followup, patient_signature, patient_signed_at, signed_snapshot,
            is_minor, guardian_name, guardian_relationship, guardian_signature, guardian_signed_at)
         VALUES (?, ?, ?, ?, ?, 'pending_staff', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.patient_id,
          contractId,
          appointment.id,
          appointment.service_id,
          legalKey,
          zone || null,
          JSON.stringify(consent.health_answers || {}),
          consent.data_health_consent ? 1 : 0,
          consent.photos_followup ? 1 : 0,
          consent.signature,
          now,
          snapshot,
          persistMinor ? 1 : 0,
          persistMinor ? annex.guardian_name : null,
          persistMinor ? annex.guardian_relationship : null,
          persistMinor ? annex.guardian_signature : null,
          persistMinor ? now : null,
        ],
      );
    }

    // Log signature completion
    await pool.query(
      `INSERT INTO check_in_logs 
       (appointment_id, check_in_token, action, ip_address, user_agent) 
       VALUES (?, ?, 'signature_completed', ?, ?)`,
      [appointment.id, token, req.ip, req.headers["user-agent"]],
    );

    // Send email notification with PDF attachment
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log("RESEND_API_KEY not configured - skipping email");
      } else {
        const emailBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato Firmado - All Beauty Luxury &amp; Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background-color:#111111;padding:28px 40px;text-align:center;">
            ${emailLogoImg()}
          </td>
        </tr>
        <tr>
          <td style="background:linear-gradient(135deg,#C9A159 0%,#E8C580 60%,#B8903D 100%);padding:28px 40px;text-align:center;">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;">Check-in Completado</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:16px;color:#1A1A1A;">Estimado/a <strong>${appointment.patient_name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#4B4B4B;line-height:1.7;">Su check-in ha sido completado exitosamente y su contrato ha sido firmado.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #EDE8DF;border-radius:12px;overflow:hidden;">
              <tr><td style="background-color:#FAF7F2;padding:14px 20px;border-bottom:1px solid #EDE8DF;">
                <span style="font-size:13px;font-weight:700;color:#C9A159;letter-spacing:1px;text-transform:uppercase;">Detalles de la cita</span>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#4B4B4B;"><strong>Servicio:</strong> ${appointment.service_name}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#4B4B4B;"><strong>Fecha:</strong> ${new Date(appointment.scheduled_at).toLocaleDateString("es-MX")}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#4B4B4B;"><strong>Precio:</strong> $${appointment.service_price.toLocaleString("es-MX")}</p>
                <p style="margin:0;font-size:14px;color:#4B4B4B;"><strong>Numero de Contrato:</strong> ${contractNumber}</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:15px;color:#4B4B4B;line-height:1.7;">Adjuntamos su contrato firmado en formato PDF. Gracias por su preferencia.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#111111;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#C9A159;font-weight:600;letter-spacing:0.5px;">ALL BEAUTY LUXURY &amp; WELLNESS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        await sendEmail({
          to: appointment.patient_email,
          subject: "Contrato Firmado - All Beauty Luxury & Wellness",
          html: emailBody,
          attachments: pdfBuffer
            ? [
                {
                  filename: `${contractNumber}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : undefined,
        });

        await pool.query(
          `INSERT INTO check_in_logs 
           (appointment_id, check_in_token, action) 
           VALUES (?, ?, 'email_sent')`,
          [appointment.id, token],
        );

        await pool.query(
          `INSERT INTO contract_emails 
           (appointment_id, patient_id, email_to, email_type, status, 
            pdf_attachment_path, sent_at)
           VALUES (?, ?, ?, 'signed_contract', 'sent', ?, ?)`,
          [
            appointment.id,
            appointment.patient_id,
            appointment.patient_email,
            contractNumber,
            now,
          ],
        );
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail check-in if email fails
      await pool.query(
        `INSERT INTO contract_emails 
         (appointment_id, patient_id, email_to, email_type, status, error_message)
         VALUES (?, ?, ?, 'signed_contract', 'failed', ?)`,
        [
          appointment.id,
          appointment.patient_id,
          appointment.patient_email,
          (emailError as Error).message,
        ],
      );
    }

    // Log check-in completion
    await pool.query(
      `INSERT INTO check_in_logs 
       (appointment_id, check_in_token, action) 
       VALUES (?, ?, 'check_in_completed')`,
      [appointment.id, token],
    );

    res.json({
      success: true,
      message: "Check-in completado exitosamente",
      data: {
        appointment_id: appointment.id,
        contract_number: contractNumber,
      },
    });
  } catch (error) {
    console.error("Error completing check-in:", error);
    res.status(500).json({
      success: false,
      message: "Error al completar check-in",
    });
  }
};

/**
 * GET /api/admin/payments
 * Get all payments with filters
 */
const getAllAdminPayments: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      payment_method,
      start_date,
      end_date,
      search,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (status) {
      whereClause += " AND p.payment_status = ?";
      queryParams.push(status);
    }

    if (payment_method) {
      whereClause += " AND p.payment_method = ?";
      queryParams.push(payment_method);
    }

    if (start_date && end_date) {
      whereClause += " AND DATE(p.created_at) BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
    }

    if (typeof search === "string" && search.trim()) {
      const like = `%${search.trim()}%`;
      whereClause +=
        " AND (pat.first_name LIKE ? OR pat.last_name LIKE ? OR pat.email LIKE ? OR s.name LIKE ? OR CAST(p.id AS CHAR) LIKE ?)";
      queryParams.push(like, like, like, like, like);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total
       FROM payments p
       JOIN patients pat ON p.patient_id = pat.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get payments
    const [payments] = await pool.query<any[]>(
      `SELECT 
        p.*,
        pat.first_name as patient_first_name,
        pat.last_name as patient_last_name,
        pat.email as patient_email,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM payments p
       JOIN patients pat ON p.patient_id = pat.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN users u ON p.processed_by = u.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/payments/:id
 * Get payment by ID
 */
const getAdminPaymentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get appointment details as payment info
    const [payments] = await pool.query<any[]>(
      `SELECT 
        a.*,
        pat.first_name as patient_first_name,
        pat.last_name as patient_last_name,
        pat.email as patient_email,
        pat.phone as patient_phone,
        s.name as service_name,
        s.price as service_price
       FROM appointments a
       JOIN patients pat ON a.patient_id = pat.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id],
    );

    if (payments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.json({
      success: true,
      data: payments[0],
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/payments
 * Create a payment record
 */
const createPayment: RequestHandler = async (req, res) => {
  try {
    const { appointment_id, patient_id, amount, payment_method, notes } =
      req.body;
    const processedBy = getAdminFromRequest(req)?.id || null;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Un monto válido es requerido",
      });
    }

    let resolvedPatientId = patient_id ? Number(patient_id) : 0;
    let resolvedAppointmentId = appointment_id ? Number(appointment_id) : null;

    if (resolvedAppointmentId) {
      const [appts] = await pool.query<any[]>(
        "SELECT id, patient_id FROM appointments WHERE id = ?",
        [resolvedAppointmentId],
      );
      if (appts.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }
      resolvedPatientId = appts[0].patient_id;
    }

    if (!resolvedPatientId) {
      return res.status(400).json({
        success: false,
        message: "Selecciona un paciente o una cita",
      });
    }

    const method = normalizePaymentMethod(payment_method);
    if (!method) {
      return res.status(400).json({
        success: false,
        message: "Método de pago inválido",
      });
    }
    const [result] = await pool.query<any>(
      `INSERT INTO payments
         (appointment_id, patient_id, amount, payment_method, payment_status, notes, processed_by, processed_at)
       VALUES (?, ?, ?, ?, 'completed', ?, ?, NOW())`,
      [
        resolvedAppointmentId,
        resolvedPatientId,
        parseFloat(amount),
        method,
        notes || null,
        processedBy,
      ],
    );

    const [created] = await pool.query<any[]>(
      "SELECT * FROM payments WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Pago registrado",
      data: created[0],
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/payments/:id/status
 * Update payment status
 */
const updatePaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const [existing] = await pool.query<any[]>(
      "SELECT id FROM payments WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    await pool.query(
      `UPDATE payments
       SET payment_status = ?,
           notes = CASE
             WHEN ? IS NULL OR ? = '' THEN notes
             ELSE CONCAT(COALESCE(notes, ''), CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\n' END, ?)
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [status, notes, notes, notes, id],
    );

    res.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/payments/:id/refund
 * Request a refund for a payment
 */
const processRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const adminId = getAdminFromRequest(req)?.id || null;

    if (!amount || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid refund amount is required" });
    }
    if (!reason?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Refund reason is required" });
    }

    const [existing] = await pool.query<any[]>(
      "SELECT * FROM payments WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const payment = existing[0];
    if (parseFloat(amount) > parseFloat(payment.amount)) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed payment amount",
      });
    }

    if (
      payment.payment_method === "stripe" &&
      !resolveStripeRefundRef(payment)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Este pago de Stripe no tiene PaymentIntent ni cargo. No se puede solicitar reembolso sin reembolsar en Stripe.",
      });
    }

    await pool.query(
      `UPDATE payments
       SET refund_amount = ?, refund_reason = ?, refunded_by = ?,
           refund_status = 'pending', updated_at = NOW()
       WHERE id = ?`,
      [parseFloat(amount), reason, adminId, id],
    );

    res.json({
      success: true,
      message: "Refund request submitted for approval",
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/payments/:id/approve-refund
 * Approve a pending refund
 */
const approveRefund: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getAdminFromRequest(req)?.id || null;

    const [existing] = await pool.query<any[]>(
      "SELECT * FROM payments WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const payment = existing[0];
    if (payment.refund_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending refund for this payment",
      });
    }

    const refundAmount = Number(payment.refund_amount || payment.amount);
    if (payment.payment_method === "stripe") {
      const stripeRef = resolveStripeRefundRef(payment);
      if (!stripeRef) {
        return res.status(400).json({
          success: false,
          message:
            "Este pago de Stripe no tiene PaymentIntent ni cargo. No se puede marcar reembolsado sin reembolsar en Stripe.",
        });
      }
      try {
        await issueStripeRefund({
          ...stripeRef,
          amountCents: Math.round(refundAmount * 100),
          reason: payment.refund_reason || "Approved by admin",
        });
      } catch (stripeErr: any) {
        const code = stripeErr?.code || "";
        if (code !== "charge_already_refunded") {
          console.error("[approve-refund] Stripe refund failed:", stripeErr.message);
          return res.status(502).json({
            success: false,
            message: `No se pudo procesar el reembolso en Stripe: ${stripeErr.message}`,
          });
        }
      }
    }

    await markPaymentRefundedInDb({
      paymentId: Number(id),
      refundAmount,
      reason: payment.refund_reason,
      approvedBy: adminId,
    });

    res.json({ success: true, message: "Refund approved successfully" });
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/payments/stats
 * Get payment statistics
 */
const getPaymentStats: RequestHandler = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = "";
    const params: any[] = [];

    if (start_date && end_date) {
      whereClause = "WHERE DATE(p.created_at) BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    const [stats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' OR p.payment_status = 'partially_refunded' THEN COALESCE(p.refund_amount, 0) ELSE 0 END), 0) as refunded_amount,
        COUNT(CASE WHEN p.refund_status = 'pending' THEN 1 END) as pending_refunds
       FROM payments p ${whereClause}`,
      params,
    );

    // Payment methods breakdown
    const [methodBreakdown] = await pool.query<any[]>(
      `SELECT 
        p.payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       ${whereClause}
       GROUP BY p.payment_method`,
      params,
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        payment_methods: methodBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices
 * Get all invoice requests with filters
 */
const getAllInvoiceRequests: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      startDate,
      endDate,
    } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        ir.invoice_number LIKE ? OR 
        ir.rfc LIKE ? OR 
        ir.business_name LIKE ? OR
        p.first_name LIKE ? OR 
        p.last_name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      );
    }

    if (status) {
      whereClause += " AND ir.status = ?";
      queryParams.push(status);
    }

    if (startDate) {
      whereClause += " AND DATE(ir.created_at) >= ?";
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += " AND DATE(ir.created_at) <= ?";
      queryParams.push(endDate);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total 
       FROM invoice_requests ir 
       WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get invoice requests with related data
    const [invoices] = await pool.query<any[]>(
      `SELECT 
        ir.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        pay.amount as payment_amount,
        pay.payment_method,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN appointments a ON ir.appointment_id = a.id
       INNER JOIN services s ON a.service_id = s.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       LEFT JOIN users u ON ir.processed_by = u.id
       WHERE ${whereClause}
       ORDER BY ir.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: {
        items: invoices.map((invoice) => ({
          ...invoice,
          payment_amount: parseFloat(invoice.payment_amount),
          fiscal_address: JSON.parse(invoice.fiscal_address),
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoice requests:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices/:id
 * Get a specific invoice request by ID
 */
const getInvoiceRequestById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoices] = await pool.query<any[]>(
      `SELECT 
        ir.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        a.scheduled_at as appointment_date,
        s.name as service_name,
        s.description as service_description,
        pay.amount as payment_amount,
        pay.payment_method,
        pay.stripe_payment_id,
        pay.transaction_id,
        pay.processed_at as payment_date,
        u.first_name as processed_by_first_name,
        u.last_name as processed_by_last_name
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN appointments a ON ir.appointment_id = a.id
       INNER JOIN services s ON a.service_id = s.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       LEFT JOIN users u ON ir.processed_by = u.id
       WHERE ir.id = ?`,
      [id],
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice request not found",
      });
    }

    const invoice = {
      ...invoices[0],
      payment_amount: parseFloat(invoices[0].payment_amount),
      fiscal_address: JSON.parse(invoices[0].fiscal_address),
    };

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/invoices/:id
 * Update invoice request status, PDFs, or notes
 */
const updateInvoiceRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pdf_url, xml_url, notes, processed_by } = req.body;
    const processedBy = processed_by || getAdminFromRequest(req)?.id || null;

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (pdf_url !== undefined) {
      updates.push("pdf_url = ?");
      values.push(pdf_url);
    }

    if (xml_url !== undefined) {
      updates.push("xml_url = ?");
      values.push(xml_url);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }

    if (processedBy) {
      updates.push("processed_by = ?");
      values.push(processedBy);
    }

    // If marking as completed or processing, set processed_at
    if (status === "completed" || status === "processing") {
      updates.push("processed_at = NOW()");
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updates provided",
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE invoice_requests 
       SET ${updates.join(", ")}
       WHERE id = ?`,
      values,
    );

    // Fetch updated invoice
    const [invoices] = await pool.query<any[]>(
      `SELECT ir.*, 
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       WHERE ir.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Invoice request updated successfully",
      data: {
        ...invoices[0],
        fiscal_address: JSON.parse(invoices[0].fiscal_address),
      },
    });
  } catch (error) {
    console.error("Error updating invoice request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/invoices/stats
 * Get invoice statistics
 */
const getInvoiceStats: RequestHandler = async (req, res) => {
  try {
    const [stats] = await pool.query<any[]>(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
       FROM invoice_requests`,
    );

    // Get recent requests
    const [recentRequests] = await pool.query<any[]>(
      `SELECT 
        ir.id,
        ir.invoice_number,
        ir.status,
        ir.created_at,
        p.first_name,
        p.last_name,
        pay.amount
       FROM invoice_requests ir
       INNER JOIN patients p ON ir.patient_id = p.id
       INNER JOIN payments pay ON ir.payment_id = pay.id
       ORDER BY ir.created_at DESC
       LIMIT 5`,
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        recent_requests: recentRequests.map((req) => ({
          ...req,
          amount: parseFloat(req.amount),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/coupons
 * Get all coupons
 */
const getAllCoupons: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", is_active } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (c.code LIKE ? OR c.description LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (is_active !== undefined) {
      whereClause += " AND c.is_active = ?";
      queryParams.push(is_active);
    }

    // Get total count
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM coupons c WHERE ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get coupons with creator info
    const [coupons] = await pool.query<any[]>(
      `SELECT 
        c.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name
       FROM coupons c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit as string), offset],
    );

    res.json({
      success: true,
      data: {
        items: coupons.map((coupon) => ({
          ...coupon,
          discount_value: parseFloat(coupon.discount_value),
          min_purchase_amount: coupon.min_purchase_amount
            ? parseFloat(coupon.min_purchase_amount)
            : null,
          max_discount_amount: coupon.max_discount_amount
            ? parseFloat(coupon.max_discount_amount)
            : null,
          applicable_services: coupon.applicable_services
            ? JSON.parse(coupon.applicable_services)
            : null,
          is_active: Boolean(coupon.is_active),
          creator_name:
            coupon.creator_first_name && coupon.creator_last_name
              ? `${coupon.creator_first_name} ${coupon.creator_last_name}`
              : null,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/coupons
 * Create coupon
 */
const createCoupon: RequestHandler = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      is_active = true,
      applicable_services,
    } = req.body;
    const createdBy = getAdminFromRequest(req)?.id;

    // Validation
    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: code, discount_type, discount_value",
      });
    }
    if (!createdBy) return missingAdminActorResponse(res);

    if (!["percentage", "fixed_amount"].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be 'percentage' or 'fixed_amount'",
      });
    }

    if (
      discount_type === "percentage" &&
      (discount_value < 0 || discount_value > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    if (discount_value < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be positive",
      });
    }

    // Check if code already exists
    const [existingCoupon] = await pool.query<any[]>(
      "SELECT id FROM coupons WHERE code = ?",
      [code.toUpperCase()],
    );

    if (existingCoupon.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Create coupon
    const [result] = await pool.query<any>(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value,
        min_purchase_amount, max_discount_amount, usage_limit,
        per_user_limit, valid_from, valid_until, is_active,
        applicable_services, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        code.toUpperCase(),
        description || null,
        discount_type,
        discount_value,
        min_purchase_amount || null,
        max_discount_amount || null,
        usage_limit || null,
        per_user_limit || null,
        valid_from || new Date(),
        valid_until || null,
        is_active ? 1 : 0,
        applicable_services ? JSON.stringify(applicable_services) : null,
        createdBy,
      ],
    );

    // Get created coupon
    const [newCoupon] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: {
        ...newCoupon[0],
        discount_value: parseFloat(newCoupon[0].discount_value),
        min_purchase_amount: newCoupon[0].min_purchase_amount
          ? parseFloat(newCoupon[0].min_purchase_amount)
          : null,
        max_discount_amount: newCoupon[0].max_discount_amount
          ? parseFloat(newCoupon[0].max_discount_amount)
          : null,
        applicable_services: newCoupon[0].applicable_services
          ? JSON.parse(newCoupon[0].applicable_services)
          : null,
        is_active: Boolean(newCoupon[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/coupons/:id
 * Update coupon
 */
const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      is_active,
      applicable_services,
    } = req.body;

    // Check if coupon exists
    const [existing] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Validate discount_type if provided
    if (
      discount_type &&
      !["percentage", "fixed_amount"].includes(discount_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be 'percentage' or 'fixed_amount'",
      });
    }

    // Validate percentage discount
    if (
      discount_type === "percentage" &&
      discount_value !== undefined &&
      (discount_value < 0 || discount_value > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    // Validate discount value
    if (discount_value !== undefined && discount_value < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be positive",
      });
    }

    // Check if new code conflicts with existing coupons
    if (code && code.toUpperCase() !== existing[0].code) {
      const [codeConflict] = await pool.query<any[]>(
        "SELECT id FROM coupons WHERE code = ? AND id != ?",
        [code.toUpperCase(), id],
      );

      if (codeConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (code !== undefined) {
      updates.push("code = ?");
      values.push(code.toUpperCase());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (discount_type !== undefined) {
      updates.push("discount_type = ?");
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push("discount_value = ?");
      values.push(discount_value);
    }
    if (min_purchase_amount !== undefined) {
      updates.push("min_purchase_amount = ?");
      values.push(min_purchase_amount);
    }
    if (max_discount_amount !== undefined) {
      updates.push("max_discount_amount = ?");
      values.push(max_discount_amount);
    }
    if (usage_limit !== undefined) {
      updates.push("usage_limit = ?");
      values.push(usage_limit);
    }
    if (per_user_limit !== undefined) {
      updates.push("per_user_limit = ?");
      values.push(per_user_limit);
    }
    if (valid_from !== undefined) {
      updates.push("valid_from = ?");
      values.push(valid_from);
    }
    if (valid_until !== undefined) {
      updates.push("valid_until = ?");
      values.push(valid_until);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (applicable_services !== undefined) {
      updates.push("applicable_services = ?");
      values.push(
        applicable_services ? JSON.stringify(applicable_services) : null,
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated coupon
    const [updatedCoupon] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: {
        ...updatedCoupon[0],
        discount_value: parseFloat(updatedCoupon[0].discount_value),
        min_purchase_amount: updatedCoupon[0].min_purchase_amount
          ? parseFloat(updatedCoupon[0].min_purchase_amount)
          : null,
        max_discount_amount: updatedCoupon[0].max_discount_amount
          ? parseFloat(updatedCoupon[0].max_discount_amount)
          : null,
        applicable_services: updatedCoupon[0].applicable_services
          ? JSON.parse(updatedCoupon[0].applicable_services)
          : null,
        is_active: Boolean(updatedCoupon[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/coupons/:id
 * Delete coupon
 */
const deleteCoupon: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const [existing] = await pool.query<any[]>(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Check if coupon has been used
    const [usageCheck] = await pool.query<any[]>(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?",
      [id],
    );

    if (usageCheck[0].count > 0) {
      // If coupon has been used, soft delete by deactivating it
      await pool.query(
        "UPDATE coupons SET is_active = 0, updated_at = NOW() WHERE id = ?",
        [id],
      );

      return res.json({
        success: true,
        message: "Coupon has been used and was deactivated instead of deleted",
      });
    }

    // Hard delete if never used
    await pool.query("DELETE FROM coupons WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/business-hours
 * Get admin business hours (same as regular but for admin panel)
 */
const getAdminBusinessHours: RequestHandler = async (req, res) => {
  try {
    const [hours] = await pool.query<any[]>(
      "SELECT * FROM business_hours ORDER BY day_of_week",
    );

    res.json({
      success: true,
      data: hours,
    });
  } catch (error) {
    console.error("Error fetching admin business hours:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/business-hours
 * Update business hours
 */
const updateBusinessHours: RequestHandler = async (req, res) => {
  try {
    const { hours } = req.body;

    if (!Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        message: "Hours array is required",
      });
    }

    // Update each day's hours
    for (const hour of hours) {
      await pool.query(
        `UPDATE business_hours 
         SET is_open = ?, open_time = ?, close_time = ?,
             break_start = ?, break_end = ?, notes = ?
         WHERE day_of_week = ?`,
        [
          hour.is_open ? 1 : 0,
          hour.open_time || null,
          hour.close_time || null,
          hour.break_start || null,
          hour.break_end || null,
          hour.notes || null,
          hour.day_of_week,
        ],
      );
    }

    res.json({
      success: true,
      message: "Business hours updated successfully",
    });
  } catch (error) {
    console.error("Error updating business hours:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings
 * Get all settings
 */
const getSettings: RequestHandler = async (req, res) => {
  try {
    const [settings] = await pool.query<any[]>(
      `SELECT * FROM settings ORDER BY category, setting_key`,
    );

    // Group by category
    const grouped = settings.reduce((acc: any, setting) => {
      const category = setting.category || "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/:key
 * Update a setting
 */
const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    await pool.query(
      `UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?`,
      [setting_value, key],
    );

    res.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/content-pages
 * Get all content pages
 */
/**
 * GET /api/content/:slug
 * Published legal/content pages (terms, privacy) — no auth.
 */
const getPublishedContentPage: RequestHandler = async (req, res) => {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const [pages] = await pool.query<any[]>(
      `SELECT slug, title, content, meta_description, updated_at
       FROM content_pages
       WHERE slug = ? AND is_published = 1
       LIMIT 1`,
      [slug],
    );

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    return res.json({ success: true, data: pages[0] });
  } catch (error) {
    console.error("Error fetching published content page:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getContentPages: RequestHandler = async (req, res) => {
  try {
    const [pages] = await pool.query<any[]>(
      `SELECT p.*, 
              c.first_name as created_by_first_name,
              c.last_name as created_by_last_name,
              u.first_name as updated_by_first_name,
              u.last_name as updated_by_last_name
       FROM content_pages p
       LEFT JOIN users c ON p.created_by = c.id
       LEFT JOIN users u ON p.updated_by = u.id
       ORDER BY p.created_at DESC`,
    );

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Error fetching content pages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/content-pages
 * Create content page
 */
const createContentPage: RequestHandler = async (req, res) => {
  try {
    const { slug, title, content, is_published } = req.body;
    const userId = getAdminFromRequest(req)?.id;
    if (!userId) return missingAdminActorResponse(res);

    const [result] = await pool.query<any>(
      `INSERT INTO content_pages (slug, title, content, is_published, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [slug, title, content, is_published ? 1 : 0, userId],
    );

    res.json({
      success: true,
      message: "Content page created successfully",
      page_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/settings/content-pages/:id
 * Update content page
 */
const updateContentPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_published } = req.body;
    const userId = getAdminFromRequest(req)?.id || null;

    await pool.query(
      `UPDATE content_pages SET
        title = ?,
        content = ?,
        is_published = ?,
        updated_by = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [title, content, is_published ? 1 : 0, userId, id],
    );

    res.json({
      success: true,
      message: "Content page updated successfully",
    });
  } catch (error) {
    console.error("Error updating content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/content-pages/:id
 * Delete content page
 */
const deleteContentPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>(
      "DELETE FROM content_pages WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Content page not found" });
    }

    res.json({
      success: true,
      message: "Content page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content page:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users
 * Get all admin users
 */
const getAdminUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, employee_id,
              specialization, is_active, is_email_verified, created_at, last_login
       FROM users
       WHERE role IN (${STAFF_LOGIN_ROLES_SQL})
       ORDER BY created_at DESC`,
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users/:id
 * Get admin user by ID
 */
const getAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query<any[]>(
      `SELECT id, email, role, first_name, last_name, phone, employee_id,
              specialization, is_active, is_email_verified, created_at, last_login
       FROM users
       WHERE id = ?`,
      [id],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/settings/users
 * Create admin user
 */
const createAdminUser: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      role,
      first_name,
      last_name,
      phone,
      employee_id,
      specialization,
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      });
    }

    // Check if email already exists
    const [existingUsers] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // For admin users, we set an empty password_hash as they use code-based authentication
    const [result] = await pool.query<any>(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, employee_id, specialization, is_active, created_at, updated_at)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [email, role, first_name, last_name, phone, employee_id, specialization],
    );

    res.json({
      success: true,
      message:
        "Admin user created successfully. They will receive login instructions via email.",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/admin/settings/users/:id
 * Update admin user
 */
const updateAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      employee_id,
      specialization,
      role,
      is_active,
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (email !== undefined) {
      // Check if email is already used by another user
      const [existingUsers] = await pool.query<any[]>(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
      updates.push("email = ?");
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (employee_id !== undefined) {
      updates.push("employee_id = ?");
      values.push(employee_id);
    }
    if (specialization !== undefined) {
      updates.push("specialization = ?");
      values.push(specialization);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const [result] = await pool.query<any>(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/admin/settings/users/:id/toggle-active
 * Toggle admin user active status
 */
const toggleAdminUserActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`,
      [id],
    );
    const [rows] = await pool.query<any[]>(
      `SELECT id, is_active FROM users WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "User status toggled successfully",
      data: {
        id: Number(id),
        is_active: Boolean(rows[0]?.is_active),
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/settings/users/:id
 * Delete admin user
 */
const deleteAdminUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and get their data
    const [users] = await pool.query<any[]>(
      "SELECT id, email, role FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if user has related records
    const [appointmentCount] = await pool.query<any[]>(
      "SELECT COUNT(*) as count FROM appointments WHERE created_by = ?",
      [id],
    );

    const [medicalRecordsCount] = await pool.query<any[]>(
      "SELECT COUNT(*) as count FROM medical_records WHERE doctor_id = ?",
      [id],
    );

    const hasAppointments = appointmentCount[0]?.count > 0;
    const hasMedicalRecords = medicalRecordsCount[0]?.count > 0;

    if (hasAppointments || hasMedicalRecords) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el usuario porque tiene ${
          hasAppointments
            ? `${appointmentCount[0].count} citas registradas`
            : ""
        }${hasAppointments && hasMedicalRecords ? " y " : ""}${
          hasMedicalRecords
            ? `${medicalRecordsCount[0].count} expedientes médicos`
            : ""
        }. Por favor, desactive el usuario en su lugar.`,
      });
    }

    // Proceed with deletion if no related records
    const [result] = await pool.query<any>("DELETE FROM users WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting admin user:", error);

    // Check for foreign key constraint error
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar el usuario porque tiene registros asociados. Por favor, desactive el usuario en su lugar.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
};

/**
 * POST /api/admin/settings/users/:id/reset-access
 * Reset admin user access (send new login code)
 */
const resetAdminUserAccess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would generate and send a new access code
    res.json({
      success: true,
      message: "Access reset instructions have been sent to the user's email",
    });
  } catch (error) {
    console.error("Error resetting user access:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/settings/users/:id/activity
 * Get admin user activity
 */
const getAdminUserActivity: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get recent appointments created by this user
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, s.name as service_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.created_by = ?
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [id],
    );

    // Get recent medical records added by this user
    const [medicalRecords] = await pool.query<any[]>(
      `SELECT mr.*, p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.doctor_id = ?
       ORDER BY mr.created_at DESC
       LIMIT 10`,
      [id],
    );

    res.json({
      success: true,
      data: {
        appointments,
        medicalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/blocked-dates
 * Get admin blocked dates
 */
const getAdminBlockedDates: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 100, start_date, end_date } = req.query;

    let query = `
      SELECT bd.*, 
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM blocked_dates bd
      LEFT JOIN users u ON bd.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ` AND bd.end_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND bd.start_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY bd.start_date ASC`;
    query += ` LIMIT ? OFFSET ?`;
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const [dates] = await pool.query<any[]>(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM blocked_dates bd WHERE 1=1`;
    const countParams: any[] = [];
    if (start_date) {
      countQuery += ` AND bd.end_date >= ?`;
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND bd.start_date <= ?`;
      countParams.push(end_date);
    }

    const [countRows] = await pool.query<any[]>(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    res.json({
      success: true,
      data: {
        items: dates,
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching admin blocked dates:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/admin/blocked-dates
 * Create blocked date
 */
const createBlockedDate: RequestHandler = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
      created_by,
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const userId = getAdminFromRequest(req)?.id || created_by || null;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo identificar al administrador",
      });
    }

    const [result] = await pool.query<any>(
      `INSERT INTO blocked_dates (start_date, end_date, start_time, end_time, all_day, reason, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        all_day ? 1 : 0,
        reason,
        notes,
        userId,
      ],
    );

    // Fetch the created record to return it
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM blocked_dates WHERE id = ?`,
      [result.insertId],
    );

    res.json({
      success: true,
      message: "Blocked date created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Error creating blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/blocked-dates/:id
 * Update blocked date
 */
const updateBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      start_time,
      end_time,
      all_day,
      reason,
      notes,
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const [result] = await pool.query<any>(
      `UPDATE blocked_dates 
       SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, all_day = ?, reason = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        all_day ? 1 : 0,
        reason,
        notes,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blocked date not found" });
    }

    res.json({
      success: true,
      message: "Blocked date updated successfully",
    });
  } catch (error) {
    console.error("Error updating blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE /api/admin/blocked-dates/:id
 * Delete blocked date
 */
const deleteBlockedDate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<any>(
      "DELETE FROM blocked_dates WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blocked date not found" });
    }

    res.json({
      success: true,
      message: "Blocked date deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getPatientPackages: RequestHandler = async (req, res) => {
  try {
    const patientId = Number(req.query.patient_id || req.body?.patient_id);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }
    const ok = await verifyPatientSession(patientId);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }
    const [rows] = await pool.query<any[]>(
      `SELECT c.id, c.service_id, c.selected_zone, c.selected_zones, c.sessions_included,
              c.sessions_completed, c.status, c.legal_template, c.guarantee_status,
              c.extra_sessions_granted, s.name as service_name,
              (SELECT COUNT(*) FROM appointments a
                WHERE a.contract_id = c.id AND a.status NOT IN ('cancelled')) AS reserved,
              (SELECT MAX(a.scheduled_at) FROM appointments a
                WHERE a.contract_id = c.id AND a.status NOT IN ('cancelled')) AS last_scheduled
       FROM contracts c
       JOIN services s ON s.id = c.service_id
       WHERE c.patient_id = ?
         AND c.status IN ('draft', 'pending_signature', 'signed')
       ORDER BY c.id DESC`,
      [patientId],
    );
    res.json({
      success: true,
      data: rows.map((row) => {
        const reserved = Number(row.reserved || 0);
        const extras = Number(row.extra_sessions_granted || 0);
        let remaining = Number(row.sessions_included) + extras - reserved;
        if (row.guarantee_status === "active") {
          remaining = Math.max(remaining, 1);
        }
        const lastScheduled = row.last_scheduled
          ? new Date(row.last_scheduled)
          : null;
        return {
          contract_id: Number(row.id),
          service_id: Number(row.service_id),
          service_name: row.service_name,
          legal_template: row.legal_template,
          zone: row.selected_zone,
          zones: parseSelectedZones(row.selected_zones),
          sessions_included: Number(row.sessions_included),
          sessions_completed: Number(row.sessions_completed || 0),
          extra_sessions_granted: extras,
          remaining,
          guarantee_status: row.guarantee_status || "not_applicable",
          suggested_next_date:
            row.legal_template === "velocity" &&
            lastScheduled &&
            !Number.isNaN(lastScheduled.getTime())
              ? suggestedVelocityNextDate(lastScheduled, reserved)
              : null,
          status: row.status,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching patient packages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const completeAdminConsent: RequestHandler = async (req, res) => {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const { clinical_conclusion, clinical_notes, signature } = req.body;
    if (!clinical_conclusion || !signature) {
      return res.status(400).json({
        success: false,
        message: "Conclusión clínica y firma del responsable son requeridas",
      });
    }
    const allowed = ["apto", "no_apto", "pendiente", "no_contratado"];
    if (!allowed.includes(clinical_conclusion)) {
      return res.status(400).json({
        success: false,
        message: "Conclusión clínica inválida",
      });
    }
    const [rows] = await pool.query<any[]>(
      "SELECT id, status FROM consents WHERE id = ?",
      [id],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Consentimiento no encontrado" });
    }
    const nextStatus =
      clinical_conclusion === "apto" ? "signed" : "pending_staff";
    await pool.query(
      `UPDATE consents
       SET clinical_conclusion = ?,
           clinical_notes = ?,
           staff_user_id = ?,
           staff_signature = ?,
           staff_signed_at = NOW(),
           status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        clinical_conclusion,
        clinical_notes || null,
        admin.id,
        signature,
        nextStatus,
        id,
      ],
    );
    res.json({ success: true, message: "Consentimiento clínico actualizado" });
  } catch (error) {
    console.error("Error completing consent:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const saveContractMeasurements: RequestHandler = async (req, res) => {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const contractId = Number(req.params.id);
    const { zone_id, zone_label, baseline_count, final_count, notes } =
      req.body || {};
    if (!zone_id) {
      return res.status(400).json({
        success: false,
        message: "zone_id es requerido",
      });
    }
    const [contracts] = await pool.query<any[]>(
      `SELECT id, legal_template, selected_zone, selected_zones, guarantee_status
       FROM contracts WHERE id = ?`,
      [contractId],
    );
    if (!contracts.length) {
      return res.status(404).json({ success: false, message: "Contrato no encontrado" });
    }
    const contract = contracts[0];
    if (contract.legal_template !== "velocity") {
      return res.status(400).json({
        success: false,
        message: "Las mediciones de vello solo aplican a contratos Velocity",
      });
    }
    const zones = parseSelectedZones(contract.selected_zones);
    const match =
      zones.find((zone) => zone.id === String(zone_id)) ||
      (contract.selected_zone && String(zone_id) === contract.selected_zone
        ? { id: String(zone_id), label: contract.selected_zone }
        : null);
    const label = String(zone_label || match?.label || zone_id);
    const [existingRows] = await pool.query<any[]>(
      `SELECT baseline_count, final_count FROM contract_zone_measurements
       WHERE contract_id = ? AND zone_id = ? LIMIT 1`,
      [contractId, String(zone_id)],
    );
    const existing = existingRows[0] || {};
    const baseline =
      baseline_count === undefined || baseline_count === null || baseline_count === ""
        ? existing.baseline_count != null
          ? Number(existing.baseline_count)
          : null
        : Number(baseline_count);
    const final =
      final_count === undefined || final_count === null || final_count === ""
        ? existing.final_count != null
          ? Number(existing.final_count)
          : null
        : Number(final_count);
    if (baseline != null && (!Number.isFinite(baseline) || baseline <= 0)) {
      return res.status(400).json({
        success: false,
        message: "El conteo inicial debe ser un número mayor a 0",
      });
    }
    if (final != null && (!Number.isFinite(final) || final < 0)) {
      return res.status(400).json({
        success: false,
        message: "El conteo final debe ser un número mayor o igual a 0",
      });
    }
    let reduction: number | null = null;
    let met90: number | null = null;
    if (baseline != null && baseline > 0 && final != null) {
      reduction = Number((((baseline - final) / baseline) * 100).toFixed(2));
      met90 = reduction >= 90 ? 1 : 0;
    }
    await pool.query(
      `INSERT INTO contract_zone_measurements
         (contract_id, zone_id, zone_label, baseline_count, baseline_at, final_count,
          final_at, reduction_pct, met_90, notes, recorded_by)
       VALUES (?, ?, ?, ?, IF(? IS NULL, NULL, NOW()), ?, IF(? IS NULL, NULL, NOW()), ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         zone_label = VALUES(zone_label),
         baseline_count = COALESCE(VALUES(baseline_count), baseline_count),
         baseline_at = IF(VALUES(baseline_count) IS NULL, baseline_at, NOW()),
         final_count = COALESCE(VALUES(final_count), final_count),
         final_at = IF(VALUES(final_count) IS NULL, final_at, NOW()),
         reduction_pct = VALUES(reduction_pct),
         met_90 = VALUES(met_90),
         notes = COALESCE(VALUES(notes), notes),
         recorded_by = VALUES(recorded_by)`,
      [
        contractId,
        String(zone_id),
        label,
        baseline,
        baseline,
        final,
        final,
        reduction,
        met90,
        notes || null,
        admin.id,
      ],
    );
    if (
      baseline != null &&
      (contract.guarantee_status === "pending_baseline" ||
        contract.guarantee_status === "not_applicable")
    ) {
      await pool.query(
        `UPDATE contracts SET guarantee_status = 'in_progress' WHERE id = ?`,
        [contractId],
      );
    }
    res.json({ success: true, message: "Medición guardada" });
  } catch (error) {
    console.error("Error saving measurements:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const evaluateContractGuarantee: RequestHandler = async (req, res) => {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const contractId = Number(req.params.id);
    const [contracts] = await pool.query<any[]>(
      `SELECT id, legal_template, sessions_included, sessions_completed, extra_sessions_granted
       FROM contracts WHERE id = ?`,
      [contractId],
    );
    if (!contracts.length) {
      return res.status(404).json({ success: false, message: "Contrato no encontrado" });
    }
    const contract = contracts[0];
    if (contract.legal_template !== "velocity") {
      return res.status(400).json({
        success: false,
        message: "La póliza de garantía solo aplica a Velocity",
      });
    }
    const [rows] = await pool.query<any[]>(
      `SELECT zone_id, zone_label, baseline_count, final_count, reduction_pct, met_90
       FROM contract_zone_measurements WHERE contract_id = ?`,
      [contractId],
    );
    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Registra conteo inicial y final por zona antes de evaluar",
      });
    }
    const incomplete = rows.filter(
      (row) =>
        row.baseline_count == null ||
        row.final_count == null ||
        Number(row.baseline_count) <= 0,
    );
    if (incomplete.length) {
      return res.status(400).json({
        success: false,
        message:
          "Cada zona necesita conteo inicial mayor a 0 y conteo final para calcular la reducción",
      });
    }
    const unmet = rows.filter((row) => Number(row.met_90) !== 1);
    const nextStatus = unmet.length ? "active" : "met";
    await pool.query(
      `UPDATE contracts
       SET guarantee_status = ?,
           guarantee_evaluated_at = NOW(),
           extra_sessions_granted = IF(? = 'active', extra_sessions_granted, extra_sessions_granted)
       WHERE id = ?`,
      [nextStatus, nextStatus, contractId],
    );
    res.json({
      success: true,
      message:
        nextStatus === "active"
          ? "Garantía activa: sesiones adicionales sin costo hasta alcanzar el 90 %"
          : "Garantía cumplida: todas las zonas alcanzaron al menos 90 %",
      data: {
        guarantee_status: nextStatus,
        zones: rows,
        unmet_zones: unmet.map((row) => row.zone_label),
      },
    });
  } catch (error) {
    console.error("Error evaluating guarantee:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const suspendContractGuarantee: RequestHandler = async (req, res) => {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const contractId = Number(req.params.id);
    const { status } = req.body || {};
    const allowed = ["suspended", "active", "in_progress"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado de garantía inválido",
      });
    }
    const [result] = await pool.query<any>(
      `UPDATE contracts SET guarantee_status = ? WHERE id = ? AND legal_template = 'velocity'`,
      [status, contractId],
    );
    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Contrato Velocity no encontrado",
      });
    }
    res.json({ success: true, message: "Estado de garantía actualizado" });
  } catch (error) {
    console.error("Error updating guarantee status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/appointments/quote
 * Authoritative catalog price / duration for the selected Venus package + zones.
 * Optionally previews skip_payment when patient_id has remaining sessions or an active guarantee.
 */
const quoteAppointmentPackage: RequestHandler = async (req, res) => {
  try {
    const { service_id, selected_areas, patient_id } = req.body || {};
    if (!service_id) {
      return res.status(400).json({
        success: false,
        error: "service_id is required",
      });
    }

    const [serviceRows] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ? AND is_active = 1",
      [service_id],
    );
    if (serviceRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    const service = mapServiceRow(serviceRows[0]);
    const velocityCatalog =
      service.legal_template === "velocity"
        ? await loadVelocityAreaCatalog()
        : [];
    const zonePick = resolveSelectedZones(
      service,
      selected_areas,
      velocityCatalog,
    );
    if (zonePick.ok === false) {
      return res.status(400).json({
        success: false,
        error: zonePick.error,
      });
    }

    const durationMinutes = computePackageDuration(
      service.legal_template,
      service.duration_minutes,
      zonePick.zones.length,
    );
    const openPackage = patient_id
      ? await findOpenPackageContract(
          Number(patient_id),
          service,
          zonePick.zones,
        )
      : null;
    const skipPayment = Boolean(openPackage && openPackage.remaining > 0);

    return res.json({
      success: true,
      data: {
        service_id: service.id,
        legal_template: service.legal_template,
        zones: zonePick.zones,
        zone_label: zonePick.zoneLabel,
        amount: skipPayment ? 0 : zonePick.totalPrice,
        catalog_amount: zonePick.totalPrice,
        duration_minutes: durationMinutes,
        package_sessions: service.package_sessions,
        max_zones:
          service.legal_template === "velocity" ? VELOCITY_MAX_ZONES : 1,
        skip_payment: skipPayment,
        remaining_sessions: openPackage?.remaining ?? null,
        suggested_next_date: openPackage?.suggested_next_date ?? null,
        guarantee_status: openPackage?.guarantee_status ?? null,
      },
    });
  } catch (error) {
    console.error("Error quoting appointment package:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/appointments/book-with-payment
 * Create a new appointment with payment processing
 * This combines appointment creation, patient creation (if needed), and Stripe payment
 */
const bookAppointmentWithPayment: RequestHandler = async (req, res) => {
  try {
    console.log("📝 Book appointment with payment request:", {
      body: req.body,
    });

    const {
      patient_id,
      patient_info,
      service_id,
      scheduled_at,
      duration_minutes,
      notes,
      booked_for_self = true,
      booked_by_patient_id,
      selected_areas,
      accepted_terms = true, // Default to true since we don't have UI for this in simple version
      accepted_privacy = true, // Default to true since we don't have UI for this in simple version
      payment_amount,
      currency = "mxn",
    } = req.body;

    // Validate required fields
    if (!service_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        error: "service_id and scheduled_at are required",
      });
    }

    // Validate terms acceptance
    if (!accepted_terms || !accepted_privacy) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions and privacy policy",
      });
    }

    const [serviceRows] = await pool.query<any[]>(
      "SELECT * FROM services WHERE id = ? AND is_active = 1",
      [service_id],
    );

    if (serviceRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    const service = mapServiceRow(serviceRows[0]);
    const velocityCatalog =
      service.legal_template === "velocity"
        ? await loadVelocityAreaCatalog()
        : [];
    const zonePick = resolveSelectedZones(
      service,
      selected_areas,
      velocityCatalog,
    );
    if (zonePick.ok === false) {
      return res.status(400).json({
        success: false,
        error: zonePick.error,
      });
    }

    // Determine the patient_id for the appointment
    let finalPatientId: number;

    if (patient_id) {
      // Use provided patient_id
      finalPatientId = patient_id;
    } else if (patient_info) {
      // Create new patient record or reuse existing one
      const { first_name, last_name, email, phone, date_of_birth } =
        patient_info;

      if (!first_name || !last_name || !email || !phone) {
        return res.status(400).json({
          success: false,
          error:
            "Patient info must include first_name, last_name, email, and phone",
        });
      }

      // Check if patient with this email already exists
      const [existingPatients] = await pool.query<any[]>(
        "SELECT id FROM patients WHERE email = ?",
        [email],
      );

      if (existingPatients.length > 0) {
        // Patient already exists - use their existing ID
        finalPatientId = existingPatients[0].id;
        console.log(
          `♻️  Reusing existing patient with email ${email}, ID: ${finalPatientId}`,
        );
      } else {
        // Patient doesn't exist - create new patient record
        const [patientResult] = await pool.query<any>(
          `INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, role, is_active)
           VALUES (?, ?, ?, ?, ?, 'patient', 1)`,
          [first_name, last_name, email, phone, date_of_birth || null],
        );

        finalPatientId = patientResult.insertId;
        console.log(
          `✨ Created new patient with email ${email}, ID: ${finalPatientId}`,
        );
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Either patient_id or patient_info must be provided",
      });
    }

    console.log("💰 Creating appointment for patient ID:", finalPatientId);

    // Verify patient exists
    const [patientRows] = await pool.query<any[]>(
      "SELECT id, email, first_name, last_name, stripe_customer_id FROM patients WHERE id = ?",
      [finalPatientId],
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    console.log("✅ Patient verified:", patientRows[0].email);

    const appointmentDuration = computePackageDuration(
      service.legal_template,
      duration_minutes || service.duration_minutes,
      zonePick.zones.length,
    );
    const catalogAmount = zonePick.totalPrice;
    if (!Number.isFinite(catalogAmount) || catalogAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "El servicio no tiene un precio válido",
      });
    }
    const amountInCents = Math.round(catalogAmount * 100);
    const areaNote = zonePick.zoneLabel ? `Área: ${zonePick.zoneLabel}` : "";
    const notesWithAreas = [areaNote, notes].filter(Boolean).join("\n") || "";
    const openPackage = await findOpenPackageContract(
      finalPatientId,
      service,
      zonePick.zones,
    );
    if (openPackage && openPackage.remaining > 0) {
      const scheduledDate = new Date(scheduled_at);
      if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Fecha de cita inválida",
        });
      }
      const [created] = await pool.query<any>(
        `INSERT INTO appointments
           (patient_id, service_id, scheduled_at, duration_minutes, notes, status, created_by, booked_for_self, booked_by_patient_id, contract_id)
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
        [
          finalPatientId,
          service_id,
          scheduled_at,
          appointmentDuration,
          notesWithAreas || null,
          null,
          booked_for_self ? 1 : 0,
          booked_by_patient_id || (booked_for_self ? finalPatientId : null),
          openPackage.id,
        ],
      );
      return res.json({
        success: true,
        data: {
          skip_payment: true,
          appointment_id: created.insertId,
          contract_id: openPackage.id,
          amount: 0,
          catalog_amount: catalogAmount,
          duration_minutes: appointmentDuration,
          remaining_sessions: openPackage.remaining - 1,
          suggested_next_date: openPackage.suggested_next_date,
          guarantee_status: openPackage.guarantee_status,
          message:
            openPackage.guarantee_status === "active"
              ? "Sesión adicional de garantía Velocity. No se cobra."
              : "Sesión tomada de tu paquete. No se volvió a cobrar el precio completo.",
        },
      });
    }
    if (
      payment_amount != null &&
      Math.abs(Number(payment_amount) - catalogAmount) > 0.009
    ) {
      console.warn(
        `[book-with-payment] Client amount ${payment_amount} ignored; charging catalog price ${catalogAmount}`,
      );
    }

    // Ensure this patient has a Stripe customer so payment methods can be saved
    const patient = patientRows[0];
    console.log(
      `[book-with-payment] Patient DB row: id=${patient.id} email=${patient.email} stripe_customer_id=${patient.stripe_customer_id ?? "NULL (migration 009 may not be applied)"}`,
    );
    const stripeCustomerId = await getOrCreateStripeCustomer(
      finalPatientId,
      patient.email,
      patient.first_name,
      patient.last_name,
      patient.stripe_customer_id,
    );
    console.log(
      `[book-with-payment] Using Stripe customer ID: ${stripeCustomerId}`,
    );

    console.log(
      `[book-with-payment] Creating PaymentIntent: amount=${amountInCents} currency=${currency.toLowerCase()} customer=${stripeCustomerId}`,
    );
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          customer: stripeCustomerId,
          metadata: {
            patient_id: finalPatientId.toString(),
            service_id: service_id.toString(),
            scheduled_at: scheduled_at,
            duration_minutes: appointmentDuration.toString(),
            notes: notesWithAreas,
            created_by: finalPatientId.toString(),
            booked_for_self: booked_for_self ? "1" : "0",
            booked_by_patient_id: String(
              booked_by_patient_id ||
                (booked_for_self ? finalPatientId : "") ||
                "",
            ),
            selected_zone: zonePick.zoneLabel,
            selected_zones: JSON.stringify(zonePick.zones),
            legal_template: service.legal_template || "",
            package_sessions: String(service.package_sessions || 1),
            catalog_amount: String(catalogAmount),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        },
        {
          idempotencyKey: `book-${finalPatientId}-${service_id}-${String(scheduled_at).slice(0, 32)}`,
        },
      );
    } catch (stripeError: any) {
      console.error("Stripe payment intent creation failed:", stripeError);
      return res.status(500).json({
        success: false,
        error:
          "Failed to create payment intent. Please check Stripe configuration.",
        details: stripeError.message,
      });
    }
    console.log(
      `[book-with-payment] ✅ PaymentIntent created: ${paymentIntent.id} | customer=${paymentIntent.customer} | setup_future_usage=${paymentIntent.setup_future_usage}`,
    );

    // Don't create payment record yet - only create after payment is confirmed
    // This prevents pending payments cluttering the database

    // CustomerSession redisplays cards already on the customer.
    // Do not set setup_future_usage or allow_redirects:"never" — those hide
    // OXXO and other redirect methods Stripe enables for MXN.
    let customerSessionClientSecret: string | undefined;
    try {
      const customerSession = await stripe.customerSessions.create({
        customer: stripeCustomerId,
        components: {
          payment_element: {
            enabled: true,
            features: {
              payment_method_save: "disabled",
              payment_method_remove: "enabled",
              payment_method_redisplay: "enabled",
            },
          },
        },
      });
      customerSessionClientSecret = customerSession.client_secret;
      console.log(
        `[book-with-payment] ✅ CustomerSession created for customer ${stripeCustomerId} | secret present=${!!customerSessionClientSecret}`,
      );
    } catch (csError: any) {
      // Non-fatal — PaymentElement still works, just won't show saved methods
      console.warn(
        `[book-with-payment] ⚠️  CustomerSession creation FAILED for customer ${stripeCustomerId}:`,
        csError.message,
      );
    }

    console.log(
      `[book-with-payment] 📤 Response: paymentIntentId=${paymentIntent.id} | clientSecret present=${!!paymentIntent.client_secret} | customerSessionClientSecret present=${!!customerSessionClientSecret}`,
    );
    res.json({
      success: true,
      message:
        "Payment intent created. Complete payment to confirm appointment.",
      data: {
        clientSecret: paymentIntent.client_secret,
        customerSessionClientSecret,
        amount: catalogAmount,
        payment_intent_id: paymentIntent.id,
      },
    });
  } catch (error: any) {
    console.error("Error booking appointment with payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      message: "Internal server error",
    });
  }
};

/**
 * POST /api/appointments/confirm-payment
 * Confirm a Stripe payment and create the appointment
 */
const confirmPayment: RequestHandler = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: "payment_intent_id is required",
      });
    }

    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);
    const result = await fulfillSucceededPaymentIntent(paymentIntent);
    if (result.ok === false) {
      return res.status(result.status).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      message: result.alreadyFulfilled
        ? "Payment already confirmed"
        : "Payment confirmed and appointment scheduled",
      data: {
        appointment_id: result.appointmentId,
        appointmentId: result.appointmentId,
        status: "confirmed",
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const handleStripeWebhook: RequestHandler = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe:webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }
  const signature = req.headers["stripe-signature"];
  if (!signature || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err: any) {
    console.warn("[stripe:webhook] signature failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.service_id && paymentIntent.metadata?.scheduled_at) {
        const result = await fulfillSucceededPaymentIntent(paymentIntent);
        if (result.ok === false && result.status >= 500) {
          return res.status(500).json({ error: result.error });
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (piId) {
        const refunded = (charge.amount_refunded || 0) / 100;
        await pool.query(
          `UPDATE payments
           SET payment_status = ?,
               refund_amount = ?,
               refunded_at = COALESCE(refunded_at, NOW()),
               refund_status = 'approved',
               updated_at = NOW()
           WHERE stripe_payment_intent_id = ?`,
          [charge.refunded ? "refunded" : "partially_refunded", refunded, piId],
        );
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[stripe:webhook] handler failed:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const getAllServicesAdmin: RequestHandler = async (req, res) => {
  // Reuse the existing services handler but with admin privileges
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM services ORDER BY category, name`,
    );

    const services = rows.map(mapServiceRow);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching admin services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const uploadAdminFile: RequestHandler = async (req, res) => {
  try {
    const { filename, content_type, data_base64, folder } = req.body as {
      filename?: string;
      content_type?: string;
      data_base64?: string;
      folder?: string;
    };

    if (!filename || !content_type || !data_base64) {
      return res.status(400).json({
        success: false,
        message: "filename, content_type y data_base64 son requeridos",
      });
    }

    if (!ALLOWED_UPLOAD_TYPES.has(content_type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de archivo no permitido",
      });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
      return res.status(503).json({
        success: false,
        message: "Almacenamiento no configurado (BLOB_READ_WRITE_TOKEN)",
      });
    }

    const raw = String(data_base64).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(raw, "base64");
    const maxBytes = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);
    if (!buffer.length) {
      return res.status(400).json({
        success: false,
        message: "Archivo vacío o data_base64 inválido",
      });
    }
    if (buffer.length > maxBytes) {
      return res.status(400).json({
        success: false,
        message: "El archivo excede el tamaño máximo",
      });
    }

    const safeFolder = UPLOAD_FOLDERS.has(String(folder))
      ? String(folder)
      : "uploads";
    const pathname = `beauty/${safeFolder}/${Date.now()}-${sanitizeUploadName(filename)}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: content_type,
      addRandomSuffix: false,
    });

    res.json({
      success: true,
      data: { url: blob.url, pathname: blob.pathname },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo subir el archivo",
    });
  }
};

const createService: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration_minutes,
      is_active = true,
      image_url,
    } = req.body;

    // Validation
    if (!name || !category || price === undefined || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, category, price, duration_minutes",
      });
    }

    const validCategories = [
      "laser_hair_removal",
      "facial_treatment",
      "body_treatment",
      "consultation",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const imageUrl =
      typeof image_url === "string" ? image_url.trim() : "";
    if (!isAllowedAssetUrl(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "image_url must be a public http(s) or /assets/ path",
      });
    }

    const [result] = await pool.query<any>(
      `INSERT INTO services (
        name, 
        description, 
        category, 
        price, 
        duration_minutes, 
        is_active,
        image_url,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        description || null,
        category,
        price,
        duration_minutes,
        is_active ? 1 : 0,
        imageUrl || null,
      ],
    );

    const [newService] = await pool.query<any[]>(
      `SELECT * FROM services WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        ...newService[0],
        price: parseFloat(newService[0].price),
        duration_minutes: parseInt(newService[0].duration_minutes, 10),
        is_active: Boolean(newService[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const updateService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration_minutes,
      is_active,
      image_url,
    } = req.body;

    // Check if service exists
    const [existing] = await pool.query<any[]>(
      `SELECT id FROM services WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "laser_hair_removal",
        "facial_treatment",
        "body_treatment",
        "consultation",
        "other",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      values.push(price);
    }
    if (duration_minutes !== undefined) {
      updates.push("duration_minutes = ?");
      values.push(duration_minutes);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (image_url !== undefined) {
      const imageUrl = typeof image_url === "string" ? image_url.trim() : "";
      if (!isAllowedAssetUrl(imageUrl)) {
        return res.status(400).json({
          success: false,
          message: "image_url must be a public http(s) or /assets/ path",
        });
      }
      updates.push("image_url = ?");
      values.push(imageUrl || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE services SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated service
    const [updatedService] = await pool.query<any[]>(
      `SELECT * FROM services WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      data: {
        ...updatedService[0],
        price: parseFloat(updatedService[0].price),
        duration_minutes: parseInt(updatedService[0].duration_minutes, 10),
        is_active: Boolean(updatedService[0].is_active),
      },
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const deleteService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const [existing] = await pool.query<any[]>(
      `SELECT id FROM services WHERE id = ?`,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check if service is being used in appointments
    const [appointments] = await pool.query<any[]>(
      `SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND status NOT IN ('cancelled', 'completed')`,
      [id],
    );

    if (appointments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete service with active appointments. Deactivate it instead.",
      });
    }

    // Soft delete by setting is_active to false
    await pool.query(
      `UPDATE services SET is_active = 0, updated_at = NOW() WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Service deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments/:id
 * Get a specific appointment by ID
 */
const getAppointmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = tryGetAdminFromHeader(req);

    const [appointments] = await pool.query<any[]>(
      `SELECT 
         a.id,
         a.patient_id,
         a.scheduled_at,
         DATE(a.scheduled_at) as appointment_date,
         TIME(a.scheduled_at) as appointment_time,
         a.status, 
         a.duration_minutes,
         a.notes,
         a.created_at,
         s.name as service_name,
         s.duration_minutes as service_duration,
         p.first_name,
         p.last_name,
         p.email,
         p.phone
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (!staff) {
      const allowed = await verifyPatientSession(appointments[0].patient_id);
      if (!allowed) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
    }

    const appointment = {
      ...appointments[0],
      duration_minutes: parseInt(appointments[0].duration_minutes, 10),
      service_duration: parseInt(appointments[0].service_duration, 10),
    };

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/appointments/:id
 * Update an appointment
 */
const updateAppointmentHandler: RequestHandler = async (req, res) => {
  try {
    if (!tryGetAdminFromHeader(req)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const { id } = req.params;
    const { appointment_date, appointment_time, scheduled_at, notes, status } =
      req.body;

    // Check if appointment exists
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    // Handle scheduling update
    if (scheduled_at) {
      updates.push("scheduled_at = ?");
      values.push(scheduled_at);
    } else if (appointment_date && appointment_time) {
      // Convert separate date/time to timestamp for backwards compatibility
      const scheduledTimestamp = `${appointment_date} ${appointment_time}:00`;
      updates.push("scheduled_at = ?");
      values.push(scheduledTimestamp);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({
      success: true,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * DELETE /api/appointments/:id
 * Cancel an appointment
 */
const cancelAppointmentHandler: RequestHandler = async (req, res) => {
  try {
    if (!tryGetAdminFromHeader(req)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const { id } = req.params;

    const [existing] = await pool.query<any[]>(
      "SELECT id, status FROM appointments WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (existing[0].status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    await pool.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/appointments/booked-slots
 * Get booked time slots for a specific date
 * This is used to show unavailable time slots in the appointment booking wizard
 */
const getBookedTimeSlots: RequestHandler = async (req, res) => {
  try {
    const { date, service_id } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "date parameter is required",
      });
    }

    // Build query to fetch appointments for the given date
    let query = `
      SELECT 
        a.id,
        a.scheduled_at,
        a.duration_minutes,
        s.duration_minutes as service_duration
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE DATE(a.scheduled_at) = ?
      AND a.status IN ('scheduled', 'confirmed')
    `;
    const params: any[] = [date];

    // Optionally filter by service_id
    if (service_id) {
      query += ` AND a.service_id = ?`;
      params.push(service_id);
    }

    query += ` ORDER BY a.scheduled_at`;

    const [rows] = await pool.query<any[]>(query, params);

    // Transform the results into time slots
    const bookedSlots = rows.map((row) => {
      const scheduledAt = new Date(row.scheduled_at);
      const hours = scheduledAt.getHours().toString().padStart(2, "0");
      const minutes = scheduledAt.getMinutes().toString().padStart(2, "0");
      const startTime = `${hours}:${minutes}`;

      // Use appointment duration or service duration
      const duration = row.duration_minutes || row.service_duration || 60;

      return {
        start_time: startTime,
        duration_minutes: duration,
        appointment_id: row.id,
      };
    });

    res.json({
      success: true,
      data: {
        date,
        service_id: service_id ? Number(service_id) : null,
        booked_slots: bookedSlots,
      },
    });
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch booked time slots",
    });
  }
};

/**
 * POST /api/auth/create-user
 * Create a new user (from passwordless auth)
 */
const createUser: RequestHandler = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, date_of_birth } = req.body;

    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      });
    }

    // Check if user already exists
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM patients WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new patient
    const [result] = await pool.query<any>(
      `INSERT INTO patients (email, first_name, last_name, phone, date_of_birth, role, created_at) 
       VALUES (?, ?, ?, ?, ?, 'patient', NOW())`,
      [email, first_name, last_name, phone, date_of_birth],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.insertId,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Helper function to verify patient session
 */
async function verifyPatientSession(patientId: number): Promise<boolean> {
  try {
    const [sessions] = await pool.query<any[]>(
      `SELECT id FROM users_sessions 
       WHERE patient_id = ? 
       AND user_session = 1 
       AND user_session_date_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [patientId],
    );
    return sessions.length > 0;
  } catch (error) {
    console.error("Error verifying session:", error);
    return false;
  }
}

/**
 * GET /api/patient/appointments
 * Get all appointments for the logged-in patient
 */
const getPatientAppointments: RequestHandler = async (req, res) => {
  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get all appointments for this patient (both as patient and created_by)
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.id,
        a.patient_id,
        a.service_id,
        a.status,
        a.scheduled_at,
        a.duration_minutes,
        a.notes,
        a.created_by,
        a.booked_for_self,
        a.booked_by_patient_id,
        a.created_at,
        a.updated_at,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.category as service_category,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        py.id as payment_id,
        py.amount as payment_amount,
        py.payment_status,
        py.payment_method,
        c.id as contract_id,
        c.status as contract_status
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN payments py ON py.appointment_id = a.id
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.patient_id = ? OR a.booked_by_patient_id = ? OR a.created_by = ?
      ORDER BY a.scheduled_at DESC`,
      [patient_id, patient_id, patient_id],
    );

    // Format appointments with categorization
    const now = new Date();
    const formattedAppointments = appointments.map((apt) => {
      const scheduledDate = new Date(apt.scheduled_at);
      const isPast = scheduledDate < now;
      const isUpcoming =
        scheduledDate >= now &&
        apt.status !== "cancelled" &&
        apt.status !== "completed";

      return {
        id: apt.id,
        patient_id: apt.patient_id,
        service: {
          id: apt.service_id,
          name: apt.service_name,
          description: apt.service_description,
          price: parseFloat(apt.service_price),
          category: apt.service_category,
        },
        status: apt.status,
        scheduled_at: apt.scheduled_at,
        duration_minutes: apt.duration_minutes,
        notes: apt.notes,
        booked_for_self: Boolean(apt.booked_for_self),
        patient: {
          first_name: apt.first_name,
          last_name: apt.last_name,
          email: apt.email,
          phone: apt.phone,
        },
        payment: apt.payment_id
          ? {
              id: apt.payment_id,
              amount: parseFloat(apt.payment_amount),
              status: apt.payment_status,
              method: apt.payment_method,
            }
          : null,
        contract_id: apt.contract_id || undefined,
        contract_status: apt.contract_status || undefined,
        is_past: isPast,
        is_upcoming: isUpcoming,
        can_cancel: isUpcoming,
        can_edit:
          isUpcoming &&
          (apt.status === "scheduled" || apt.status === "confirmed"),
        created_at: apt.created_at,
        updated_at: apt.updated_at,
      };
    });

    res.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        upcoming: formattedAppointments.filter((a) => a.is_upcoming),
        past: formattedAppointments.filter((a) => a.is_past),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/patient/appointments/:id/cancel
 * Cancel an appointment with refund penalization logic
 */
const cancelPatientAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, cancellation_reason } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT a.*, p.amount, p.payment_status, p.id as payment_id,
              p.stripe_payment_intent_id, p.stripe_payment_id, p.payment_method
       FROM appointments a
       LEFT JOIN payments p ON p.appointment_id = a.id
       WHERE a.id = ? AND (a.patient_id = ? OR a.created_by = ?)`,
      [id, patient_id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to cancel it",
      });
    }

    const appointment = appointments[0];

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Check if appointment is in the past
    const scheduledDate = new Date(appointment.scheduled_at);
    const now = new Date();
    if (scheduledDate < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past appointments",
      });
    }

    // Calculate time difference (in hours)
    const hoursUntilAppointment =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine refund eligibility (>24 hours = full refund, <24 hours = no refund)
    const refundEligible = hoursUntilAppointment > 24;
    const refundAmount =
      refundEligible && appointment.amount ? parseFloat(appointment.amount) : 0;

    // Update appointment status
    await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), '\nCancelled by patient: ', COALESCE(?, 'No reason provided'), '\nCancellation time: ', NOW())
       WHERE id = ?`,
      [cancellation_reason, id],
    );

    // Handle refund if applicable
    let refundProcessed = false;
    if (
      refundEligible &&
      appointment.payment_id &&
      appointment.payment_status === "completed"
    ) {
      try {
        if (appointment.payment_method === "stripe") {
          const stripeRef = resolveStripeRefundRef(appointment);
          if (!stripeRef) {
            console.error(
              "[patient-cancel] Stripe payment has no PaymentIntent or charge; skipping DB refund",
            );
          } else {
            await issueStripeRefund({
              ...stripeRef,
              amountCents: Math.round(refundAmount * 100),
              reason: "Patient cancelled >24h before appointment",
            });
            await markPaymentRefundedInDb({
              paymentId: appointment.payment_id,
              refundAmount,
              reason:
                "Full refund due to cancellation >24hrs before appointment",
            });
            refundProcessed = true;
          }
        } else {
          await markPaymentRefundedInDb({
            paymentId: appointment.payment_id,
            refundAmount,
            reason:
              "Full refund due to cancellation >24hrs before appointment",
          });
          refundProcessed = true;
        }
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
      }
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        appointment_id: id,
        cancelled_at: new Date().toISOString(),
        refund_eligible: refundEligible,
        refund_amount: refundAmount,
        refund_processed: refundProcessed,
        hours_notice: Math.floor(hoursUntilAppointment),
        penalization_applied: !refundEligible,
        penalization_message: !refundEligible
          ? "No refund available - cancellation made less than 24 hours before appointment"
          : null,
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PATCH /api/patient/appointments/:id/reschedule
 * Reschedule an appointment to a new date/time
 */
const reschedulePatientAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, new_date, new_time } = req.body;

    if (!patient_id || !new_date || !new_time) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, new date, and new time are required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment details
    const [appointments] = await pool.query<any[]>(
      `SELECT * FROM appointments 
       WHERE id = ? AND (patient_id = ? OR created_by = ?)`,
      [id, patient_id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to reschedule it",
      });
    }

    const appointment = appointments[0];

    // Check if can be rescheduled
    if (
      appointment.status === "cancelled" ||
      appointment.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${appointment.status} appointments`,
      });
    }

    // Validate new date/time is in the future
    const newScheduledAt = `${new_date} ${new_time}:00`;
    const newDateTime = new Date(newScheduledAt);
    const now = new Date();

    if (newDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "New appointment time must be in the future",
      });
    }

    const blockedReason = await findBlockedSlotReason(new_date, new_time);
    if (blockedReason) {
      return res.status(400).json({
        success: false,
        message: `The selected time is not available. Reason: ${blockedReason}`,
      });
    }

    const oldScheduledAt = appointment.scheduled_at;
    const durationMinutes = Number(appointment.duration_minutes || 60);
    try {
      await withScheduleDayLock(new_date, async (conn) => {
        const overlapId = await findOverlappingAppointment(
          conn,
          newScheduledAt,
          durationMinutes,
          Number(id),
        );
        if (overlapId) {
          throw new SlotConflictError("The selected time slot is not available");
        }
        await conn.query(
          `UPDATE appointments 
           SET scheduled_at = ?, 
               notes = CONCAT(COALESCE(notes, ''), '\nRescheduled from ', ?, ' to ', ?, ' at ', NOW())
           WHERE id = ?`,
          [newScheduledAt, oldScheduledAt, newScheduledAt, id],
        );
      });
    } catch (error) {
      if (error instanceof SlotConflictError) {
        return res.status(409).json({
          success: false,
          message: error.message,
          reason: error.reason,
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: {
        appointment_id: id,
        old_scheduled_at: oldScheduledAt,
        new_scheduled_at: newScheduledAt,
        rescheduled_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/patient/appointments/:id/request-invoice
 * Request invoice generation for an appointment
 */
const requestInvoice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, invoice_info } = req.body;

    if (!patient_id || !invoice_info) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and invoice information are required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get appointment and payment details
    const [appointments] = await pool.query<any[]>(
      `SELECT 
        a.*, 
        s.name as service_name, 
        s.price as service_price,
        p.id as payment_id,
        p.amount,
        p.payment_status,
        p.payment_method,
        p.transaction_id,
        pat.first_name,
        pat.last_name,
        pat.email,
        pat.phone
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN payments p ON p.appointment_id = a.id
       LEFT JOIN patients pat ON a.patient_id = pat.id
       WHERE a.id = ? AND (a.patient_id = ? OR a.created_by = ?)`,
      [id, patient_id, patient_id],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found or you don't have permission to request invoice",
      });
    }

    const appointment = appointments[0];

    const [existingInvoices] = await pool.query<any[]>(
      `SELECT id FROM invoice_requests
       WHERE appointment_id = ? AND status IN ('pending', 'processing', 'completed')`,
      [id],
    );
    if (existingInvoices.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una solicitud de factura para esta cita",
      });
    }

    // Check if payment exists and is completed
    if (!appointment.payment_id || appointment.payment_status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Invoice can only be generated for completed payments",
      });
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${id}`;

    // Insert invoice request into database
    const [result] = await pool.query(
      `INSERT INTO invoice_requests (
        appointment_id,
        patient_id,
        payment_id,
        invoice_number,
        rfc,
        business_name,
        cfdi_use,
        payment_method,
        payment_type,
        fiscal_address,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        patient_id,
        appointment.payment_id,
        invoiceNumber,
        invoice_info.rfc,
        invoice_info.businessName,
        invoice_info.cfdiUse,
        invoice_info.paymentMethod,
        invoice_info.paymentType,
        JSON.stringify(invoice_info.fiscalAddress),
      ],
    );

    res.json({
      success: true,
      message: "Invoice request received successfully",
      data: {
        invoice_request_id: (result as any).insertId,
        invoice_number: invoiceNumber,
        appointment_id: id,
        payment_id: appointment.payment_id,
        amount: parseFloat(appointment.amount),
        service_name: appointment.service_name,
        invoice_info: invoice_info,
        requested_at: new Date().toISOString(),
        status: "pending",
        // In production, this would be the PDF URL
        pdf_url: null,
        note: "Invoice generation is being processed. You will receive it via email shortly.",
      },
    });
  } catch (error) {
    console.error("Error requesting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/patient/profile
 * Update patient profile information
 */
const updatePatientProfile: RequestHandler = async (req, res) => {
  try {
    const {
      patient_id,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      state,
      zip_code,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (date_of_birth !== undefined) {
      updates.push("date_of_birth = ?");
      values.push(date_of_birth);
    }
    if (gender !== undefined) {
      updates.push("gender = ?");
      values.push(gender);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      values.push(address);
    }
    if (city !== undefined) {
      updates.push("city = ?");
      values.push(city);
    }
    if (state !== undefined) {
      updates.push("state = ?");
      values.push(state);
    }
    if (zip_code !== undefined) {
      updates.push("zip_code = ?");
      values.push(zip_code);
    }
    if (emergency_contact_name !== undefined) {
      updates.push("emergency_contact_name = ?");
      values.push(emergency_contact_name);
    }
    if (emergency_contact_phone !== undefined) {
      updates.push("emergency_contact_phone = ?");
      values.push(emergency_contact_phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add updated_at
    updates.push("updated_at = NOW()");
    values.push(patient_id);

    // Execute update
    await pool.query(
      `UPDATE patients SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated patient data
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        is_active, created_at, updated_at
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: patients[0],
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/patient/profile
 * Get patient profile information
 */
const getPatientProfile: RequestHandler = async (req, res) => {
  try {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Verify patient session
    const isAuthenticated = await verifyPatientSession(Number(patient_id));
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - please login again",
      });
    }

    // Get patient data
    const [patients] = await pool.query<any[]>(
      `SELECT 
        id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
        is_active, is_email_verified, last_login, created_at, updated_at
       FROM patients WHERE id = ?`,
      [patient_id],
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patients[0],
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create the Express app once (reused across invocations)
let app: express.Application | null = null;

function createServer() {
  console.log("Creating Express server for Vercel...");

  const expressApp = express();

  // Middleware
  expressApp.use(cors());
  expressApp.use((req, res, next) => {
    if (
      req.originalUrl === "/api/stripe/webhook" ||
      req.path === "/api/stripe/webhook"
    ) {
      return express.raw({ type: "application/json" })(req, res, next);
    }
    next();
  });
  expressApp.use(express.json({ limit: "10mb" })); // Increase limit for PDF base64
  expressApp.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Log requests
  expressApp.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check
  expressApp.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        success: true,
        message: "All Beauty Luxury & Wellness API is running",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Ping endpoint
  expressApp.get("/api/ping", (_req, res) => {
    res.json({ message: "pong" });
  });
  expressApp.get("/api/content/:slug", getPublishedContentPage);

  // Public brand logo for email clients that cannot load CID attachments
  expressApp.get("/api/brand/logo", (_req, res) => {
    const buf = loadBrandLogo();
    if (!buf) {
      res.status(404).json({ success: false, message: "Logo not found" });
      return;
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  });

  // ==================== CONFIGURE API ROUTES ====================

  // Demo routes
  expressApp.get("/api/demo", handleDemo);

  // Services routes
  expressApp.get("/api/services", handleGetServices);
  expressApp.get("/api/services/:id", handleGetServiceById);

  // ==================== QR CHECK-IN ROUTES ====================
  // Generate QR token (admin only - but no auth middleware in this pattern)
  expressApp.post(
    "/api/check-in/generate-token",
    authenticateAdmin,
    requireRoles(CALENDAR_ROLES),
    generateCheckInToken,
  );
  // Validate token (public - for patient check-in page)
  expressApp.get("/api/check-in/validate/:token", validateCheckInToken);
  // Complete check-in with signature (public - for patient check-in page)
  expressApp.post("/api/check-in/complete", completeCheckIn);
  expressApp.get("/api/patient/packages", getPatientPackages);

  // Auth routes
  expressApp.post("/api/auth/register", handleRegister);
  expressApp.post("/api/auth/login", handleLogin);

  // Passwordless Auth routes
  expressApp.post("/api/auth/check-user", checkUser);
  expressApp.post("/api/auth/send-code", sendCode);
  expressApp.post("/api/auth/verify-code", verifyCode);
  expressApp.post("/api/auth/create-user", createUser);

  // Appointment routes (specific routes first, then parameterized routes)
  expressApp.get("/api/appointments/booked-slots", getBookedTimeSlots);
  expressApp.post("/api/appointments/quote", quoteAppointmentPackage);
  expressApp.post(
    "/api/appointments/book-with-payment",
    bookAppointmentWithPayment,
  );
  expressApp.post("/api/appointments/confirm-payment", confirmPayment);
  expressApp.post("/api/stripe/webhook", handleStripeWebhook);
  expressApp.post("/api/appointments", createAppointment);
  expressApp.get("/api/appointments", getAppointments);
  expressApp.get("/api/appointments/:id", getAppointmentById);
  expressApp.put("/api/appointments/:id", updateAppointmentHandler);
  expressApp.delete("/api/appointments/:id", cancelAppointmentHandler);

  // Business Hours routes
  expressApp.get("/api/business-hours", getBusinessHours);
  expressApp.get("/api/business-hours/day/:day", getBusinessHoursByDay);

  // Blocked Dates routes
  expressApp.get("/api/blocked-dates", getBlockedDates);
  expressApp.get("/api/blocked-dates/check", checkDateBlocked);

  // ==================== PATIENT ROUTES ====================
  // Patient Appointments
  expressApp.get("/api/patient/appointments", getPatientAppointments);
  expressApp.patch(
    "/api/patient/appointments/:id/cancel",
    cancelPatientAppointment,
  );
  expressApp.patch(
    "/api/patient/appointments/:id/reschedule",
    reschedulePatientAppointment,
  );
  expressApp.post(
    "/api/patient/appointments/:id/request-invoice",
    requestInvoice,
  );

  // Patient Profile
  expressApp.get("/api/patient/profile", getPatientProfile);
  expressApp.put("/api/patient/profile", updatePatientProfile);
  expressApp.get(
    "/api/patient/contracts/:id/download",
    downloadPatientContractPDF,
  );

  // ==================== ADMIN ROUTES ====================
  // Admin Auth (public — JWT is issued here)
  expressApp.post("/api/admin/auth/check-user", checkAdminUser);
  expressApp.post("/api/admin/auth/send-code", sendAdminCode);
  expressApp.post("/api/admin/auth/verify-code", verifyAdminCode);
  expressApp.post("/api/admin/auth/refresh", refreshAdminToken);

  expressApp.use("/api/admin", (req, res, next) => {
    if (req.path.startsWith("/auth/")) return next();
    return authenticateAdmin(req, res, () => authorizeAdmin(req, res, next));
  });

  // Admin Dashboard
  expressApp.get("/api/admin/dashboard/stats", getDashboardMetrics);
  expressApp.get("/api/admin/dashboard/metrics", getDashboardMetrics);
  expressApp.get("/api/admin/dashboard/revenue-chart", getRevenueChart);
  expressApp.get("/api/admin/dashboard/activity", getRecentActivity);
  expressApp.get("/api/admin/dashboard/calendar", getCalendarAppointments);

  // Admin file uploads (Vercel Blob)
  expressApp.post("/api/admin/uploads", uploadAdminFile);

  // Admin Services
  expressApp.get("/api/admin/services", getAllServicesAdmin);
  expressApp.post("/api/admin/services", createService);
  expressApp.put("/api/admin/services/:id", updateService);
  expressApp.delete("/api/admin/services/:id", deleteService);

  // Admin Patient Management
  expressApp.get("/api/admin/patients", getAllAdminPatients);
  expressApp.post("/api/admin/patients", createAdminPatient);
  expressApp.get("/api/admin/patients/:id", getAdminPatientById);
  expressApp.patch("/api/admin/patients/:id", updatePatient);
  expressApp.patch(
    "/api/admin/patients/:id/toggle-active",
    togglePatientActive,
  );
  expressApp.post(
    "/api/admin/patients/:id/medical-records",
    addPatientMedicalRecord,
  );

  // Admin Medical Records Management
  expressApp.get("/api/admin/medical-records", getAllMedicalRecords);
  expressApp.get("/api/admin/medical-records/:id", getMedicalRecordById);
  expressApp.post("/api/admin/medical-records", createMedicalRecord);
  expressApp.put("/api/admin/medical-records/:id", updateMedicalRecord);
  expressApp.delete("/api/admin/medical-records/:id", deleteMedicalRecord);

  // Admin User Management
  expressApp.get("/api/admin/users", getAdminUsers);
  expressApp.get("/api/admin/users/:id", getAdminUser);
  expressApp.post("/api/admin/users", createAdminUser);
  expressApp.put("/api/admin/users/:id", updateAdminUser);
  expressApp.delete("/api/admin/users/:id", deleteAdminUser);
  expressApp.patch("/api/admin/users/:id/toggle-active", toggleAdminUserActive);

  // Admin Appointment Management
  expressApp.get("/api/admin/appointments", getAllAdminAppointments);
  expressApp.get(
    "/api/admin/appointments/:id/payment-info",
    getAppointmentPaymentInfo,
  );
  expressApp.post("/api/admin/appointments/manual", createManualAppointment);
  expressApp.patch(
    "/api/admin/appointments/:id/status",
    updateAppointmentStatus,
  );
  expressApp.post("/api/admin/appointments/:id/check-in", checkInAppointment);
  expressApp.post("/api/admin/appointments/:id/cancel", cancelAdminAppointment);
  expressApp.post(
    "/api/admin/appointments/:id/reschedule",
    rescheduleAdminAppointment,
  );

  // Admin Contract Management
  expressApp.get("/api/admin/contracts", getAllContracts);
  expressApp.get("/api/admin/contracts/stats", getContractStats);
  expressApp.get("/api/admin/contracts/:id", getContractDetails);
  expressApp.get("/api/admin/contracts/:id/download", downloadContractPDF);

  // Admin Settings - Default Contract Terms
  expressApp.get(
    "/api/admin/settings/default-contract-terms",
    getDefaultContractTerms,
  );
  expressApp.put(
    "/api/admin/settings/default-contract-terms",
    updateDefaultContractTerms,
  );
  expressApp.post("/api/admin/contracts/create", createContract);
  expressApp.post(
    "/api/admin/contracts/:id/send-for-signature",
    sendContractForSignature,
  );
  expressApp.put("/api/admin/contracts/:id/terms", updateContractTermsHandler);
  expressApp.post(
    "/api/admin/contracts/:id/measurements",
    saveContractMeasurements,
  );
  expressApp.post(
    "/api/admin/contracts/:id/evaluate-guarantee",
    evaluateContractGuarantee,
  );
  expressApp.post(
    "/api/admin/contracts/:id/guarantee-status",
    suspendContractGuarantee,
  );
  expressApp.get("/api/admin/contracts/:id/status", getContractStatus);
  expressApp.get(
    "/api/admin/contracts/appointment/:appointmentId",
    getContractByAppointment,
  );
  expressApp.post("/api/admin/consents/:id/complete", completeAdminConsent);

  // Admin Payment Management
  expressApp.get("/api/admin/payments/stats", getPaymentStats);
  expressApp.get("/api/admin/payments", getAllAdminPayments);
  expressApp.get("/api/admin/payments/:id", getAdminPaymentById);
  expressApp.post("/api/admin/payments", createPayment);
  expressApp.patch("/api/admin/payments/:id/status", updatePaymentStatus);
  expressApp.post("/api/admin/payments/:id/refund", processRefund);
  expressApp.post("/api/admin/payments/:id/approve-refund", approveRefund);

  // Admin Invoice Management
  expressApp.get("/api/admin/invoices/stats", getInvoiceStats);
  expressApp.get("/api/admin/invoices", getAllInvoiceRequests);
  expressApp.get("/api/admin/invoices/:id", getInvoiceRequestById);
  expressApp.patch("/api/admin/invoices/:id", updateInvoiceRequest);

  // Admin Settings Management
  expressApp.get("/api/admin/settings/coupons", getAllCoupons);
  expressApp.post("/api/admin/settings/coupons", createCoupon);
  expressApp.put("/api/admin/settings/coupons/:id", updateCoupon);
  expressApp.delete("/api/admin/settings/coupons/:id", deleteCoupon);
  expressApp.get("/api/admin/settings", getSettings);
  expressApp.put("/api/admin/settings/:key", updateSetting);
  expressApp.get("/api/admin/settings/content-pages", getContentPages);
  expressApp.post("/api/admin/settings/content-pages", createContentPage);
  expressApp.put("/api/admin/settings/content-pages/:id", updateContentPage);
  expressApp.delete("/api/admin/settings/content-pages/:id", deleteContentPage);
  expressApp.get("/api/admin/settings/users", getAdminUsers);
  expressApp.get("/api/admin/settings/users/:id", getAdminUser);
  expressApp.post("/api/admin/settings/users", createAdminUser);
  expressApp.put("/api/admin/settings/users/:id", updateAdminUser);
  expressApp.patch(
    "/api/admin/settings/users/:id/toggle-active",
    toggleAdminUserActive,
  );
  expressApp.delete("/api/admin/settings/users/:id", deleteAdminUser);
  expressApp.post(
    "/api/admin/settings/users/:id/reset-access",
    resetAdminUserAccess,
  );
  expressApp.get(
    "/api/admin/settings/users/:id/activity",
    getAdminUserActivity,
  );
  expressApp.get("/api/admin/settings/business-hours", getAdminBusinessHours);
  expressApp.post("/api/admin/settings/business-hours", updateBusinessHours);
  expressApp.get("/api/admin/blocked-dates", getAdminBlockedDates);
  expressApp.post("/api/admin/blocked-dates", createBlockedDate);
  expressApp.put("/api/admin/blocked-dates/:id", updateBlockedDate);
  expressApp.delete("/api/admin/blocked-dates/:id", deleteBlockedDate);

  // 404 handler - only for API routes
  expressApp.use("/api", (_req, res, next) => {
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: "API endpoint not found",
      });
    } else {
      next();
    }
  });

  // Error handler
  expressApp.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Express error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    },
  );

  return expressApp;
}

function getApp() {
  if (!app) {
    console.log("Initializing Express app for serverless...");
    app = createServer();
  }
  return app;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Export createServer for development use
export { createServer };

// Export handler for Vercel serverless
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const expressApp = getApp();
    expressApp(req as any, res as any);
  } catch (error) {
    console.error("API Handler Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: "500",
          message: "A server error has occurred",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
};
