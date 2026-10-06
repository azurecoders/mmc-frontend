"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  Users,
  CheckCircle2,
  Clock,
  PhoneCall,
  Plus,
  Trash2,
  AlertCircle,
  Pill,
  FlaskConical,
  FileText,
  HeartPulse,
  Activity,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  X,
  Copy,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Mic,
  MicOff,
  Zap,
  Wand2,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useSocketEvent } from "@/lib/hooks";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  statusTone,
  Alert,
  LoadingState,
  Dialog,
  useToast,
  LabReportSimplifierModal,
} from "@/components/ui";
import {
  DoctorProfile,
  QueueEntry,
  DoctorLiveQueueSummary,
  LabTestCatalog,
  PrescriptionItem,
  PharmacyMedicine,
  PatientVitalsLog,
  Consultation,
  PatientMedicalProfile,
  DrugSafetyCheckResponse,
  DrugSafetyCheckItem,
  ClinicalCopilotResponse,
  DifferentialDiagnosisItem,
  SuggestedLabOrderItem,
  VoiceToSoapResponse,
  ExtractedPrescription,
  LabReportSimplificationResponse,
} from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";

/** Follow-up presets requested by user */
const FOLLOW_UP_OPTIONS = [
  { value: "", label: "No follow-up required" },
  { value: "1", label: "After 1 day (Tomorrow)" },
  { value: "2", label: "After 2 days" },
  { value: "3", label: "After 3 days" },
  { value: "5", label: "After 5 days" },
  { value: "7", label: "After 1 week (7 days)" },
  { value: "10", label: "After 10 days" },
  { value: "14", label: "After 2 weeks (14 days)" },
  { value: "21", label: "After 3 weeks (21 days)" },
  { value: "30", label: "After 1 month (30 days)" },
  { value: "60", label: "After 2 months (60 days)" },
  { value: "90", label: "After 3 months (90 days)" },
  { value: "180", label: "After 6 months" },
  { value: "__CUSTOM__", label: "📅 Custom date..." },
];

/** Searchable Medicine Combobox Selector */
function SearchableMedicineInput({
  value,
  onChange,
  medicines,
}: {
  value: string;
  onChange: (medicineName: string, selectedMed?: PharmacyMedicine) => void;
  medicines: PharmacyMedicine[];
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = medicines.filter((m) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q))
    );
  });

  const selectedMed = medicines.find(
    (m) => m.name.toLowerCase() === (value || "").toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs hover:border-slate-400 transition">
          <div className="flex items-center gap-2 min-w-0">
            <Pill className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{value}</span>
            {selectedMed && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0">
                {selectedMed.dosage_form} · Stock: {selectedMed.stock_quantity}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm(value);
              setOpen(true);
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium shrink-0 ml-1"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              placeholder="Search medicine by brand or generic name..."
              value={searchTerm}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {open && (
            <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-xs">
              {filtered.length > 0 ? (
                filtered.slice(0, 15).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.name, m);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50/70 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Pill className="h-3 w-3 text-brand-600" />
                        <span>{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({m.dosage_form})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-4">
                        {m.generic_name || m.category}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          m.stock_quantity > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {m.stock_quantity > 0 ? `${m.stock_quantity} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-slate-500">
                  No matching medication found in pharmacy.
                </div>
              )}

              {searchTerm.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchTerm.trim());
                    setOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-brand-50 text-brand-700 font-medium border-t border-slate-100 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Prescribe as custom/unlisted: &quot;{searchTerm.trim()}&quot;</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorCabinPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [queueSummary, setQueueSummary] = useState<DoctorLiveQueueSummary | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activeQueueEntry, setActiveQueueEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Active patient vitals state
  const [activePatientVitals, setActivePatientVitals] = useState<PatientVitalsLog | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [recordingVitals, setRecordingVitals] = useState(false);

  // Patient past consultant records & EHR history
  const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);
  const [pastConsultationsLoading, setPastConsultationsLoading] = useState(false);
  const [medicalProfile, setMedicalProfile] = useState<PatientMedicalProfile | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

  // Quick vital inputs
  const [vitalsBP, setVitalsBP] = useState("120/80");
  const [vitalsHR, setVitalsHR] = useState("72");
  const [vitalsSpO2, setVitalsSpO2] = useState("98");
  const [vitalsRR, setVitalsRR] = useState("16");
  const [vitalsTemp, setVitalsTemp] = useState("98.6");
  const [vitalsGlucose, setVitalsGlucose] = useState("");

  // Consultation SOAP workbench inputs
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [highlights, setHighlights] = useState("");

  // Follow-up state (preset dropdown + computed date)
  const [followUpPreset, setFollowUpPreset] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Formularies & orders
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>([]);
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);

  const [prescriptions, setPrescriptions] = useState<
    Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>
  >([]);

  const [selectedLabTests, setSelectedLabTests] = useState<
    Array<{ test_id: string; urgency: string; instructions: string }>
  >([]);

  const [finalizing, setFinalizing] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // AI Feature 1: Drug Interaction & Allergy Safety Guard
  const [safetyCheckLoading, setSafetyCheckLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<DrugSafetyCheckResponse | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // AI Feature 2: Clinical Copilot (Differential Diagnosis & Lab Test Assistant)
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<ClinicalCopilotResponse | null>(null);
  const [showCopilotModal, setShowCopilotModal] = useState(false);

  // AI Feature 3: Ambient Voice-to-SOAP Scribe
  const [showScribeModal, setShowScribeModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dictationText, setDictationText] = useState("");
  const [scribeLoading, setScribeLoading] = useState(false);
  const [scribeResult, setScribeResult] = useState<VoiceToSoapResponse | null>(null);
  const recognitionRef = useRef<any>(null);

  // AI Feature: Lab Report Simplifier (Clinician Snapshot)
  const [simplifyingLabOrderId, setSimplifyingLabOrderId] = useState<string | null>(null);
  const [doctorLabAiReport, setDoctorLabAiReport] = useState<LabReportSimplificationResponse | null>(null);
  const [showDoctorLabAiModal, setShowDoctorLabAiModal] = useState(false);

  const handleViewDoctorLabSnapshot = async (orderId: string) => {
    setSimplifyingLabOrderId(orderId);
    try {
      const data = await apiFetch<LabReportSimplificationResponse>(
        `/lab/orders/${orderId}/simplify-report`,
        { method: "POST" }
      );
      setDoctorLabAiReport(data);
      setShowDoctorLabAiModal(true);
    } catch (err: any) {
      toast({
        tone: "error",
        title: "Could not fetch AI diagnostic snapshot",
        description: err?.message || "Please try again.",
      });
    } finally {
      setSimplifyingLabOrderId(null);
    }
  };

  // Load initial doctors, lab catalog & pharmacy medicines
  useEffect(() => {
    async function init() {
      try {
        const [docs, catalog, meds] = await Promise.all([
          apiFetch<DoctorProfile[]>("/doctors/").catch(() => []),
          apiFetch<LabTestCatalog[]>("/lab/catalog").catch(() => []),
          apiFetch<PharmacyMedicine[]>("/pharmacy/inventory").catch(() => []),
        ]);
        setDoctors(docs);
        setLabCatalog(catalog);
        setMedicines(meds);

        // Auto-match doctor to logged-in user
        const matched = docs.find((d) => d.user_id === user?.id);
        if (matched) {
          setSelectedDoctorId(matched.id);
        } else if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  // Load doctor's queue when selectedDoctorId changes
  const loadDoctorQueue = async (docId: string) => {
    if (!docId) return;
    try {
      const summary = await apiFetch<DoctorLiveQueueSummary>(`/queue/doctor-queue/${docId}`).catch(() => null);
      setQueueSummary(summary);

      // Fetch live queue entries and appointments
      const [entries, allAppointments] = await Promise.all([
        apiFetch<QueueEntry[]>(`/queue/doctor-queue/${docId}/entries`).catch(() => []),
        apiFetch<any[]>("/appointments/").catch(() => []),
      ]);
      const docApts = allAppointments.filter((a) => a.doctor_id === docId);

      const entryAptIds = new Set(entries.map((e) => e.appointment_id));
      const combined = [
        ...entries,
        ...docApts
          .filter((a) => !entryAptIds.has(a.id) && ["APPROVED", "CHECKED_IN", "IN_CONSULTATION"].includes(a.status))
          .map((a) => ({
            id: a.id,
            appointment_id: a.id,
            doctor_id: a.doctor_id,
            patient_id: a.patient_id,
            queue_date: a.appointment_date,
            token_number: a.token_number,
            status: a.status === "IN_CONSULTATION" ? "IN_CONSULTATION" : "WAITING",
            is_priority: false,
            check_in_time: a.slot_time || "Scheduled",
            patient: a.patient,
            appointment: a,
          })),
      ];
      setQueueEntries(combined as QueueEntry[]);
    } catch (e) {
      console.error("Queue load error:", e);
    }
  };

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorQueue(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  // Socket room for doctor alerts
  useSocketEvent(
    "queue:doctor_updated",
    () => {
      if (selectedDoctorId) loadDoctorQueue(selectedDoctorId);
    },
    selectedDoctorId ? `doctor:${selectedDoctorId}` : null
  );

  useSocketEvent(
    "patient:critical_vitals_alert",
    (alert: any) => {
      toast({
        title: "CRITICAL PATIENT ALERT",
        description: `${alert.patient_name} has critical vitals (MEWS ${alert.mews_score}).`,
        tone: "error",
      });
      setNotice(`CRITICAL ALERT: ${alert.patient_name} reported severe vitals. Check Alerts tab.`);
    },
    selectedDoctorId ? `doctor:${selectedDoctorId}` : null
  );

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Call Next Patient in queue
  const handleCallNext = async () => {
    if (!selectedDoctorId) return;
    setCallingNext(true);
    try {
      const res = await apiFetch<QueueEntry>("/queue/call-patient", {
        method: "POST",
        body: JSON.stringify({ doctor_id: selectedDoctorId }),
      });
      toast({
        title: "Patient Called",
        description: `Token #${res.token_number} (${res.patient?.full_name || "Patient"}) called to Room ${selectedDoctor?.room_number || "Cabin"}.`,
        tone: "success",
      });
      setActiveQueueEntry(res);
      setChiefComplaint(res.appointment?.chief_complaint || "");
      setSymptoms(res.appointment?.symptom_duration || "");
      loadDoctorQueue(selectedDoctorId);
    } catch (err: any) {
      toast({
        title: "Queue Empty",
        description: err?.message || "No patients currently waiting in queue.",
        tone: "info",
      });
    } finally {
      setCallingNext(false);
    }
  };

  // Call a specific patient directly from queue list
  const handleCallSpecific = async (q: QueueEntry) => {
    setCallingId(q.id);
    try {
      const res = await apiFetch<QueueEntry>("/queue/call-patient", {
        method: "POST",
        body: JSON.stringify({ queue_entry_id: q.id }),
      });
      toast({
        title: "Patient Called",
        description: `Token #${res.token_number} (${res.patient?.full_name || "Patient"}) called to Room ${selectedDoctor?.room_number || "Cabin"}.`,
        tone: "success",
      });
      setActiveQueueEntry(res);
      setChiefComplaint(res.appointment?.chief_complaint || "");
      setSymptoms(res.appointment?.symptom_duration || "");
      if (selectedDoctorId) loadDoctorQueue(selectedDoctorId);
    } catch (err: any) {
      toast({
        title: "Could not call patient",
        description: err?.message || "Please try again.",
        tone: "error",
      });
    } finally {
      setCallingId(null);
    }
  };

  // Fetch patient vitals & prior consultant records when consultation opens
  const fetchActivePatientData = async (patientId: string) => {
    if (!patientId) return;
    setVitalsLoading(true);
    setPastConsultationsLoading(true);
    try {
      const [vitals, history, profile] = await Promise.all([
        apiFetch<PatientVitalsLog>(`/vitals/patient/${patientId}/latest`).catch(() => null),
        apiFetch<Consultation[]>(`/consultations/patient/${patientId}/history`).catch(() => []),
        apiFetch<PatientMedicalProfile>(`/patients/${patientId}/medical-profile`).catch(() => null),
      ]);

      setActivePatientVitals(vitals);
      if (vitals) {
        setVitalsBP(`${vitals.systolic_bp}/${vitals.diastolic_bp}`);
        setVitalsHR(`${vitals.heart_rate}`);
        setVitalsSpO2(`${vitals.spo2}`);
        setVitalsRR(`${vitals.respiratory_rate}`);
        setVitalsTemp(`${vitals.temperature_f}`);
        setVitalsGlucose(vitals.blood_glucose ? `${vitals.blood_glucose}` : "");
      }

      setPastConsultations(history);
      setMedicalProfile(profile);
      if (history.length > 0) {
        setExpandedConsultationId(history[0].id);
      }
    } finally {
      setVitalsLoading(false);
      setPastConsultationsLoading(false);
    }
  };

  useEffect(() => {
    setSafetyResult(null);
    setCopilotResult(null);
    setScribeResult(null);
    setDictationText("");
    if (activeQueueEntry?.patient_id) {
      fetchActivePatientData(activeQueueEntry.patient_id);
    } else {
      setActivePatientVitals(null);
      setPastConsultations([]);
      setMedicalProfile(null);
    }
  }, [activeQueueEntry?.patient_id]);

  // Doctor records or updates vitals inside cabin
  const handleSaveConsultationVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const aptId = activeQueueEntry?.appointment_id || activeQueueEntry?.id;
    if (!aptId) return;
    setRecordingVitals(true);
    try {
      const parts = vitalsBP.split("/");
      const sys = parseInt(parts[0], 10) || 120;
      const dia = parseInt(parts[1], 10) || 80;
      const res = await apiFetch<PatientVitalsLog>("/vitals/compounder-intake", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: aptId,
          systolic_bp: sys,
          diastolic_bp: dia,
          heart_rate: parseInt(vitalsHR, 10) || 72,
          spo2: parseFloat(vitalsSpO2) || 98,
          respiratory_rate: parseInt(vitalsRR, 10) || 16,
          temperature_f: parseFloat(vitalsTemp) || 98.6,
          blood_glucose: vitalsGlucose ? parseFloat(vitalsGlucose) : undefined,
          consciousness_level: "ALERT",
          symptoms_notes: `Clinical examination vitals recorded by Dr. ${selectedDoctor?.user?.full_name || "Physician"}`,
        }),
      });
      setActivePatientVitals(res);
      setShowVitalsForm(false);
      toast({
        title: "Vitals Recorded & Evaluated",
        description: `MEWS Score: ${res.mews_score} (${res.triage_level})`,
        tone: res.is_critical ? "warning" : "success",
      });
    } catch (err: any) {
      toast({ title: "Failed to record vitals", description: err?.message || "Please check inputs", tone: "error" });
    } finally {
      setRecordingVitals(false);
    }
  };

  // Follow-up preset change handler
  const handleFollowUpPresetChange = (preset: string) => {
    setFollowUpPreset(preset);
    if (!preset) {
      setFollowUpDate("");
    } else if (preset === "__CUSTOM__") {
      // Keep existing custom or leave blank for picker
    } else {
      const days = parseInt(preset, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      setFollowUpDate(d.toISOString().split("T")[0]);
    }
  };

  // Add prescription row using pharmacy catalog
  const addPrescription = () => {
    const firstMed = medicines[0];
    setPrescriptions([
      ...prescriptions,
      {
        medicine_name: firstMed ? firstMed.name : "",
        dosage: firstMed ? `1 ${firstMed.dosage_form?.toLowerCase() || "tab"}` : "1 tab",
        frequency: "Twice daily (1-0-1)",
        duration: "5 days",
        instructions: "After meals with water",
      },
    ]);
  };

  // Add lab order row
  const addLabOrder = () => {
    if (labCatalog.length === 0) return;
    setSelectedLabTests([
      ...selectedLabTests,
      { test_id: labCatalog[0].id, urgency: "ROUTINE", instructions: "" },
    ]);
  };

  // Copy past consultation diagnosis or medications
  const handleCopyPastDiagnosis = (pastDiagnosis: string) => {
    setDiagnosis(pastDiagnosis);
    toast({
      title: "Diagnosis Applied",
      description: "Copied past diagnosis to current consultation.",
      tone: "success",
    });
  };

  const handleCopyPastMeds = (pastMeds: PrescriptionItem[]) => {
    if (!pastMeds || pastMeds.length === 0) return;
    const newItems = pastMeds.map((m) => ({
      medicine_name: m.medicine_name,
      dosage: m.dosage || "1 tab",
      frequency: m.frequency || "Once daily (1-0-0)",
      duration: m.duration || "5 days",
      instructions: m.instructions || "After meals with water",
    }));
    setPrescriptions([...prescriptions, ...newItems]);
    toast({
      title: "Medications Appended",
      description: `Imported ${newItems.length} medications from previous visit.`,
      tone: "success",
    });
  };

  // --- AI Feature 1: Real-Time Drug Interaction & Allergy Safety Guard ---
  const runDrugSafetyCheck = async (explicitUserClick = false) => {
    const medNames = prescriptions
      .map((p) => p.medicine_name?.trim())
      .filter((n): n is string => Boolean(n && n.length > 0));

    if (medNames.length === 0) {
      if (explicitUserClick) {
        toast({
          title: "No Medications Added",
          description: "Please add at least one medication to run the AI safety check.",
          tone: "warning",
        });
      }
      return;
    }

    setSafetyCheckLoading(true);
    try {
      const allergies: string[] = [];
      if (medicalProfile?.known_allergies && Array.isArray(medicalProfile.known_allergies)) {
        allergies.push(...medicalProfile.known_allergies.map((a) => a.allergen));
      }
      if (highlights) {
        allergies.push(highlights);
      }

      const chronicConditions: string[] = [];
      if (medicalProfile?.chronic_conditions && Array.isArray(medicalProfile.chronic_conditions)) {
        chronicConditions.push(...medicalProfile.chronic_conditions.map((c) => c.condition));
      }

      let patientAge: number | undefined = undefined;
      if (medicalProfile?.date_of_birth) {
        const birthYear = new Date(medicalProfile.date_of_birth).getFullYear();
        if (!isNaN(birthYear)) {
          patientAge = new Date().getFullYear() - birthYear;
        }
      }
      const patientGender = medicalProfile?.gender;

      const res = await apiFetch<DrugSafetyCheckResponse>("/consultations/ai/drug-safety-check", {
        method: "POST",
        body: JSON.stringify({
          medicines: medNames,
          allergies,
          chronic_conditions: chronicConditions,
          patient_age: patientAge,
          patient_gender: patientGender,
        }),
      });

      setSafetyResult(res);

      if (explicitUserClick) {
        if (res.overall_safety === "CRITICAL_CONTRAINDICATION") {
          toast({
            title: "CRITICAL CONTRAINDICATION DETECTED",
            description: res.summary,
            tone: "error",
          });
          setShowSafetyModal(true);
        } else if (res.overall_safety === "MODERATE_WARNING") {
          toast({
            title: "Drug Safety Warnings Found",
            description: `Identified ${res.warnings_count} interaction warnings. Review recommendations.`,
            tone: "warning",
          });
          setShowSafetyModal(true);
        } else {
          toast({
            title: "Prescription Safety Verified",
            description: "No dangerous drug interactions, allergy conflicts, or disease risks found.",
            tone: "success",
          });
        }
      } else if (res.overall_safety === "CRITICAL_CONTRAINDICATION") {
        toast({
          title: "SAFETY ALERT: Contraindication Detected",
          description: `${res.interactions[0]?.primary_item || "Medication"} conflicts with patient profile!`,
          tone: "error",
        });
      }
    } catch (err: any) {
      if (explicitUserClick) {
        toast({
          title: "Safety check could not be completed",
          description: err?.message || "Please review prescriptions manually.",
          tone: "error",
        });
      }
    } finally {
      setSafetyCheckLoading(false);
    }
  };

  // Auto-check Drug Safety with debounce when prescriptions change
  useEffect(() => {
    if (!activeQueueEntry) {
      setSafetyResult(null);
      return;
    }
    const medNames = prescriptions
      .map((p) => p.medicine_name?.trim())
      .filter((n): n is string => Boolean(n && n.length > 0));

    if (medNames.length === 0) {
      setSafetyResult(null);
      return;
    }

    const timer = setTimeout(() => {
      runDrugSafetyCheck(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [prescriptions, activeQueueEntry, highlights, medicalProfile]);

  // --- AI Feature 2: Differential Diagnosis & Lab Test Assistant ---
  const handleRunClinicalCopilot = async () => {
    if (!chiefComplaint.trim() && !symptoms.trim() && !activePatientVitals) {
      toast({
        title: "Clinical Context Needed",
        description: "Please enter a chief complaint or record vitals before invoking Clinical Copilot.",
        tone: "warning",
      });
      return;
    }

    setCopilotLoading(true);
    try {
      const chronicConditions: string[] = [];
      if (medicalProfile?.chronic_conditions && Array.isArray(medicalProfile.chronic_conditions)) {
        chronicConditions.push(...medicalProfile.chronic_conditions.map((c) => c.condition));
      }

      let patientAge: number | undefined = undefined;
      if (medicalProfile?.date_of_birth) {
        const birthYear = new Date(medicalProfile.date_of_birth).getFullYear();
        if (!isNaN(birthYear)) {
          patientAge = new Date().getFullYear() - birthYear;
        }
      }
      const patientGender = medicalProfile?.gender;

      const res = await apiFetch<ClinicalCopilotResponse>("/consultations/ai/clinical-copilot", {
        method: "POST",
        body: JSON.stringify({
          chief_complaint: chiefComplaint.trim() || "Clinical consultation",
          symptoms: symptoms.trim() || undefined,
          vitals_bp: vitalsBP || undefined,
          vitals_heart_rate: parseInt(vitalsHR, 10) || undefined,
          vitals_spo2: parseFloat(vitalsSpO2) || undefined,
          vitals_temperature: parseFloat(vitalsTemp) || undefined,
          chronic_conditions: chronicConditions,
          patient_age: patientAge,
          patient_gender: patientGender,
        }),
      });

      setCopilotResult(res);
      setShowCopilotModal(true);
      toast({
        title: "Clinical Copilot Analysis Ready",
        description: `Generated ${res.differential_diagnoses.length} differential diagnoses and recommended tests.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Clinical Copilot Error",
        description: err?.message || "Failed to generate AI clinical guidance.",
        tone: "error",
      });
    } finally {
      setCopilotLoading(false);
    }
  };

  const applyCopilotDiagnosis = (diagName: string) => {
    setDiagnosis(diagName);
    toast({
      title: "Diagnosis Applied",
      description: `Primary diagnosis updated to: "${diagName}".`,
      tone: "success",
    });
  };

  const applySuggestedLabOrder = (suggestedTest: SuggestedLabOrderItem) => {
    const matched = labCatalog.find(
      (c) =>
        c.id === suggestedTest.test_id ||
        c.name.toLowerCase().includes(suggestedTest.test_name.toLowerCase()) ||
        suggestedTest.test_name.toLowerCase().includes(c.name.toLowerCase())
    );

    const testId = matched ? matched.id : labCatalog[0]?.id;
    if (!testId) {
      toast({
        title: "Lab Catalog Unavailable",
        description: "Could not add lab order because catalog is empty.",
        tone: "warning",
      });
      return;
    }

    const alreadyOrdered = selectedLabTests.some((t) => t.test_id === testId);
    if (alreadyOrdered) {
      toast({
        title: "Test Already Ordered",
        description: `This test is already in the patient's lab order list.`,
        tone: "info",
      });
      return;
    }

    const urgency = ["ROUTINE", "URGENT", "STAT"].includes(suggestedTest.urgency)
      ? suggestedTest.urgency
      : "ROUTINE";

    setSelectedLabTests((prev) => [
      ...prev,
      {
        test_id: testId,
        urgency,
        instructions:
          suggestedTest.clinical_justification ||
          `AI Copilot recommended for ${chiefComplaint || "evaluation"}`,
      },
    ]);

    toast({
      title: "Lab Order Added",
      description: `Ordered ${matched ? matched.name : suggestedTest.test_name} (${urgency}).`,
      tone: "success",
    });
  };

  // --- AI Feature 3: Ambient Voice-to-SOAP Scribe ---
  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description:
          "Your browser does not support Web Speech. You can type or paste dictation text directly into the box.",
        tone: "warning",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let baseText = dictationText ? dictationText + " " : "";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDictationText(baseText + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error !== "no-speech") {
          toast({
            title: "Microphone / Dictation Notice",
            description: `Speech status: ${event.error}. You can also type dictation text manually.`,
            tone: "info",
          });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err: any) {
      toast({
        title: "Microphone Access Denied",
        description: err?.message || "Please check browser microphone permissions.",
        tone: "error",
      });
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleProcessVoiceToSoap = async () => {
    if (!dictationText.trim()) {
      toast({
        title: "Dictation Required",
        description: "Please speak into the mic or type dictation text before generating SOAP notes.",
        tone: "warning",
      });
      return;
    }

    if (isRecording) {
      stopVoiceRecording();
    }

    setScribeLoading(true);
    try {
      const vitalsSummary = activePatientVitals
        ? `BP: ${activePatientVitals.systolic_bp}/${activePatientVitals.diastolic_bp} mmHg, HR: ${activePatientVitals.heart_rate} bpm, SpO2: ${activePatientVitals.spo2}%, Temp: ${activePatientVitals.temperature_f}°F, RR: ${activePatientVitals.respiratory_rate}`
        : undefined;

      const res = await apiFetch<VoiceToSoapResponse>("/consultations/ai/voice-to-soap", {
        method: "POST",
        body: JSON.stringify({
          dictation_text: dictationText.trim(),
          chief_complaint: chiefComplaint.trim() || undefined,
          vitals_summary: vitalsSummary,
          patient_name: activeQueueEntry?.patient?.full_name || undefined,
        }),
      });

      setScribeResult(res);
      toast({
        title: "SOAP Notes Structured",
        description: "Structured notes and extracted prescriptions are ready for review.",
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Scribe Processing Error",
        description: err?.message || "Failed to structure dictation into SOAP notes.",
        tone: "error",
      });
    } finally {
      setScribeLoading(false);
    }
  };

  const handleApplyScribeToWorkbench = () => {
    if (!scribeResult) return;

    if (scribeResult.structured_soap_notes) {
      setClinicalNotes(scribeResult.structured_soap_notes);
    }

    if (scribeResult.suggested_diagnosis && !diagnosis.trim()) {
      setDiagnosis(scribeResult.suggested_diagnosis);
    }

    if (scribeResult.suggested_special_instructions) {
      setSpecialInstructions((prev) =>
        prev
          ? `${prev}\n${scribeResult.suggested_special_instructions}`
          : scribeResult.suggested_special_instructions || ""
      );
    }

    if (scribeResult.suggested_follow_up_days) {
      const days = scribeResult.suggested_follow_up_days;
      const matchOpt = FOLLOW_UP_OPTIONS.find((o) => o.value === String(days));
      if (matchOpt) {
        handleFollowUpPresetChange(String(days));
      } else {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setFollowUpPreset("__CUSTOM__");
        setFollowUpDate(d.toISOString().split("T")[0]);
      }
    }

    if (scribeResult.extracted_prescriptions && scribeResult.extracted_prescriptions.length > 0) {
      const newItems = scribeResult.extracted_prescriptions.map((rx) => ({
        medicine_name: rx.medicine_name,
        dosage: rx.dosage || "1 tab",
        frequency: rx.frequency || "Twice daily (1-0-1)",
        duration: rx.duration || "5 days",
        instructions: rx.instructions || "After meals with water",
      }));
      setPrescriptions((prev) => [...prev, ...newItems]);
    }

    setShowScribeModal(false);
    toast({
      title: "Applied to Workbench",
      description: "SOAP notes, prescriptions, and instructions loaded into consultation form.",
      tone: "success",
    });
  };

  // Finalize consultation
  const handleFinalizeVisit = async () => {
    if (!activeQueueEntry) return;
    if (!diagnosis.trim()) {
      toast({ title: "Diagnosis Required", description: "Please enter a clinical diagnosis before finalizing.", tone: "warning" });
      return;
    }

    setFinalizing(true);
    try {
      const formattedRx = prescriptions
        .filter((p) => p.medicine_name && p.medicine_name.trim().length > 0)
        .map((p) => ({
          medicine_name: p.medicine_name.trim(),
          dosage: p.dosage?.trim() || "1 tab",
          frequency: p.frequency?.trim() || "Once daily (1-0-0)",
          duration: p.duration?.trim() || "5 days",
          instructions: p.instructions?.trim() || "After meals with water",
        }));

      await apiFetch("/consultations/", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: activeQueueEntry.appointment_id || activeQueueEntry.id,
          chief_complaint: chiefComplaint.trim() || "Clinical Consultation",
          symptoms: symptoms.trim() || undefined,
          diagnosis: diagnosis.trim(),
          clinical_notes: clinicalNotes.trim() || "Clinical examination and evaluation completed.",
          special_instructions: specialInstructions.trim() || undefined,
          highlights: highlights.trim() || undefined,
          follow_up_date: followUpDate || undefined,
          prescriptions: formattedRx,
          prescription_items: formattedRx,
          lab_orders: selectedLabTests.map((l) => ({
            test_id: l.test_id,
            urgency: l.urgency,
            instructions: l.instructions?.trim() || undefined,
          })),
          finalize: true,
        }),
      });

      toast({
        title: "Consultation Finalized",
        description: `Prescribed ${formattedRx.length} medications and dispatched to Pharmacy.`,
        tone: "success",
      });

      // Reset form
      setActiveQueueEntry(null);
      setDiagnosis("");
      setClinicalNotes("");
      setSpecialInstructions("");
      setHighlights("");
      setFollowUpPreset("");
      setFollowUpDate("");
      setPrescriptions([]);
      setSelectedLabTests([]);
      setPastConsultations([]);
      setMedicalProfile(null);
      setSafetyResult(null);
      setCopilotResult(null);
      setScribeResult(null);
      setDictationText("");
      if (selectedDoctorId) loadDoctorQueue(selectedDoctorId);
    } catch (err: any) {
      toast({ title: "Error finalizing visit", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading doctor cabin workspace…" />;
  }

  // Filter previous finalized visits for current patient (excluding today's in-progress visit)
  const previousVisits = pastConsultations.filter(
    (c) => c.id !== activeQueueEntry?.id && c.id !== activeQueueEntry?.appointment_id
  );

  const allergiesSummary =
    medicalProfile?.known_allergies && medicalProfile.known_allergies.length > 0
      ? medicalProfile.known_allergies.map((a) => `${a.allergen} (${a.severity})`).join(", ")
      : null;

  const chronicSummary =
    medicalProfile?.chronic_conditions && medicalProfile.chronic_conditions.length > 0
      ? medicalProfile.chronic_conditions.map((c) => c.condition).join(", ")
      : null;

  const surgeriesSummary =
    medicalProfile?.past_surgeries && medicalProfile.past_surgeries.length > 0
      ? medicalProfile.past_surgeries.map((s) => `${s.procedure}${s.year ? ` (${s.year})` : ""}`).join(", ")
      : null;

  const ongoingMedsSummary =
    medicalProfile?.ongoing_medications && medicalProfile.ongoing_medications.length > 0
      ? medicalProfile.ongoing_medications.map((m) => `${m.medicine_name} (${m.dosage})`).join(", ")
      : null;

  const familyHistorySummary =
    medicalProfile?.family_medical_history && medicalProfile.family_medical_history.length > 0
      ? medicalProfile.family_medical_history.map((f) => `${f.relation}: ${f.condition}`).join(", ")
      : null;


  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Consultation Console"
        title="Doctor Cabin & EHR Workbench"
        description="Call patients from today's queue, review past consultant records, record SOAP clinical notes, and dispatch electronic prescriptions in real time."
        actions={
          <div className="flex items-center gap-3">
            {doctors.length > 1 && (
              <Select
                label="Active Cabin"
                hideLabel
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                options={doctors.map((d) => ({
                  value: d.id,
                  label: `${d.user?.full_name || "Doctor"} (Room ${d.room_number})`,
                }))}
                className="w-56"
              />
            )}
            <Button
              onClick={handleCallNext}
              loading={callingNext}
              icon={<PhoneCall className="h-4 w-4" />}
            >
              Call Next Patient
            </Button>
          </div>
        }
      />

      {notice && (
        <Alert tone="warning" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {/* Cabin Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Cabin Room</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {selectedDoctor?.room_number || "Cabin 101"}
          </div>
          <span className="text-xs text-brand-600">{selectedDoctor?.specialization}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Waiting in Queue</span>
          <div className="text-xl font-bold text-brand-600 mt-1">
            {queueSummary?.total_waiting || 0}
          </div>
          <span className="text-xs text-slate-400">Patients ready outside</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Currently Serving</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {queueSummary?.active_token ? `#${queueSummary.active_token}` : "None"}
          </div>
          <span className="text-xs text-slate-400 truncate block">
            {queueSummary?.active_patient_name || "Idle cabin"}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Completed Today</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {queueSummary?.total_completed_today || 0}
          </div>
          <span className="text-xs text-slate-400">Discharged or routed</span>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Queue List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Today&apos;s Patient Queue
            </h2>
            <span className="text-xs text-slate-400">{queueEntries.length} registered</span>
          </div>

          <div className="space-y-2">
            {queueEntries.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-500">
                No patients scheduled in today&apos;s queue.
              </Card>
            ) : (
              queueEntries.map((q) => {
                const isActive = activeQueueEntry?.token_number === q.token_number;
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-3.5 transition flex items-center justify-between gap-2 ${
                      isActive
                        ? "border-brand-500 bg-brand-50/50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-brand-600">
                          #{q.token_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {q.patient?.full_name || "Patient"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{q.check_in_time}</span>
                        <span>&bull;</span>
                        <Badge tone={statusTone(q.status)}>
                          {q.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCallSpecific(q)}
                        loading={callingId === q.id}
                        title="Call patient into cabin now"
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-brand-600" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant={isActive ? "primary" : "ghost"}
                        onClick={() => {
                          setActiveQueueEntry(q);
                          setChiefComplaint(q.appointment?.chief_complaint || "");
                          setSymptoms(q.appointment?.symptom_duration || "");
                        }}
                      >
                        {isActive ? "Active" : "Open"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Consultation Workbench */}
        <div className="lg:col-span-2 space-y-6">
          {activeQueueEntry ? (
            <Card>
              <CardHeader
                title={`Active Consultation — Token #${activeQueueEntry.token_number}`}
                description={`Patient: ${activeQueueEntry.patient?.full_name || "Patient"} (${activeQueueEntry.patient?.phone || "No phone listed"})`}
                action={
                  <div className="flex items-center gap-2">
                    {previousVisits.length > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowHistoryModal(true)}
                        icon={<History className="h-3.5 w-3.5 text-brand-600" />}
                      >
                        EHR History ({previousVisits.length})
                      </Button>
                    )}
                    <Badge tone="brand">In Consultation</Badge>
                  </div>
                }
              />
              <CardBody className="space-y-5">
                {/* 1. Patient Medical History & Prior Consultant Records Panel */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <span>Patient Records & Previous Consultant History</span>
                          {pastConsultationsLoading && (
                            <span className="text-[10px] text-slate-400 font-normal">Loading...</span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {previousVisits.length > 0
                            ? `${previousVisits.length} prior consultation(s) documented across hospital departments.`
                            : "First visit documented in hospital electronic records."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {medicalProfile?.blood_group && (
                        <Badge tone="neutral">Blood: {medicalProfile.blood_group}</Badge>
                      )}
                      {allergiesSummary ? (
                        <Badge tone="danger" className="font-semibold">
                          ⚠️ Allergies: {allergiesSummary}
                        </Badge>
                      ) : (
                        <Badge tone="success">No Known Drug Allergies</Badge>
                      )}
                      {previousVisits.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowHistoryModal(true)}
                          icon={<History className="h-3.5 w-3.5" />}
                        >
                          View All ({previousVisits.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Chronic Conditions & Profile Summary Bar */}
                  {medicalProfile && (chronicSummary || surgeriesSummary || ongoingMedsSummary) && (
                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
                      {chronicSummary && (
                        <div>
                          <strong className="text-slate-900">Chronic Conditions:</strong> {chronicSummary}
                        </div>
                      )}
                      {surgeriesSummary && (
                        <div>
                          <strong className="text-slate-900">Past Surgeries:</strong> {surgeriesSummary}
                        </div>
                      )}
                      {ongoingMedsSummary && (
                        <div>
                          <strong className="text-slate-900">Long-term Meds:</strong> {ongoingMedsSummary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Most Recent Previous Visit Snapshot */}
                  {previousVisits.length > 0 ? (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3.5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-3.5 w-3.5 text-brand-600" />
                          <span className="font-bold text-xs text-slate-900">
                            Last Visit: {previousVisits[0].doctor?.user?.full_name || "Doctor"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({previousVisits[0].doctor?.specialization || "General Specialist"})
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(previousVisits[0].created_at)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-800">
                        <strong className="text-slate-900">Diagnosis: </strong>
                        <span className="font-medium text-brand-950">{previousVisits[0].diagnosis}</span>
                      </div>

                      {previousVisits[0].clinical_notes && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white/70 p-2 rounded-lg border border-brand-100/50">
                          {previousVisits[0].clinical_notes}
                        </p>
                      )}

                      {/* Prescribed Meds from Last Visit */}
                      {previousVisits[0].prescription_items && previousVisits[0].prescription_items.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Pill className="h-3 w-3 text-slate-400" /> Prescribed:
                          </span>
                          {previousVisits[0].prescription_items.map((pi) => (
                            <span
                              key={pi.id}
                              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-800 border border-slate-200"
                            >
                              <strong>{pi.medicine_name}</strong>
                              <span className="text-slate-400">({pi.dosage})</span>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleCopyPastMeds(previousVisits[0].prescription_items)}
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium ml-1 flex items-center gap-0.5"
                          >
                            <Copy className="h-3 w-3" /> Re-prescribe these
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center text-xs text-slate-500">
                      First visit on record for this patient. No prior consultant visits found.
                    </div>
                  )}
                </div>

                {/* 2. Patient Physiological Vitals Banner */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                        <HeartPulse className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Patient Physiological Vitals & Triage
                          </h3>
                          {activePatientVitals && (
                            <Badge tone={activePatientVitals.is_critical ? "danger" : "neutral"}>
                              MEWS: {activePatientVitals.mews_score} ({activePatientVitals.triage_level})
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {activePatientVitals
                            ? `Recorded by ${
                                activePatientVitals.source === "COMPOUNDER_INTAKE"
                                  ? "Triage Staff (Compounder)"
                                  : activePatientVitals.source === "PATIENT_SELF_REPORT"
                                  ? "Patient (Self-Logged)"
                                  : "Consultant Physician"
                              } · ${formatDateTime(activePatientVitals.created_at)}`
                            : "No pre-consultation vitals recorded yet for this session"}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowVitalsForm(!showVitalsForm)}
                      icon={<Activity className="h-3.5 w-3.5" />}
                    >
                      {activePatientVitals ? "Update Vitals" : "Record Vitals"}
                    </Button>
                  </div>

                  {/* Vitals Stats Grid */}
                  {vitalsLoading ? (
                    <p className="text-xs text-slate-400 py-1">Loading intake vitals...</p>
                  ) : activePatientVitals ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Blood Pressure</span>
                        <span className="text-sm font-black text-slate-900">
                          {activePatientVitals.systolic_bp}/{activePatientVitals.diastolic_bp}
                        </span>
                        <span className="text-[10px] text-slate-500 block">mmHg</span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Heart Rate</span>
                        <span className="text-sm font-black text-slate-900">{activePatientVitals.heart_rate}</span>
                        <span className="text-[10px] text-slate-500 block">BPM</span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">SpO₂</span>
                        <span
                          className={`text-sm font-black ${
                            activePatientVitals.spo2 < 95 ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {activePatientVitals.spo2}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">Pulse Ox</span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Temperature</span>
                        <span
                          className={`text-sm font-black ${
                            activePatientVitals.temperature_f > 100.4 ? "text-amber-600" : "text-slate-900"
                          }`}
                        >
                          {activePatientVitals.temperature_f}
                        </span>
                        <span className="text-[10px] text-slate-500 block">°F</span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Resp. Rate</span>
                        <span className="text-sm font-black text-slate-900">
                          {activePatientVitals.respiratory_rate}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/min</span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Blood Glucose</span>
                        <span className="text-sm font-black text-slate-900">
                          {activePatientVitals.blood_glucose ? `${activePatientVitals.blood_glucose}` : "—"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">mg/dL</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">
                      No baseline vitals recorded at triage desk. Click &quot;Record Vitals&quot; to take readings now.
                    </p>
                  )}

                  {/* Inline Vitals Quick Entry Form */}
                  {showVitalsForm && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                      <form onSubmit={handleSaveConsultationVitals} className="space-y-3">
                        <span className="text-xs font-bold text-slate-800 block">
                          Record Current Vitals in Cabin
                        </span>
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-6">
                          <Input
                            label="BP (Sys/Dia)"
                            placeholder="120/80"
                            value={vitalsBP}
                            onChange={(e) => setVitalsBP(e.target.value)}
                            required
                          />
                          <Input
                            label="Heart Rate"
                            placeholder="72"
                            value={vitalsHR}
                            onChange={(e) => setVitalsHR(e.target.value)}
                            required
                          />
                          <Input
                            label="SpO2 (%)"
                            placeholder="98"
                            value={vitalsSpO2}
                            onChange={(e) => setVitalsSpO2(e.target.value)}
                            required
                          />
                          <Input
                            label="Resp. Rate"
                            placeholder="16"
                            value={vitalsRR}
                            onChange={(e) => setVitalsRR(e.target.value)}
                            required
                          />
                          <Input
                            label="Temp (°F)"
                            placeholder="98.6"
                            value={vitalsTemp}
                            onChange={(e) => setVitalsTemp(e.target.value)}
                            required
                          />
                          <Input
                            label="Glucose (mg/dL)"
                            placeholder="Optional"
                            value={vitalsGlucose}
                            onChange={(e) => setVitalsGlucose(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowVitalsForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" loading={recordingVitals}>
                            Save & Score MEWS
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* AI Clinical Intelligence Toolbar */}
                <div className="rounded-2xl border border-indigo-200/80 bg-linear-to-r from-indigo-50/70 via-brand-50/50 to-purple-50/70 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                          AI Clinical Intelligence Copilot
                        </span>
                        <Badge tone="brand" className="text-[10px] px-1.5 py-0">
                          GPT-4o-mini
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Differential diagnoses, confirmatory test orders, and ambient voice-to-SOAP documentation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowScribeModal(true)}
                      icon={<Mic className="h-3.5 w-3.5 text-purple-600" />}
                      className="bg-white border-purple-200 text-purple-900 hover:bg-purple-50 shadow-xs text-xs font-semibold"
                    >
                      Ambient Voice Scribe
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRunClinicalCopilot}
                      loading={copilotLoading}
                      icon={<Wand2 className="h-3.5 w-3.5 text-white" />}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs font-semibold"
                    >
                      Differential Diagnoses & Tests
                    </Button>
                  </div>
                </div>

                {/* 3. Chief Complaint & Symptoms */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Chief Complaint"
                    placeholder="e.g. Chest pain, dry cough, dizziness"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                  />
                  <Input
                    label="Duration & Severity"
                    placeholder="e.g. 3 days, moderate severity"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                {/* 4. Primary Diagnosis */}
                <div className="space-y-2">
                  <Input
                    label="Clinical Diagnosis (Required)"
                    placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />

                  {/* AI Differential Diagnoses quick application chips */}
                  {copilotResult && copilotResult.differential_diagnoses.length > 0 && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                        AI Suggested Diagnoses (Click to apply):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {copilotResult.differential_diagnoses.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => applyCopilotDiagnosis(d.diagnosis)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 shadow-2xs ${
                              diagnosis === d.diagnosis
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            <span>{d.diagnosis}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded-sm font-semibold uppercase ${
                                d.likelihood === "HIGH"
                                  ? "bg-amber-100 text-amber-800"
                                  : d.likelihood === "MODERATE"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {d.likelihood}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Clinical Notes & Advice */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Textarea
                    label="Doctor's Clinical Notes (SOAP)"
                    placeholder="Subjective history, physical examination findings, assessment, and treatment plan..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    label="Patient Advice & Lifestyle Instructions"
                    placeholder="Diet recommendations, hydration, rest, warning signs..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* 6. Red Flags & Follow-up Presets */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Red Flags / Allergy Highlights"
                    placeholder="e.g. Penicillin allergy, diabetic caution"
                    value={highlights}
                    onChange={(e) => setHighlights(e.target.value)}
                  />

                  {/* Follow-up Dropdown (after 1 day, 3 days, 1 week, 1 month, etc.) */}
                  <div>
                    <Select
                      label="Follow-up Appointment"
                      value={followUpPreset}
                      onChange={(e) => handleFollowUpPresetChange(e.target.value)}
                      options={FOLLOW_UP_OPTIONS}
                    />

                    {followUpPreset === "__CUSTOM__" ? (
                      <div className="mt-2">
                        <Input
                          label="Custom Follow-up Date"
                          hideLabel
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                      </div>
                    ) : followUpDate ? (
                      <p className="text-xs text-brand-700 font-medium mt-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-brand-600" />
                        <span>Scheduled for: {formatDate(followUpDate)}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* 7. Prescribe Medications with Searchable Combobox & Real-Time Safety Guard */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-brand-600" />
                      <span>Prescribe Medications (Searchable Formulary)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => runDrugSafetyCheck(true)}
                        loading={safetyCheckLoading}
                        icon={
                          safetyResult?.overall_safety === "CRITICAL_CONTRAINDICATION" ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                          ) : safetyResult?.overall_safety === "MODERATE_WARNING" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          )
                        }
                        className={
                          safetyResult?.overall_safety === "CRITICAL_CONTRAINDICATION"
                            ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-semibold"
                            : safetyResult?.overall_safety === "MODERATE_WARNING"
                            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {safetyCheckLoading
                          ? "Analyzing Safety..."
                          : safetyResult
                          ? `Safety Score: ${safetyResult.safety_score}/100`
                          : "Check Drug Safety & Allergies"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={addPrescription}
                        icon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Medicine
                      </Button>
                    </div>
                  </div>

                  {/* Real-time Safety Guard Banner */}
                  {safetyCheckLoading ? (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5 text-xs text-indigo-800 flex items-center gap-2 animate-pulse">
                      <ShieldAlert className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>AI Safety Guard is analyzing drug interactions, allergies, and patient contraindications...</span>
                    </div>
                  ) : safetyResult ? (
                    safetyResult.overall_safety === "CRITICAL_CONTRAINDICATION" ? (
                      <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-900 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                            <div>
                              <strong className="font-bold text-red-800 text-sm block">
                                Critical Contraindication Detected!
                              </strong>
                              <span className="text-red-700 text-[11px]">
                                Safety Score: {safetyResult.safety_score}/100 &bull; {safetyResult.warnings_count} alert(s)
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowSafetyModal(true)}
                            className="bg-white border-red-300 text-red-800 hover:bg-red-100 text-xs py-1"
                          >
                            View Safety Report
                          </Button>
                        </div>
                        <p className="text-red-800 leading-relaxed font-medium">
                          {safetyResult.summary}
                        </p>
                        {safetyResult.safer_alternatives.length > 0 && (
                          <div className="rounded-lg bg-white/80 p-2 border border-red-200 text-[11px] space-y-0.5">
                            <span className="font-bold text-red-900 block">Recommended Safer Alternatives:</span>
                            <ul className="list-disc list-inside text-red-800">
                              {safetyResult.safer_alternatives.map((alt, i) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : safetyResult.overall_safety === "MODERATE_WARNING" ? (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <div>
                              <strong className="font-bold text-amber-900 block">
                                Clinical Interaction Warnings ({safetyResult.warnings_count})
                              </strong>
                              <span className="text-amber-700 text-[11px]">
                                Safety Score: {safetyResult.safety_score}/100 &bull; Requires dose monitoring or food separation
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowSafetyModal(true)}
                            className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs py-1"
                          >
                            Review Details
                          </Button>
                        </div>
                        <p className="text-amber-800 text-[11px]">
                          {safetyResult.summary}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Safety Verified (100/100):</strong> No dangerous drug-drug, allergy, or condition conflicts identified.
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSafetyModal(true)}
                          className="text-emerald-800 hover:bg-emerald-100 text-[11px] py-0.5 px-2 h-auto"
                        >
                          Report
                        </Button>
                      </div>
                    )
                  ) : null}

                  {prescriptions.map((p, idx) => {
                    const medWarning = safetyResult?.interactions.find(
                      (it) =>
                        it.primary_item.toLowerCase() === (p.medicine_name || "").toLowerCase().trim()
                    );

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 space-y-2 transition ${
                          medWarning
                            ? medWarning.severity === "HIGH"
                              ? "border-red-300 bg-red-50/40"
                              : "border-amber-300 bg-amber-50/40"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="grid gap-2 sm:grid-cols-5">
                          <div className="sm:col-span-2">
                            <SearchableMedicineInput
                              value={p.medicine_name}
                              medicines={medicines}
                              onChange={(medName, medObj) => {
                                const updated = [...prescriptions];
                                updated[idx].medicine_name = medName;
                                if (medObj && !updated[idx].dosage) {
                                  updated[idx].dosage = `1 ${medObj.dosage_form?.toLowerCase() || "tab"}`;
                                }
                                setPrescriptions(updated);
                              }}
                            />
                          </div>

                          <Input
                            label="Dosage"
                            hideLabel
                            placeholder="Dosage (e.g. 500mg, 1 tab)"
                            value={p.dosage}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].dosage = e.target.value;
                              setPrescriptions(updated);
                            }}
                          />

                          <Select
                            label="Frequency"
                            hideLabel
                            value={p.frequency}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].frequency = e.target.value;
                              setPrescriptions(updated);
                            }}
                            options={[
                              { value: "Once daily (1-0-0)", label: "Once daily (Morning)" },
                              { value: "Twice daily (1-0-1)", label: "Twice daily (1-0-1)" },
                              { value: "Thrice daily (1-1-1)", label: "Thrice daily (1-1-1)" },
                              { value: "Four times daily", label: "Four times daily (QID)" },
                              { value: "As needed (PRN / SOS)", label: "As needed (PRN / SOS)" },
                              { value: "At bedtime (0-0-1)", label: "At bedtime (Night)" },
                            ]}
                          />

                          <div className="flex items-center gap-1">
                            <Input
                              label="Duration"
                              hideLabel
                              placeholder="Duration (e.g. 5 days)"
                              value={p.duration}
                              onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[idx].duration = e.target.value;
                                setPrescriptions(updated);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPrescriptions(prescriptions.filter((_, i) => i !== idx))
                              }
                              className="text-red-500"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Inline Item Alert */}
                        {medWarning && (
                          <div className={`rounded-lg p-2 text-[11px] flex items-start gap-1.5 ${
                            medWarning.severity === "HIGH"
                              ? "bg-red-100/80 border border-red-200 text-red-900"
                              : "bg-amber-100/80 border border-amber-200 text-amber-900"
                          }`}>
                            <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                              medWarning.severity === "HIGH" ? "text-red-600" : "text-amber-600"
                            }`} />
                            <div>
                              <span className="font-bold uppercase tracking-wider text-[10px]">
                                {medWarning.interaction_type.replace("_", " ")} ({medWarning.severity}):
                              </span>{" "}
                              <span>{medWarning.clinical_effect} &bull; <em>Recommendation: {medWarning.clinical_recommendation}</em></span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 8. Diagnostic Lab Test Orders */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4 text-brand-600" />
                      <span>Order Diagnostic Laboratory Tests</span>
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={addLabOrder}
                      icon={<Plus className="h-3.5 w-3.5" />}
                    >
                      Add Test Order
                    </Button>
                  </div>

                  {/* AI Copilot Confirmatory Lab Order Recommendations */}
                  {copilotResult && copilotResult.suggested_lab_orders.length > 0 && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                        AI Confirmatory Lab Suggestions (Click to add to orders):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {copilotResult.suggested_lab_orders.map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestedLabOrder(t)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-100 text-indigo-900 font-medium transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <Plus className="h-3 w-3 text-indigo-600" />
                            <span>{t.test_name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded-sm bg-indigo-100 text-indigo-700 font-semibold uppercase">
                              {t.urgency}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLabTests.map((t, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-center gap-2"
                    >
                      <Select
                        label="Test"
                        hideLabel
                        value={t.test_id}
                        onChange={(e) => {
                          const updated = [...selectedLabTests];
                          updated[idx].test_id = e.target.value;
                          setSelectedLabTests(updated);
                        }}
                        options={labCatalog.map((c) => ({ value: c.id, label: c.name }))}
                        className="flex-1"
                      />
                      <Select
                        label="Urgency"
                        hideLabel
                        value={t.urgency}
                        onChange={(e) => {
                          const updated = [...selectedLabTests];
                          updated[idx].urgency = e.target.value;
                          setSelectedLabTests(updated);
                        }}
                        options={[
                          { value: "ROUTINE", label: "Routine" },
                          { value: "URGENT", label: "Urgent" },
                          { value: "STAT", label: "STAT (Emergency)" },
                        ]}
                        className="w-36"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedLabTests(selectedLabTests.filter((_, i) => i !== idx))
                        }
                        className="text-red-500"
                        aria-label="Remove test"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Finalizing dispatches orders to Pharmacy and Diagnostics Laboratory simultaneously.
                </span>
                <Button
                  onClick={handleFinalizeVisit}
                  loading={finalizing}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Finalize Visit & Send Orders
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-semibold text-slate-900">Cabin is Currently Idle</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No patient is currently in consultation. Click &quot;Call Next Patient&quot; to bring in the next token from the waiting lounge.
              </p>
              <div className="mt-5">
                <Button onClick={handleCallNext} icon={<PhoneCall className="h-4 w-4" />}>
                  Call Next Patient
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Full Patient EHR & Past Consultant Records Modal */}
      <Dialog
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Electronic Health Record — Patient History"
        description={`Complete consultation history, past diagnoses, and medical archive for ${activeQueueEntry?.patient?.full_name || "Patient"}`}
        size="xl"
        footer={
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close Record
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Medical Profile Summary Banner */}
          {medicalProfile && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Profile Archive
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Blood Group</span>
                  <span className="font-semibold text-slate-900">
                    {medicalProfile.blood_group || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Drug Allergies</span>
                  <span className={`font-semibold ${allergiesSummary ? "text-red-600" : "text-slate-900"}`}>
                    {allergiesSummary || "None reported"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chronic Conditions</span>
                  <span className="font-semibold text-slate-900">
                    {chronicSummary || "None reported"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Long-term Medications</span>
                  <span className="font-semibold text-slate-900">
                    {ongoingMedsSummary || "None listed"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Past Surgeries / Procedures</span>
                  <span className="font-semibold text-slate-900">
                    {surgeriesSummary || "None listed"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Family History</span>
                  <span className="font-semibold text-slate-900">
                    {familyHistorySummary || "None listed"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Past Consultations Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Past Consultant Visits ({previousVisits.length})</span>
            </h3>

            {previousVisits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No past consultations recorded for this patient.
              </p>
            ) : (
              previousVisits.map((c) => {
                const isExpanded = expandedConsultationId === c.id;
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedConsultationId(isExpanded ? null : c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setExpandedConsultationId(isExpanded ? null : c.id);
                        }
                      }}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-brand-600" />
                          <span className="font-semibold text-slate-900 text-sm">
                            {c.doctor?.user?.full_name || "Consultant"}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({c.doctor?.specialization || "Specialist"})
                          </span>
                        </div>
                        <div className="text-xs text-slate-700">
                          <strong className="text-slate-900">Diagnosis: </strong>
                          {c.diagnosis}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                          <span>{formatDate(c.created_at)}</span>
                          <span>&bull;</span>
                          <span>{c.prescription_items?.length || 0} Meds Prescribed</span>
                          <span>&bull;</span>
                          <span>{c.lab_orders?.length || 0} Lab Orders</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPastDiagnosis(c.diagnosis);
                          }}
                          title="Copy this diagnosis to current workbench"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Use Diagnosis
                        </Button>
                        <span className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4 text-xs">
                        {/* Clinical notes */}
                        {c.clinical_notes && (
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                              Consultant Clinical Notes
                            </span>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {c.clinical_notes}
                            </p>
                          </div>
                        )}

                        {/* Special instructions */}
                        {c.special_instructions && (
                          <div className="rounded-lg bg-white p-3 border border-slate-200">
                            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                              Advice & Instructions Given
                            </span>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {c.special_instructions}
                            </p>
                          </div>
                        )}

                        {/* Prescribed Medications */}
                        {c.prescription_items && c.prescription_items.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                                Prescribed Medications ({c.prescription_items.length})
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopyPastMeds(c.prescription_items)}
                                icon={<Copy className="h-3 w-3" />}
                              >
                                Re-prescribe All Meds
                              </Button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full text-left">
                                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                                  <tr>
                                    <th className="p-2.5 font-medium">Medicine</th>
                                    <th className="p-2.5 font-medium">Dosage</th>
                                    <th className="p-2.5 font-medium">Frequency</th>
                                    <th className="p-2.5 font-medium">Duration</th>
                                    <th className="p-2.5 font-medium">Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {c.prescription_items.map((pi) => (
                                    <tr key={pi.id} className="hover:bg-slate-50/50">
                                      <td className="p-2.5 font-semibold text-slate-900">{pi.medicine_name}</td>
                                      <td className="p-2.5 text-slate-600">{pi.dosage}</td>
                                      <td className="p-2.5 text-slate-600">{pi.frequency}</td>
                                      <td className="p-2.5 text-slate-600">{pi.duration}</td>
                                      <td className="p-2.5 text-slate-500">{pi.instructions || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Lab Orders */}
                        {c.lab_orders && c.lab_orders.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block">
                              Diagnostic Lab Orders & Findings ({c.lab_orders.length})
                            </span>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {c.lab_orders.map((lo) => (
                                <div
                                  key={lo.id}
                                  className="rounded-lg border border-slate-200 bg-white p-3 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">
                                      {lo.test?.name || "Lab Panel"}
                                    </span>
                                    <Badge tone={statusTone(lo.status)}>{lo.status}</Badge>
                                  </div>
                                  {lo.result && (
                                    <div className="space-y-1.5 mt-1">
                                      <p className="text-slate-600 text-xs">
                                        <strong>Result:</strong> {lo.result.result_summary}
                                      </p>
                                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                        <Badge tone={lo.result.is_abnormal ? "danger" : "success"} className="text-[10px]">
                                          {lo.result.is_abnormal ? "Abnormal" : "Normal"}
                                        </Badge>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="h-6 text-[10px] px-2 gap-1 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200"
                                          loading={simplifyingLabOrderId === lo.id}
                                          onClick={() => handleViewDoctorLabSnapshot(lo.id)}
                                          icon={<Sparkles className="h-2.5 w-2.5 text-brand-600" />}
                                        >
                                          AI Clinical Snapshot
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Dialog>

      {/* 1. Drug Safety & Interaction Guard Dialog */}
      <Dialog
        open={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        title="AI Prescription Safety & Allergy Guard"
        description="Real-time multi-agent clinical evaluation of drug-drug interactions, patient allergies, and chronic condition risks."
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-500">
              Powered by {safetyResult?.ai_model_used || "OpenAI gpt-4o-mini & Clinical Rule Engine"}
            </span>
            <Button variant="secondary" onClick={() => setShowSafetyModal(false)}>
              Close Safety Report
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {safetyResult ? (
            <>
              {/* Overall Safety Status Banner */}
              <div
                className={`rounded-xl p-4 border flex items-center justify-between gap-3 ${
                  safetyResult.overall_safety === "CRITICAL_CONTRAINDICATION"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : safetyResult.overall_safety === "MODERATE_WARNING"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {safetyResult.overall_safety === "CRITICAL_CONTRAINDICATION" ? (
                    <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                  ) : safetyResult.overall_safety === "MODERATE_WARNING" ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {safetyResult.overall_safety === "CRITICAL_CONTRAINDICATION"
                        ? "CRITICAL CONTRAINDICATION DETECTED"
                        : safetyResult.overall_safety === "MODERATE_WARNING"
                        ? "MODERATE CLINICAL INTERACTIONS"
                        : "ALL MEDICATIONS VERIFIED SAFE"}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">{safetyResult.summary}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black">
                    {safetyResult.safety_score}
                    <span className="text-xs font-normal text-slate-500">/100</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Safety Score
                  </span>
                </div>
              </div>

              {/* Interaction Details List */}
              {safetyResult.interactions.length > 0 ? (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Flagged Interactions & Contraindications ({safetyResult.interactions.length})
                  </h4>
                  <div className="space-y-2">
                    {safetyResult.interactions.map((it, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 border text-xs space-y-1.5 ${
                          it.severity === "HIGH"
                            ? "border-red-200 bg-red-50/50"
                            : "border-amber-200 bg-amber-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {it.primary_item} &harr; {it.interacting_with}
                            </span>
                            <Badge
                              tone={
                                it.interaction_type === "DRUG_ALLERGY"
                                  ? "danger"
                                  : it.interaction_type === "DRUG_DISEASE"
                                  ? "warning"
                                  : "neutral"
                              }
                              className="text-[10px]"
                            >
                              {it.interaction_type === "DRUG_ALLERGY"
                                ? "Drug-Allergy"
                                : it.interaction_type === "DRUG_DISEASE"
                                ? "Disease Contraindication"
                                : "Drug-Drug"}
                            </Badge>
                          </div>
                          <Badge
                            tone={it.severity === "HIGH" ? "danger" : "warning"}
                            className="text-[10px]"
                          >
                            {it.severity} SEVERITY
                          </Badge>
                        </div>
                        <p className="text-slate-700">
                          <strong>Adverse Effect:</strong> {it.clinical_effect}
                        </p>
                        <p className="text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/80">
                          <strong>Clinical Recommendation:</strong> {it.clinical_recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-center text-xs text-emerald-800">
                  No interacting drug pairs, allergen matches, or disease contraindications found.
                </div>
              )}

              {/* Safer Alternatives */}
              {safetyResult.safer_alternatives.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5 text-xs text-blue-900">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Evidence-Based Safer Clinical Alternatives</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {safetyResult.safer_alternatives.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No safety report loaded yet.</p>
          )}
        </div>
      </Dialog>

      {/* 2. AI Clinical Copilot Dialog */}
      <Dialog
        open={showCopilotModal}
        onClose={() => setShowCopilotModal(false)}
        title="AI Clinical Copilot — Diagnostic & Lab Order Assistant"
        description="Real-time clinical reasoning based on patient chief complaint, duration, vitals, and chronic medical history."
        size="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-500">
              Model: {copilotResult?.ai_model_used || "OpenAI gpt-4o-mini"}
            </span>
            <Button variant="secondary" onClick={() => setShowCopilotModal(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {copilotResult ? (
            <>
              {/* Summary Assessment */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-xs space-y-1 text-indigo-950">
                <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-800 block">
                  Physician Assessment Overview
                </span>
                <p className="leading-relaxed">{copilotResult.summary_assessment}</p>
              </div>

              {/* Red Flag Warnings */}
              {copilotResult.red_flag_warnings.length > 0 && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 space-y-1.5 text-xs text-red-900">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Red Flag Clinical Alerts & Warning Signs</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    {copilotResult.red_flag_warnings.map((rf, i) => (
                      <li key={i} className="font-medium">{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Differential Diagnoses */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Suggested Differential Diagnoses</span>
                  <span className="text-[10px] font-normal text-slate-400">Click &quot;Apply Diagnosis&quot; to set workbench</span>
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {copilotResult.differential_diagnoses.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{d.diagnosis}</h5>
                          <Badge
                            tone={
                              d.likelihood === "HIGH"
                                ? "danger"
                                : d.likelihood === "brand"
                                ? "brand"
                                : "neutral"
                            }
                            className="text-[10px]"
                          >
                            {d.likelihood} LIKELIHOOD
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {d.clinical_rationale}
                        </p>
                        {d.recommended_tests.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Confirmatory Tests:
                            </span>
                            <span className="text-[11px] text-slate-700">
                              {d.recommended_tests.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            applyCopilotDiagnosis(d.diagnosis);
                            setShowCopilotModal(false);
                          }}
                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />}
                          className="text-xs font-semibold"
                        >
                          Apply Diagnosis
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Diagnostic Lab Tests */}
              {copilotResult.suggested_lab_orders.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Confirmatory Lab Tests & Imaging</span>
                    <span className="text-[10px] font-normal text-slate-400">Click &quot;+ Order Test&quot; to queue in visit</span>
                  </h4>
                  <div className="space-y-2">
                    {copilotResult.suggested_lab_orders.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{t.test_name}</span>
                            <Badge
                              tone={t.urgency === "STAT" ? "danger" : t.urgency === "URGENT" ? "warning" : "neutral"}
                              className="text-[10px]"
                            >
                              {t.urgency}
                            </Badge>
                          </div>
                          <p className="text-slate-600">{t.clinical_justification}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => applySuggestedLabOrder(t)}
                          icon={<Plus className="h-3.5 w-3.5" />}
                          className="shrink-0 self-end sm:self-center"
                        >
                          Order Test
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Exam Tips */}
              {copilotResult.recommended_physical_exams.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
                    Recommended Focal Physical Examinations
                  </span>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                    {copilotResult.recommended_physical_exams.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No copilot analysis generated yet.</p>
          )}
        </div>
      </Dialog>

      {/* 3. Ambient Voice-to-SOAP Scribe Dialog */}
      <Dialog
        open={showScribeModal}
        onClose={() => {
          stopVoiceRecording();
          setShowScribeModal(false);
        }}
        title="Ambient Voice-to-SOAP Clinical Scribe"
        description="Speak into your microphone or paste raw consultation dictation. AI structures it into SOAP notes and extracts medication orders automatically."
        size="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-500">
              Low-token GPT-4o-mini Ambient Parser
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  stopVoiceRecording();
                  setShowScribeModal(false);
                }}
              >
                Cancel
              </Button>
              {scribeResult && (
                <Button
                  onClick={handleApplyScribeToWorkbench}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Apply to Workbench
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Voice Dictation Input Panel */}
          <div className="rounded-2xl border border-purple-200 bg-linear-to-b from-purple-50/50 to-white p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-purple-500"}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  {isRecording ? "Listening to doctor dictation..." : "Dictation Speech-to-Text"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={stopVoiceRecording}
                    icon={<MicOff className="h-3.5 w-3.5" />}
                  >
                    Stop Listening
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={startVoiceRecording}
                    icon={<Mic className="h-3.5 w-3.5 text-purple-600" />}
                    className="border-purple-300 text-purple-900 hover:bg-purple-100"
                  >
                    Start Voice Dictation (Mic)
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setDictationText("")}
                  className="text-xs text-slate-500"
                >
                  Clear Text
                </Button>
              </div>
            </div>

            <Textarea
              label="Doctor Voice Dictation Transcript / Raw Notes"
              hideLabel
              placeholder="Speak into your microphone or type consultation details here... e.g.: Patient presents with severe sore throat and fever for 3 days. Vitals show mild pyrexia. Diagnosis: Acute Pharyngitis. Prescribe Amoxicillin 500mg twice daily for 5 days and Paracetamol 500mg as needed for fever. Advise warm water gargle and return in 5 days."
              value={dictationText}
              onChange={(e) => setDictationText(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleProcessVoiceToSoap}
                loading={scribeLoading}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
              >
                Structure into SOAP & Extract Rx
              </Button>
            </div>
          </div>

          {/* Scribe Result Preview */}
          {scribeResult && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-900">Structured Clinical SOAP Output</h4>
                </div>
                {scribeResult.suggested_diagnosis && (
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Diagnosis: </strong>
                    <span className="font-semibold text-brand-700">{scribeResult.suggested_diagnosis}</span>
                  </div>
                )}
              </div>

              {/* SOAP 4-Quadrant Preview */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                  <span className="font-black text-brand-700 uppercase tracking-wider text-[11px] block">
                    [S] Subjective
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{scribeResult.subjective}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                  <span className="font-black text-brand-700 uppercase tracking-wider text-[11px] block">
                    [O] Objective
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{scribeResult.objective}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                  <span className="font-black text-brand-700 uppercase tracking-wider text-[11px] block">
                    [A] Assessment
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{scribeResult.assessment}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
                  <span className="font-black text-brand-700 uppercase tracking-wider text-[11px] block">
                    [P] Plan
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{scribeResult.plan}</p>
                </div>
              </div>

              {/* Extracted Prescriptions */}
              {scribeResult.extracted_prescriptions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Extracted Prescription Items ({scribeResult.extracted_prescriptions.length})
                  </span>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-2.5 font-medium">Medicine</th>
                          <th className="p-2.5 font-medium">Dosage</th>
                          <th className="p-2.5 font-medium">Frequency</th>
                          <th className="p-2.5 font-medium">Duration</th>
                          <th className="p-2.5 font-medium">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scribeResult.extracted_prescriptions.map((rx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-900">{rx.medicine_name}</td>
                            <td className="p-2.5 text-slate-600">{rx.dosage}</td>
                            <td className="p-2.5 text-slate-600">{rx.frequency}</td>
                            <td className="p-2.5 text-slate-600">{rx.duration}</td>
                            <td className="p-2.5 text-slate-600">{rx.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Special Instructions & Follow-up */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
                {scribeResult.suggested_special_instructions && (
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px] block mb-1">
                      Patient Advice:
                    </span>
                    <p className="text-slate-700">{scribeResult.suggested_special_instructions}</p>
                  </div>
                )}
                {scribeResult.suggested_follow_up_days && (
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px] block mb-1">
                      Recommended Follow-up:
                    </span>
                    <p className="text-slate-700">After {scribeResult.suggested_follow_up_days} days</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* AI Diagnostic Lab Report Simplifier Dialog (Clinician Snapshot) */}
      <LabReportSimplifierModal
        open={showDoctorLabAiModal}
        onClose={() => setShowDoctorLabAiModal(false)}
        data={doctorLabAiReport}
        defaultPerspective="clinician"
      />
    </div>
  );
}
