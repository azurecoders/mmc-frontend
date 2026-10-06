"use client";

import React, { useState, useEffect } from "react";
import { Siren, RefreshCw, CheckCircle2, UserCheck, AlertTriangle, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageHeader, Card, CardHeader, CardBody, Button, Badge, LoadingState } from "@/components/ui";
import { EmergencyAlertResponse } from "@/types";
import { EmergencyTriggerButton } from "@/components/emergency/EmergencyTriggerButton";

export default function NurseAlertsPage() {
  const [alerts, setAlerts] = useState<EmergencyAlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const data = await apiFetch<EmergencyAlertResponse[]>("/emergency/active");
      setAlerts(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return <LoadingState label="Loading emergency alerts feed…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Emergency Protocol Feed"
        title="Hospital Emergency Alerts"
        description="Real-time log of hospital color codes, rapid response dispatches, and clinical responder acknowledgments."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchAlerts();
              }}
              loading={refreshing}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <EmergencyTriggerButton ward="ICU — Intensive Care Unit" />
          </div>
        }
      />

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Hospital is All-Clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No active emergency color codes or critical rapid response alarms are active at this moment.
            </p>
          </div>
        ) : (
          alerts.map((alt) => (
            <Card key={alt.id} className="overflow-hidden border-2 border-slate-200">
              <CardHeader
                title={
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase text-white bg-slate-900">
                      <Siren className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                      {alt.code_name}
                    </span>
                    <span className="font-bold text-slate-900">
                      📍 {alt.ward} {alt.location_details ? `— ${alt.location_details}` : ""}
                    </span>
                  </div>
                }
                action={
                  <Badge tone={alt.status === "ACTIVE" ? "danger" : alt.status === "ACKNOWLEDGED" ? "warning" : "success"}>
                    {alt.status}
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                {alt.notes && (
                  <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-red-600">Clinical Situation: </span>
                    {alt.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Triggered by: <strong>{alt.triggered_by_name}</strong></span>
                  <span>•</span>
                  <span>
                    Triggered at: {new Date(alt.triggered_at).toLocaleString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", month: "short", day: "numeric" })}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {alt.responders.length} Responder(s) En Route
                  </span>
                </div>

                {alt.responders.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Responding Team Members:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alt.responders.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 font-medium"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{r.user_name}</span>
                          {r.note && <span className="text-slate-500 italic">("{r.note}")</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
