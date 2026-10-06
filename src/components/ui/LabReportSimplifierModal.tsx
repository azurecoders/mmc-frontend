"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  User,
  HeartPulse,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Dialog, Badge, Button, Tabs } from "@/components/ui";
import { LabReportSimplificationResponse } from "@/types";

interface LabReportSimplifierModalProps {
  open: boolean;
  onClose: () => void;
  data: LabReportSimplificationResponse | null;
  defaultPerspective?: "patient" | "clinician";
}

export function LabReportSimplifierModal({
  open,
  onClose,
  data,
  defaultPerspective = "patient",
}: LabReportSimplifierModalProps) {
  const [perspective, setPerspective] = useState<"patient" | "clinician">(defaultPerspective);

  if (!data) return null;

  const isCritical = data.overall_status === "CRITICAL_ALERT";
  const isAbnormal = data.is_abnormal || data.overall_status === "ATTENTION_NEEDED";

  const statusTone = isCritical ? "danger" : isAbnormal ? "warning" : "success";
  const statusLabel = isCritical
    ? "Critical Alert — Prompt Review Required"
    : isAbnormal
    ? "Attention Needed — Out of Range Markers"
    : "Normal Reference Range";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="AI Diagnostic Lab Report Simplifier"
      description="Translating complex laboratory biomarkers into plain-English patient guidance and dense clinical snapshots."
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>AI Engine: {data.ai_model_used}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner with Overview */}
        <div
          className={`rounded-2xl border p-4.5 space-y-3 transition ${
            isCritical
              ? "border-red-200 bg-red-50/60"
              : isAbnormal
              ? "border-amber-200 bg-amber-50/50"
              : "border-emerald-200 bg-emerald-50/50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
                  isCritical ? "bg-red-600" : isAbnormal ? "bg-amber-600" : "bg-emerald-600"
                }`}
              >
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{data.test_name}</h3>
                <p className="text-xs text-slate-500">
                  Category: <span className="font-semibold text-slate-700">{data.test_category}</span>
                  {data.patient_name ? ` • Patient: ${data.patient_name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone={statusTone} className="px-2.5 py-1 text-xs font-semibold gap-1">
                {isCritical ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : isAbnormal ? (
                  <Activity className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {statusLabel}
              </Badge>
              <Badge tone={data.is_live_ai ? "brand" : "neutral"} className="gap-1 font-medium">
                <Sparkles className="h-3 w-3" />
                {data.is_live_ai ? "OpenAI gpt-4o-mini" : "Clinical Engine"}
              </Badge>
            </div>
          </div>

          {/* Critical Danger Flags Alert */}
          {data.critical_flags && data.critical_flags.length > 0 && (
            <div className="rounded-xl border border-red-300 bg-white p-3 space-y-1.5 shadow-xs">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                Immediate Critical Markers Identified
              </span>
              <ul className="list-disc list-inside text-xs text-red-800 space-y-0.5">
                {data.critical_flags.map((flag, idx) => (
                  <li key={idx} className="font-semibold">{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Perspective Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setPerspective("patient")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
              perspective === "patient"
                ? "border-brand-600 text-brand-700 bg-brand-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Patient View (Plain English)
          </button>
          <button
            type="button"
            onClick={() => setPerspective("clinician")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
              perspective === "clinician"
                ? "border-brand-600 text-brand-700 bg-brand-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Doctor & Pathologist Clinical Snapshot
          </button>
        </div>

        {/* Content based on perspective */}
        {perspective === "patient" ? (
          <div className="space-y-4">
            {/* Plain English Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                What This Report Means For You
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {data.patient_summary}
              </p>
            </div>

            {/* Questions to ask doctor */}
            {data.questions_for_doctor && data.questions_for_doctor.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  Helpful Questions to Ask Your Doctor
                </h4>
                <ul className="space-y-1.5 text-xs text-blue-950">
                  {data.questions_for_doctor.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended action steps */}
            {data.recommended_actions && data.recommended_actions.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <HeartPulse className="h-4 w-4 text-emerald-600" />
                  Recommended Next Steps
                </h4>
                <ul className="space-y-1 text-xs text-slate-600">
                  {data.recommended_actions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Clinician Snapshot */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-brand-400" />
                  Clinician Differential & Findings Snapshot
                </h4>
                <span className="text-[11px] font-mono text-slate-400">ICD & Diagnostic Correlation</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {data.doctor_snapshot}
              </div>
            </div>
          </div>
        )}

        {/* Interpreted Parameters Breakdown (Available in both views) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-600" />
              <span>Biomarker Analyte Breakdown ({data.interpreted_parameters.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Interpreted by {data.is_live_ai ? "OpenAI" : "Deterministic Engine"}
            </span>
          </div>

          <div className="grid gap-3">
            {data.interpreted_parameters.map((param, idx) => {
              const isCrit = param.status === "CRITICALLY_HIGH" || param.status === "CRITICALLY_LOW";
              const isAbn = param.status === "ELEVATED" || param.status === "LOW";
              const badgeTone = isCrit ? "danger" : isAbn ? "warning" : "success";

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3.5 space-y-2 transition ${
                    isCrit
                      ? "border-red-200 bg-red-50/30"
                      : isAbn
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isCrit ? "bg-red-500" : isAbn ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-bold text-slate-900 text-xs">{param.parameter_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {param.measured_value}
                      </span>
                      {param.reference_range && (
                        <span className="text-slate-400 text-[11px]">
                          (Ref: {param.reference_range})
                        </span>
                      )}
                      <Badge tone={badgeTone} className="text-[10px] px-2 py-0.5">
                        {param.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 pt-1 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Plain-English Interpretation
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {param.plain_english_meaning}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Clinical Significance
                      </span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {param.clinical_significance}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
