"use client";

import React, { useEffect, useState } from "react";
import {
  ListOrdered,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Volume2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useSocketEvent } from "@/lib/hooks";
import { hospitalAudio } from "@/lib/audio";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  statusTone,
  Button,
  LinkButton,
  LoadingState,
  Alert,
  Dialog,
  useToast,
} from "@/components/ui";
import { Appointment, PatientLiveQueueStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PatientQueuePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<PatientLiveQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const data = await apiFetch<Appointment[]>("/appointments/").catch(() => []);
      setAppointments(data);
      if (!selectedAppointmentId && data.length > 0) {
        // Default to active or first appointment
        const active = data.find(
          (a) => a.status === "APPROVED" || a.status === "CHECKED_IN" || a.status === "IN_CONSULTATION"
        );
        setSelectedAppointmentId(active ? active.id : data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async (aptId: string) => {
    try {
      const data = await apiFetch<PatientLiveQueueStatus>(`/queue/patient-status/${aptId}`).catch(() => null);
      setQueueStatus(data);
    } catch {
      setQueueStatus(null);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  useEffect(() => {
    if (selectedAppointmentId) {
      fetchQueueStatus(selectedAppointmentId);
    }
  }, [selectedAppointmentId]);

  // Realtime Socket.IO events
  useSocketEvent(
    "queue:your_turn",
    (data: any) => {
      hospitalAudio.playTokenCalledChime();
      setTurnBanner(
        `YOUR TURN IS CALLED! Please proceed to ${data.room_number || "Doctor Cabin"} immediately.`
      );
      toast({
        title: "Your Turn!",
        description: `Token #${data.token_number} called to room ${data.room_number || "Cabin"}.`,
        tone: "success",
      });
      if (selectedAppointmentId) fetchQueueStatus(selectedAppointmentId);
    },
    user ? `patient:${user.id}` : null
  );

  useSocketEvent(
    "queue:patient_status",
    () => {
      if (selectedAppointmentId) fetchQueueStatus(selectedAppointmentId);
      fetchAppointments();
    },
    user ? `patient:${user.id}` : null
  );

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentId) return;
    setCanceling(true);
    try {
      await apiFetch(`/appointments/${selectedAppointmentId}/cancel`, { method: "POST" });
      toast({ title: "Appointment Cancelled", tone: "info" });
      setCancelDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast({
        title: "Error cancelling appointment",
        description: err?.message || "Please try again.",
        tone: "error",
      });
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your appointments and queue status…" />;
  }

  const selectedApt = appointments.find((a) => a.id === selectedAppointmentId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Real-Time Queue Monitor"
        title="My Appointments & Live Queue"
        description="Monitor your token progress, wait times, and cabin callouts with zero delay."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => hospitalAudio.playTokenCalledChime()}
            icon={<Volume2 className="h-4 w-4 text-brand-600" />}
          >
            Test Chime Audio
          </Button>
        }
      />

      {turnBanner && (
        <Alert
          tone="success"
          title="Turn Now Active"
          onDismiss={() => setTurnBanner(null)}
        >
          {turnBanner}
        </Alert>
      )}

      {appointments.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">No appointments scheduled</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            You don&apos;t have any appointments booked yet. Use our AI assistant to book a visit with a specialist.
          </p>
          <div className="mt-5">
            <LinkButton href="/patient/book">Book Appointment</LinkButton>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Appointments List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
              Your Appointments
            </h2>
            <div className="space-y-2">
              {appointments.map((apt) => {
                const isSelected = apt.id === selectedAppointmentId;
                return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(apt.id)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600">
                        Token #{apt.token_number}
                      </span>
                      <Badge tone={statusTone(apt.status)}>{apt.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm mt-1">
                      {apt.doctor?.user?.full_name || "Doctor"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(apt.appointment_date)} at {apt.slot_time}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Appointment Live Queue Tracker */}
          <div className="lg:col-span-2 space-y-6">
            {selectedApt && (
              <Card>
                <CardHeader
                  title={`Token #${selectedApt.token_number} — ${selectedApt.doctor?.user?.full_name || "Specialist"}`}
                  description={`${selectedApt.doctor?.specialization || "Clinical Clinic"} · Room ${selectedApt.doctor?.room_number || "101"}`}
                  action={
                    selectedApt.status === "PENDING_APPROVAL" || selectedApt.status === "APPROVED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelDialogOpen(true)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cancel Visit
                      </Button>
                    ) : null
                  }
                />
                <CardBody className="space-y-6">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(selectedApt.status)}>
                      Status: {selectedApt.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Scheduled: {formatDate(selectedApt.appointment_date)} ({selectedApt.slot_time})
                    </span>
                  </div>

                  {/* Big Numbers Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
                      <span className="text-xs font-semibold text-brand-700 uppercase">Your Token</span>
                      <div className="text-3xl font-black text-brand-600 mt-1">
                        #{queueStatus?.your_token_number || selectedApt.token_number}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Now Serving</span>
                      <div className="text-3xl font-black text-slate-900 mt-1">
                        {queueStatus?.currently_serving_token
                          ? `#${queueStatus.currently_serving_token}`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Ahead of You</span>
                      <div className="text-3xl font-black text-slate-900 mt-1">
                        {queueStatus?.patients_ahead ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Wait</span>
                      <div className="text-3xl font-black text-slate-900 mt-1">
                        {queueStatus ? `${queueStatus.estimated_wait_time_minutes}m` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Visit Summary Details */}
                  {selectedApt.chief_complaint && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Chief Complaint
                      </span>
                      <p className="text-xs text-slate-700 font-medium">
                        {selectedApt.chief_complaint}
                      </p>
                      {selectedApt.symptom_duration && (
                        <p className="text-xs text-slate-500">
                          Duration: {selectedApt.symptom_duration} &bull; Severity: {selectedApt.severity}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status Instructions */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedApt.status === "PENDING_APPROVAL" && (
                      <p>
                        Your appointment is waiting for clinic verification. Once approved, the reception desk will check you into today&apos;s queue.
                      </p>
                    )}
                    {selectedApt.status === "APPROVED" && (
                      <p>
                        Your booking is confirmed! When you arrive at the hospital, proceed directly to the reception desk or waiting lounge.
                      </p>
                    )}
                    {selectedApt.status === "CHECKED_IN" && (
                      <p>
                        You are checked in to the active queue. Please remain near Room {selectedApt.doctor?.room_number || "101"}. Your token will be called shortly.
                      </p>
                    )}
                    {selectedApt.status === "IN_CONSULTATION" && (
                      <p className="font-semibold text-brand-700">
                        Consultation in progress. You are currently in the doctor&apos;s cabin.
                      </p>
                    )}
                    {selectedApt.status === "COMPLETED" && (
                      <p className="text-emerald-700 font-medium">
                        Visit completed. Prescriptions and lab orders have been sent to pharmacy and diagnostic lab.
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              loading={canceling}
              onClick={handleCancelAppointment}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancelling will forfeit your assigned token number (#{selectedApt?.token_number}).
          You can book another appointment at any time.
        </p>
      </Dialog>
    </div>
  );
}
