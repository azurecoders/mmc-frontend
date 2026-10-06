"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  Stethoscope,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  AlertTriangle,
  Info,
  CheckCircle2,
  Apple,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  LoadingState,
  Dialog,
  useToast,
  LabReportSimplifierModal,
} from "@/components/ui";
import {
  Consultation,
  PrescriptionExplanationResponse,
  LabReportSimplificationResponse,
} from "@/types";
import { formatDate } from "@/lib/utils";

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI Prescription Explainer state
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [activeExplanation, setActiveExplanation] = useState<PrescriptionExplanationResponse | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  // AI Lab Report Simplifier state
  const [simplifyingLabOrderId, setSimplifyingLabOrderId] = useState<string | null>(null);
  const [activeLabAiReport, setActiveLabAiReport] = useState<LabReportSimplificationResponse | null>(null);
  const [isLabAiModalOpen, setIsLabAiModalOpen] = useState(false);

  const handleExplainLabReport = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSimplifyingLabOrderId(orderId);
    try {
      const data = await apiFetch<LabReportSimplificationResponse>(
        `/lab/orders/${orderId}/simplify-report`,
        { method: "POST" }
      );
      setActiveLabAiReport(data);
      setIsLabAiModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to generate AI explanation at this time.";
      toast({
        tone: "error",
        title: "Could not generate AI lab report explanation",
        description: message,
      });
    } finally {
      setSimplifyingLabOrderId(null);
    }
  };

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const data = await apiFetch<Consultation[]>(`/consultations/patient/${user.id}/history`).catch(() => []);
        setConsultations(data);
        if (data.length > 0) {
          setExpandedId(data[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const handleExplainPrescription = async (consultationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExplainingId(consultationId);
    try {
      const data = await apiFetch<PrescriptionExplanationResponse>(
        `/consultations/${consultationId}/explain-prescription`,
        { method: "POST" }
      );
      setActiveExplanation(data);
      setIsExplanationOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to generate AI explanation at this time.";
      toast({
        tone: "error",
        title: "Could not generate AI explanation",
        description: message,
      });
    } finally {
      setExplainingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your prescriptions and consultation records…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Electronic Health Records"
        title="Visits & Prescriptions"
        description="Inspect all finalized doctor consultations, structured medication prescriptions, AI plain-language explanations, and diagnostic lab test reports."
      />

      {consultations.length === 0 ? (
        <Card className="p-8 text-center">
          <Pill className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">No medical consultations recorded</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Once you visit a physician and your consultation is finalized, prescriptions and diagnostic orders will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => {
            const isExpanded = expandedId === c.id;
            const hasMedications = (c.prescription_items?.length || 0) > 0;

            return (
              <Card key={c.id} className="overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(isExpanded ? null : c.id);
                    }
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/50 cursor-pointer transition gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-brand-600" />
                      <span className="font-semibold text-slate-900 text-sm">
                        {c.doctor?.user?.full_name || "Doctor"}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({c.doctor?.specialization || "General Specialist"})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-800">Diagnosis:</strong> {c.diagnosis}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span>{formatDate(c.created_at)}</span>
                      <span>&bull;</span>
                      <span>{c.prescription_items?.length || 0} Medications</span>
                      <span>&bull;</span>
                      <span>{c.lab_orders?.length || 0} Lab Tests</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                    <Link
                      href={`/patient/lifestyle?consultationId=${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
                    >
                      <Apple className="h-3.5 w-3.5 text-emerald-600" />
                      <span>7-Day Diet Plan</span>
                    </Link>
                    {hasMedications && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border-brand-200"
                        loading={explainingId === c.id}
                        onClick={(e) => handleExplainPrescription(c.id, e)}
                        icon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />}
                      >
                        Explain (AI)
                      </Button>
                    )}
                    <Badge tone={c.is_finalized ? "success" : "warning"}>
                      {c.is_finalized ? "Finalized Visit" : "In Progress"}
                    </Badge>
                    <span className="p-1 rounded-md text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/40 space-y-6">
                    {/* Diet & Lifestyle Action Banner */}
                    <div className="rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50/70 via-teal-50/50 to-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs shrink-0">
                          <Apple className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">
                            Personalized 7-Day Diet & Lifestyle Plan for {c.diagnosis}
                          </span>
                          <span className="text-[11px] text-emerald-800 block">
                            Customized meal menus, foods to avoid with healthy substitutes, and hydration targets tailored to this visit.
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/patient/lifestyle?consultationId=${c.id}`}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs shrink-0"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>View 7-Day Plan</span>
                      </Link>
                    </div>

                    {/* Clinical Notes & Instructions */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {c.clinical_notes && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Doctor&apos;s Clinical Notes
                          </span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                            {c.clinical_notes}
                          </p>
                        </div>
                      )}

                      {c.special_instructions && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Special Instructions / Advice
                          </span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                            {c.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Prescriptions Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-brand-600" />
                          <span>Prescribed Medications ({c.prescription_items?.length || 0})</span>
                        </h3>
                        {hasMedications && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2.5 gap-1 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200 font-medium"
                            loading={explainingId === c.id}
                            onClick={(e) => handleExplainPrescription(c.id, e)}
                            icon={<Sparkles className="h-3 w-3 text-brand-600" />}
                          >
                            Explain with OpenAI
                          </Button>
                        )}
                      </div>

                      {c.prescription_items?.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No medications prescribed for this visit.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                              <tr>
                                <th scope="col" className="p-3 font-medium">Medicine</th>
                                <th scope="col" className="p-3 font-medium">Dosage</th>
                                <th scope="col" className="p-3 font-medium">Frequency</th>
                                <th scope="col" className="p-3 font-medium">Duration</th>
                                <th scope="col" className="p-3 font-medium">Instructions</th>
                                <th scope="col" className="p-3 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {c.prescription_items?.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 font-semibold text-slate-900">{item.medicine_name}</td>
                                  <td className="p-3 text-slate-600">{item.dosage}</td>
                                  <td className="p-3 text-slate-600">{item.frequency}</td>
                                  <td className="p-3 text-slate-600">{item.duration}</td>
                                  <td className="p-3 text-slate-500">{item.instructions || "—"}</td>
                                  <td className="p-3">
                                    <Badge tone={statusTone(item.dispense_status)}>
                                      {item.dispense_status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Diagnostic Lab Orders */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FlaskConical className="h-3.5 w-3.5 text-brand-600" />
                        <span>Diagnostic Laboratory Tests</span>
                      </h3>
                      {c.lab_orders?.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No diagnostic tests ordered.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {c.lab_orders?.map((ord) => (
                            <div
                              key={ord.id}
                              className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {ord.test?.name || "Diagnostic Panel"}
                                </span>
                                <Badge tone={statusTone(ord.status)}>{ord.status.replace("_", " ")}</Badge>
                              </div>
                              {ord.instructions && (
                                <p className="text-xs text-slate-500">
                                  Instructions: {ord.instructions}
                                </p>
                              )}
                              {ord.result && (
                                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs mt-2 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-800">Lab Findings:</span>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="h-6 text-[11px] px-2 gap-1 text-brand-700 bg-brand-50 hover:bg-brand-100 border-brand-200 font-medium"
                                      loading={simplifyingLabOrderId === ord.id}
                                      onClick={(e) => handleExplainLabReport(ord.id, e)}
                                      icon={<Sparkles className="h-2.5 w-2.5 text-brand-600" />}
                                    >
                                      ✨ Explain with AI
                                    </Button>
                                  </div>
                                  <p className="text-slate-600 leading-relaxed">{ord.result.result_summary}</p>
                                  {ord.result.is_abnormal && (
                                    <Badge tone="danger" className="mt-1">
                                      Abnormal Result: {ord.result.critical_alert || "Attention needed"}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Prescription Explanation Modal */}
      <Dialog
        open={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        title="AI Prescription Explainer"
        description="Plain-English explanation of your medicines, when and how to take them, food interactions, and precautions."
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-slate-400">
              Engine: {activeExplanation?.ai_model_used || "gpt-4o-mini"}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setIsExplanationOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {activeExplanation && (
          <div className="space-y-6">
            {/* Header / Diagnosis summary banner */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Prescription for: {activeExplanation.diagnosis}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Prescribed by {activeExplanation.doctor_name}
                    </p>
                  </div>
                </div>
                <Badge tone={activeExplanation.is_live_ai ? "brand" : "neutral"} className="gap-1 font-medium">
                  <Sparkles className="h-3 w-3" />
                  {activeExplanation.is_live_ai
                    ? `OpenAI (${activeExplanation.ai_model_used})`
                    : "Clinical Reference Engine"}
                </Badge>
              </div>

              <div className="rounded-lg bg-white p-3.5 border border-brand-100 text-xs text-slate-700 leading-relaxed shadow-sm">
                <strong className="text-slate-900 block mb-1">Treatment Goal:</strong>
                {activeExplanation.summary}
              </div>
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-brand-600" />
                <span>Medication Breakdown ({activeExplanation.medicines.length})</span>
              </h4>

              <div className="grid gap-3">
                {activeExplanation.medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                        <span className="font-semibold text-slate-900 text-sm">{med.medicine_name}</span>
                      </div>
                      <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                        {med.purpose}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 pt-3 text-xs">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" /> How to take
                        </span>
                        <p className="text-slate-700 leading-relaxed">{med.how_to_take}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Apple className="h-3.5 w-3.5 text-slate-400" /> Food & Drink
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {med.food_interaction || "Take with water as directed."}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Precautions
                        </span>
                        <p className="text-slate-700 leading-relaxed">{med.precautions_and_side_effects}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifestyle & Warnings Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Lifestyle & Diet */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Lifestyle & Diet Tips</span>
                </div>
                <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside">
                  {activeExplanation.lifestyle_and_diet_recommendations?.map((tip, i) => (
                    <li key={i} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Warning Signs to Watch */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <span>When to Seek Urgent Medical Care</span>
                </div>
                <ul className="text-xs text-red-950 space-y-1.5 list-disc list-inside">
                  {activeExplanation.warning_signs_to_watch?.map((warn, i) => (
                    <li key={i} className="leading-relaxed">{warn}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Clinical disclaimer */}
            {activeExplanation.general_advice && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="leading-relaxed">{activeExplanation.general_advice}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* AI Diagnostic Lab Report Simplifier Dialog */}
      <LabReportSimplifierModal
        open={isLabAiModalOpen}
        onClose={() => setIsLabAiModalOpen(false)}
        data={activeLabAiReport}
        defaultPerspective="patient"
      />
    </div>
  );
}
