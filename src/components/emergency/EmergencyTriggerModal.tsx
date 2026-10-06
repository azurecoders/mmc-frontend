"use client";

import React, { useState, useEffect } from "react";
import { Siren, AlertTriangle, ShieldAlert, CheckCircle2, Flame, Baby, Users, Biohazard, ShieldX, Activity } from "lucide-react";
import { Modal } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EmergencyCodeOption {
  code: string;
  name: string;
  subtitle: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const EMERGENCY_CODES: EmergencyCodeOption[] = [
  {
    code: "CODE_BLUE",
    name: "Code Blue",
    subtitle: "Cardiac Arrest / CPR",
    bgClass: "bg-blue-600 hover:bg-blue-700 text-white",
    borderClass: "border-blue-500",
    textClass: "text-blue-700",
    badgeBg: "bg-blue-100 text-blue-800",
    icon: Activity,
    description: "Immediate cardiac resuscitation, crash cart & ACLS defibrillation response required.",
  },
  {
    code: "CODE_RED",
    name: "Code Red",
    subtitle: "Fire / Smoke Emergency",
    bgClass: "bg-red-600 hover:bg-red-700 text-white",
    borderClass: "border-red-500",
    textClass: "text-red-700",
    badgeBg: "bg-red-100 text-red-800",
    icon: Flame,
    description: "Active fire or smoke detected. Evacuation & engineering firefighting protocols.",
  },
  {
    code: "CODE_PINK",
    name: "Code Pink",
    subtitle: "Infant / Pediatric Emergency",
    bgClass: "bg-pink-600 hover:bg-pink-700 text-white",
    borderClass: "border-pink-500",
    textClass: "text-pink-700",
    badgeBg: "bg-pink-100 text-pink-800",
    icon: Baby,
    description: "Pediatric critical arrest or suspected infant abduction alert. Hospital perimeter lockdown.",
  },
  {
    code: "CODE_YELLOW",
    name: "Code Yellow",
    subtitle: "Mass Casualty / Disaster",
    bgClass: "bg-amber-600 hover:bg-amber-700 text-white",
    borderClass: "border-amber-500",
    textClass: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800",
    icon: Users,
    description: "Multi-casualty influx or internal infrastructure crisis. Mobilize triage surge teams.",
  },
  {
    code: "CODE_ORANGE",
    name: "Code Orange",
    subtitle: "Hazmat / Chemical Spill",
    bgClass: "bg-orange-600 hover:bg-orange-700 text-white",
    borderClass: "border-orange-500",
    textClass: "text-orange-700",
    badgeBg: "bg-orange-100 text-orange-800",
    icon: Biohazard,
    description: "Biohazard or dangerous chemical contamination. Containment & hazmat protective protocols.",
  },
  {
    code: "CODE_BLACK",
    name: "Code Black",
    subtitle: "Security / Armed Threat",
    bgClass: "bg-slate-900 hover:bg-black text-white",
    borderClass: "border-slate-800",
    textClass: "text-slate-900",
    badgeBg: "bg-slate-200 text-slate-800",
    icon: ShieldX,
    description: "Severe personal security risk, physical violence or armed intruder. Urgent police & security backup.",
  },
  {
    code: "RAPID_RESPONSE",
    name: "Rapid Response",
    subtitle: "Acute Clinical Deterioration",
    bgClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    borderClass: "border-emerald-500",
    textClass: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800",
    icon: ShieldAlert,
    description: "Patient vitals decompensating rapidly before full cardiac arrest. Mobilize ICU outreach specialist.",
  },
];

const DEFAULT_WARDS = [
  "ICU — Intensive Care Unit",
  "CCU — Coronary Care Unit",
  "Emergency & Trauma Bay",
  "General Ward — Floor 1",
  "General Ward — Floor 2",
  "General Ward — Floor 3",
  "Operation Theater (OT)",
  "Pediatric & Neonatal Ward",
  "Maternity & Labor Ward",
  "Cardiology Inpatient Ward",
  "OPD & Triage Reception Area",
];

interface EmergencyTriggerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedWard?: string;
}

export function EmergencyTriggerModal({
  open,
  onClose,
  onSuccess,
  preselectedWard,
}: EmergencyTriggerModalProps) {
  const [wards, setWards] = useState<string[]>(DEFAULT_WARDS);
  const [selectedWard, setSelectedWard] = useState<string>(preselectedWard || DEFAULT_WARDS[0]);
  const [customWard, setCustomWard] = useState<string>("");
  const [isCustomWard, setIsCustomWard] = useState(false);
  const [locationDetails, setLocationDetails] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string>("CODE_BLUE");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      apiFetch("/emergency/wards")
        .then((data: string[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setWards(data);
            if (!preselectedWard) {
              setSelectedWard(data[0]);
            }
          }
        })
        .catch(() => {
          // Keep defaults
        });
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, preselectedWard]);

  const activeCodeObj = EMERGENCY_CODES.find((c) => c.code === selectedCode) || EMERGENCY_CODES[0];

  const handleBroadcast = async () => {
    const finalWard = isCustomWard ? customWard.trim() : selectedWard;
    if (!finalWard) {
      setError("Please select or enter the ward / location.");
      return;
    }
    if (!selectedCode) {
      setError("Please select the emergency color code.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await apiFetch("/emergency/trigger", {
        method: "POST",
        body: JSON.stringify({
          code: selectedCode,
          ward: finalWard,
          location_details: locationDetails.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      setSuccessMessage(`🚨 ${activeCodeObj.name} successfully broadcasted to hospital response team!`);
      setTimeout(() => {
        setSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setSubmitting(false);
      setError(err?.message || "Failed to broadcast emergency alert. Please call hospital telephone immediately.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-red-600">
          <Siren className="h-6 w-6 animate-pulse" />
          <span>Hospital Emergency Code Broadcast</span>
        </div>
      }
      description="Select the ward location first, then select the emergency color code to dispatch assigned teams."
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3.5 text-sm text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-800 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* STEP 1: WARD LOCATION */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                1
              </span>
              Target Ward / Clinical Location <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomWard(!isCustomWard)}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
            >
              {isCustomWard ? "Select standard ward" : "+ Specify other location"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              {isCustomWard ? (
                <input
                  type="text"
                  placeholder="Enter exact ward or department name"
                  value={customWard}
                  onChange={(e) => setCustomWard(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  autoFocus
                />
              ) : (
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                >
                  {wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Specific Bed / Room # (e.g., Bed 4, Room 102)"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* STEP 2: COLOR CODES */}
        <div>
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              2
            </span>
            Select Emergency Code <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EMERGENCY_CODES.map((item) => {
              const isSelected = selectedCode === item.code;
              const Icon = item.icon;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedCode(item.code)}
                  className={cn(
                    "flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                    isSelected
                      ? cn("ring-2 ring-offset-2 ring-slate-900 shadow-md", item.bgClass)
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", isSelected ? "text-white" : item.textClass)} />
                      <span className={cn("font-bold text-sm", isSelected ? "text-white" : "text-slate-900")}>
                        {item.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-900 text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold mb-1",
                      isSelected ? "text-white/90" : "text-slate-700"
                    )}
                  >
                    {item.subtitle}
                  </span>
                  <p
                    className={cn(
                      "text-[11px] leading-tight line-clamp-2",
                      isSelected ? "text-white/80" : "text-slate-500"
                    )}
                  >
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: SITUATION / NOTES */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
            Clinical Situation / Patient Details (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 62yo male, sudden collapse, no palpable carotid pulse, bag-mask ventilation started..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* BANNER PREVIEW */}
        <div
          className={cn(
            "rounded-xl p-4 flex items-center justify-between gap-4 border shadow-sm",
            activeCodeObj.code === "CODE_BLUE" && "bg-blue-50 border-blue-200 text-blue-900",
            activeCodeObj.code === "CODE_RED" && "bg-red-50 border-red-200 text-red-900",
            activeCodeObj.code === "CODE_PINK" && "bg-pink-50 border-pink-200 text-pink-900",
            activeCodeObj.code === "CODE_YELLOW" && "bg-amber-50 border-amber-200 text-amber-900",
            activeCodeObj.code === "CODE_ORANGE" && "bg-orange-50 border-orange-200 text-orange-900",
            activeCodeObj.code === "CODE_BLACK" && "bg-slate-100 border-slate-300 text-slate-900",
            activeCodeObj.code === "RAPID_RESPONSE" && "bg-emerald-50 border-emerald-200 text-emerald-900"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/80 shadow-xs">
              <Siren className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">
                  {activeCodeObj.name.toUpperCase()} BROADCAST
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/90">
                  {isCustomWard ? customWard || "Custom Ward" : selectedWard}
                  {locationDetails ? ` — ${locationDetails}` : ""}
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                All doctors, compounders, and nurses assigned to this code will receive an immediate pop-up sound & alert.
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBroadcast}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            <Siren className="h-5 w-5 animate-spin" />
            {submitting ? "Broadcasting Code..." : `Broadcast ${activeCodeObj.name}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
