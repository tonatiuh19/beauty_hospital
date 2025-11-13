/**
 * Database schema types and interfaces
 * Shared between client and server for type safety
 */

// ==================== ENUMS ====================
export enum UserRole {
  ADMIN = "admin",
  GENERAL_ADMIN = "general_admin",
  RECEPTIONIST = "receptionist",
  DOCTOR = "doctor",
  POS = "pos",
  PATIENT = "patient",
}

export type AdminRole = "admin" | "general_admin" | "receptionist" | "doctor";

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum BookingSource {
  ONLINE = "online",
  RECEPTIONIST = "receptionist",
  PHONE = "phone",
  WALK_IN = "walk_in",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  TRANSFER = "transfer",
  STRIPE = "stripe",
}

export enum ContractStatus {
  DRAFT = "draft",
  PENDING_SIGNATURE = "pending_signature",
  SIGNED = "signed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum NotificationType {
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  SMS = "sms",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
}

export enum ServiceCategory {
  LASER_HAIR_REMOVAL = "laser_hair_removal",
  FACIAL_TREATMENT = "facial_treatment",
  BODY_TREATMENT = "body_treatment",
  CONSULTATION = "consultation",
  OTHER = "other",
}

// ==================== USER TYPES ====================
export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_picture_url?: string;
  specialization?: string; // For doctors
  employee_id?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export type UserWithoutPassword = Omit<User, "password_hash">;

// ==================== PATIENT TYPES ====================
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string; // For patient authentication (null for walk-ins or externally booked)
  role: "patient";
  phone?: string; // Made optional - can be collected during signup or first appointment
  date_of_birth?: Date; // Made optional - can be collected during signup or first appointment
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  is_active: boolean;
  is_email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export type PatientWithoutPassword = Omit<Patient, "password_hash">;

// ==================== MEDICAL RECORD TYPES ====================
export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  allergies?: string;
  medications?: string;
  medical_history?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MedicalMedia {
  id: number;
  medical_record_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_at: Date;
}

// ==================== SERVICE TYPES ====================
export interface Service {
  id: number;
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ==================== APPOINTMENT TYPES ====================
export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id?: number;
  service_id: number;
  status: AppointmentStatus;
  scheduled_at: Date;
  duration_minutes: number;
  notes?: string;
  booked_for_self: boolean; // true if appointment is for the logged-in user, false if for someone else
  created_by: number;
  booking_source: BookingSource;
  check_in_at?: Date;
  check_in_by?: number;
  contract_id?: number;
  cancellation_reason?: string;
  cancelled_at?: Date;
  cancelled_by?: number;
  rescheduled_from?: number;
  reminder_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentWithDetails extends Appointment {
  patient: PatientWithoutPassword;
  doctor?: UserWithoutPassword;
  service: Service;
}

// ==================== PAYMENT TYPES ====================
export interface Payment {
  id: number;
  appointment_id?: number;
  patient_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  stripe_payment_id?: string;
  stripe_payment_intent_id?: string;
  transaction_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: Date;
  refunded_by?: number;
  refund_approved_by?: number;
  refund_approved_at?: Date;
  coupon_id?: number;
  discount_amount: number;
  notes?: string;
  processed_by: number;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ==================== CONTRACT TYPES ====================
export interface Contract {
  id: number;
  patient_id: number;
  service_id: number;
  contract_number: string;
  status: ContractStatus;
  total_amount: number;
  sessions_included: number;
  sessions_completed: number;
  terms_and_conditions: string;
  pdf_url?: string;
  signature_data?: string; // Base64 encoded signature image
  signed_at?: Date;
  signed_by?: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContractWithDetails extends Contract {
  patient: PatientWithoutPassword;
  service: Service;
  created_by_user: UserWithoutPassword;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id: number;
  patient_id: number;
  appointment_id?: number;
  type: NotificationType;
  status: NotificationStatus;
  recipient: string; // Email or phone number
  subject?: string;
  message: string;
  sent_at?: Date;
  delivered_at?: Date;
  error_message?: string;
  created_at: Date;
}

// ==================== BLOCKED DATES TYPES ====================
export interface BlockedDate {
  id: number;
  start_date: Date;
  end_date: Date;
  start_time?: string; // HH:MM:SS format or null for all-day
  end_time?: string; // HH:MM:SS format or null for all-day
  all_day: boolean; // true = entire day blocked, false = specific time range
  reason?: string;
  notes?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface BlockedDateWithCreator extends BlockedDate {
  created_by_user: UserWithoutPassword;
}

// ==================== BUSINESS HOURS TYPES ====================
export interface BusinessHours {
  id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  is_open: boolean;
  open_time: string; // HH:MM:SS format
  close_time: string; // HH:MM:SS format
  break_start?: string | null; // HH:MM:SS format
  break_end?: string | null; // HH:MM:SS format
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== AUDIT LOG TYPES ====================
export interface AuditLog {
  id: number;
  user_id?: number; // For staff actions (admin, doctor, receptionist, etc.)
  patient_id?: number; // For patient actions
  action: string;
  entity_type: string;
  entity_id: number;
  old_values?: string; // JSON string
  new_values?: string; // JSON string
  metadata?: string; // JSON string - Additional context
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// ==================== COUPON TYPES ====================
export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  per_user_limit?: number;
  valid_from: Date;
  valid_until?: Date;
  is_active: boolean;
  applicable_services?: number[]; // Array of service IDs or null for all
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CouponUsage {
  id: number;
  coupon_id: number;
  patient_id: number;
  appointment_id?: number;
  payment_id?: number;
  discount_amount: number;
  used_at: Date;
}

// ==================== SETTINGS TYPES ====================
export enum SettingType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  JSON = "json",
}

export interface Setting {
  id: number;
  setting_key: string;
  setting_value?: string;
  setting_type: SettingType;
  category: string;
  description?: string;
  is_public: boolean;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

// ==================== CONTENT PAGES TYPES ====================
export interface ContentPage {
  id: number;
  slug: string;
  title: string;
  content?: string;
  meta_description?: string;
  is_published: boolean;
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

// ==================== DASHBOARD METRICS TYPES ====================
export interface DashboardMetrics {
  id: number;
  metric_date: Date;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  total_revenue: number;
  total_refunds: number;
  new_patients: number;
  active_contracts: number;
  created_at: Date;
  updated_at: Date;
}

// ==================== APPOINTMENT REMINDER TYPES ====================
export interface AppointmentReminder {
  id: number;
  appointment_id: number;
  reminder_type: NotificationType;
  scheduled_for: Date;
  sent_at?: Date;
  status: "pending" | "sent" | "failed";
  error_message?: string;
  created_at: Date;
}
