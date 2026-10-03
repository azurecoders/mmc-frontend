"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  LinkButton,
  LoadingState,
  Dialog,
  Textarea,
  useToast,
} from "@/components/ui";
import { Appointment } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ReceptionApprovalsPage() {
  const toast = useToast();
  const [pending, setPending] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectingApt, setRejectingApt] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const data = await apiFetch<Appointment[]>("/appointments/pending-approvals").catch(() => []);
      setPending(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (aptId: string) => {
    setProcessingId(aptId);
    try {
      await apiFetch(`/appointments/${aptId}/approve`, { method: "POST" });
      toast({ title: "Appointment Approved", tone: "success" });
      fetchPending();
    } catch (err: any) {
      toast({ title: "Approval failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingApt) return;
    setProcessingId(rejectingApt.id);
    try {
      await apiFetch(`/appointments/${rejectingApt.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason }),
      });
      toast({ title: "Appointment Rejected", tone: "info" });
      setRejectingApt(null);
      setRejectionReason("");
      fetchPending();
    } catch (err: any) {
      toast({ title: "Rejection failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading pending booking approvals…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verification Queue"
        title="Pending Online Bookings"
        description="Verify and approve appointment requests submitted by patients online before checking them into the queue."
        actions={
          <LinkButton href="/compounder" variant="secondary">
            Back to Live Queue
          </LinkButton>
        }
      />

      {pending.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">All online bookings reviewed</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are no pending patient appointment requests awaiting review.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((apt) => (
            <Card key={apt.id}>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Token #{apt.token_number}
                    </span>
                    <Badge tone="warning">Pending Approval</Badge>
                  </div>
                }
                description={`Requested: ${formatDate(apt.appointment_date)} at ${apt.slot_time}`}
              />
              <CardBody className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Patient:</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">
                    {apt.patient?.full_name || "Patient"}
                  </p>
                  <p className="text-slate-500">{apt.patient?.phone || "No phone listed"}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Requested Doctor:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {apt.doctor?.user?.full_name || "Doctor"} (Room {apt.doctor?.room_number})
                  </p>
                  <p className="text-brand-600">{apt.doctor?.specialization}</p>
                </div>

                {apt.chief_complaint && (
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-500 font-medium">Symptoms / Complaint:</span>
                    <p className="text-slate-700 mt-0.5">{apt.chief_complaint}</p>
                    {apt.severity && (
                      <p className="text-slate-400 mt-1">Severity: {apt.severity}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setRejectingApt(apt)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={processingId === apt.id}
                    onClick={() => handleApprove(apt.id)}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Approve Request
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectingApt !== null}
        onClose={() => setRejectingApt(null)}
        title="Reject Appointment Request"
        description="Provide a reason for rejecting this booking so the patient can be notified."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectingApt(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={processingId === rejectingApt?.id}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <Textarea
          label="Rejection Reason"
          placeholder="e.g. Requested doctor unavailable on this date; please reschedule."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={3}
          required
        />
      </Dialog>
    </div>
  );
}
