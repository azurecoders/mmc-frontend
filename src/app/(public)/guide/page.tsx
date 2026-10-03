"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  ShieldCheck,
  Tv,
  Cpu,
  Layers,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Tabs } from "@/components/ui";
import { RoleCode } from "@/types";

type GuideTab =
  | "overview"
  | "patient"
  | "compounder"
  | "doctor"
  | "pharmacy"
  | "lab"
  | "tv"
  | "admin";

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<GuideTab>("overview");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Clinical User Manual & Reference</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          System Guide & Workflows
        </h1>
        <p className="max-w-3xl text-base text-slate-600">
          Learn how ApexCare coordinates clinical teams in real-time — from AI triage and queue
          management to digital prescriptions and laboratory results.
        </p>
      </div>

      {/* Tabs */}
      <Tabs<GuideTab>
        label="Guide Sections"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "patient", label: "Patient Portal" },
          { value: "compounder", label: "Reception Desk" },
          { value: "doctor", label: "Doctor Cabin" },
          { value: "pharmacy", label: "Pharmacy" },
          { value: "lab", label: "Diagnostics" },
          { value: "tv", label: "Waiting TV" },
          { value: "admin", label: "Admin & RBAC" },
        ]}
        className="mb-8"
      />

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Hospital Operating System Architecture"
                description="Real-time asynchronous coordination between patients and clinicians"
              />
              <CardBody className="space-y-4 text-sm text-slate-600">
                <p>
                  ApexCare is built on an asynchronous event-driven architecture using Next.js 16,
                  FastAPI, PostgreSQL, and Socket.IO. When any clinician takes an action — such as calling
                  a token, dispensing medicine, or publishing a lab report — all relevant interfaces
                  update instantly with under 50ms latency.
                </p>
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Gemma 31B AI</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Triage classification, clinical doctor matching, and chronic medical history risk analysis.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Socket.IO Rooms</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Isolated realtime event channels for waiting lounges, individual cabins, patients, and pharmacy.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Dynamic RBAC</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Hierarchical sub-roles with inherited domain-scoped permissions without code changes.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}


        {activeTab === "patient" && (
          <Card>
            <CardHeader
              title="Patient Care Workflows"
              description="Self-service booking, queue tracking, health record, and vitals monitoring"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">1. AI Doctor Recommendation</h3>
                <p>
                  Enter chief symptoms, duration, and severity in the booking form. Gemma 31B analyzes
                  clinical urgency, matches the correct specialty department, and ranks suitable doctors
                  with consultation fees and room numbers.
                </p>
                <h3 className="font-semibold text-slate-900 pt-2">2. Live Queue Tracking</h3>
                <p>
                  Once approved, your appointment receives a daily sequential token. The queue page displays
                  your token number, currently serving token, people ahead, and estimated wait minutes.
                  When your turn is called, an audio chime sounds and a banner directs you to the doctor's room.
                </p>
                <h3 className="font-semibold text-slate-900 pt-2">3. Health Check & AI Early Warning</h3>
                <p>
                  Log vitals (BP, Heart Rate, SpO2, Temp). Clinical MEWS/NEWS2 scores are computed automatically.
                  The AI checks your past medical archive for chronic risks and notifies your attending physician
                  immediately if vitals indicate emergency distress.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === "compounder" && (
          <Card>
            <CardHeader
              title="Reception & Triage Desk"
              description="Walk-in registrations, online booking approvals, and turn calling"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                The reception desk manages queue flow at the clinic entrance:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900">Walk-In Bookings:</strong> Register walk-in patients on the spot.
                  The system creates their patient profile and automatically generates today's next sequential token.
                </li>
                <li>
                  <strong className="text-slate-900">Approval Queue:</strong> Verify incoming online booking requests.
                  Approved appointments can be immediately checked into the live queue.
                </li>
                <li>
                  <strong className="text-slate-900">Turn Calling:</strong> Call patients into doctor cabins, put tokens
                  on temporary hold, or skip unresponsive tokens. Calling triggers lounge screen updates and patient device alerts.
                </li>
              </ul>
            </CardBody>
          </Card>
        )}

        {activeTab === "doctor" && (
          <Card>
            <CardHeader
              title="Doctor Cabin & Clinical EHR"
              description="Consultations, electronic prescriptions, lab test orders, and critical alerts"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                Doctors have a focused workspace designed for rapid clinical documentation:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900">Queue Management:</strong> View today's waiting list and click
                  &quot;Call next patient&quot; to begin consultation.
                </li>
                <li>
                  <strong className="text-slate-900">Structured Prescriptions:</strong> Add medications with dosage,
                  frequency, duration, and instructions. Prescriptions stream directly to the hospital pharmacy.
                </li>
                <li>
                  <strong className="text-slate-900">Diagnostic Orders:</strong> Order diagnostic tests (CBC, Lipid Panel,
                  X-Rays) directly from the hospital catalog with STAT or Routine urgency.
                </li>
                <li>
                  <strong className="text-slate-900">Visit Finalization:</strong> Finalizing dispatches real-time orders
                  to Pharmacy and Laboratory simultaneously, marking the appointment completed.
                </li>
              </ul>
            </CardBody>
          </Card>
        )}

        {activeTab === "pharmacy" && (
          <Card>
            <CardHeader
              title="Pharmacy & Inventory Management"
              description="Prescription order streams, generic substitutions, and stock control"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                Pharmacists dispense medications prescribed by doctors in real time:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900">Real-Time Queue:</strong> Prescriptions appear immediately upon doctor visit finalization.
                </li>
                <li>
                  <strong className="text-slate-900">Bioequivalent Substitutions:</strong> If a prescribed brand is unavailable, pharmacists can record bioequivalent generic substitutions with clinical notes.
                </li>
                <li>
                  <strong className="text-slate-900">Automatic Stock Deductions:</strong> Dispensing items decrements inventory quantities automatically.
                </li>
                <li>
                  <strong className="text-slate-900">Pickup Notifications:</strong> Completing dispensation notifies the patient with the specific pickup counter number.
                </li>
              </ul>
            </CardBody>
          </Card>
        )}

        {activeTab === "lab" && (
          <Card>
            <CardHeader
              title="Laboratory Diagnostics"
              description="Test tracking, sample collection timestamps, and abnormal panic alerts"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                Lab assistants process diagnostic panels ordered during consultations:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900">Sample Collection:</strong> Log precise specimen collection timestamps for traceability.
                </li>
                <li>
                  <strong className="text-slate-900">Structured Results Entry:</strong> Input findings JSON, summary observations, and reference links.
                </li>
                <li>
                  <strong className="text-slate-900">Panic Value Alerts:</strong> Highlight critical abnormal values that require immediate doctor intervention.
                </li>
              </ul>
            </CardBody>
          </Card>
        )}

        {activeTab === "tv" && (
          <Card>
            <CardHeader
              title="Waiting Lounge Screen"
              description="High-contrast public display for lounge wall monitors"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                The TV screen is designed for high-contrast visibility across waiting areas:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Displays each active doctor room, currently served token, and upcoming tokens.</li>
                <li>Plays hospital chime audio when a new token is called.</li>
                <li>Features a persistent audio toggle button to satisfy browser media policies.</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/tv"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
                >
                  Open Waiting Room Display <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === "admin" && (
          <Card>
            <CardHeader
              title="Super Admin & Dynamic RBAC"
              description="Dynamic role management, permission assignment, and staff governance"
            />
            <CardBody className="space-y-4 text-sm text-slate-600">
              <p>
                Hospital administrators can define fine-grained access without writing code:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900">Staff Accounts:</strong> Create clinicians, pharmacists, and desk staff with assigned roles.
                </li>
                <li>
                  <strong className="text-slate-900">Hierarchical Roles:</strong> Sub-roles inherit all permissions of their parent roles recursively.
                </li>
                <li>
                  <strong className="text-slate-900">Granular Permissions:</strong> Enable or disable specific domain actions (e.g. `appointments:approve`, `pharmacy:dispense`).
                </li>
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
