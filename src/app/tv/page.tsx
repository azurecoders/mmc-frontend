"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Volume2,
  VolumeX,
  Bell,
  ArrowLeft,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocketEvent } from "@/lib/hooks";
import { hospitalAudio } from "@/lib/audio";
import { WaitingRoomTVDisplay } from "@/types";

export default function WaitingRoomTVPage() {
  const [tvData, setTvData] = useState<WaitingRoomTVDisplay | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [calledAlert, setCalledAlert] = useState<{
    token: number;
    doctorName: string;
    room: string;
  } | null>(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTVData = async () => {
    try {
      const data = await apiFetch<WaitingRoomTVDisplay>("/queue/tv-display");
      setTvData(data);
    } catch (e) {
      console.error("TV data fetch error:", e);
    }
  };

  useEffect(() => {
    fetchTVData();
    // Resilient auto-polling fallback every 4 seconds
    const interval = setInterval(fetchTVData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Realtime queue state updates
  useSocketEvent(
    "queue:tv_updated",
    () => {
      fetchTVData();
    },
    "queue:tv"
  );

  const handleCallAlert = (data: any) => {
    if (audioEnabled) {
      hospitalAudio.playTokenCalledChime();
    }
    setCalledAlert({
      token: data.token_number,
      doctorName: data.doctor_name || "Specialist",
      room: data.room_number || "Cabin",
    });
    fetchTVData();

    // Clear alert banner after 12 seconds
    setTimeout(() => {
      setCalledAlert(null);
    }, 12000);
  };

  useSocketEvent("queue:token_called_tv", handleCallAlert, "queue:tv");
  useSocketEvent("queue:your_turn", handleCallAlert, "queue:tv");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Return to App"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                ApexCare Hospital & Medical Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Live Patient Calling & Waiting Lounge Information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) hospitalAudio.playTokenCalledChime();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                audioEnabled
                  ? "bg-brand-950/80 border-brand-600 text-brand-300"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>{audioEnabled ? "Chime Audio On" : "Audio Muted (Click to enable)"}</span>
            </button>

            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-brand-400 tabular-nums">
                {currentTime}
              </div>
              <div className="text-xs text-slate-400">{currentDate}</div>
            </div>
          </div>
        </div>

        {/* Flashing Call Alert Banner */}
        {calledAlert && (
          <div className="mt-6 rounded-2xl bg-brand-600 p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Bell className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-widest text-brand-100 uppercase">
                  NOW CALLING PATIENT
                </span>
                <h2 className="text-3xl sm:text-5xl font-black">
                  TOKEN #{calledAlert.token}
                </h2>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs text-brand-100 font-medium uppercase block">
                PLEASE PROCEED TO
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold">
                Room {calledAlert.room}
              </div>
              <div className="text-xs text-brand-200 mt-0.5">
                {calledAlert.doctorName}
              </div>
            </div>
          </div>
        )}

        {/* Doctor Cabins Grid */}
        {tvData?.doctors && tvData.doctors.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tvData.doctors.map((doc) => (
              <div
                key={doc.doctor_id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                        Room {doc.room_number}
                      </span>
                      <h2 className="text-xl font-bold text-white mt-0.5">{doc.doctor_name}</h2>
                      <p className="text-xs text-slate-400">{doc.specialization}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
                      {doc.total_waiting} Waiting
                    </span>
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-950 p-5 border border-slate-800 text-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
                      Now Serving
                    </span>
                    <div className="text-5xl font-black text-white mt-1">
                      {doc.active_token ? `#${doc.active_token}` : "—"}
                    </div>
                    <p className="text-xs text-brand-400 mt-1 font-medium truncate">
                      {doc.active_patient_name || (doc.active_token ? "Patient in Consultation" : "Cabin Ready / Open")}
                    </p>
                  </div>
                </div>

                {/* Upcoming Tokens */}
                <div className="border-t border-slate-800/80 pt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
                    Next Tokens in Queue:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.upcoming_tokens && doc.upcoming_tokens.length > 0 ? (
                      doc.upcoming_tokens.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200"
                        >
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600">No other waiting tokens</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-950/80 border border-brand-800 text-brand-400 mx-auto flex items-center justify-center">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Outpatient Reception Desk Open</h2>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                Tokens called by consulting physicians will display here with live chime alerts. Please check in at the compounder desk to obtain your queue token.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Display Feed Connected
            </div>
          </div>
        )}
      </div>

      {/* Public Footer Strip */}
      <div className="mt-10 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Please watch your token number and listen for the audio chime. For assistance, contact the reception desk.
        </p>
        <p className="font-mono">Real-Time Asynchronous Broadcast Feed</p>
      </div>
    </div>
  );
}
