"use client";

import React, { useState, useEffect } from "react";
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
  Siren,
  FileText,
  User,
  HeartPulse,
  Activity,
  Sparkles,
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
  EmptyState,
  useToast,
} from "@/components/ui";
import {
  DoctorProfile,
  QueueEntry,
  DoctorLiveQueueSummary,
  LabTestCatalog,
  PrescriptionItem,
  PharmacyMedicine,
  PatientVitalsLog,
} from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function DoctorCabinPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [queueSummary, setQueueSummary] = useState<DoctorLiveQueueSummary | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>([]);
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Session Workbench State
  const [activeQueueEntry, setActiveQueueEntry] = useState<QueueEntry | null>(null);
  const [activePatientVitals, setActivePatientVitals] = useState<PatientVitalsLog | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [showVitalsForm, setShowVitalsForm] = useState(false);

  // In-cabin quick vitals entry form
  const [vitalsBP, setVitalsBP] = useState("120/80");
  const [vitalsHR, setVitalsHR] = useState("72");
  const [vitalsSpO2, setVitalsSpO2] = useState("98");
  const [vitalsRR, setVitalsRR] = useState("16");
  const [vitalsTemp, setVitalsTemp] = useState("98.6");
  const [vitalsGlucose, setVitalsGlucose] = useState("");
  const [recordingVitals, setRecordingVitals] = useState(false);

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [highlights, setHighlights] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Prescriptions & Lab Order Rows
  const [prescriptions, setPrescriptions] = useState<
    Array<{
      medicine_name: string;
      is_custom?: boolean;
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
  const [notice, setNotice] = useState<string | null>(null);

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

      // Fetch today's appointment queue for this doctor
      const allAppointments = await apiFetch<any[]>("/appointments/").catch(() => []);
      const docApts = allAppointments.filter((a) => a.doctor_id === docId);
      // Map to pseudo QueueEntry if needed or display appointments
      setQueueEntries(
        docApts.map((a) => ({
          id: a.id,
          appointment_id: a.id,
          doctor_id: a.doctor_id,
          patient_id: a.patient_id,
          queue_date: a.appointment_date,
          token_number: a.token_number,
          status: a.status === "IN_CONSULTATION" ? "IN_CONSULTATION" : a.status === "CHECKED_IN" ? "WAITING" : "WAITING",
          is_priority: false,
          check_in_time: a.slot_time,
          patient: a.patient,
          appointment: a,
        }))
      );
    } catch (e) {
      console.error(e);
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

  // Call Next Patient
  const handleCallNext = async () => {
    if (!selectedDoctorId) return;
    setCallingNext(true);
    try {
      const res = await apiFetch("/queue/call-patient", {
        method: "POST",
        body: JSON.stringify({ doctor_id: selectedDoctorId }),
      });
      toast({
        title: "Patient Called",
        description: `Token #${res.token_number} called to Room ${selectedDoctor?.room_number || "Cabin"}.`,
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

  // Fetch patient vitals when an active consultation opens
  const fetchActivePatientVitals = async (patientId: string) => {
    if (!patientId) return;
    setVitalsLoading(true);
    try {
      const data = await apiFetch<PatientVitalsLog>(`/vitals/patient/${patientId}/latest`).catch(() => null);
      setActivePatientVitals(data);
      if (data) {
        setVitalsBP(`${data.systolic_bp}/${data.diastolic_bp}`);
        setVitalsHR(`${data.heart_rate}`);
        setVitalsSpO2(`${data.spo2}`);
        setVitalsRR(`${data.respiratory_rate}`);
        setVitalsTemp(`${data.temperature_f}`);
        setVitalsGlucose(data.blood_glucose ? `${data.blood_glucose}` : "");
      }
    } finally {
      setVitalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeQueueEntry?.patient_id) {
      fetchActivePatientVitals(activeQueueEntry.patient_id);
    } else {
      setActivePatientVitals(null);
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

  // Add prescription row using pharmacy catalog
  const addPrescription = () => {
    const firstMed = medicines[0];
    setPrescriptions([
      ...prescriptions,
      {
        medicine_name: firstMed ? firstMed.name : "",
        is_custom: false,
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
      setPrescriptions([]);
      setSelectedLabTests([]);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Consultation Console"
        title="Doctor Cabin & EHR Workbench"
        description="Call patients from today's queue, record SOAP clinical notes, and dispatch electronic prescriptions in real time."
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
                    className={`rounded-xl border p-3.5 transition flex items-center justify-between ${
                      isActive
                        ? "border-brand-500 bg-brand-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-brand-600">
                          #{q.token_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                          {q.patient?.full_name || "Patient"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{q.check_in_time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isActive ? "primary" : "secondary"}
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
                  <Badge tone="brand">In Consultation</Badge>
                }
              />
              <CardBody className="space-y-5">
                {/* Patient Vitals & Clinical Acuity Banner */}
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
                      No baseline vitals recorded at triage desk. Click "Record Vitals" to take readings now.
                    </p>
                  )}

                  {activePatientVitals?.ai_analysis && (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-2.5 text-xs text-brand-950 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-brand-900">AI Triage Acuity Assessment: </span>
                        <span>{activePatientVitals.ai_analysis}</span>
                        {activePatientVitals.clinical_recommendation && (
                          <p className="text-[11px] text-brand-800 mt-0.5 font-medium">
                            Clinical Recommendation: {activePatientVitals.clinical_recommendation}
                          </p>
                        )}
                      </div>
                    </div>
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

                {/* Chief Complaint & Symptoms */}
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

                {/* Primary Diagnosis */}
                <Input
                  label="Clinical Diagnosis (Required)"
                  placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />

                {/* Clinical Notes & Instructions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Textarea
                    label="Clinical Examination Notes"
                    placeholder="Observations, auscultation findings, vitals correlation..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    label="Special Instructions & Advice"
                    placeholder="Dietary changes, rest protocol, warning symptoms..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Red Flags / Allergy Highlights"
                    placeholder="e.g. Penicillin allergy, diabetic caution"
                    value={highlights}
                    onChange={(e) => setHighlights(e.target.value)}
                  />
                  <Input
                    label="Follow-up Date"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                {/* Prescription Items Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-brand-600" />
                      Prescribe Medications (Pharmacy Catalog)
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={addPrescription}
                      icon={<Plus className="h-3.5 w-3.5" />}
                    >
                      Add Medicine
                    </Button>
                  </div>

                  {prescriptions.map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2"
                    >
                      <div className="grid gap-2 sm:grid-cols-5">
                        <div className="sm:col-span-2">
                          {!p.is_custom ? (
                            <Select
                              label="Medicine"
                              hideLabel
                              value={p.medicine_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...prescriptions];
                                if (val === "__CUSTOM__") {
                                  updated[idx].is_custom = true;
                                  updated[idx].medicine_name = "";
                                } else {
                                  updated[idx].medicine_name = val;
                                  const found = medicines.find((m) => m.name === val);
                                  if (found && !updated[idx].dosage) {
                                    updated[idx].dosage = `1 ${found.dosage_form?.toLowerCase() || "tab"}`;
                                  }
                                }
                                setPrescriptions(updated);
                              }}
                              options={[
                                { value: "", label: "Select Medicine from Pharmacy..." },
                                ...medicines.map((m) => ({
                                  value: m.name,
                                  label: `${m.name} (${m.generic_name}) · Stock: ${m.stock_quantity}`,
                                })),
                                { value: "__CUSTOM__", label: "✍️ Other Medicine (Manual Entry)..." },
                              ]}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Input
                                label="Custom Medicine Name"
                                hideLabel
                                placeholder="Type medicine name..."
                                value={p.medicine_name}
                                onChange={(e) => {
                                  const updated = [...prescriptions];
                                  updated[idx].medicine_name = e.target.value;
                                  setPrescriptions(updated);
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const updated = [...prescriptions];
                                  updated[idx].is_custom = false;
                                  updated[idx].medicine_name = medicines[0]?.name || "";
                                  setPrescriptions(updated);
                                }}
                                title="Back to catalog dropdown"
                              >
                                Catalog
                              </Button>
                            </div>
                          )}
                        </div>

                        <Input
                          label="Dosage"
                          hideLabel
                          placeholder="Dosage (e.g. 500mg)"
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
                    </div>
                  ))}
                </div>

                {/* Lab Diagnostic Tests Orders */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4 text-brand-600" />
                      Order Diagnostic Tests
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
    </div>
  );
}
