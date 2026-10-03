"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit,
  DollarSign,
  Boxes,
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
  Checkbox,
  LoadingState,
  useToast,
} from "@/components/ui";
import { PharmacyMedicine } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function PharmacyInventoryPage() {
  const toast = useToast();

  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [category, setCategory] = useState("Antibiotic");
  const [dosageForm, setDosageForm] = useState("Tablet");
  const [unitPrice, setUnitPrice] = useState("12.50");
  const [stockQuantity, setStockQuantity] = useState("100");
  const [reorderLevel, setReorderLevel] = useState("20");
  const [adding, setAdding] = useState(false);

  // Edit Stock Dialog
  const [editingMed, setEditingMed] = useState<PharmacyMedicine | null>(null);
  const [newStock, setNewStock] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchInventory = async () => {
    try {
      const data = await apiFetch<PharmacyMedicine[]>("/pharmacy/inventory").catch(() => []);
      setMedicines(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiFetch("/pharmacy/inventory", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          generic_name: genericName.trim(),
          category,
          dosage_form: dosageForm,
          unit_price: parseFloat(unitPrice),
          stock_quantity: parseInt(stockQuantity),
          reorder_level: parseInt(reorderLevel),
          is_active: true,
        }),
      });

      toast({ title: "Medication Added", tone: "success" });
      setAddDialogOpen(false);
      setName("");
      setGenericName("");
      fetchInventory();
    } catch (err: any) {
      toast({ title: "Failed to add medicine", description: err?.message || "Please check fields.", tone: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!editingMed) return;
    setUpdating(true);
    try {
      await apiFetch(`/pharmacy/inventory/${editingMed.id}`, {
        method: "PUT",
        body: JSON.stringify({
          stock_quantity: parseInt(newStock),
        }),
      });

      toast({ title: "Stock Updated", tone: "success" });
      setEditingMed(null);
      fetchInventory();
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !lowStockOnly || m.stock_quantity <= m.reorder_level;
    return matchesSearch && matchesLowStock;
  });

  if (loading) {
    return <LoadingState label="Loading medication inventory…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Formulary Catalog & Stock"
        title="Pharmacy Inventory"
        description="Monitor drug inventory levels, configure reorder thresholds, and manage generic salt formulations."
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/pharmacy" variant="secondary">
              Back to Prescriptions
            </LinkButton>
            <Button onClick={() => setAddDialogOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Add Medicine
            </Button>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Input
            label="Search Inventory"
            hideLabel
            placeholder="Search by brand name, generic salt, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Checkbox
          label="Show low stock only"
          checked={lowStockOnly}
          onChange={(e) => setLowStockOnly(e.target.checked)}
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No medications matching your filter criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-medium">Brand Name</th>
                    <th scope="col" className="py-3 px-4 font-medium">Generic Formulation</th>
                    <th scope="col" className="py-3 px-4 font-medium">Category & Form</th>
                    <th scope="col" className="py-3 px-4 font-medium">Unit Price</th>
                    <th scope="col" className="py-3 px-4 font-medium">Stock Status</th>
                    <th scope="col" className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((m) => {
                    const isLow = m.stock_quantity <= m.reorder_level;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900 text-sm">
                          {m.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {m.generic_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {m.category} &bull; {m.dosage_form}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {formatCurrency(m.unit_price)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{m.stock_quantity} units</span>
                            {isLow && (
                              <Badge tone="danger">Low Stock (Reorder: {m.reorder_level})</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingMed(m);
                              setNewStock(String(m.stock_quantity));
                            }}
                          >
                            Update Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Medicine Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Medicine to Formulary"
        description="Add a new brand medication and specify generic salt classification."
        size="md"
      >
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <Input
            label="Brand Name"
            placeholder="e.g. Augmentin 625mg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Generic Salt Formulation"
            placeholder="e.g. Amoxicillin + Clavulanic Acid"
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Therapeutic Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "Antibiotic", label: "Antibiotic" },
                { value: "Cardiovascular", label: "Cardiovascular" },
                { value: "Analgesic", label: "Analgesic / Antipyretic" },
                { value: "Antidiabetic", label: "Antidiabetic" },
                { value: "Respiratory", label: "Respiratory" },
                { value: "Gastrointestinal", label: "Gastrointestinal" },
              ]}
            />
            <Select
              label="Dosage Form"
              value={dosageForm}
              onChange={(e) => setDosageForm(e.target.value)}
              options={[
                { value: "Tablet", label: "Tablet" },
                { value: "Capsule", label: "Capsule" },
                { value: "Syrup", label: "Syrup" },
                { value: "Injection", label: "Injection" },
                { value: "Ointment", label: "Ointment" },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
            <Input
              label="Initial Stock"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
            <Input
              label="Reorder Alert Level"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={adding}>
              Save to Formulary
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog
        open={editingMed !== null}
        onClose={() => setEditingMed(null)}
        title={`Adjust Stock — ${editingMed?.name}`}
        description="Update total count on hand after inventory intake or cycle count."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingMed(null)}>
              Cancel
            </Button>
            <Button loading={updating} onClick={handleUpdateStock}>
              Save Stock Count
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Current Total Stock Quantity"
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            required
          />
        </div>
      </Dialog>
    </div>
  );
}
