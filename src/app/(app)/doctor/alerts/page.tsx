"use client";

import React, { useState, useEffect } from "react";
import {
  Siren,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  HeartPulse,
  Thermometer,
  Wind,
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
  Button,
  LoadingState,
  Tabs,
  useToast,
} from "@/components/ui";
import { DoctorCriticalAlertItem } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function DoctorAlertsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [alerts, setAlerts] = useState<DoctorCriticalAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"UNACK" | "ALL">("UNACK");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const data = await apiFetch<DoctorCriticalAlertItem[]>("/vitals/doctor/critical-alerts").catch(() => []);
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  // Realtime critical alert socket listener
  useSocketEvent("patient:critical_vitals_alert", () => {
    toast({
      title: "New Critical Alert Received",
      description: "A patient's physiological scores indicate urgent distress.",
      tone: "error",
    });
    fetchAlerts();
  });

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await apiFetch(`/vitals/alerts/${alertId}/acknowledge`, { method: "POST" });
      toast({ title: "Alert Acknowledged", tone: "success" });
      fetchAlerts();
    } catch (err: any) {
      toast({ title: "Error acknowledging alert", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterTab === "UNACK") return !a.acknowledged;
    return true;
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  if (loading) {
    return <LoadingState label="Loading patient critical alerts…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Early Warning Signals"
        title="Critical Patient Alerts"
        description="Urgent physiological alerts dispatched when patients report vitals indicating acute clinical deterioration."
      />

      <Tabs<"UNACK" | "ALL">
        label="Alert Filters"
        value={filterTab}
        onChange={setFilterTab}
        tabs={[
          { value: "UNACK", label: "Requires Review", count: unacknowledgedCount },
          { value: "ALL", label: "All Alerts", count: alerts.length },
        ]}
      />

      {filteredAlerts.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">
            {filterTab === "UNACK" ? "No unacknowledged critical alerts" : "No critical alerts recorded"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All your patients are currently stable with no acute early warning scores flagged.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((a) => (
            <Card
              key={a.vitals_log_id}
              className={`border ${a.acknowledged ? "border-slate-200 bg-white" : "border-red-300 bg-red-50/20"}`}
            >
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <Siren className={`h-4 w-4 ${a.acknowledged ? "text-slate-400" : "text-red-600 animate-pulse"}`} />
                    <span className="text-sm font-bold text-slate-900">{a.patient_name}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({a.patient_phone || "No phone listed"})
                    </span>
                  </div>
                }
                description={`Logged: ${formatDateTime(a.recorded_at)}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={a.is_critical ? "danger" : "warning"}>
                      MEWS Score: {a.mews_score} ({a.triage_level})
                    </Badge>
                    {!a.acknowledged && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={acknowledgingId === a.vitals_log_id}
                        onClick={() => handleAcknowledge(a.vitals_log_id)}
                      >
                        Acknowledge Alert
                      </Button>
                    )}
                  </div>
                }
              />
              <CardBody className="space-y-4">
                {/* Vitals Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Blood Pressure</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {a.systolic_bp}/{a.diastolic_bp} mmHg
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Heart Rate</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{a.heart_rate} bpm</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Oxygen SpO2</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{a.spo2}%</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Temperature</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{a.temperature_f}°F</p>
                  </div>
                </div>

                {/* AI Contextual Analysis */}
                {a.ai_analysis && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Gemma 31B Clinical Assessment
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{a.ai_analysis}</p>
                  </div>
                )}

                {/* Clinical Recommendation */}
                {a.clinical_recommendation && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Action Recommendation
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {a.clinical_recommendation}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
