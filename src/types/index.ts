export type RoleCode =
  | "SUPER_ADMIN"
  | "DOCTOR"
  | "COMPOUNDER"
  | "LAB_ASSISTANT"
  | "PHARMACIST"
  | "PATIENT";

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  roles: Role[];
}

export interface Role {
  id: string;
  code: RoleCode | string;
  name: string;
  description?: string;
  is_system: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  department_id: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  room_number: string;
  bio?: string;
  is_available: boolean;
  avg_consultation_mins: number;
  user?: User;
  department?: Department;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CHECKED_IN" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  chief_complaint?: string;
  symptom_duration?: string;
  severity?: string;
  rejection_reason?: string;
  patient?: User;
  doctor?: DoctorProfile;
}

export interface QueueEntry {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  queue_date: string;
  token_number: number;
  status: "WAITING" | "CALLED_IN" | "IN_CONSULTATION" | "ON_HOLD" | "COMPLETED" | "SKIPPED";
  is_priority: boolean;
  check_in_time: string;
  called_in_time?: string;
  session_start_time?: string;
  session_end_time?: string;
  patient?: User;
  doctor?: DoctorProfile;
  appointment?: Appointment;
}

export interface PatientLiveQueueStatus {
  appointment_id: string;
  queue_entry_id: string;
  your_token_number: number;
  status: string;
  is_your_turn: boolean;
  currently_serving_token?: number | null;
  patients_ahead: number;
  estimated_wait_time_minutes: number;
  is_priority: boolean;
  doctor_name: string;
  doctor_specialization: string;
  room_number: string;
  queue_date: string;
}

export interface DoctorLiveQueueSummary {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  room_number: string;
  active_token?: number | null;
  active_token_status?: string | null;
  active_patient_name?: string | null;
  total_waiting: number;
  total_completed_today: number;
  upcoming_tokens: number[];
}

export interface WaitingRoomTVDisplay {
  hospital_name: string;
  queue_date: string;
  doctors: DoctorLiveQueueSummary[];
}

export interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  dispense_status: "PENDING" | "DISPENSED" | "SUBSTITUTED" | "OUT_OF_STOCK";
}

export interface LabOrder {
  id: string;
  consultation_id: string;
  test_id: string;
  patient_id: string;
  doctor_id: string;
  instructions?: string;
  urgency: "ROUTINE" | "URGENT" | "STAT";
  status: "ORDERED" | "SAMPLE_COLLECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  sample_collected_at?: string;
  test?: LabTestCatalog;
  patient?: User;
  doctor?: DoctorProfile;
  result?: LabResult;
}

export interface LabTestCatalog {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  standard_turnaround_hours: number;
  is_active: boolean;
}

export interface LabResult {
  id: string;
  lab_order_id: string;
  lab_assistant_id: string;
  result_summary: string;
  findings_json?: Record<string, any>;
  report_file_url?: string;
  is_abnormal: boolean;
  critical_alert?: string;
  completed_at: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis: string;
  clinical_notes?: string;
  special_instructions?: string;
  highlights?: string;
  follow_up_date?: string;
  is_finalized: boolean;
  prescription_items: PrescriptionItem[];
  lab_orders: LabOrder[];
  created_at: string;
  patient?: User;
  doctor?: DoctorProfile;
}

export interface PharmacyMedicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
}

export interface PharmacyPrescriptionQueueItem {
  consultation_id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  doctor_name: string;
  room_number: string;
  diagnosis: string;
  prescribed_at: string;
  is_all_dispensed: boolean;
  items: PrescriptionItem[];
}

export interface PatientMedicalProfile {
  id: string;
  patient_id: string;
  blood_group?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  baseline_systolic_bp?: number;
  baseline_diastolic_bp?: number;
  chronic_conditions: Array<{
    condition: string;
    diagnosed_year?: number;
    status: string;
    notes?: string;
  }>;
  known_allergies: Array<{
    allergen: string;
    type: string;
    severity: string;
    reaction?: string;
  }>;
  past_surgeries: Array<{
    procedure: string;
    year?: number;
    hospital?: string;
    notes?: string;
  }>;
  ongoing_medications: Array<{
    medicine_name: string;
    dosage: string;
    prescribed_for?: string;
  }>;
  family_medical_history: Array<{
    relation: string;
    condition: string;
  }>;
  lifestyle_factors: {
    smoking_status?: string;
    alcohol_use?: string;
    exercise_level?: string;
    dietary_restrictions?: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  clinical_notes?: string;
}

export interface PatientVitalsLog {
  id: string;
  patient_id: string;
  recorded_by_id: string;
  source: string;
  appointment_id?: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  respiratory_rate: number;
  temperature_f: number;
  spo2: number;
  blood_glucose?: number;
  consciousness_level: string;
  symptoms_notes?: string;
  mews_score: number;
  news2_score: number;
  triage_level: string;
  is_critical: boolean;
  ai_analysis?: string;
  clinical_recommendation?: string;
  risk_factors_detected: string[];
  notified_doctor_id?: string;
  doctor_notified_at?: string;
  doctor_alert_acknowledged: boolean;
  doctor_name?: string;
  created_at: string;
}

export interface DoctorCriticalAlertItem {
  vitals_log_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  appointment_id?: string;
  triage_level: string;
  is_critical: boolean;
  mews_score: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  temperature_f: number;
  symptoms_notes?: string;
  ai_analysis?: string;
  clinical_recommendation?: string;
  risk_factors_detected: string[];
  recorded_at: string;
  acknowledged: boolean;
}

export interface MedicineExplanationItem {
  medicine_name: string;
  purpose: string;
  how_to_take: string;
  precautions_and_side_effects: string;
  food_interaction?: string | null;
}

export interface PrescriptionExplanationResponse {
  consultation_id: string;
  diagnosis: string;
  doctor_name: string;
  ai_model_used: string;
  is_live_ai: boolean;
  summary: string;
  medicines: MedicineExplanationItem[];
  lifestyle_and_diet_recommendations: string[];
  warning_signs_to_watch: string[];
  general_advice: string;
  created_at: string;
}
