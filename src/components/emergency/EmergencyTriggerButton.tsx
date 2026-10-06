"use client";

import React, { useState } from "react";
import { Siren } from "lucide-react";
import { EmergencyTriggerModal } from "./EmergencyTriggerModal";
import { cn } from "@/lib/utils";

interface EmergencyTriggerButtonProps {
  ward?: string;
  variant?: "solid" | "outline" | "compact";
  className?: string;
  onSuccess?: () => void;
}

export function EmergencyTriggerButton({
  ward,
  variant = "solid",
  className,
  onSuccess,
}: EmergencyTriggerButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 animate-pulse",
            className
          )}
          title="Trigger Hospital Emergency Code"
        >
          <Siren className="h-4 w-4" />
          <span>Emergency Code</span>
        </button>
      ) : variant === "outline" ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border-2 border-red-500 bg-red-50/70 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-xs",
            className
          )}
        >
          <Siren className="h-4 w-4 text-red-600 animate-pulse" />
          <span>🚨 Emergency Code</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            "inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-red-600/30 hover:from-red-700 hover:to-rose-800 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-98 tracking-wide",
            className
          )}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
            <Siren className="relative h-4 w-4 text-white" />
          </div>
          <span>🚨 Emergency Code</span>
        </button>
      )}

      <EmergencyTriggerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedWard={ward}
        onSuccess={onSuccess}
      />
    </>
  );
}
