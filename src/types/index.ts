export type RoleCode =
  | "SUPER_ADMIN"
  | "DOCTOR"
  | "COMPOUNDER"
  | "NURSE"
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

// --- AI Clinical Workbench Types ---
export interface DrugSafetyCheckItem {
  interaction_type: "DRUG_DRUG" | "DRUG_ALLERGY" | "DRUG_DISEASE" | string;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  primary_item: string;
  interacting_with: string;
  clinical_effect: string;
  clinical_recommendation: string;
}

export interface DrugSafetyCheckRequest {
  medicines: string[];
  allergies?: string[];
  chronic_conditions?: string[];
  patient_age?: number;
  patient_gender?: string;
}

export interface DrugSafetyCheckResponse {
  overall_safety: "SAFE" | "MODERATE_WARNING" | "CRITICAL_CONTRAINDICATION" | string;
  safety_score: number;
  summary: string;
  warnings_count: number;
  interactions: DrugSafetyCheckItem[];
  safer_alternatives: string[];
  ai_model_used: string;
  is_live_ai: boolean;
}

export interface DifferentialDiagnosisItem {
  diagnosis: string;
  likelihood: "HIGH" | "MODERATE" | "LOW" | string;
  clinical_rationale: string;
  recommended_tests: string[];
}

export interface SuggestedLabOrderItem {
  test_name: string;
  test_id?: string;
  urgency: "ROUTINE" | "URGENT" | "STAT" | string;
  clinical_justification: string;
}

export interface ClinicalCopilotRequest {
  chief_complaint: string;
  symptoms?: string;
  vitals_bp?: string;
  vitals_heart_rate?: number;
  vitals_spo2?: number;
  vitals_temperature?: number;
  chronic_conditions?: string[];
  patient_age?: number;
  patient_gender?: string;
}

export interface ClinicalCopilotResponse {
  summary_assessment: string;
  differential_diagnoses: DifferentialDiagnosisItem[];
  suggested_lab_orders: SuggestedLabOrderItem[];
  red_flag_warnings: string[];
  recommended_physical_exams: string[];
  ai_model_used: string;
  is_live_ai: boolean;
}

export interface ExtractedPrescription {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface VoiceToSoapRequest {
  dictation_text: string;
  chief_complaint?: string;
  vitals_summary?: string;
  patient_name?: string;
}

export interface VoiceToSoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  structured_soap_notes: string;
  suggested_diagnosis: string;
  suggested_special_instructions?: string;
  extracted_prescriptions: ExtractedPrescription[];
  suggested_follow_up_days?: number;
  ai_model_used: string;
  is_live_ai: boolean;
}

// --- AI Feature 4: Personalized Diet & Lifestyle Plan Types ---
export interface DayMealPlanItem {
  day: string;
  theme: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  clinical_note?: string;
}

export interface FoodRestrictionItem {
  food_to_avoid: string;
  reason: string;
  healthy_substitute: string;
}

export interface GenerateDietPlanRequest {
  diagnosis?: string;
  chronic_conditions?: string[];
  allergies?: string[];
  dietary_preferences?: string;
  patient_age?: number;
  patient_gender?: string;
}

export interface PersonalizedDietPlanResponse {
  consultation_id?: string;
  diagnosis: string;
  patient_name: string;
  target_conditions: string[];
  dietary_framework: string;
  daily_calorie_target?: string;
  daily_hydration_liters: number;
  hydration_guidelines: string;
  foods_to_avoid: FoodRestrictionItem[];
  seven_day_meal_plan: DayMealPlanItem[];
  physical_activity_plan: string[];
  lifestyle_and_sleep_habits: string[];
  clinical_precautions: string[];
  ai_model_used: string;
  is_live_ai: boolean;
  generated_at: string;
}

// --- AI Feature 5: Diagnostic Lab Report Simplifier Types ---
export interface LabInterpretedParameter {
  parameter_name: string;
  measured_value: string;
  reference_range?: string;
  status: "NORMAL" | "ELEVATED" | "LOW" | "CRITICALLY_HIGH" | "CRITICALLY_LOW";
  plain_english_meaning: string;
  clinical_significance: string;
}

export interface SimplifyLabReportRequest {
  test_name?: string;
  test_category?: string;
  result_summary?: string;
  findings_json?: Record<string, any>;
  patient_age?: number;
  patient_gender?: string;
  clinical_diagnosis?: string;
}

export interface LabReportSimplificationResponse {
  order_id?: string;
  test_name: string;
  test_category: string;
  patient_name: string;
  overall_status: "NORMAL" | "ATTENTION_NEEDED" | "CRITICAL_ALERT";
  is_abnormal: boolean;
  patient_summary: string;
  doctor_snapshot: string;
  critical_flags: string[];
  interpreted_parameters: LabInterpretedParameter[];
  questions_for_doctor: string[];
  recommended_actions: string[];
  ai_model_used: string;
  is_live_ai: boolean;
  generated_at: string;
}

// --- Emergency Code & Hospital Response System Types ---
export interface EmergencyMemberBrief {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role_names: string[];
}

export interface EmergencyCodeGroupResponse {
  id: string;
  code: string;
  name: string;
  color_hex: string;
  badge_color: string;
  description: string;
  call_to_action: string;
  is_active: boolean;
  members: EmergencyMemberBrief[];
  member_count: number;
}

export interface EmergencyResponderResponse {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  responded_at: string;
  note?: string;
}

export interface EmergencyAlertResponse {
  id: string;
  code: string;
  code_name: string;
  color_hex: string;
  ward: string;
  location_details?: string;
  notes?: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
  triggered_at: string;
  triggered_by_id: string;
  triggered_by_name: string;
  resolved_at?: string;
  resolved_by_id?: string;
  resolved_by_name?: string;
  resolution_notes?: string;
  assigned_members_count: number;
  responders_count: number;
  responders: EmergencyResponderResponse[];
}

export interface EmergencyTriggerPayload {
  code: string;
  ward: string;
  location_details?: string;
  notes?: string;
}
