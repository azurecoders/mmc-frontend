"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Sparkles,
  Bot,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  User,
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
  useToast,
} from "@/components/ui";
import { Department, DoctorProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DoctorRecommendationItem {
  doctor: DoctorProfile;
  match_score: number;
  match_reason: string;
}

interface AIRecommendation {
  recommended_department: string;
  urgency_level: string;
  clinical_assessment: string;
  recommended_doctors: DoctorRecommendationItem[];
  fallback_used?: boolean;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Symptoms
  const [complaint, setComplaint] = useState("");
  const [duration, setDuration] = useState("2-3 days");
  const [severity, setSeverity] = useState("MODERATE");

  // Step 2: Recommendations & Doctor selection
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [allDoctors, setAllDoctors] = useState<DoctorProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<{
    id: string;
    name: string;
    specialization: string;
    room: string;
    fee: number;
  } | null>(null);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [manualBrowse, setManualBrowse] = useState(false);

  // Step 3: Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [appointmentDate, setAppointmentDate] = useState(defaultDate);
  const [slotTime, setSlotTime] = useState("10:00");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedResult, setBookedResult] = useState<{ token: number; appointmentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/departments/").catch(() => []),
      apiFetch<DoctorProfile[]>("/doctors/").catch(() => []),
    ]).then(([depts, docs]) => {
      setDepartments(depts);
      setAllDoctors(docs);
    });
  }, []);

  // Step 1 -> Step 2
  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) {
      setError("Please describe your symptoms.");
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const res = await apiFetch<AIRecommendation>("/appointments/recommend-doctors", {
        method: "POST",
        body: JSON.stringify({
          symptoms: complaint.trim(),
          duration: duration,
          severity: severity.toUpperCase(),
        }),
      });
      setRecommendation(res);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "AI recommendation service unavailable. You can browse all doctors manually.");
      setManualBrowse(true);
      setStep(2);
    } finally {
      setAiLoading(false);
    }
  };

  // Step 2 -> Step 3
  const handleSelectDoctor = (doc: {
    id: string;
    name: string;
    specialization: string;
    room: string;
    fee: number;
  }) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  // Step 3 -> Confirm Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor) return;
    setBookingLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>("/appointments/book-online", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDate,
          slot_time: slotTime,
          chief_complaint: complaint.trim(),
          symptom_duration: duration,
          severity: severity.toUpperCase(),
          ai_recommended_department: recommendation?.recommended_department || undefined,
          ai_recommendation_reason: recommendation?.clinical_assessment || undefined,
        }),
      });
      setBookedResult({
        token: res.token_number,
        appointmentId: res.id,
      });
      setStep(4);
      toast({
        title: "Appointment Booked!",
        description: `Your token #${res.token_number} has been assigned.`,
        tone: "success",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to book appointment. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredDoctors = filterDepartment
    ? allDoctors.filter((d) => d.department_id === filterDepartment)
    : allDoctors;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Appointment Scheduling"
        title="Book Doctor Appointment"
        description="Describe how you feel to get AI specialist recommendations, or select your doctor directly."
      />

      {/* Stepper Indicator */}
      <nav aria-label="Booking Progress" className="flex items-center justify-between border-b border-slate-200 pb-4">
        {[
          { num: 1, label: "Symptoms" },
          { num: 2, label: "Choose Doctor" },
          { num: 3, label: "Date & Time" },
          { num: 4, label: "Confirmation" },
        ].map((s) => {
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent
                    ? "bg-brand-600 text-white"
                    : isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </span>
              <span
                className={`hidden sm:inline text-xs font-medium ${
                  isCurrent ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </nav>

      {error && (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* STEP 1: Symptoms Form */}
      {step === 1 && (
        <Card>
          <form onSubmit={handleGetRecommendations}>
            <CardHeader
              title="Describe Your Symptoms"
              description="Our AI uses clinical triage guidelines to recommend the most suitable clinical department."
            />
            <CardBody className="space-y-5">
              <Textarea
                label="What health issues or symptoms are you experiencing?"
                placeholder="e.g. Sharp chest pain radiating to left shoulder, mild shortness of breath when walking up stairs..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={4}
                required
                hint="Be as detailed as possible regarding location, severity, and triggers (minimum 3 characters)."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="How long have you had these symptoms?"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  options={[
                    { value: "Less than 24 hours", label: "Less than 24 hours" },
                    { value: "1-2 days", label: "1-2 days" },
                    { value: "3-5 days", label: "3-5 days" },
                    { value: "1-2 weeks", label: "1-2 weeks" },
                    { value: "Over 1 month (Chronic)", label: "Over 1 month (Chronic)" },
                  ]}
                />

                <Select
                  label="Severity Level"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  options={[
                    { value: "MILD", label: "Mild (Manageable discomfort)" },
                    { value: "MODERATE", label: "Moderate (Affecting daily routine)" },
                    { value: "SEVERE", label: "Severe (Intense, need urgent care)" },
                  ]}
                />
              </div>
            </CardBody>
            <CardFooter>
              <Button type="submit" loading={aiLoading} icon={<Sparkles className="h-4 w-4" />}>
                {aiLoading ? "Analyzing Clinical Case..." : "Get AI Doctor Recommendations"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* STEP 2: Doctor Selection */}
      {step === 2 && (
        <div className="space-y-6">
          {/* AI Recommendation Callout */}
          {recommendation && !manualBrowse && (
            <Card className="border-brand-200 bg-brand-50/30">
              <CardBody className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-semibold text-brand-800 uppercase tracking-wide">
                      Recommended Department: {recommendation.recommended_department}
                    </span>
                  </div>
                  <Badge
                    tone={
                      recommendation.urgency_level === "EMERGENCY"
                        ? "danger"
                        : recommendation.urgency_level === "URGENT"
                        ? "warning"
                        : "brand"
                    }
                  >
                    Triage Urgency: {recommendation.urgency_level}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {recommendation.clinical_assessment}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Recommended Doctors or Manual Browse */}
          <Card>
            <CardHeader
              title={manualBrowse ? "Browse All Specialists" : "Recommended Specialists"}
              description={
                manualBrowse
                  ? "Filter by department and select any available specialist"
                  : "Matched by Gemma 31B based on your clinical symptoms"
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualBrowse(!manualBrowse)}
                >
                  {manualBrowse ? "Show AI Recommendations" : "Browse All Doctors"}
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {manualBrowse ? (
                <>
                  <Select
                    label="Filter by Clinical Department"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    placeholder="All Departments"
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  />

                  {filteredDoctors.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                      No doctors are currently available in this department. Doctors added by the administrator will appear here automatically.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredDoctors.map((doc) => {
                        const docName = doc.user?.full_name || "Doctor";
                        return (
                          <div
                            key={doc.id}
                            className="rounded-xl border border-slate-200 p-4 hover:border-brand-500 hover:bg-brand-50/20 transition flex flex-col justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {docName}
                              </p>
                              <p className="text-xs text-brand-600 font-medium">{doc.specialization}</p>
                              <p className="text-xs text-slate-500 mt-1">{doc.qualifications}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                                <span>Room {doc.room_number}</span>
                                <span>&bull;</span>
                                <span className="font-medium text-slate-900">
                                  {formatCurrency(doc.consultation_fee)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="mt-4"
                              onClick={() =>
                                handleSelectDoctor({
                                  id: doc.id,
                                  name: docName,
                                  specialization: doc.specialization,
                                  room: doc.room_number,
                                  fee: doc.consultation_fee,
                                })
                              }
                            >
                              Select Doctor
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {recommendation?.recommended_doctors && recommendation.recommended_doctors.length > 0 ? (
                    recommendation.recommended_doctors.map((item) => {
                      const doc = item.doctor;
                      const docName = doc.user?.full_name || "Specialist Doctor";
                      return (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-slate-200 p-4 hover:border-brand-500 hover:bg-brand-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 text-sm">{docName}</p>
                              <Badge tone="brand">{doc.specialization}</Badge>
                              <span className="text-xs text-slate-400">
                                Match: {Math.round(item.match_score * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {item.match_reason}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                              <span>Cabin {doc.room_number}</span>
                              <span>&bull;</span>
                              <span className="font-semibold text-slate-900">
                                Fee: {formatCurrency(doc.consultation_fee)}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSelectDoctor({
                                id: doc.id,
                                name: docName,
                                specialization: doc.specialization,
                                room: doc.room_number,
                                fee: doc.consultation_fee,
                              })
                            }
                          >
                            Choose Specialist
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No matching doctors found for this specific triage query. Click &quot;Browse All Doctors&quot; to pick manually.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
            <CardFooter>
              <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                Back to Symptoms
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 3: Date, Time & Final Confirmation */}
      {step === 3 && selectedDoctor && (
        <Card>
          <CardHeader
            title="Select Appointment Date & Time"
            description="Choose your preferred schedule for the consultation"
          />
          <CardBody className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Selected Physician
              </span>
              <p className="text-base font-semibold text-slate-900 mt-1">{selectedDoctor.name}</p>
              <p className="text-xs text-slate-600">
                {selectedDoctor.specialization} &bull; Room {selectedDoctor.room} &bull; Fee:{" "}
                {formatCurrency(selectedDoctor.fee)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Appointment Date"
                type="date"
                value={appointmentDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />

              <Select
                label="Preferred Time Slot"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                options={[
                  { value: "09:00", label: "09:00 AM" },
                  { value: "10:00", label: "10:00 AM" },
                  { value: "11:00", label: "11:00 AM" },
                  { value: "14:00", label: "02:00 PM" },
                  { value: "15:00", label: "03:00 PM" },
                  { value: "16:00", label: "04:00 PM" },
                ]}
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Upon booking, your appointment will be assigned a daily queue token and submitted to the reception desk for instant check-in.
            </div>
          </CardBody>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft className="h-4 w-4" />}>
              Change Doctor
            </Button>
            <Button
              loading={bookingLoading}
              onClick={handleConfirmBooking}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm & Issue Token
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: Success Screen */}
      {step === 4 && bookedResult && (
        <Card className="text-center p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Appointment Booked!</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Your appointment has been registered. You have been assigned sequential token:
          </p>

          <div className="my-6 inline-block rounded-2xl bg-brand-50 border border-brand-200 p-6 px-10">
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
              Your Daily Token
            </span>
            <div className="text-5xl font-black text-brand-600 mt-1">
              #{bookedResult.token}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <LinkButton href="/patient/queue" size="lg">
              Track Queue Live
            </LinkButton>
            <LinkButton href="/patient" variant="secondary" size="lg">
              Back to Overview
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
