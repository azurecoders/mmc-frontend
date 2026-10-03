"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
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
  Alert,
  LoadingState,
  useToast,
} from "@/components/ui";
import { PatientVitalsLog } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function PatientVitalsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [spo2, setSpo2] = useState("98");
  const [respiratoryRate, setRespiratoryRate] = useState("16");
  const [temperature, setTemperature] = useState("98.6");
  const [glucose, setGlucose] = useState("");
  const [consciousness, setConsciousness] = useState("ALERT");
  const [symptoms, setSymptoms] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [vitalsResult, setVitalsResult] = useState<PatientVitalsLog | null>(null);
  const [history, setHistory] = useState<PatientVitalsLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<PatientVitalsLog[]>(`/vitals/patient/${user.id}/history`).catch(() => []);
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<PatientVitalsLog>("/vitals/patient-log", {
        method: "POST",
        body: JSON.stringify({
          systolic_bp: parseInt(systolic, 10) || 120,
          diastolic_bp: parseInt(diastolic, 10) || 80,
          heart_rate: parseInt(heartRate, 10) || 72,
          spo2: parseFloat(spo2) || 98.0,
          respiratory_rate: parseInt(respiratoryRate, 10) || 16,
          temperature_f: parseFloat(temperature) || 98.6,
          blood_glucose: glucose ? parseFloat(glucose) : undefined,
          consciousness_level: consciousness,
          symptoms_notes: symptoms.trim() || undefined,
        }),
      });

      setVitalsResult(res);
      toast({
        title: "Vitals Evaluated & Stored",
        description: `Triage Assessment: ${res.triage_level} (MEWS: ${res.mews_score})`,
        tone: res.is_critical ? "warning" : "success",
      });
      await loadHistory();
    } catch (err: any) {
      setError(err?.message || "Failed to submit vitals for evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Early Warning System"
        title="Health Check & Vitals Triage"
        description="Log your daily vital signs. Our AI and clinical MEWS algorithms assess physiological risk and cross-reference your medical history."
      />

      {error && (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* AI Evaluation Result Card */}
      {vitalsResult && (
        <Card className={vitalsResult.is_critical ? "border-red-300 bg-red-50/30" : "border-emerald-300 bg-emerald-50/20"}>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                {vitalsResult.is_critical ? (
                  <Siren className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                <span>AI Clinical Triage Assessment</span>
              </div>
            }
            action={
              <Badge tone={vitalsResult.is_critical ? "danger" : "success"}>
                {vitalsResult.triage_level} Risk (MEWS Score: {vitalsResult.mews_score})
              </Badge>
            }
          />
          <CardBody className="space-y-4">
            {vitalsResult.is_critical && (
              <Alert tone="danger" title="Urgent Clinical Attention Advised">
                Your physiological readings indicate acute distress.
                {vitalsResult.doctor_name
                  ? ` Your attending consultant (${vitalsResult.doctor_name}) has been notified in real time.`
                  : " Please proceed to hospital triage or emergency immediately."}
              </Alert>
            )}

            {vitalsResult.ai_analysis && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Gemma 31B Contextual Analysis
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {vitalsResult.ai_analysis}
                </p>
              </div>
            )}

            {vitalsResult.clinical_recommendation && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Clinical Recommendation
                </span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {vitalsResult.clinical_recommendation}
                </p>
              </div>
            )}

            {vitalsResult.risk_factors_detected && vitalsResult.risk_factors_detected.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-500 mr-1">Correlated Risks:</span>
                {vitalsResult.risk_factors_detected.map((r, i) => (
                  <Badge key={i} tone="warning">{r}</Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Vitals Input Form */}
      <Card>
        <form onSubmit={handleSubmitVitals}>
          <CardHeader
            title="Log Current Vital Signs"
            description="Enter readings measured via home monitors or clinical devices"
          />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Systolic BP (mmHg)"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                hint="Normal: 90 - 120"
                required
              />
              <Input
                label="Diastolic BP (mmHg)"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                hint="Normal: 60 - 80"
                required
              />
              <Input
                label="Heart Rate (BPM)"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                hint="Normal: 60 - 100"
                required
              />
              <Input
                label="Oxygen SpO2 (%)"
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                hint="Normal: 95 - 100%"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Respiratory Rate (Breaths/min)"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                hint="Normal: 12 - 20"
                required
              />
              <Input
                label="Temperature (°F)"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                hint="Normal: 97.8 - 99.1"
                required
              />
              <Input
                label="Blood Glucose (mg/dL)"
                type="number"
                placeholder="e.g. 110"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                hint="Optional (Fasting/Random)"
              />
              <Select
                label="Consciousness Level (AVPU)"
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value)}
                options={[
                  { value: "ALERT", label: "Alert & Responsive (A)" },
                  { value: "VOICE", label: "Responds to Voice (V)" },
                  { value: "PAIN", label: "Responds to Pain (P)" },
                  { value: "UNRESPONSIVE", label: "Unresponsive (U)" },
                ]}
              />
            </div>

            <Textarea
              label="Associated Symptoms or Notes"
              placeholder="e.g. Feeling lightheaded after breakfast, mild chest tightness since morning..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={2}
            />
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              loading={submitting}
              icon={<HeartPulse className="h-4 w-4" />}
            >
              {submitting ? "Evaluating Health Status..." : "Run Clinical AI Evaluation"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Historical Vitals Table */}
      <Card>
        <CardHeader
          title="Past Vitals Timeline"
          description="Historical readings and calculated MEWS early warning scores"
        />
        <CardBody>
          {historyLoading ? (
            <LoadingState label="Loading vitals history…" />
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No vital logs recorded yet. Submit your first reading above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th scope="col" className="py-2.5 font-medium">Date & Time</th>
                    <th scope="col" className="py-2.5 font-medium">BP (mmHg)</th>
                    <th scope="col" className="py-2.5 font-medium">Pulse</th>
                    <th scope="col" className="py-2.5 font-medium">SpO2</th>
                    <th scope="col" className="py-2.5 font-medium">Temp</th>
                    <th scope="col" className="py-2.5 font-medium">MEWS Score</th>
                    <th scope="col" className="py-2.5 font-medium">Triage Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 text-slate-700">
                        {log.systolic_bp}/{log.diastolic_bp}
                      </td>
                      <td className="py-3 text-slate-700">{log.heart_rate} bpm</td>
                      <td className="py-3 text-slate-700">{log.spo2}%</td>
                      <td className="py-3 text-slate-700">{log.temperature_f}°F</td>
                      <td className="py-3 font-bold text-slate-900">{log.mews_score}</td>
                      <td className="py-3">
                        <Badge tone={log.is_critical ? "danger" : "brand"}>
                          {log.triage_level}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
