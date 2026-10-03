"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  LinkButton,
  Input,
  Select,
  Textarea,
  Badge,
  Alert,
  LoadingState,
  useToast,
} from "@/components/ui";
import { Appointment, PatientVitalsLog } from "@/types";

export default function ReceptionTriagePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialAptId = searchParams.get("aptId") || "";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState(initialAptId);
  const [loading, setLoading] = useState(true);

  // Vitals State
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("75");
  const [spo2, setSpo2] = useState("98");
  const [respiratoryRate, setRespiratoryRate] = useState("16");
  const [temperature, setTemperature] = useState("98.6");
  const [glucose, setGlucose] = useState("");
  const [consciousness, setConsciousness] = useState("ALERT");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<PatientVitalsLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApts() {
      try {
        const data = await apiFetch<Appointment[]>("/appointments/").catch(() => []);
        setAppointments(data);
        if (!selectedAptId && data.length > 0) {
          setSelectedAptId(data[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    loadApts();
  }, []);

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptId) {
      setError("Please select a patient from the queue.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<PatientVitalsLog>("/vitals/compounder-intake", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: selectedAptId,
          systolic_bp: parseFloat(systolic),
          diastolic_bp: parseFloat(diastolic),
          heart_rate: parseInt(heartRate),
          spo2: parseFloat(spo2),
          respiratory_rate: parseInt(respiratoryRate),
          temperature_f: parseFloat(temperature),
          blood_glucose: glucose ? parseFloat(glucose) : undefined,
          consciousness_level: consciousness,
          symptoms_notes: notes || undefined,
        }),
      });

      setTriageResult(res);
      toast({
        title: "Triage Intake Recorded",
        description: `MEWS Score: ${res.mews_score} (${res.triage_level})`,
        tone: res.is_critical ? "warning" : "success",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to record triage intake.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading triage intake desk…" />;
  }

  const selectedApt = appointments.find((a) => a.id === selectedAptId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Pre-Consultation Intake"
        title="Patient Vitals & MEWS Triage"
        description="Record baseline vitals at reception. The system automatically scores MEWS and elevates emergency queue tokens if abnormal."
        actions={
          <LinkButton href="/compounder" variant="secondary">
            Back to Queue
          </LinkButton>
        }
      />

      {error && (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Result Card */}
      {triageResult && (
        <Card className={triageResult.is_critical ? "border-red-300 bg-red-50/20" : "border-emerald-300 bg-emerald-50/20"}>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                {triageResult.is_critical ? (
                  <Siren className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                <span>Triage Scoring Complete</span>
              </div>
            }
            action={
              <Badge tone={triageResult.is_critical ? "danger" : "success"}>
                MEWS Score: {triageResult.mews_score} ({triageResult.triage_level})
              </Badge>
            }
          />
          <CardBody className="space-y-3">
            {triageResult.is_critical && (
              <Alert tone="danger" title="Immediate Priority Elevation">
                Patient exhibits acute physiological instability. Their queue token has been automatically elevated to Emergency Priority on doctor cabin screens.
              </Alert>
            )}

            {triageResult.clinical_recommendation && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700">
                <strong className="text-slate-900 block mb-1">Clinical Protocol:</strong>
                {triageResult.clinical_recommendation}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Triage Form */}
      <Card>
        <form onSubmit={handleTriageSubmit}>
          <CardHeader
            title="Triage Intake Form"
            description="Select the scheduled patient and measure physical vital parameters"
          />
          <CardBody className="space-y-5">
            <Select
              label="Select Patient from Queue"
              value={selectedAptId}
              onChange={(e) => {
                setSelectedAptId(e.target.value);
                setTriageResult(null);
              }}
              options={appointments.map((a) => ({
                value: a.id,
                label: `Token #${a.token_number} — ${a.patient?.full_name || "Patient"} (${a.doctor?.user?.full_name || "Doctor"})`,
              }))}
              required
            />

            {selectedApt && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Assigned Cabin: </span>
                {selectedApt.doctor?.user?.full_name} (Room {selectedApt.doctor?.room_number})
                {selectedApt.chief_complaint && (
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800">Complaint: </span>
                    {selectedApt.chief_complaint}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Systolic BP (mmHg)"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                required
              />
              <Input
                label="Diastolic BP (mmHg)"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                required
              />
              <Input
                label="Heart Rate (BPM)"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                required
              />
              <Input
                label="Oxygen SpO2 (%)"
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Respiratory Rate"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                required
              />
              <Input
                label="Temperature (°F)"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                required
              />
              <Input
                label="Glucose (mg/dL)"
                type="number"
                placeholder="Optional"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
              />
              <Select
                label="Consciousness (AVPU)"
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value)}
                options={[
                  { value: "ALERT", label: "Alert (A)" },
                  { value: "VOICE", label: "Voice (V)" },
                  { value: "PAIN", label: "Pain (P)" },
                  { value: "UNRESPONSIVE", label: "Unresponsive (U)" },
                ]}
              />
            </div>

            <Textarea
              label="Pre-Consultation Observations"
              placeholder="e.g. Patient appears pale, diaphoretic, complaining of chest heaviness..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              loading={submitting}
              icon={<HeartPulse className="h-4 w-4" />}
            >
              Calculate MEWS & Submit Intake
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
