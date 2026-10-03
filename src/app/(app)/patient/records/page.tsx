"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Heart,
  AlertTriangle,
  Pill,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  LoadingState,
  Alert,
  useToast,
} from "@/components/ui";
import { PatientMedicalProfile } from "@/types";

export default function PatientRecordsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [bloodGroup, setBloodGroup] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [baselineSys, setBaselineSys] = useState("");
  const [baselineDia, setBaselineDia] = useState("");

  const [chronicConditions, setChronicConditions] = useState<
    Array<{ condition: string; diagnosed_year?: number; status: string; notes?: string }>
  >([]);

  const [allergies, setAllergies] = useState<
    Array<{ allergen: string; type: string; severity: string; reaction?: string }>
  >([]);

  const [surgeries, setSurgeries] = useState<
    Array<{ procedure: string; year?: number; hospital?: string; notes?: string }>
  >([]);

  const [medications, setMedications] = useState<
    Array<{ medicine_name: string; dosage: string; prescribed_for?: string }>
  >([]);

  const [familyHistory, setFamilyHistory] = useState<
    Array<{ relation: string; condition: string }>
  >([]);

  const [lifestyle, setLifestyle] = useState({
    smoking_status: "NEVER",
    alcohol_use: "NONE",
    exercise_level: "MODERATE",
    dietary_restrictions: "NONE",
  });

  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await apiFetch<PatientMedicalProfile>("/patients/me/medical-profile");
        if (p) {
          setBloodGroup(p.blood_group || "");
          setDob(p.date_of_birth || "");
          setGender(p.gender || "");
          setHeight(p.height_cm ? String(p.height_cm) : "");
          setWeight(p.weight_kg ? String(p.weight_kg) : "");
          setBaselineSys(p.baseline_systolic_bp ? String(p.baseline_systolic_bp) : "");
          setBaselineDia(p.baseline_diastolic_bp ? String(p.baseline_diastolic_bp) : "");
          setChronicConditions(p.chronic_conditions || []);
          setAllergies(p.known_allergies || []);
          setSurgeries(p.past_surgeries || []);
          setMedications(p.ongoing_medications || []);
          setFamilyHistory(p.family_medical_history || []);
          if (p.lifestyle_factors) setLifestyle(p.lifestyle_factors as any);
          setEmergencyName(p.emergency_contact_name || "");
          setEmergencyPhone(p.emergency_contact_phone || "");
          setEmergencyRelation(p.emergency_contact_relation || "");
        }
      } catch (e) {
        // May be empty on new user, which is normal
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/patients/me/medical-profile", {
        method: "PUT",
        body: JSON.stringify({
          blood_group: bloodGroup || undefined,
          date_of_birth: dob || undefined,
          gender: gender || undefined,
          height_cm: height ? parseFloat(height) : undefined,
          weight_kg: weight ? parseFloat(weight) : undefined,
          baseline_systolic_bp: baselineSys ? parseFloat(baselineSys) : undefined,
          baseline_diastolic_bp: baselineDia ? parseFloat(baselineDia) : undefined,
          chronic_conditions: chronicConditions,
          known_allergies: allergies,
          past_surgeries: surgeries,
          ongoing_medications: medications,
          family_medical_history: familyHistory,
          lifestyle_factors: lifestyle,
          emergency_contact_name: emergencyName || undefined,
          emergency_contact_phone: emergencyPhone || undefined,
          emergency_contact_relation: emergencyRelation || undefined,
        }),
      });

      toast({
        title: "Medical Profile Saved",
        description: "Your comprehensive clinical archive has been updated.",
        tone: "success",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to save medical profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your medical record archive…" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Clinical History Archive"
        title="Comprehensive Medical Record"
        description="Maintain your health history, chronic conditions, drug allergies, and active medications for clinician review."
      />

      {error && (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Demographics & Biometrics */}
        <Card>
          <CardHeader
            title="Biometrics & Baseline Vitals"
            description="Core physiological parameters used for early warning calibration"
          />
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              placeholder="Select blood group"
              options={[
                { value: "A+", label: "A+" },
                { value: "A-", label: "A-" },
                { value: "B+", label: "B+" },
                { value: "B-", label: "B-" },
                { value: "AB+", label: "AB+" },
                { value: "AB-", label: "AB-" },
                { value: "O+", label: "O+" },
                { value: "O-", label: "O-" },
              ]}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Select gender"
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              label="Baseline Systolic BP"
              type="number"
              value={baselineSys}
              onChange={(e) => setBaselineSys(e.target.value)}
              hint="Normal: 120"
            />
            <Input
              label="Baseline Diastolic BP"
              type="number"
              value={baselineDia}
              onChange={(e) => setBaselineDia(e.target.value)}
              hint="Normal: 80"
            />
          </CardBody>
        </Card>

        {/* Section 2: Chronic Conditions */}
        <Card>
          <CardHeader
            title="Chronic Medical Conditions"
            description="Long-term diagnoses such as Hypertension, Diabetes, Asthma, CAD"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setChronicConditions([
                    ...chronicConditions,
                    { condition: "", diagnosed_year: new Date().getFullYear(), status: "ACTIVE" },
                  ])
                }
                icon={<Plus className="h-4 w-4" />}
              >
                Add Condition
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {chronicConditions.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No chronic conditions listed.</p>
            ) : (
              chronicConditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    label="Condition"
                    hideLabel
                    placeholder="e.g. Type 2 Diabetes"
                    value={cond.condition}
                    onChange={(e) => {
                      const updated = [...chronicConditions];
                      updated[idx].condition = e.target.value;
                      setChronicConditions(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    label="Year"
                    hideLabel
                    type="number"
                    placeholder="Year"
                    value={cond.diagnosed_year || ""}
                    onChange={(e) => {
                      const updated = [...chronicConditions];
                      updated[idx].diagnosed_year = parseInt(e.target.value) || undefined;
                      setChronicConditions(updated);
                    }}
                    className="w-24"
                  />
                  <Select
                    label="Status"
                    hideLabel
                    value={cond.status}
                    onChange={(e) => {
                      const updated = [...chronicConditions];
                      updated[idx].status = e.target.value;
                      setChronicConditions(updated);
                    }}
                    options={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "MANAGED", label: "Managed" },
                      { value: "REMISSION", label: "Remission" },
                    ]}
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setChronicConditions(chronicConditions.filter((_, i) => i !== idx))
                    }
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Section 3: Drug & Environmental Allergies */}
        <Card>
          <CardHeader
            title="Known Allergies"
            description="Medications, foods, or materials that trigger allergic reactions"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setAllergies([
                    ...allergies,
                    { allergen: "", type: "MEDICATION", severity: "MODERATE" },
                  ])
                }
                icon={<Plus className="h-4 w-4" />}
              >
                Add Allergy
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {allergies.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No known allergies listed.</p>
            ) : (
              allergies.map((alg, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    label="Allergen"
                    hideLabel
                    placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                    value={alg.allergen}
                    onChange={(e) => {
                      const updated = [...allergies];
                      updated[idx].allergen = e.target.value;
                      setAllergies(updated);
                    }}
                    className="flex-1"
                  />
                  <Select
                    label="Type"
                    hideLabel
                    value={alg.type}
                    onChange={(e) => {
                      const updated = [...allergies];
                      updated[idx].type = e.target.value;
                      setAllergies(updated);
                    }}
                    options={[
                      { value: "MEDICATION", label: "Drug" },
                      { value: "FOOD", label: "Food" },
                      { value: "ENVIRONMENTAL", label: "Environmental" },
                    ]}
                    className="w-32"
                  />
                  <Select
                    label="Severity"
                    hideLabel
                    value={alg.severity}
                    onChange={(e) => {
                      const updated = [...allergies];
                      updated[idx].severity = e.target.value;
                      setAllergies(updated);
                    }}
                    options={[
                      { value: "MILD", label: "Mild" },
                      { value: "MODERATE", label: "Moderate" },
                      { value: "SEVERE", label: "Severe" },
                      { value: "ANAPHYLACTIC", label: "Anaphylaxis" },
                    ]}
                    className="w-36"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove allergy"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Section 4: Ongoing Medications */}
        <Card>
          <CardHeader
            title="Active Medications"
            description="Daily prescriptions or supplements currently taken"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setMedications([
                    ...medications,
                    { medicine_name: "", dosage: "", prescribed_for: "" },
                  ])
                }
                icon={<Plus className="h-4 w-4" />}
              >
                Add Medication
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {medications.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No active medications listed.</p>
            ) : (
              medications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    label="Medicine Name"
                    hideLabel
                    placeholder="e.g. Metformin 500mg"
                    value={med.medicine_name}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].medicine_name = e.target.value;
                      setMedications(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    label="Dosage"
                    hideLabel
                    placeholder="e.g. 1 tab twice daily"
                    value={med.dosage}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].dosage = e.target.value;
                      setMedications(updated);
                    }}
                    className="w-48"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove medication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Section 5: Emergency Contacts */}
        <Card>
          <CardHeader
            title="Emergency Contact"
            description="Primary person to notify in case of hospital emergency"
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Contact Name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
            <Input
              label="Relationship"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              placeholder="e.g. Spouse, Parent, Sibling"
            />
          </CardBody>
          <CardFooter>
            <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
              Save Medical Profile Archive
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
