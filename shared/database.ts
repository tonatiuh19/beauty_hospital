/**
 * Database schema types and interfaces
 * Shared between client and server for type safety
 */

// ==================== ENUMS ====================
export enum UserRole {
  ADMIN = "admin",
  POS = "pos",
  DOCTOR = "doctor",
  RECEPTIONIST = "receptionist",
  PATIENT = "patient",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
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
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export type UserWithoutPassword = Omit<User, "password_hash">;

// ==================== PATIENT TYPES ====================
export interface Patient {
  id: number;
  user_id?: number; // Link to user account (optional for walk-ins)
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentWithDetails extends Appointment {
  patient: Patient;
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
  patient: Patient;
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

// ==================== AUDIT LOG TYPES ====================
export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values?: string; // JSON string
  new_values?: string; // JSON string
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
