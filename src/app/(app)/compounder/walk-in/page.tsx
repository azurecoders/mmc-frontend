"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  CheckCircle2,
  Stethoscope,
  DollarSign,
  Clock,
  ArrowRight,
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
  Alert,
  useToast,
} from "@/components/ui";
import { Department, DoctorProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ReceptionWalkInPage() {
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [complaint, setComplaint] = useState("");
  const [severity, setSeverity] = useState("Moderate");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [successToken, setSuccessToken] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/departments/").catch(() => []),
      apiFetch<DoctorProfile[]>("/doctors/").catch(() => []),
    ]).then(([depts, docs]) => {
      setDepartments(depts);
      setDoctors(docs);
      if (docs.length > 0) setSelectedDoctorId(docs[0].id);
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !selectedDoctorId) {
      setError("Please fill in patient name, phone number, and select a doctor.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/appointments/book-walkin", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          doctor_id: selectedDoctorId,
          chief_complaint: complaint || "General consultation",
          severity,
          symptom_duration: "Walk-in registration",
        }),
      });

      setSuccessToken(res.token_number);
      toast({
        title: "Walk-In Registered!",
        description: `Assigned daily token #${res.token_number}`,
        tone: "success",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to register walk-in patient.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setComplaint("");
    setSuccessToken(null);
    setError(null);
  };

  const filteredDoctors = selectedDeptId
    ? doctors.filter((d) => d.department_id === selectedDeptId)
    : doctors;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="On-Site Patient Intake"
        title="Register Walk-In Patient"
        description="Issue an immediate token and register a walk-in patient directly into today's doctor queue."
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

      {successToken !== null ? (
        <Card className="text-center p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Walk-In Patient Registered!</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
            The patient has been added to today&apos;s active queue and assigned sequential token:
          </p>

          <div className="my-6 inline-block rounded-2xl bg-brand-50 border border-brand-200 p-6 px-10">
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
              Assigned Token
            </span>
            <div className="text-5xl font-black text-brand-600 mt-1">
              #{successToken}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button onClick={handleReset} variant="secondary">
              Register Another Walk-In
            </Button>
            <LinkButton href="/compounder">
              View in Live Queue
            </LinkButton>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleRegister}>
            <CardHeader
              title="Patient & Visit Details"
              description="New patients will have their medical profile created automatically"
            />
            <CardBody className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Patient Full Name"
                  placeholder="e.g. Johnathan Davis"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="e.g. +1 555 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Department Filter (Optional)"
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    const matching = doctors.filter((d) => !e.target.value || d.department_id === e.target.value);
                    if (matching.length > 0) setSelectedDoctorId(matching[0].id);
                  }}
                  placeholder="All Clinical Departments"
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />

                <Select
                  label="Assign to Doctor Cabin"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  options={filteredDoctors.map((d) => ({
                    value: d.id,
                    label: `${d.user?.full_name || "Doctor"} — Room ${d.room_number} (${formatCurrency(d.consultation_fee)})`,
                  }))}
                  required
                />
              </div>

              <Textarea
                label="Chief Complaint / Reason for Visit"
                placeholder="e.g. Severe headache and fever for 2 days..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={2}
              />

              <Select
                label="Triage Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                options={[
                  { value: "Mild", label: "Mild (Routine visit)" },
                  { value: "Moderate", label: "Moderate (Standard queue)" },
                  { value: "Severe", label: "Severe (Urgent attention)" },
                ]}
              />
            </CardBody>
            <CardFooter>
              <Button type="submit" loading={loading} icon={<UserPlus className="h-4 w-4" />}>
                Register & Issue Token
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
