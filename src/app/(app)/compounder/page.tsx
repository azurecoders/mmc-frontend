"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  PauseCircle,
  Stethoscope,
  Volume2,
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
  Select,
  LoadingState,
  useToast,
} from "@/components/ui";
import { Appointment, DoctorProfile } from "@/types";
import { formatDate } from "@/lib/utils";
import { EmergencyTriggerButton } from "@/components/emergency/EmergencyTriggerButton";

export default function ReceptionQueuePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const [apts, docs] = await Promise.all([
        apiFetch<Appointment[]>("/appointments/").catch(() => []),
        apiFetch<DoctorProfile[]>("/doctors/").catch(() => []),
      ]);
      setAppointments(apts);
      setDoctors(docs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [user]);

  // Realtime updates
  useSocketEvent(
    "queue:doctor_updated",
    () => {
      fetchQueue();
    },
    "compounder:queue"
  );

  useSocketEvent(
    "queue:emergency_priority",
    (data: any) => {
      toast({
        title: "EMERGENCY PRIORITY ELEVATED",
        description: `Token #${data.token_number} elevated to immediate priority due to critical MEWS score.`,
        tone: "error",
      });
      fetchQueue();
    },
    "compounder:queue"
  );

  // Check In an approved patient
  const handleCheckIn = async (aptId: string) => {
    setActionInProgress(aptId);
    try {
      await apiFetch("/queue/check-in", {
        method: "POST",
        body: JSON.stringify({ appointment_id: aptId }),
      });
      toast({ title: "Patient Checked In", description: "Added to active waiting queue.", tone: "success" });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  // Call patient turn for doctor
  const handleCallDoctorQueue = async (docId: string) => {
    setActionInProgress(docId);
    try {
      const res = await apiFetch("/queue/call-patient", {
        method: "POST",
        body: JSON.stringify({ doctor_id: docId }),
      });
      hospitalAudio.playTokenCalledChime();
      toast({
        title: "Token Called",
        description: `Token #${res.token_number} called to Cabin ${res.doctor?.room_number || ""}.`,
        tone: "success",
      });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Queue Empty", description: err?.message || "No waiting patients for this cabin.", tone: "info" });
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = selectedDoctorFilter
    ? appointments.filter((a) => a.doctor_id === selectedDoctorFilter)
    : appointments;

  const waitingCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const inConsultCount = appointments.filter((a) => a.status === "IN_CONSULTATION").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const pendingApprovalsCount = appointments.filter((a) => a.status === "PENDING_APPROVAL").length;

  if (loading) {
    return <LoadingState label="Loading reception queue dashboard…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reception & Triage Console"
        title="Live Clinic Queue"
        description="Monitor active patient tokens, check in approved visitors, and coordinate doctor cabin calls."
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/compounder/walk-in" icon={<UserPlus className="h-4 w-4" />}>
              Register Walk-In
            </LinkButton>
            <LinkButton href="/compounder/approvals" variant="secondary">
              Review Approvals ({pendingApprovalsCount})
            </LinkButton>
            <EmergencyTriggerButton ward="OPD & Triage Reception Area" />
          </div>
        }
      />

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Waiting in Lounge</span>
          <div className="text-2xl font-bold text-brand-600 mt-1">{waitingCount}</div>
          <span className="text-xs text-slate-400">Checked in</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">In Consultation</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{inConsultCount}</div>
          <span className="text-xs text-slate-400">Active in cabins</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Completed Visits</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
          <span className="text-xs text-slate-400">Today</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingApprovalsCount}</div>
          <Link href="/compounder/approvals" className="text-xs text-brand-600 hover:underline">
            Review online bookings &rarr;
          </Link>
        </div>
      </div>

      {/* Queue Table Card */}
      <Card>
        <CardHeader
          title="Today's Appointments & Queue Status"
          description="Manage check-ins, cabin callouts, and triage priority"
          action={
            <div className="flex items-center gap-2">
              <Select
                label="Filter Doctor"
                hideLabel
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                placeholder="All Doctor Cabins"
                options={doctors.map((d) => ({
                  value: d.id,
                  label: `${d.user?.full_name || "Doctor"} (Room ${d.room_number})`,
                }))}
                className="w-52"
              />
            </div>
          }
        />
        <CardBody>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No appointments found for the selected cabin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th scope="col" className="py-3 px-3 font-medium">Token</th>
                    <th scope="col" className="py-3 px-3 font-medium">Patient</th>
                    <th scope="col" className="py-3 px-3 font-medium">Doctor Cabin</th>
                    <th scope="col" className="py-3 px-3 font-medium">Scheduled</th>
                    <th scope="col" className="py-3 px-3 font-medium">Status</th>
                    <th scope="col" className="py-3 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-brand-600 text-sm">
                        #{apt.token_number}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 text-xs">
                          {apt.patient?.full_name || "Patient"}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {apt.patient?.phone || "No phone"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-medium">
                          {apt.doctor?.user?.full_name || "Doctor"}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Room {apt.doctor?.room_number} ({apt.doctor?.specialization})
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(apt.appointment_date)} at {apt.slot_time}
                      </td>
                      <td className="py-3 px-3">
                        <Badge tone={statusTone(apt.status)}>
                          {apt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === "APPROVED" && (
                            <Button
                              size="sm"
                              loading={actionInProgress === apt.id}
                              onClick={() => handleCheckIn(apt.id)}
                            >
                              Check In
                            </Button>
                          )}
                          {apt.status === "CHECKED_IN" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionInProgress === apt.doctor_id}
                              onClick={() => handleCallDoctorQueue(apt.doctor_id)}
                              icon={<PhoneCall className="h-3 w-3" />}
                            >
                              Call Turn
                            </Button>
                          )}
                          <LinkButton
                            href={`/compounder/triage?aptId=${apt.id}`}
                            variant="ghost"
                            size="sm"
                          >
                            Triage
                          </LinkButton>
                        </div>
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
