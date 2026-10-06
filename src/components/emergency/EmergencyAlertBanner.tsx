"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Siren, CheckCircle2, UserCheck, AlertCircle, ChevronDown, ChevronUp, Check, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { EmergencyAlertResponse } from "@/types";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";

function playAlertChime() {
  try {
    if (typeof window === "undefined" || !window.AudioContext) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play dual-tone high urgency emergency beep
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(880, 0, 0.2); // A5
    playTone(1174, 0.25, 0.3); // D6
    playTone(880, 0.6, 0.2);
    playTone(1174, 0.85, 0.4);
  } catch (err) {
    console.warn("Could not play audio alert:", err);
  }
}

export function EmergencyAlertBanner() {
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlertResponse[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<EmergencyAlertResponse | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isStaff = user?.roles?.some((r) =>
    ["DOCTOR", "NURSE", "COMPOUNDER", "SUPER_ADMIN"].includes(r.code)
  );

  const fetchActiveAlerts = useCallback(async () => {
    if (!isStaff) return;
    try {
      const data = await apiFetch("/emergency/active");
      if (Array.isArray(data)) {
        setActiveAlerts(data);
      }
    } catch {
      // Ignore background errors
    }
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) return;
    fetchActiveAlerts();

    const socket = getSocket();

    const handleCodeTriggered = (event: any) => {
      if (soundEnabled) {
        playAlertChime();
      }
      fetchActiveAlerts();
    };

    const handleAcknowledged = (event: any) => {
      fetchActiveAlerts();
    };

    const handleResolved = (event: any) => {
      fetchActiveAlerts();
    };

    socket.on("emergency:code_triggered", handleCodeTriggered);
    socket.on("emergency:alert_acknowledged", handleAcknowledged);
    socket.on("emergency:alert_resolved", handleResolved);

    return () => {
      socket.off("emergency:code_triggered", handleCodeTriggered);
      socket.off("emergency:alert_acknowledged", handleAcknowledged);
      socket.off("emergency:alert_resolved", handleResolved);
    };
  }, [isStaff, fetchActiveAlerts, soundEnabled]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await apiFetch(`/emergency/alerts/${alertId}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({
          note: `${user?.full_name || "Staff"} responding to scene`,
        }),
      });
      await fetchActiveAlerts();
    } catch (err: any) {
      alert(err?.message || "Failed to acknowledge alert");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!resolvingAlert) return;
    try {
      setActionLoading("resolving");
      await apiFetch(`/emergency/alerts/${resolvingAlert.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          resolution_notes: resolutionNotes.trim() || "Resolved on scene by clinical staff",
        }),
      });
      setResolvingAlert(null);
      setResolutionNotes("");
      await fetchActiveAlerts();
    } catch (err: any) {
      alert(err?.message || "Failed to resolve alert");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isStaff || activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {activeAlerts.map((alert) => {
        const isResponding = alert.responders.some((r) => r.user_id === user?.id);
        const isExpanded = expandedId === alert.id;

        const getBgColor = (code: string) => {
          switch (code) {
            case "CODE_BLUE":
              return "bg-blue-600 text-white";
            case "CODE_RED":
              return "bg-red-600 text-white";
            case "CODE_PINK":
              return "bg-pink-600 text-white";
            case "CODE_YELLOW":
              return "bg-amber-600 text-white";
            case "CODE_ORANGE":
              return "bg-orange-600 text-white";
            case "CODE_BLACK":
              return "bg-slate-900 text-white";
            case "RAPID_RESPONSE":
              return "bg-emerald-600 text-white";
            default:
              return "bg-red-600 text-white";
          }
        };

        return (
          <div
            key={alert.id}
            className={cn(
              "overflow-hidden rounded-2xl border-2 shadow-xl transition-all relative animate-pulse-border",
              alert.code === "CODE_BLUE" && "border-blue-500 bg-blue-50/90 shadow-blue-500/10",
              alert.code === "CODE_RED" && "border-red-500 bg-red-50/90 shadow-red-500/10",
              alert.code === "CODE_PINK" && "border-pink-500 bg-pink-50/90 shadow-pink-500/10",
              alert.code === "CODE_YELLOW" && "border-amber-500 bg-amber-50/90 shadow-amber-500/10",
              alert.code === "CODE_ORANGE" && "border-orange-500 bg-orange-50/90 shadow-orange-500/10",
              alert.code === "CODE_BLACK" && "border-slate-800 bg-slate-100 shadow-slate-900/10",
              alert.code === "RAPID_RESPONSE" && "border-emerald-500 bg-emerald-50/90 shadow-emerald-500/10"
            )}
          >
            {/* TOP BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-black/10">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs",
                    getBgColor(alert.code)
                  )}
                >
                  <Siren className="h-3.5 w-3.5 animate-bounce" />
                  {alert.code_name}
                </span>

                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <span>📍 {alert.ward}</span>
                  {alert.location_details && (
                    <span className="text-slate-600 font-semibold text-sm">
                      ({alert.location_details})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-black/5"
                  title={soundEnabled ? "Mute siren sound" : "Unmute siren sound"}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                {/* Respond action */}
                {isResponding ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    En Route / On Scene
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={actionLoading === alert.id}
                    className="bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md"
                  >
                    ⚡ I am Responding
                  </Button>
                )}

                {/* Resolve button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setResolvingAlert(alert)}
                  className="border-slate-300 bg-white/90 text-slate-800 hover:bg-white text-xs font-semibold"
                >
                  Resolve Code
                </Button>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  className="rounded-lg p-1 text-slate-600 hover:bg-black/5"
                  aria-label="Toggle details"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* BODY / NOTES */}
            <div className="px-5 py-3 text-sm text-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                {alert.notes ? (
                  <p className="font-medium text-slate-900">
                    <span className="font-bold text-red-600">Report: </span>
                    {alert.notes}
                  </p>
                ) : (
                  <p className="text-slate-600 italic">Emergency alert triggered. Immediate response team dispatched.</p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>Triggered by: <strong>{alert.triggered_by_name}</strong></span>
                  <span>•</span>
                  <span>
                    Time: {new Date(alert.triggered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {alert.responders.length} responder(s) on scene / en route
                  </span>
                </div>
              </div>
            </div>

            {/* EXPANDED RESPONDERS DRAWER */}
            {isExpanded && (
              <div className="border-t border-black/10 bg-white/70 px-5 py-3 text-xs">
                <p className="font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Active Responders ({alert.responders.length}):
                </p>
                {alert.responders.length === 0 ? (
                  <p className="text-slate-500 italic">No team members have clicked responding yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {alert.responders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs font-medium"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{r.user_name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({new Date(r.responded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* RESOLVE DIALOG */}
      {resolvingAlert && (
        <Modal
          open={!!resolvingAlert}
          onClose={() => setResolvingAlert(null)}
          title={`Resolve ${resolvingAlert.code_name} — ${resolvingAlert.ward}`}
          description="Document clinical resolution before closing the hospital emergency alert."
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Resolution Notes & Patient Outcome <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g., ROSC achieved at 14:22, patient transferred to ICU. Stabilized by Dr. Smith."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setResolvingAlert(null)}
                disabled={actionLoading === "resolving"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={actionLoading === "resolving"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {actionLoading === "resolving" ? "Resolving..." : "Confirm & Close Alert"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
