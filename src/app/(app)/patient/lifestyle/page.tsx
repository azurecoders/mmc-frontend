"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Apple,
  Droplets,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Heart,
  Moon,
  Printer,
  ChevronDown,
  ChevronUp,
  Utensils,
  Stethoscope,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Select,
  LoadingState,
  Alert,
  useToast,
} from "@/components/ui";
import {
  Consultation,
  PatientMedicalProfile,
  PersonalizedDietPlanResponse,
  DayMealPlanItem,
  FoodRestrictionItem,
} from "@/types";
import { formatDate } from "@/lib/utils";

const DIETARY_PREFERENCES_OPTIONS = [
  { value: "Standard balanced diet", label: "Standard / No specific dietary preference" },
  { value: "Vegetarian (Plant-forward with dairy)", label: "Vegetarian" },
  { value: "Vegan (100% Plant-based)", label: "Vegan" },
  { value: "Low Sodium / DASH-oriented", label: "Low Sodium (Heart-Healthy)" },
  { value: "Diabetic / Strict Low Glycemic", label: "Strict Low Glycemic (Diabetic)" },
  { value: "Gluten-Free", label: "Gluten-Free" },
  { value: "Halal / Kosher", label: "Halal / Kosher" },
];

function DietPlanContent() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const queryConsultationId = searchParams.get("consultationId");

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [medicalProfile, setMedicalProfile] = useState<PatientMedicalProfile | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>("");
  const [dietaryPref, setDietaryPref] = useState("Standard balanced diet");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<PersonalizedDietPlanResponse | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Load patient consultations & medical profile
  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        const [history, profile] = await Promise.all([
          apiFetch<Consultation[]>(`/consultations/patient/${user.id}/history`).catch(() => []),
          apiFetch<PatientMedicalProfile>("/patients/me/medical-profile").catch(() => null),
        ]);
        setConsultations(history);
        setMedicalProfile(profile);

        if (queryConsultationId && history.some((c) => c.id === queryConsultationId)) {
          setSelectedConsultationId(queryConsultationId);
        } else if (history.length > 0) {
          setSelectedConsultationId(history[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, queryConsultationId]);

  // Auto-generate if query param consultation is given
  useEffect(() => {
    if (queryConsultationId && consultations.length > 0 && !plan && !generating) {
      handleGeneratePlan(queryConsultationId);
    }
  }, [queryConsultationId, consultations]);

  const handleGeneratePlan = async (targetConsultationId?: string) => {
    const consultId = targetConsultationId || selectedConsultationId;
    setGenerating(true);
    try {
      let res: PersonalizedDietPlanResponse;
      if (consultId && consultId !== "__PROFILE__") {
        res = await apiFetch<PersonalizedDietPlanResponse>(
          `/consultations/${consultId}/diet-lifestyle-plan`,
          { method: "POST" }
        );
      } else {
        res = await apiFetch<PersonalizedDietPlanResponse>(
          "/consultations/patient/me/diet-lifestyle-plan",
          {
            method: "POST",
            body: JSON.stringify({
              dietary_preferences: dietaryPref,
            }),
          }
        );
      }
      setPlan(res);
      setActiveDayIndex(0);
      toast({
        title: "Personalized Plan Ready",
        description: `7-day ${res.dietary_framework} generated based on clinical diagnosis.`,
        tone: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate lifestyle plan.";
      toast({
        title: "Plan Generation Error",
        description: msg,
        tone: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading patient clinical history and nutritional records…" />;
  }

  const selectedConsultation = consultations.find((c) => c.id === selectedConsultationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="AI Preventive Medicine"
          title="Personalized Diet & Lifestyle Plan"
          description="Tailored 7-day meal guide, foods to avoid with healthy substitutes, and hydration targets aligned with your clinical diagnoses."
        />
        {plan && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="h-4 w-4" />}
            className="self-start sm:self-auto shrink-0 print:hidden"
          >
            Print / Save Plan
          </Button>
        )}
      </div>

      {/* Control / Generator Card */}
      <Card className="print:hidden border-indigo-100 bg-linear-to-r from-indigo-50/40 via-white to-brand-50/30">
        <CardBody className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-12 items-end">
            <div className="sm:col-span-5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Select Consultation / Health Diagnosis
              </label>
              <select
                value={selectedConsultationId}
                onChange={(e) => setSelectedConsultationId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-brand-500 focus:outline-hidden"
              >
                {consultations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.diagnosis} — Dr. {c.doctor?.user?.full_name || "Physician"} ({formatDate(c.created_at)})
                  </option>
                ))}
                <option value="__PROFILE__">
                  My Active Chronic Profile & General Wellness
                </option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Dietary Preferences / Restrictions
              </label>
              <select
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-brand-500 focus:outline-hidden"
              >
                {DIETARY_PREFERENCES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button
                onClick={() => handleGeneratePlan()}
                loading={generating}
                icon={<Sparkles className="h-4 w-4" />}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
              >
                {plan ? "Regenerate Plan" : "Generate 7-Day Plan"}
              </Button>
            </div>
          </div>

          {selectedConsultation && (
            <div className="rounded-xl bg-white/80 border border-indigo-100 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-600" />
                <span className="text-slate-600">
                  Target Diagnosis: <strong className="text-slate-900">{selectedConsultation.diagnosis}</strong>
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-600">
                  Physician: <strong>Dr. {selectedConsultation.doctor?.user?.full_name || "Physician"}</strong>
                </span>
              </div>
              {selectedConsultation.special_instructions && (
                <span className="text-slate-500 text-[11px] italic truncate max-w-md">
                  Note: &quot;{selectedConsultation.special_instructions}&quot;
                </span>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Plan Display Area */}
      {generating ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <Sparkles className="h-5 w-5 text-indigo-600 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Generating Clinically Tailored Care Plan...
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              AI clinical nutritionist is evaluating the target diagnosis, chronic profile contraindications, daily hydration requirements, and composing a balanced 7-day meal guide.
            </p>
          </div>
        </Card>
      ) : plan ? (
        <div className="space-y-6">
          {/* 1. Overview Summary Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-indigo-200 bg-linear-to-b from-indigo-50/60 to-white p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Clinical Protocol
              </span>
              <h4 className="text-xs font-black text-slate-900 leading-snug">
                {plan.dietary_framework}
              </h4>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {plan.ai_model_used}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-linear-to-b from-blue-50/60 to-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Hydration Target
                </span>
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {plan.daily_hydration_liters} <span className="text-xs font-normal text-slate-500">Liters / day</span>
              </div>
              <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
                Approx. {Math.round(plan.daily_hydration_liters * 4)} glasses
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-linear-to-b from-emerald-50/60 to-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Daily Energy Goal
                </span>
                <Apple className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-base font-black text-slate-900">
                {plan.daily_calorie_target || "Balanced Nutrient Intake"}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Macro-balanced
              </span>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-linear-to-b from-purple-50/60 to-white p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                Target Conditions
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {plan.target_conditions.slice(0, 2).map((c, i) => (
                  <Badge key={i} tone="brand" className="text-[10px] py-0 px-1.5">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Hydration Guidelines Banner */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Daily Hydration Strategy ({plan.daily_hydration_liters} Liters)
              </h4>
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                {plan.hydration_guidelines}
              </p>
            </div>
          </div>

          {/* 3. Foods to Avoid & Healthy Substitutes Table */}
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Foods to Avoid & Clinically Approved Safe Substitutes
                  </span>
                </div>
              }
              description="Avoid items that spike blood pressure, serum uric acid, or blood glucose, and replace them with these nutrient-dense culinary swaps."
              className="bg-slate-50/70 border-b border-slate-200/80"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-1/3">❌ Restrict / Avoid</th>
                    <th className="p-3 w-1/3">Pathophysiological Reason</th>
                    <th className="p-3 w-1/3">✅ Healthy Culinary Swap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {plan.foods_to_avoid.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 align-top font-bold text-red-700">
                        {item.food_to_avoid}
                      </td>
                      <td className="p-3 align-top text-slate-600 leading-relaxed text-[11px]">
                        {item.reason}
                      </td>
                      <td className="p-3 align-top font-semibold text-emerald-800 bg-emerald-50/20">
                        {item.healthy_substitute}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 4. Actionable 7-Day Meal Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-brand-600" />
                  <span>Actionable 7-Day Meal Guide</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select a day to view portion sizes, timing, and clinical benefits.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                Day {activeDayIndex + 1} of 7
              </span>
            </div>

            {/* Day Selector Tabs */}
            <div className="grid grid-cols-7 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
              {plan.seven_day_meal_plan.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`py-2 px-1 text-center rounded-xl transition text-xs font-bold ${
                    activeDayIndex === idx
                      ? "bg-white text-brand-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span className="block text-[10px] text-slate-400 uppercase font-medium">Day</span>
                  <span className="text-sm font-black">{idx + 1}</span>
                </button>
              ))}
            </div>

            {/* Selected Day Meal Plan Card */}
            {plan.seven_day_meal_plan[activeDayIndex] && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {plan.seven_day_meal_plan[activeDayIndex].day}
                    </h4>
                    <span className="text-xs text-brand-700 font-semibold block mt-0.5">
                      Focus: {plan.seven_day_meal_plan[activeDayIndex].theme}
                    </span>
                  </div>
                  {plan.seven_day_meal_plan[activeDayIndex].clinical_note && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] text-amber-900 max-w-md">
                      <strong>Clinical Benefit:</strong> {plan.seven_day_meal_plan[activeDayIndex].clinical_note}
                    </div>
                  )}
                </div>

                {/* 4 Meals Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Breakfast */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        Breakfast
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">7:30 - 8:30 AM</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1">
                      {plan.seven_day_meal_plan[activeDayIndex].breakfast}
                    </p>
                  </div>

                  {/* Lunch */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        Lunch
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">12:30 - 1:30 PM</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1">
                      {plan.seven_day_meal_plan[activeDayIndex].lunch}
                    </p>
                  </div>

                  {/* Healthy Snack */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        Afternoon Snack
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">4:30 - 5:00 PM</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1">
                      {plan.seven_day_meal_plan[activeDayIndex].snack}
                    </p>
                  </div>

                  {/* Dinner */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        Dinner (Light)
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">7:00 - 8:00 PM</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1">
                      {plan.seven_day_meal_plan[activeDayIndex].dinner}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Physical Activity, Sleep & Red Flags */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Exercise */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Activity className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Physical Activity Guide
                </h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {plan.physical_activity_plan.map((act, i) => (
                  <li key={i} className="leading-relaxed">{act}</li>
                ))}
              </ul>
            </div>

            {/* Sleep & Habits */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Moon className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Restorative Sleep & Habits
                </h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {plan.lifestyle_and_sleep_habits.map((hb, i) => (
                  <li key={i} className="leading-relaxed">{hb}</li>
                ))}
              </ul>
            </div>

            {/* Clinical Precautions */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider">
                  Clinical Precautions & Red Flags
                </h4>
              </div>
              <ul className="text-xs text-red-900 space-y-1.5 list-disc list-inside">
                {plan.clinical_precautions.map((p, i) => (
                  <li key={i} className="leading-relaxed font-medium">{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <Card className="p-10 text-center space-y-3">
          <Apple className="h-10 w-10 text-brand-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Generate Your Tailored 7-Day Care Plan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose a past consultation or select &quot;My Active Chronic Profile&quot; above to create a medical nutrition therapy meal guide, foods to avoid, and hydration plan.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => handleGeneratePlan()}
              loading={generating}
              icon={<Sparkles className="h-4 w-4" />}
            >
              Generate Care Plan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PatientLifestylePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading diet and lifestyle planner…" />}>
      <DietPlanContent />
    </Suspense>
  );
}
