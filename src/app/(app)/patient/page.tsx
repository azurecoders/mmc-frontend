"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  ListOrdered,
  Activity,
  FileText,
  Pill,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useSocketEvent } from "@/lib/hooks";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  statusTone,
  LinkButton,
  Button,
  LoadingState,
  Alert,
} from "@/components/ui";
import { Appointment, PatientLiveQueueStatus, Consultation } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

export default function PatientOverviewPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeQueueStatus, setActiveQueueStatus] = useState<PatientLiveQueueStatus | null>(null);
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [turnAlert, setTurnAlert] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [apts, consults] = await Promise.all([
        apiFetch<Appointment[]>("/appointments/").catch(() => []),
        apiFetch<Consultation[]>(`/consultations/patient/${user.id}/history`).catch(() => []),
      ]);
      setAppointments(apts);
      setRecentConsultations(consults);

      // Find first active appointment to check queue status
      const activeApt = apts.find(
        (a) => a.status === "APPROVED" || a.status === "CHECKED_IN" || a.status === "IN_CONSULTATION"
      );
      if (activeApt) {
        const qStatus = await apiFetch<PatientLiveQueueStatus>(
          `/queue/patient-status/${activeApt.id}`
        ).catch(() => null);
        setActiveQueueStatus(qStatus);
      } else {
        setActiveQueueStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Realtime updates on user's channel
  useSocketEvent(
    "queue:your_turn",
    (data: any) => {
      setTurnAlert(`It is your turn! Token #${data.token_number} called to ${data.room_number || "Cabin"}`);
      loadData();
    },
    user ? `patient:${user.id}` : null
  );

  useSocketEvent(
    "queue:patient_status",
    () => {
      loadData();
    },
    user ? `patient:${user.id}` : null
  );

  if (loading) {
    return <LoadingState label="Loading your patient care dashboard…" />;
  }

  const upcomingApt = appointments.find(
    (a) => a.status === "APPROVED" || a.status === "CHECKED_IN" || a.status === "PENDING_APPROVAL"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Workspace"
        title={`Hello, ${user?.full_name?.split(" ")[0] || "Patient"}`}
        description="Track your active appointments, check queue status, or book with our AI doctor recommender."
        actions={
          <LinkButton href="/patient/book" icon={<CalendarPlus className="h-4 w-4" />}>
            Book Appointment
          </LinkButton>
        }
      />

      {turnAlert && (
        <Alert
          tone="success"
          title="Turn Called!"
          onDismiss={() => setTurnAlert(null)}
          action={
            <LinkButton href="/patient/queue" size="sm" variant="success">
              View Cabin Directions
            </LinkButton>
          }
        >
          {turnAlert}
        </Alert>
      )}

      {/* Active Queue Status Banner */}
      {activeQueueStatus ? (
        <Card className="border-brand-200 bg-brand-50/40">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="brand">Active Visit Today</Badge>
                  <span className="text-xs text-slate-500">
                    {activeQueueStatus.doctor_name} ({activeQueueStatus.doctor_specialization})
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mt-2">
                  Room {activeQueueStatus.room_number}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {activeQueueStatus.patients_ahead === 0
                    ? "You are next in line! Please wait near the cabin door."
                    : `${activeQueueStatus.patients_ahead} patient${activeQueueStatus.patients_ahead > 1 ? "s" : ""} ahead of you (approx. ${activeQueueStatus.estimated_wait_time_minutes} mins wait).`}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Your Token</span>
                  <div className="text-3xl font-black text-brand-600">
                    #{activeQueueStatus.your_token_number}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Now Serving</span>
                  <div className="text-3xl font-black text-slate-900">
                    {activeQueueStatus.currently_serving_token
                      ? `#${activeQueueStatus.currently_serving_token}`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-100 flex justify-end">
              <LinkButton href="/patient/queue" variant="secondary" size="sm">
                Open Full Live Tracker <ArrowRight className="h-3.5 w-3.5" />
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      ) : upcomingApt ? (
        <Card>
          <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(upcomingApt.status)}>{upcomingApt.status.replace("_", " ")}</Badge>
                <span className="text-xs text-slate-500">
                  {formatDate(upcomingApt.appointment_date)} at {upcomingApt.slot_time}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                Upcoming Appointment with {upcomingApt.doctor?.user?.full_name || "Specialist"}
              </p>
              <p className="text-xs text-slate-500">Token assigned: #{upcomingApt.token_number}</p>
            </div>
            <LinkButton href="/patient/queue" variant="secondary" size="sm">
              Manage Appointment
            </LinkButton>
          </CardBody>
        </Card>
      ) : null}

      {/* Quick Action Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/patient/book"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-xs transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition">
            Book Appointment
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            AI symptom matching and specialist recommendations.
          </p>
        </Link>

        <Link
          href="/patient/queue"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-xs transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
            <ListOrdered className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition">
            Live Queue Status
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Real-time token calling and live estimated wait times.
          </p>
        </Link>

        <Link
          href="/patient/vitals"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-xs transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition">
            Health Check & Vitals
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            MEWS/NEWS2 early warning scorer with AI risk assessment.
          </p>
        </Link>

        <Link
          href="/patient/records"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500 hover:shadow-xs transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition">
            Health Record
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Medical history archive, chronic allergies, and medications.
          </p>
        </Link>
      </div>

      {/* Recent Prescriptions & Consultations */}
      <Card>
        <CardHeader
          title="Recent Consultations & Prescriptions"
          description="Doctor clinical summaries, digital prescriptions, and lab tests"
          action={
            <LinkButton href="/patient/prescriptions" variant="ghost" size="sm">
              View All History <ArrowRight className="h-3.5 w-3.5" />
            </LinkButton>
          }
        />
        <CardBody>
          {recentConsultations.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No previous consultations recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recentConsultations.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {c.doctor?.user?.full_name || "Attending Physician"}
                      </span>
                      <span className="text-xs text-slate-400">({formatDate(c.created_at)})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong className="text-slate-800">Diagnosis:</strong> {c.diagnosis}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{c.prescription_items?.length || 0} medications prescribed</span>
                      <span>&bull;</span>
                      <span>{c.lab_orders?.length || 0} lab tests ordered</span>
                    </div>
                  </div>
                  <LinkButton href="/patient/prescriptions" variant="secondary" size="sm">
                    View Details
                  </LinkButton>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
