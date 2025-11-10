/**
 * Shared code between client and server
 * API request/response types for type-safe communication
 */

import type {
  User,
  UserWithoutPassword,
  Patient,
  Appointment,
  AppointmentWithDetails,
  Payment,
  Service,
  Contract,
  ContractWithDetails,
  MedicalRecord,
  MedicalMedia,
  Notification,
  UserRole,
  AppointmentStatus,
  PaymentStatus,
  ContractStatus,
} from "./database";

// ==================== COMMON TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== AUTHENTICATION ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserWithoutPassword;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// ==================== PASSWORDLESS AUTHENTICATION ====================
export interface CheckUserRequest {
  email: string;
}

export interface CheckUserResponse {
  success: boolean;
  exists: boolean;
  user?: UserWithoutPassword;
}

export interface SendCodeRequest {
  user_id: number;
  email: string;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  user_id: number;
  code: number;
}

export interface VerifyCodeResponse {
  success: boolean;
  user: UserWithoutPassword;
}

export interface CreatePasswordlessUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
}

export interface CreatePasswordlessUserResponse {
  success: boolean;
  exists: boolean;
  user: UserWithoutPassword;
}

// ==================== USER MANAGEMENT ====================
export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

// ==================== PATIENT MANAGEMENT ====================
export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string; // ISO date string
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
  is_active?: boolean;
}

export interface SearchPatientsRequest extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

// ==================== APPOINTMENT MANAGEMENT ====================
export interface CreateAppointmentRequest {
  patient_id: number;
  doctor_id?: number;
  service_id: number;
  scheduled_at: string; // ISO datetime string
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  doctor_id?: number;
  service_id?: number;
  status?: AppointmentStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface SearchAppointmentsRequest extends PaginationParams {
  patient_id?: number;
  doctor_id?: number;
  status?: AppointmentStatus;
  date_from?: string;
  date_to?: string;
}

export interface AvailableSlot {
  start: string; // ISO datetime
  end: string;
  doctor_id?: number;
}

export interface CheckAvailabilityRequest {
  doctor_id?: number;
  date: string; // ISO date
  service_id: number;
}

// ==================== PAYMENT MANAGEMENT ====================
export interface CreatePaymentRequest {
  appointment_id?: number;
  patient_id: number;
  amount: number;
  payment_method: string;
  notes?: string;
}

export interface CreateStripePaymentRequest {
  appointment_id?: number;
  patient_id: number;
  amount: number;
  currency?: string;
  description?: string;
}

export interface StripePaymentResponse {
  clientSecret: string;
  paymentId: number;
}

export interface ConfirmPaymentRequest {
  payment_id: number;
  stripe_payment_intent_id?: string;
}

export interface SearchPaymentsRequest extends PaginationParams {
  patient_id?: number;
  appointment_id?: number;
  status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}

// ==================== SERVICE MANAGEMENT ====================
export interface GetServicesResponse {
  success: boolean;
  data: Service[];
}

export interface GetServiceResponse {
  success: boolean;
  data: Service;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category: string;
  price: number;
  duration_minutes: number;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  is_active?: boolean;
}

// ==================== CONTRACT MANAGEMENT ====================
export interface CreateContractRequest {
  patient_id: number;
  service_id: number;
  total_amount: number;
  sessions_included: number;
  terms_and_conditions: string;
}

export interface UpdateContractRequest {
  status?: ContractStatus;
  sessions_completed?: number;
}

export interface SignContractRequest {
  contract_id: number;
  signature_data: string; // Base64 encoded signature
}

export interface GenerateContractPDFResponse {
  pdf_url: string;
}

// ==================== MEDICAL RECORD MANAGEMENT ====================
export interface CreateMedicalRecordRequest {
  patient_id: number;
  appointment_id?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  allergies?: string;
  medications?: string;
  medical_history?: string;
}

export interface UpdateMedicalRecordRequest
  extends Partial<CreateMedicalRecordRequest> {}

export interface UploadMedicalMediaRequest {
  medical_record_id: number;
  description?: string;
}

export interface SearchMedicalRecordsRequest extends PaginationParams {
  patient_id: number;
}

// ==================== NOTIFICATION MANAGEMENT ====================
export interface SendNotificationRequest {
  patient_id: number;
  appointment_id?: number;
  type: "email" | "whatsapp" | "sms";
  subject?: string;
  message: string;
}

export interface SendAppointmentReminderRequest {
  appointment_id: number;
  hours_before?: number;
}

// ==================== DASHBOARD & ANALYTICS ====================
export interface DashboardStats {
  total_patients: number;
  active_patients: number;
  today_appointments: number;
  pending_appointments: number;
  monthly_revenue: number;
  pending_payments: number;
}

export interface RevenueReport {
  date: string;
  total_amount: number;
  payment_count: number;
}

export interface RevenueReportRequest {
  date_from: string;
  date_to: string;
  group_by?: "day" | "week" | "month";
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
