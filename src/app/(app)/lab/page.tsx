"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  AlertTriangle,
  TestTubes,
  FileCheck,
  Plus,
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
  Checkbox,
  Tabs,
  LoadingState,
  useToast,
} from "@/components/ui";
import { LabOrder } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface LabParameterRow {
  parameter: string;
  value: string;
  unit: string;
  reference_range: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

function getDefaultParametersForTest(testName: string, testCode?: string): LabParameterRow[] {
  const lower = (testName + " " + (testCode || "")).toLowerCase();
  if (lower.includes("cbc") || lower.includes("blood count")) {
    return [
      { parameter: "Hemoglobin", value: "", unit: "g/dL", reference_range: "13.5 - 17.5", flag: "NORMAL" },
      { parameter: "Total WBC Count", value: "", unit: "/µL", reference_range: "4,500 - 11,000", flag: "NORMAL" },
      { parameter: "Platelet Count", value: "", unit: "x10³/µL", reference_range: "150 - 450", flag: "NORMAL" },
      { parameter: "RBC Count", value: "", unit: "x10⁶/µL", reference_range: "4.5 - 5.9", flag: "NORMAL" },
      { parameter: "Hematocrit (PCV)", value: "", unit: "%", reference_range: "41.0 - 50.0", flag: "NORMAL" },
    ];
  }
  if (lower.includes("lipid") || lower.includes("cholesterol")) {
    return [
      { parameter: "Total Cholesterol", value: "", unit: "mg/dL", reference_range: "< 200", flag: "NORMAL" },
      { parameter: "HDL Cholesterol", value: "", unit: "mg/dL", reference_range: "> 40", flag: "NORMAL" },
      { parameter: "LDL Cholesterol", value: "", unit: "mg/dL", reference_range: "< 100", flag: "NORMAL" },
      { parameter: "Triglycerides", value: "", unit: "mg/dL", reference_range: "< 150", flag: "NORMAL" },
    ];
  }
  if (lower.includes("renal") || lower.includes("kidney") || lower.includes("rft") || lower.includes("kft")) {
    return [
      { parameter: "Serum Creatinine", value: "", unit: "mg/dL", reference_range: "0.7 - 1.3", flag: "NORMAL" },
      { parameter: "Blood Urea Nitrogen (BUN)", value: "", unit: "mg/dL", reference_range: "7 - 20", flag: "NORMAL" },
      { parameter: "eGFR", value: "", unit: "mL/min/1.73m²", reference_range: "> 90", flag: "NORMAL" },
    ];
  }
  if (lower.includes("liver") || lower.includes("lft") || lower.includes("hepatic")) {
    return [
      { parameter: "Total Bilirubin", value: "", unit: "mg/dL", reference_range: "0.2 - 1.2", flag: "NORMAL" },
      { parameter: "SGOT (AST)", value: "", unit: "U/L", reference_range: "8 - 48", flag: "NORMAL" },
      { parameter: "SGPT (ALT)", value: "", unit: "U/L", reference_range: "7 - 56", flag: "NORMAL" },
      { parameter: "Alkaline Phosphatase (ALP)", value: "", unit: "U/L", reference_range: "44 - 147", flag: "NORMAL" },
    ];
  }
  if (lower.includes("glucose") || lower.includes("sugar") || lower.includes("diabetes")) {
    return [
      { parameter: "Fasting Blood Glucose", value: "", unit: "mg/dL", reference_range: "70 - 99", flag: "NORMAL" },
      { parameter: "HbA1c", value: "", unit: "%", reference_range: "< 5.7", flag: "NORMAL" },
    ];
  }
  if (lower.includes("thyroid") || lower.includes("tsh")) {
    return [
      { parameter: "TSH", value: "", unit: "µIU/mL", reference_range: "0.4 - 4.0", flag: "NORMAL" },
      { parameter: "Free T3", value: "", unit: "pg/mL", reference_range: "2.3 - 4.2", flag: "NORMAL" },
      { parameter: "Free T4", value: "", unit: "ng/dL", reference_range: "0.8 - 1.8", flag: "NORMAL" },
    ];
  }
  return [
    { parameter: "Primary Finding", value: "", unit: "", reference_range: "", flag: "NORMAL" },
    { parameter: "Secondary Parameter", value: "", unit: "", reference_range: "", flag: "NORMAL" },
  ];
}

export default function LabOrdersPage() {
  const toast = useToast();

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"TO_COLLECT" | "IN_PROGRESS" | "COMPLETED">("TO_COLLECT");

  // Results Dialog - Structured Table State
  const [activeOrder, setActiveOrder] = useState<LabOrder | null>(null);
  const [parameters, setParameters] = useState<LabParameterRow[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState("");
  const [submittingResult, setSubmittingResult] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch<LabOrder[]>("/lab/orders").catch(() => []);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Realtime Socket listener
  useSocketEvent(
    "lab:new_orders",
    () => {
      toast({ title: "New Lab Orders Dispatched", tone: "info" });
      fetchOrders();
    },
    "lab:orders"
  );

  const handleCollectSample = async (orderId: string) => {
    try {
      await apiFetch(`/lab/orders/${orderId}/collect-sample`, { method: "POST" });
      toast({ title: "Sample Marked Collected", tone: "success" });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Action failed", description: err?.message || "Please try again.", tone: "error" });
    }
  };

  const handleOpenResults = (order: LabOrder) => {
    setActiveOrder(order);
    const initialParams = getDefaultParametersForTest(order.test?.name || "", order.test?.code);
    setParameters(initialParams);
    setClinicalNotes("");
    setIsAbnormal(false);
    setCriticalAlert("");
  };

  const updateParameter = (index: number, field: keyof LabParameterRow, val: string) => {
    const updated = [...parameters];
    (updated[index] as any)[field] = val;
    setParameters(updated);

    // Auto-reflect abnormal flag if any parameter is abnormal
    const hasAbnormal = updated.some((p) => p.flag === "HIGH" || p.flag === "LOW" || p.flag === "CRITICAL");
    setIsAbnormal(hasAbnormal);
  };

  const addParameter = () => {
    setParameters([
      ...parameters,
      { parameter: "", value: "", unit: "", reference_range: "", flag: "NORMAL" },
    ]);
  };

  const removeParameter = (index: number) => {
    if (parameters.length <= 1) return;
    const updated = parameters.filter((_, i) => i !== index);
    setParameters(updated);
    const hasAbnormal = updated.some((p) => p.flag === "HIGH" || p.flag === "LOW" || p.flag === "CRITICAL");
    setIsAbnormal(hasAbnormal);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    // Validate that at least one parameter has a value
    const filledParams = parameters.filter((p) => p.parameter.trim() && p.value.trim());
    if (filledParams.length === 0) {
      toast({ title: "Validation Error", description: "Please enter at least one parameter value.", tone: "error" });
      return;
    }

    setSubmittingResult(true);
    try {
      const anyAbnormal = filledParams.some((p) => p.flag !== "NORMAL") || isAbnormal;
      const summaryText =
        filledParams
          .map((p) => `${p.parameter}: ${p.value} ${p.unit} (${p.flag}${p.reference_range ? `, Ref: ${p.reference_range}` : ""})`)
          .join("; ") + (clinicalNotes ? ` | Note: ${clinicalNotes}` : "");

      await apiFetch(`/lab/orders/${activeOrder.id}/submit-result`, {
        method: "POST",
        body: JSON.stringify({
          result_summary: summaryText,
          findings_json: {
            parameters: filledParams,
            clinical_notes: clinicalNotes || undefined,
          },
          is_abnormal: anyAbnormal,
          critical_alert: criticalAlert || undefined,
        }),
      });

      toast({
        title: "Test Results Published",
        description: "Findings recorded in structured table. Notified doctor cabin and patient device in real time.",
        tone: "success",
      });
      setActiveOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Failed to publish result", description: err?.message || "Please check inputs.", tone: "error" });
    } finally {
      setSubmittingResult(false);
    }
  };

  const toCollect = orders.filter((o) => o.status === "ORDERED");
  const inProgress = orders.filter((o) => o.status === "SAMPLE_COLLECTED" || o.status === "IN_PROGRESS");
  const completed = orders.filter((o) => o.status === "COMPLETED");

  const displayed =
    activeTab === "TO_COLLECT" ? toCollect : activeTab === "IN_PROGRESS" ? inProgress : completed;

  if (loading) {
    return <LoadingState label="Loading diagnostics laboratory orders…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Pathology & Diagnostics"
        title="Laboratory Test Orders"
        description="Track specimen collection timestamps, enter structured pathology findings, and trigger abnormal panic alerts."
        actions={
          <LinkButton href="/lab/catalog" variant="secondary" icon={<FlaskConical className="h-4 w-4" />}>
            Diagnostic Test Catalog
          </LinkButton>
        }
      />

      <Tabs<"TO_COLLECT" | "IN_PROGRESS" | "COMPLETED">
        label="Order Status"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: "TO_COLLECT", label: "Sample Pending", count: toCollect.length },
          { value: "IN_PROGRESS", label: "In Testing", count: inProgress.length },
          { value: "COMPLETED", label: "Results Ready", count: completed.length },
        ]}
      />

      {displayed.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">
            No diagnostic orders in this queue
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Laboratory orders prescribed during doctor visits will appear here automatically.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((order) => {
            const urgencyTone =
              order.urgency === "STAT" ? "danger" : order.urgency === "URGENT" ? "warning" : "neutral";
            return (
              <Card key={order.id}>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {order.test?.name || "Diagnostic Panel"}
                      </span>
                      <Badge tone={urgencyTone}>{order.urgency}</Badge>
                    </div>
                  }
                  description={`Patient: ${order.patient?.full_name || "Patient"} · Doctor: ${order.doctor?.user?.full_name || "Doctor"}`}
                  action={
                    order.status === "ORDERED" ? (
                      <Button
                        size="sm"
                        onClick={() => handleCollectSample(order.id)}
                        icon={<TestTubes className="h-3.5 w-3.5" />}
                      >
                        Collect Sample
                      </Button>
                    ) : order.status !== "COMPLETED" ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenResults(order)}
                        icon={<FileCheck className="h-3.5 w-3.5" />}
                      >
                        Enter Results
                      </Button>
                    ) : null
                  }
                />
                <CardBody className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Category: {order.test?.category || "Pathology"}</span>
                    <span>Turnaround: ~{order.test?.standard_turnaround_hours || 4}h</span>
                  </div>

                  {order.instructions && (
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="font-semibold text-slate-600">Doctor Instructions:</span>
                      <p className="text-slate-700 mt-0.5">{order.instructions}</p>
                    </div>
                  )}

                  {order.sample_collected_at && (
                    <p className="text-slate-400">
                      Sample collected: {formatDateTime(order.sample_collected_at)}
                    </p>
                  )}

                  {order.result && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Completed Diagnostic Report</span>
                        <Badge tone={order.result.is_abnormal ? "danger" : "success"}>
                          {order.result.is_abnormal ? "Abnormal Flag" : "Normal"}
                        </Badge>
                      </div>

                      {order.result.findings_json?.parameters && Array.isArray(order.result.findings_json.parameters) ? (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                                <th className="py-1.5 px-2.5">Parameter</th>
                                <th className="py-1.5 px-2.5">Measured Value</th>
                                <th className="py-1.5 px-2.5">Reference Range</th>
                                <th className="py-1.5 px-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.result.findings_json.parameters.map((p: any, pIdx: number) => (
                                <tr key={pIdx}>
                                  <td className="py-1.5 px-2.5 font-medium text-slate-800">{p.parameter}</td>
                                  <td className="py-1.5 px-2.5 font-bold text-slate-900">{p.value} {p.unit}</td>
                                  <td className="py-1.5 px-2.5 text-slate-500">{p.reference_range || "—"}</td>
                                  <td className="py-1.5 px-2.5">
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        p.flag === "CRITICAL"
                                          ? "bg-red-100 text-red-800"
                                          : p.flag === "HIGH" || p.flag === "LOW"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {p.flag}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-700">{order.result.result_summary}</p>
                      )}

                      {order.result.critical_alert && (
                        <p className="text-red-600 font-semibold text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Panic Alert: {order.result.critical_alert}
                        </p>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enter Results Dialog - Structured Parameters Table */}
      <Dialog
        open={activeOrder !== null}
        onClose={() => setActiveOrder(null)}
        title={`Enter Diagnostic Findings — ${activeOrder?.test?.name}`}
        description="Record individual test parameters, measured values, units, and physiological reference ranges."
        size="lg"
      >
        <form onSubmit={handleSubmitResult} className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Test Parameter / Analyte</th>
                  <th className="py-2.5 px-3 w-32">Measured Value</th>
                  <th className="py-2.5 px-3 w-24">Unit</th>
                  <th className="py-2.5 px-3 w-32">Reference Range</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parameters.map((p, idx) => (
                  <tr
                    key={idx}
                    className={
                      p.flag === "CRITICAL"
                        ? "bg-red-50/50"
                        : p.flag === "HIGH" || p.flag === "LOW"
                        ? "bg-amber-50/40"
                        : ""
                    }
                  >
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. Hemoglobin"
                        value={p.parameter}
                        onChange={(e) => updateParameter(idx, "parameter", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-brand-500 focus:outline-none"
                        placeholder="Value"
                        value={p.value}
                        onChange={(e) => updateParameter(idx, "value", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. g/dL"
                        value={p.unit}
                        onChange={(e) => updateParameter(idx, "unit", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 focus:border-brand-500 focus:outline-none"
                        placeholder="e.g. 13.5 - 17.5"
                        value={p.reference_range}
                        onChange={(e) => updateParameter(idx, "reference_range", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold focus:outline-none ${
                          p.flag === "CRITICAL"
                            ? "border-red-300 bg-red-50 text-red-700"
                            : p.flag === "HIGH" || p.flag === "LOW"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-emerald-700"
                        }`}
                        value={p.flag}
                        onChange={(e) => updateParameter(idx, "flag", e.target.value as any)}
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High (▲)</option>
                        <option value="LOW">Low (▼)</option>
                        <option value="CRITICAL">Critical (!)</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeParameter(idx)}
                        disabled={parameters.length <= 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 p-1 rounded transition"
                        title="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={addParameter}
            >
              Add Parameter Row
            </Button>
            <span className="text-[11px] text-slate-500 font-medium">
              {parameters.filter((p) => p.flag !== "NORMAL").length > 0
                ? "⚠️ Abnormal parameters detected"
                : "All parameters marked normal"}
            </span>
          </div>

          <Input
            label="Pathologist's Clinical Observations / Remarks (Optional)"
            placeholder="e.g. Specimen analyzed with automated Coulter counter and verified manually."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
          />

          <div className="pt-1">
            <Checkbox
              label="Flag as Clinically Abnormal"
              description="Mark if results exceed normal reference biological intervals"
              checked={isAbnormal}
              onChange={(e) => setIsAbnormal(e.target.checked)}
            />
          </div>

          {isAbnormal && (
            <Input
              label="Critical Panic Alert (Optional)"
              placeholder="e.g. Severe thrombocytopenia or critical leukocytosis"
              value={criticalAlert}
              onChange={(e) => setCriticalAlert(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setActiveOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingResult}>
              Publish Test Findings
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
