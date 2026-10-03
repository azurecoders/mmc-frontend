"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  LinkButton,
  Dialog,
  Input,
  Select,
  Textarea,
  LoadingState,
  useToast,
} from "@/components/ui";
import { LabTestCatalog } from "@/types";

export default function LabCatalogPage() {
  const toast = useToast();

  const [catalog, setCatalog] = useState<LabTestCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [testCode, setTestCode] = useState("");
  const [category, setCategory] = useState("Hematology");
  const [turnaround, setTurnaround] = useState("4");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCatalog = async () => {
    try {
      const data = await apiFetch<LabTestCatalog[]>("/lab/catalog").catch(() => []);
      setCatalog(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/lab/catalog", {
        method: "POST",
        body: JSON.stringify({
          code: testCode.trim().toUpperCase(),
          name: testName.trim(),
          category,
          description: description.trim() || undefined,
          standard_turnaround_hours: parseInt(turnaround) || 4,
          is_active: true,
        }),
      });

      toast({ title: "Diagnostic Test Added to Catalog", tone: "success" });
      setAddDialogOpen(false);
      setTestName("");
      setTestCode("");
      setDescription("");
      fetchCatalog();
    } catch (err: any) {
      toast({ title: "Failed to add test", description: err?.message || "Please check inputs.", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = catalog.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingState label="Loading laboratory test catalog…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pathology & Radiology Directory"
        title="Diagnostic Test Catalog"
        description="Maintain the hospital's standardized laboratory test menu, TAT SLAs, and specimen requirements."
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/lab" variant="secondary">
              Back to Lab Orders
            </LinkButton>
            <Button onClick={() => setAddDialogOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Add Test to Menu
            </Button>
          </div>
        }
      />

      <div className="max-w-md bg-white p-3 rounded-xl border border-slate-200">
        <Input
          label="Search Catalog"
          hideLabel
          placeholder="Search by test name, code, or department category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                <tr>
                  <th scope="col" className="py-3 px-4 font-medium">Test Code</th>
                  <th scope="col" className="py-3 px-4 font-medium">Test Name</th>
                  <th scope="col" className="py-3 px-4 font-medium">Laboratory Department</th>
                  <th scope="col" className="py-3 px-4 font-medium">Turnaround SLA</th>
                  <th scope="col" className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      {t.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      ~{t.standard_turnaround_hours} hours
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={t.is_active ? "success" : "neutral"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Add Test Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Diagnostic Test to Menu"
        description="Define a new clinical diagnostic assay available for doctor consultation ordering."
        size="md"
      >
        <form onSubmit={handleAddTest} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Test Code (e.g. CBC-01)"
              placeholder="e.g. LIPID-01"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              required
            />
            <Input
              label="Test Full Name"
              placeholder="e.g. Comprehensive Lipid Profile"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Department Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "Hematology", label: "Hematology" },
                { value: "Biochemistry", label: "Biochemistry" },
                { value: "Microbiology", label: "Microbiology" },
                { value: "Radiology", label: "Radiology / Imaging" },
                { value: "Pathology", label: "Pathology" },
              ]}
            />
            <Input
              label="Turnaround Time (Hours)"
              type="number"
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Clinical Description / Specimen Requirements"
            placeholder="e.g. Requires 12-hour fasting serum sample..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add to Catalog
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
