"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocketEvent } from "@/lib/hooks";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  statusTone,
  Button,
  LinkButton,
  Dialog,
  Input,
  Select,
  Textarea,
  Tabs,
  LoadingState,
  useToast,
} from "@/components/ui";
import { PharmacyPrescriptionQueueItem, PrescriptionItem } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PharmacyPrescriptionsPage() {
  const toast = useToast();

  const [prescriptions, setPrescriptions] = useState<PharmacyPrescriptionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED">("PENDING");

  // Dispense Dialog State
  const [activeOrder, setActiveOrder] = useState<PharmacyPrescriptionQueueItem | null>(null);
  const [pickupCounter, setPickupCounter] = useState("Counter 1");
  const [itemStatuses, setItemStatuses] = useState<
    Record<string, { status: "DISPENSED" | "SUBSTITUTED" | "OUT_OF_STOCK"; substituteName: string; note: string }>
  >({});
  const [dispensing, setDispensing] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const data = await apiFetch<PharmacyPrescriptionQueueItem[]>("/pharmacy/prescriptions").catch(() => []);
      setPrescriptions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 4000);
    return () => clearInterval(interval);
  }, []);

  // Realtime Socket listener
  useSocketEvent(
    "pharmacy:new_prescription",
    (data: any) => {
      toast({
        title: "New Prescription Received",
        description: `Order from ${data.doctor_name || "Doctor"} for ${data.patient_name || "Patient"}.`,
        tone: "info",
      });
      fetchPrescriptions();
    },
    "pharmacy:orders"
  );

  const openDispenseDialog = (order: PharmacyPrescriptionQueueItem) => {
    setActiveOrder(order);
    const initial: Record<string, any> = {};
    order.items.forEach((it) => {
      initial[it.id] = { status: "DISPENSED", substituteName: "", note: "" };
    });
    setItemStatuses(initial);
  };

  const handleConfirmDispense = async () => {
    if (!activeOrder) return;
    setDispensing(true);
    try {
      const itemsPayload = activeOrder.items.map((it) => {
        const state = itemStatuses[it.id] || { status: "DISPENSED", substituteName: "", note: "" };
        return {
          prescription_item_id: it.id,
          dispense_status: state.status,
          substitute_medicine_name: state.substituteName || undefined,
          pharmacist_notes: state.note || undefined,
        };
      });

      await apiFetch("/pharmacy/dispense", {
        method: "POST",
        body: JSON.stringify({
          consultation_id: activeOrder.consultation_id,
          pickup_counter: pickupCounter,
          items: itemsPayload,
        }),
      });

      toast({
        title: "Prescription Dispensed",
        description: `Patient notified to collect at ${pickupCounter}.`,
        tone: "success",
      });
      setActiveOrder(null);
      fetchPrescriptions();
    } catch (err: any) {
      toast({ title: "Dispense failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setDispensing(false);
    }
  };

  const pendingList = prescriptions.filter((p) => !p.is_all_dispensed);
  const completedList = prescriptions.filter((p) => p.is_all_dispensed);
  const displayedList = activeTab === "PENDING" ? pendingList : completedList;

  if (loading) {
    return <LoadingState label="Loading pharmacy dispensary queue…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pharmacy Formulary Console"
        title="Prescriptions & Dispensing"
        description="Stream incoming doctor prescriptions in real time, record generic bioequivalent substitutions, and trigger pickup notifications."
        actions={
          <LinkButton href="/pharmacy/inventory" variant="secondary" icon={<Package className="h-4 w-4" />}>
            Manage Medication Inventory
          </LinkButton>
        }
      />

      <Tabs<"PENDING" | "COMPLETED">
        label="Prescription Filters"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: "PENDING", label: "To Dispense", count: pendingList.length },
          { value: "COMPLETED", label: "Completed", count: completedList.length },
        ]}
      />

      {displayedList.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">
            {activeTab === "PENDING" ? "No prescriptions waiting for dispensing" : "No completed orders"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            New prescriptions finalized by doctors will appear here instantly.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayedList.map((order) => (
            <Card key={order.consultation_id}>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{order.patient_name}</span>
                    <Badge tone={order.is_all_dispensed ? "success" : "warning"}>
                      {order.is_all_dispensed ? "Dispensed" : "Pending Dispense"}
                    </Badge>
                  </div>
                }
                description={`Doctor: ${order.doctor_name} (Room ${order.room_number})`}
                action={
                  !order.is_all_dispensed && (
                    <Button size="sm" onClick={() => openDispenseDialog(order)}>
                      Dispense Order
                    </Button>
                  )
                }
              />
              <CardBody className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Diagnosis: <strong className="text-slate-800">{order.diagnosis}</strong></span>
                  <span>{formatDate(order.prescribed_at)}</span>
                </div>

                {/* Items List */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 divide-y divide-slate-100">
                  {order.items.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{it.medicine_name}</p>
                        <p className="text-slate-500 text-[11px]">
                          {it.dosage} &bull; {it.frequency} &bull; {it.duration}
                        </p>
                      </div>
                      <Badge tone={statusTone(it.dispense_status)}>{it.dispense_status}</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Dispense Verification Dialog */}
      <Dialog
        open={activeOrder !== null}
        onClose={() => setActiveOrder(null)}
        title="Dispense Prescription"
        description="Verify each medication item, record generic substitutions if needed, and confirm pickup counter."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveOrder(null)}>
              Cancel
            </Button>
            <Button
              loading={dispensing}
              onClick={handleConfirmDispense}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm Dispensation
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Select
            label="Pickup Counter Destination"
            value={pickupCounter}
            onChange={(e) => setPickupCounter(e.target.value)}
            options={[
              { value: "Counter 1", label: "Dispensary Counter 1" },
              { value: "Counter 2", label: "Dispensary Counter 2" },
              { value: "Counter 3", label: "Express Pickup Counter 3" },
            ]}
          />

          <div className="space-y-3 pt-2">
            <span className="font-semibold text-slate-700 uppercase tracking-wide block">
              Medication Verification
            </span>
            {activeOrder?.items.map((item) => {
              const current = itemStatuses[item.id] || { status: "DISPENSED", substituteName: "", note: "" };
              return (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.medicine_name}</p>
                      <p className="text-slate-500">
                        {item.dosage} &bull; {item.frequency} &bull; {item.duration}
                      </p>
                    </div>
                    <Select
                      label="Dispense Action"
                      hideLabel
                      value={current.status}
                      onChange={(e) => {
                        setItemStatuses({
                          ...itemStatuses,
                          [item.id]: { ...current, status: e.target.value as any },
                        });
                      }}
                      options={[
                        { value: "DISPENSED", label: "Dispense Exact Brand" },
                        { value: "SUBSTITUTED", label: "Generic Substitution" },
                        { value: "OUT_OF_STOCK", label: "Mark Out of Stock" },
                      ]}
                      className="w-48"
                    />
                  </div>

                  {current.status === "SUBSTITUTED" && (
                    <div className="grid gap-2 sm:grid-cols-2 pt-1">
                      <Input
                        label="Substituted Generic Name"
                        placeholder="e.g. Bioequivalent Generic"
                        value={current.substituteName}
                        onChange={(e) => {
                          setItemStatuses({
                            ...itemStatuses,
                            [item.id]: { ...current, substituteName: e.target.value },
                          });
                        }}
                        required
                      />
                      <Input
                        label="Pharmacist Clinical Note"
                        placeholder="e.g. Bioequivalent same salt and dosage"
                        value={current.note}
                        onChange={(e) => {
                          setItemStatuses({
                            ...itemStatuses,
                            [item.id]: { ...current, note: e.target.value },
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
