"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Clock,
  Plus,
  RefreshCw,
  UserCheck,
  Search,
  Filter,
  User,
  ShieldAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Alert,
  LoadingState,
  Modal,
  useToast,
} from "@/components/ui";
import { Appointment, PatientVitalsLog, EmergencyAlertResponse } from "@/types";
import { EmergencyTriggerButton } from "@/components/emergency/EmergencyTriggerButton";
import { formatDate } from "@/lib/utils";

export default function NurseConsolePage() {
  const toast = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWard, setSelectedWard] = useState("ALL");

  // Vitals logging modal
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("75");
  const [spo2, setSpo2] = useState("98");
  const [respiratoryRate, setRespiratoryRate] = useState("16");
  const [temperature, setTemperature] = useState("98.6");
  const [glucose, setGlucose] = useState("");
  const [consciousness, setConsciousness] = useState("ALERT");
  const [vitalsNotes, setVitalsNotes] = useState("");
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);
  const [recentVitalsLog, setRecentVitalsLog] = useState<PatientVitalsLog | null>(null);

  const fetchData = async () => {
    try {
      const [apts, alerts] = await Promise.all([
        apiFetch<Appointment[]>("/appointments/").catch(() => []),
        apiFetch<EmergencyAlertResponse[]>("/emergency/active").catch(() => []),
      ]);
      setAppointments(apts);
      setActiveAlerts(alerts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenVitalsModal = (apt: Appointment) => {
    setSelectedApt(apt);
    setVitalsError(null);
    setRecentVitalsLog(null);
    setVitalsModalOpen(true);
  };

  const handleRecordVitals = async () => {
    if (!selectedApt) return;
    try {
      setVitalsSubmitting(true);
      setVitalsError(null);

      const payload = {
        appointment_id: selectedApt.id,
        systolic_bp: systolic ? parseInt(systolic) : undefined,
        diastolic_bp: diastolic ? parseInt(diastolic) : undefined,
        heart_rate: heartRate ? parseInt(heartRate) : undefined,
        spo2_percentage: spo2 ? parseFloat(spo2) : undefined,
        respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        temperature_f: temperature ? parseFloat(temperature) : undefined,
        blood_glucose_mg_dl: glucose ? parseFloat(glucose) : undefined,
        consciousness_level: consciousness,
        clinical_notes: vitalsNotes.trim() || undefined,
      };

      const result = await apiFetch<PatientVitalsLog>(
        `/patients/${selectedApt.patient_id}/vitals`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setRecentVitalsLog(result);
      toast({
        title: "Vitals Recorded",
        description: `Successfully documented vitals for ${selectedApt.patient?.full_name || "Patient"}. MEWS: ${result.mews_score ?? "Normal"}.`,
        tone: "success",
      });

      setTimeout(() => {
        setVitalsModalOpen(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setVitalsError(err?.message || "Failed to log vitals");
    } finally {
      setVitalsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const pName = a.patient?.full_name?.toLowerCase() || "";
    const token = String(a.token_number || "").toLowerCase();
    const doctor = a.doctor?.user?.full_name?.toLowerCase() || "";
    const matchesSearch =
      pName.includes(searchTerm.toLowerCase()) ||
      token.includes(searchTerm.toLowerCase()) ||
      doctor.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <LoadingState label="Loading nursing station console…" />;
  }

  const activePatientsCount = appointments.filter(
    (a) => a.status === "CHECKED_IN" || a.status === "IN_CONSULTATION"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nursing Station & Bedside Care"
        title="Inpatient Care & Emergency Command"
        description="Monitor inpatient vitals, assess clinical deterioration scores, and trigger hospital emergency color codes."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchData();
              }}
              loading={refreshing}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <EmergencyTriggerButton ward="ICU — Intensive Care Unit" />
          </div>
        }
      />

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Patients
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{activePatientsCount}</div>
          <span className="text-xs text-slate-400">Under care today</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            In Consultations
          </span>
          <div className="text-2xl font-bold text-brand-600 mt-1">
            {appointments.filter((a) => a.status === "IN_CONSULTATION").length}
          </div>
          <span className="text-xs text-slate-400">Doctor rooms</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Emergency Codes
          </span>
          <div
            className={`text-2xl font-black mt-1 ${
              activeAlerts.length > 0 ? "text-red-600 animate-pulse" : "text-emerald-600"
            }`}
          >
            {activeAlerts.length}
          </div>
          <span className="text-xs text-slate-400">
            {activeAlerts.length > 0 ? "Urgent hospital response" : "Hospital all clear"}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed Visits
          </span>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {appointments.filter((a) => a.status === "COMPLETED").length}
          </div>
          <span className="text-xs text-slate-400">Discharged</span>
        </div>
      </div>

      {/* ACTIVE EMERGENCY CODES HIGHLIGHT */}
      {activeAlerts.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-red-900 font-extrabold text-base">
              <Siren className="h-6 w-6 text-red-600 animate-bounce" />
              <span>ACTIVE HOSPITAL EMERGENCY CODES ({activeAlerts.length})</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-3 py-1 rounded-full">
              High Priority
            </span>
          </div>

          <div className="space-y-3">
            {activeAlerts.map((alt) => (
              <div
                key={alt.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 border border-red-200 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase text-white bg-slate-900">
                    {alt.code_name}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">
                      📍 {alt.ward} {alt.location_details ? `— ${alt.location_details}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Triggered by: {alt.triggered_by_name} • {new Date(alt.triggered_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {alt.responders.length} Responders En Route
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PATIENT CARE & VITALS TABLE */}
      <Card>
        <CardHeader
          title="Patient Intake & Vitals Monitoring"
          description="Log vitals signs, check MEWS scores, and manage bedside care."
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, token, doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none w-56"
                />
              </div>
            </div>
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Visit Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                      No patients found in queue.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {apt.token_number || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {apt.patient?.full_name || "Patient"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {apt.patient?.phone || apt.patient?.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">
                          Dr. {apt.doctor?.user?.full_name || "Assigned"}
                        </span>
                        <div className="text-xs text-slate-400">
                          Room {apt.doctor?.room_number || "OPD"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="neutral">{apt.chief_complaint || "Consultation"}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          tone={
                            apt.status === "IN_CONSULTATION"
                              ? "brand"
                              : apt.status === "CHECKED_IN"
                              ? "success"
                              : apt.status === "COMPLETED"
                              ? "neutral"
                              : "warning"
                          }
                        >
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenVitalsModal(apt)}
                          icon={<HeartPulse className="h-4 w-4 text-red-500" />}
                          className="text-xs font-semibold"
                        >
                          Log Vitals
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* RECORD VITALS MODAL */}
      {selectedApt && (
        <Modal
          open={vitalsModalOpen}
          onClose={() => setVitalsModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-600" />
              <span>Log Vitals: {selectedApt.patient?.full_name}</span>
            </div>
          }
          description={`Record physiological vitals to calculate MEWS early warning score (Token: ${selectedApt.token_number}).`}
          size="lg"
        >
          <div className="space-y-4">
            {vitalsError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{vitalsError}</p>
              </div>
            )}

            {recentVitalsLog && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium">
                <p className="font-bold">✓ Vitals Logged Successfully!</p>
                <p className="mt-1">
                  MEWS Early Warning Score: <strong>{recentVitalsLog.mews_score ?? "Normal"}</strong> —{" "}
                  {recentVitalsLog.triage_level || "ROUTINE"}
                </p>
                {recentVitalsLog.ai_analysis && (
                  <p className="mt-1 text-slate-700 italic">{recentVitalsLog.ai_analysis}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Blood Pressure (mmHg)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Sys (120)"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="Dia (80)"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  placeholder="75"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Respiratory Rate (/min)
                </label>
                <input
                  type="number"
                  placeholder="16"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  placeholder="110 (optional)"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Consciousness Level (AVPU)
              </label>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
              >
                <option value="ALERT">Alert (Normal)</option>
                <option value="VOICE">Responds to Voice</option>
                <option value="PAIN">Responds to Pain</option>
                <option value="UNRESPONSIVE">Unresponsive (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Clinical Observations / Notes
              </label>
              <textarea
                rows={2}
                value={vitalsNotes}
                onChange={(e) => setVitalsNotes(e.target.value)}
                placeholder="e.g., Patient complaining of mild dizziness upon standing. Hydrated well."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setVitalsModalOpen(false)}
                disabled={vitalsSubmitting}
              >
                Close
              </Button>
              <Button
                onClick={handleRecordVitals}
                loading={vitalsSubmitting}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Save Vitals Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
